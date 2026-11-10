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

/** Làm mới nền chỉ khi Admin chủ động bật; mặc định tắt để giữ quota Free. */
@Service
@RequiredArgsConstructor
@Slf4j
public class SearchCacheRefreshService {

    private final SearchCacheRepository searchCacheRepository;
    private final AmazonScraperService amazonScraperService;

    @Value("${app.search-cache.max-age-days:15}")
    private int maxAgeDays;

    @Value("${app.search-cache.refresh-enabled:false}")
    private boolean refreshEnabled;

    // 03:00 sáng Chủ nhật — ít người dùng nhất, không tranh tài nguyên với giờ làm việc.
    @Scheduled(cron = "0 0 3 * * SUN")
    public void refreshStaleKeywords() {
        if (!refreshEnabled) return;
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
