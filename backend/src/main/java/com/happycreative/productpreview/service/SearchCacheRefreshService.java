package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.SearchCache;
import com.happycreative.productpreview.repository.SearchCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Làm mới dữ liệu Amazon Search theo lịch nền — không theo lượt search của người dùng.
 *
 * <p>Seller luôn được phục vụ từ cache ngay lập tức (xem
 * {@link AmazonScraperService#searchAmazon}, không bao giờ đợi RapidAPI giữa lúc đang
 * làm việc. Job này chạy mỗi Chủ nhật nhưng chỉ thực sự gọi lại RapidAPI cho những từ
 * khoá đã đủ {@code app.search-cache.max-age-days} ngày tuổi — nên nhịp làm mới thực tế
 * của một từ khoá là khoảng 15 ngày/lần dù job được kiểm tra hằng tuần.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SearchCacheRefreshService {

    private final SearchCacheRepository searchCacheRepository;
    private final AmazonScraperService amazonScraperService;

    @Value("${app.search-cache.max-age-days:15}")
    private int maxAgeDays;

    // 03:00 sáng Chủ nhật — ít người dùng nhất, không tranh tài nguyên với giờ làm việc.
    @Scheduled(cron = "0 0 3 * * SUN")
    public void refreshStaleKeywords() {
        Instant threshold = Instant.now().minus(Duration.ofDays(maxAgeDays));

        List<String> due = searchCacheRepository.findAll().stream()
                .filter(cache -> cache.getLastUpdated() == null || cache.getLastUpdated().isBefore(threshold))
                .map(SearchCache::getKeyword)
                .toList();

        if (due.isEmpty()) {
            log.info("Search cache refresh: không có từ khoá nào quá {} ngày.", maxAgeDays);
            return;
        }

        log.info("Search cache refresh: làm mới {} từ khoá quá {} ngày tuổi.", due.size(), maxAgeDays);
        int success = 0;
        for (String keyword : due) {
            // refreshKeyword tự nuốt lỗi của riêng nó — một từ khoá hỏng không được
            // làm dừng cả mẻ, và cache cũ của nó vẫn được giữ nguyên cho Seller dùng tiếp.
            if (amazonScraperService.refreshKeyword(keyword)) {
                success++;
            }
        }
        log.info("Search cache refresh hoàn tất: {}/{} từ khoá làm mới thành công.", success, due.size());
    }
}
