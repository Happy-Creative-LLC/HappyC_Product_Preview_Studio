package com.happycreative.productpreview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.dto.AmazonSearchResultDto;
import com.happycreative.productpreview.entity.SearchCache;
import com.happycreative.productpreview.repository.SearchCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AmazonScraperService {

    private final SearchCacheRepository searchCacheRepository;
    private final ObjectMapper objectMapper;
    private final AmazonSearchProvider searchProvider;
    private final Object[] searchLocks = java.util.stream.IntStream.range(0, 64)
            .mapToObj(index -> new Object()).toArray();

    @Value("${app.search-cache.min-refresh-minutes:60}")
    private int minRefreshMinutes = 60;

    // Cache cũ vẫn dùng được; metadata cho frontend biết tuổi dữ liệu.
    @Value("${app.search-cache.max-age-days:15}")
    private int maxAgeDays;

    @Value("${app.product-cache.max-age-hours:24}")
    private int productCacheHours = 24;

    public List<AmazonSearchResultDto> searchAmazon(String keyword, boolean forceRefresh) {
        return searchDetailed(keyword, forceRefresh).items();
    }

    public record SearchOutcome(List<AmazonSearchResultDto> items, Instant fetchedAt,
                                String source, boolean stale, String notice) {}

    /**
     * Chỉ gọi provider khi chưa có cache hoặc người dùng chủ động cập nhật.
     * Khoá theo từ khoá + cooldown chặn các request trùng tiêu quota nhiều lần.
     */
    public SearchOutcome searchDetailed(String keyword, boolean forceRefresh) {
        String normalized = normalizeKeyword(keyword);
        synchronized (searchLocks[Math.floorMod(normalized.hashCode(), searchLocks.length)]) {
            Optional<SearchCache> existing = searchCacheRepository.findByKeywordIgnoreCase(normalized);
            List<AmazonSearchResultDto> cached = existing.map(this::readCache).orElse(null);
            if (cached != null && !forceRefresh) {
                return fromCache(existing.get(), cached, null);
            }
            if (cached != null && existing.get().getLastUpdated() != null
                    && existing.get().getLastUpdated().isAfter(
                            Instant.now().minus(Duration.ofMinutes(minRefreshMinutes)))) {
                return fromCache(existing.get(), cached, "REFRESH_COOLDOWN");
            }

            try {
                List<AmazonSearchResultDto> results = searchProvider.search(normalized);
                // Không làm biến mất bộ kết quả đã có khi refresh trả rỗng.
                if (results.isEmpty() && cached != null && !cached.isEmpty()) {
                    return fromCache(existing.get(), cached, "EMPTY_REFRESH");
                }
                Instant fetchedAt = Instant.now();
                saveCache(normalized, results, existing);
                return new SearchOutcome(results, fetchedAt, "serpapi", false, null);
            } catch (ResponseStatusException exception) {
                if (cached != null) {
                    return fromCache(existing.get(), cached,
                            exception.getStatusCode().value() == 429 ? "QUOTA_LIMIT" : "REFRESH_FAILED");
                }
                return new SearchOutcome(AmazonSearchDemoData.products(), null,
                        "demo", false, exception.getStatusCode().value() == 429
                                ? "DEMO_QUOTA_LIMIT" : "DEMO_UNAVAILABLE");
            }
        }
    }

    private SearchOutcome fromCache(SearchCache cache, List<AmazonSearchResultDto> items, String notice) {
        boolean stale = cache.getLastUpdated() == null || cache.getLastUpdated()
                .isBefore(Instant.now().minus(Duration.ofDays(maxAgeDays)));
        return new SearchOutcome(items, cache.getLastUpdated(), "cache", stale, notice);
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập từ khoá.");
        String normalized = keyword.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        if (normalized.isBlank() || normalized.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Từ khoá cần từ 1 đến 200 ký tự.");
        }
        return normalized;
    }

    public Optional<Instant> findLastUpdated(String keyword) {
        return searchCacheRepository.findByKeywordIgnoreCase(normalizeKeyword(keyword))
                .map(SearchCache::getLastUpdated);
    }

    public boolean refreshKeyword(String keyword) {
        try {
            return "serpapi".equals(searchDetailed(keyword, true).source());
        } catch (RuntimeException exception) {
            // Không log exception: URL của provider có thể chứa API key.
            log.warn("Không thể làm mới cache Amazon Search.");
            return false;
        }
    }

    private List<AmazonSearchResultDto> readCache(SearchCache cache) {
        try {
            return objectMapper.readValue(
                    cache.getResultsJson(), new TypeReference<List<AmazonSearchResultDto>>() {});
        } catch (Exception e) {
            log.error("Failed to parse cached JSON", e);
            return null;
        }
    }

    private void saveCache(String keyword,
                           List<AmazonSearchResultDto> results,
                           Optional<SearchCache> existing) {
        // Cache cả kết quả rỗng hợp lệ để không tốn quota khi tìm lại từ khoá đó.
        try {
            SearchCache cache = existing.orElseGet(SearchCache::new);
            cache.setKeyword(keyword);
            cache.setResultsJson(objectMapper.writeValueAsString(results));
            cache.setLastUpdated(Instant.now());
            searchCacheRepository.save(cache);
            log.info("Cache updated for keyword: {}", keyword);
        } catch (Exception e) {
            log.error("Failed to save results to cache", e);
        }
    }

    public ObjectNode scrapeProductByAsin(String asinOrUrl) {
        return getProductByAsin(asinOrUrl, "desktop").product();
    }

    public record ProductOutcome(ObjectNode product, Instant fetchedAt, String source, boolean stale) {}

    public ProductOutcome getProductByAsin(String asinOrUrl, String device) {
        String asin = normalizeAsin(asinOrUrl);
        String normalizedDevice = device == null ? "desktop" : device.strip().toLowerCase(Locale.ROOT);
        if (!List.of("desktop", "mobile", "tablet").contains(normalizedDevice)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Thiết bị phải là desktop, tablet hoặc mobile.");
        }

        String cacheKey = "amazon_product:" + asin + ":" + normalizedDevice;
        synchronized (searchLocks[Math.floorMod(cacheKey.hashCode(), searchLocks.length)]) {
            Optional<SearchCache> cachedEntity = searchCacheRepository.findByKeywordIgnoreCase(cacheKey);
            ObjectNode cachedProduct = cachedEntity.map(this::readProductCache).orElse(null);
            Instant updatedAt = cachedEntity.map(SearchCache::getLastUpdated).orElse(null);
            if (cachedProduct != null && updatedAt != null
                    && updatedAt.isAfter(Instant.now().minus(Duration.ofHours(productCacheHours)))) {
                return new ProductOutcome(cachedProduct, updatedAt, "cache", false);
            }

            try {
                ObjectNode product = searchProvider.product(asin, normalizedDevice);
                Instant fetchedAt = Instant.now();
                saveProductCache(cacheKey, product, cachedEntity);
                return new ProductOutcome(product, fetchedAt, "serpapi", false);
            } catch (ResponseStatusException exception) {
                if (cachedProduct != null) return new ProductOutcome(cachedProduct, updatedAt, "cache", true);
                throw exception;
            }
        }
    }

    private String normalizeAsin(String asinOrUrl) {
        String input = asinOrUrl == null ? "" : asinOrUrl.strip();
        String asin = input.toUpperCase(Locale.ROOT);
        if (input.startsWith("https://")) {
            try {
                java.net.URI uri = java.net.URI.create(input);
                if (!List.of("amazon.com", "www.amazon.com").contains(uri.getHost())) {
                    throw new IllegalArgumentException();
                }
                var matcher = java.util.regex.Pattern.compile(
                        "/(?:dp|gp/product|product)/([A-Za-z0-9]{10})(?:/|$)").matcher(uri.getPath());
                asin = matcher.find() ? matcher.group(1).toUpperCase(Locale.ROOT) : "";
            } catch (IllegalArgumentException exception) {
                asin = "";
            }
        }
        if (!asin.matches("[A-Z0-9]{10}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập ASIN gồm 10 ký tự hoặc URL sản phẩm amazon.com hợp lệ.");
        }
        return asin;
    }

    private ObjectNode readProductCache(SearchCache cache) {
        try {
            var parsed = objectMapper.readTree(cache.getResultsJson());
            return parsed != null && parsed.isObject() ? (ObjectNode) parsed : null;
        } catch (Exception exception) {
            return null;
        }
    }

    private void saveProductCache(String cacheKey, ObjectNode product, Optional<SearchCache> existing) {
        try {
            SearchCache cache = existing.orElseGet(SearchCache::new);
            cache.setKeyword(cacheKey);
            cache.setResultsJson(objectMapper.writeValueAsString(product));
            cache.setLastUpdated(Instant.now());
            searchCacheRepository.save(cache);
        } catch (Exception exception) {
            log.warn("Không thể lưu cache Amazon Product API.");
        }
    }
}
