package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.dto.AmazonSearchResultDto;
import com.happycreative.productpreview.entity.SearchCache;
import com.happycreative.productpreview.repository.SearchCacheRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AmazonScraperServiceTest {

    @Mock
    private SearchCacheRepository searchCacheRepository;

    @Mock
    private AmazonSearchProvider searchProvider;

    private ObjectMapper objectMapper;
    private AmazonScraperService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new AmazonScraperService(searchCacheRepository, objectMapper, searchProvider);
    }

    @Test
    void returnsRealCachedResultsWhenCacheIsYoungerThan24Hours() throws Exception {
        AmazonSearchResultDto cachedResult = AmazonSearchResultDto.builder()
                .id("amz-B012345678")
                .title("Real cached Amazon product")
                .image("https://example.com/product.jpg")
                .price(29.99)
                .build();
        SearchCache cache = cache(List.of(cachedResult), Instant.now().minus(Duration.ofHours(23)));
        when(searchCacheRepository.findByKeywordIgnoreCase("hawaiian shirt")).thenReturn(Optional.of(cache));

        List<AmazonSearchResultDto> results = service.searchAmazon(" Hawaiian Shirt ", false);

        assertEquals(1, results.size());
        assertEquals("amz-B012345678", results.getFirst().getId());
    }

    // Từ commit 58af41e cache luôn được phục vụ tức thì, kể cả khi đã cũ; job nền Chủ nhật
    // mới làm mới. Không gọi provider đồng bộ cho từ khoá đã có cache.
    @Test
    void servesStaleCacheInsteadOfCallingProvider() throws Exception {
        SearchCache cache = cache(List.of(AmazonSearchResultDto.builder()
                .id("amz-B012345678")
                .title("Old but real product")
                .image("https://example.com/product.jpg")
                .build()), Instant.now().minus(Duration.ofDays(30)));
        when(searchCacheRepository.findByKeywordIgnoreCase("shirt")).thenReturn(Optional.of(cache));

        List<AmazonSearchResultDto> results = service.searchAmazon("shirt", false);

        assertEquals(1, results.size());
        assertEquals("amz-B012345678", results.getFirst().getId());
    }

    // Demo chỉ dùng khi API không khả dụng và không có cache thật; không ghi vào DB.
    @Test
    void servesLabelledDemoWhenNoCacheAndProviderNotConfigured() {
        when(searchCacheRepository.findByKeywordIgnoreCase("shirt")).thenReturn(Optional.empty());
        when(searchProvider.search("shirt")).thenThrow(new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, "Chưa cấu hình SerpApi."));

        var result = service.searchDetailed("shirt", false);

        assertEquals("demo", result.source());
        assertEquals("DEMO_UNAVAILABLE", result.notice());
        org.junit.jupiter.api.Assertions.assertNull(result.fetchedAt());
        org.junit.jupiter.api.Assertions.assertTrue(result.items().stream().allMatch(AmazonSearchResultDto::isDemo));
        org.mockito.Mockito.verify(searchCacheRepository, org.mockito.Mockito.never())
                .save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void quotaExhaustionWithoutCacheUsesDemoWithoutSavingFakeCompetitors() {
        when(searchProvider.search("shirt"))
                .thenThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS));

        var result = service.searchDetailed("shirt", false);

        assertEquals("DEMO_QUOTA_LIMIT", result.notice());
        assertEquals("demo", result.source());
        org.mockito.Mockito.verify(searchCacheRepository, org.mockito.Mockito.never())
                .save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void forcedRefreshWithinCooldownKeepsQuota() throws Exception {
        when(searchCacheRepository.findByKeywordIgnoreCase("shirt"))
                .thenReturn(Optional.of(cache(List.of(), Instant.now().minusSeconds(30))));

        var result = service.searchDetailed(" SHIRT ", true);

        assertEquals("REFRESH_COOLDOWN", result.notice());
        org.mockito.Mockito.verifyNoInteractions(searchProvider);
    }

    @Test
    void quotaExhaustionDuringRefreshRetainsCachedResults() throws Exception {
        SearchCache existing = cache(List.of(AmazonSearchResultDto.builder().id("B01").build()),
                Instant.now().minus(Duration.ofDays(20)));
        when(searchCacheRepository.findByKeywordIgnoreCase("shirt")).thenReturn(Optional.of(existing));
        when(searchProvider.search("shirt")).thenThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS));

        var result = service.searchDetailed("shirt", true);

        assertEquals("B01", result.items().getFirst().getId());
        assertEquals(existing.getLastUpdated(), result.fetchedAt());
        assertEquals("QUOTA_LIMIT", result.notice());
        org.junit.jupiter.api.Assertions.assertTrue(result.stale());
    }

    @Test
    void cachesLegitimateEmptyResultsToAvoidRepeatedSearches() {
        when(searchCacheRepository.findByKeywordIgnoreCase("no matches")).thenReturn(Optional.empty());
        when(searchProvider.search("no matches")).thenReturn(List.of());

        var result = service.searchDetailed(" NO   MATCHES ", false);

        assertEquals(List.of(), result.items());
        org.mockito.Mockito.verify(searchCacheRepository).save(org.mockito.ArgumentMatchers.argThat(
                row -> row.getKeyword().equals("no matches") && row.getResultsJson().equals("[]")));
    }

    @Test
    void failedRefreshKeepsExistingProductsEvenWhenProviderReturnsEmpty() throws Exception {
        SearchCache existing = cache(List.of(AmazonSearchResultDto.builder().id("B01").build()),
                Instant.now().minus(Duration.ofDays(2)));
        when(searchCacheRepository.findByKeywordIgnoreCase("shirt")).thenReturn(Optional.of(existing));
        when(searchProvider.search("shirt")).thenReturn(List.of());

        var result = service.searchDetailed("shirt", true);

        assertEquals("B01", result.items().getFirst().getId());
        assertEquals("EMPTY_REFRESH", result.notice());
        org.mockito.Mockito.verify(searchCacheRepository, org.mockito.Mockito.never())
                .save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void asinUrlIsValidatedBeforeCallingProvider() {
        ObjectMapper mapper = new ObjectMapper();
        when(searchProvider.product("B012345678")).thenReturn(mapper.createObjectNode().put("title", "Shirt"));

        assertEquals("Shirt", service.scrapeProductByAsin(
                "https://www.amazon.com/name/dp/B012345678?ref=test").path("title").asText());
        assertThrows(ResponseStatusException.class, () -> service.scrapeProductByAsin("invalid"));
        assertThrows(ResponseStatusException.class, () -> service.scrapeProductByAsin(
                "https://example.com/dp/B012345678"));
        org.mockito.Mockito.verify(searchProvider, org.mockito.Mockito.times(1)).product("B012345678");
    }

    @Test
    void invalidKeywordsNeverSpendQuota() {
        assertThrows(ResponseStatusException.class, () -> service.searchDetailed(" ", false));
        assertThrows(ResponseStatusException.class, () -> service.searchDetailed("x".repeat(201), false));
        org.mockito.Mockito.verifyNoInteractions(searchCacheRepository, searchProvider);
    }

    @Test
    void simultaneousSearchesForSameKeywordUseOnlyOneProviderRequest() throws Exception {
        var rows = new java.util.concurrent.ConcurrentHashMap<String, SearchCache>();
        when(searchCacheRepository.findByKeywordIgnoreCase(org.mockito.ArgumentMatchers.anyString()))
                .thenAnswer(call -> Optional.ofNullable(rows.get(call.getArgument(0))));
        when(searchCacheRepository.save(org.mockito.ArgumentMatchers.any(SearchCache.class)))
                .thenAnswer(call -> {
                    SearchCache row = call.getArgument(0);
                    rows.put(row.getKeyword(), row);
                    return row;
                });
        var entered = new java.util.concurrent.CountDownLatch(1);
        var release = new java.util.concurrent.CountDownLatch(1);
        when(searchProvider.search("shirt")).thenAnswer(call -> {
            entered.countDown();
            org.junit.jupiter.api.Assertions.assertTrue(release.await(5, java.util.concurrent.TimeUnit.SECONDS));
            return List.of(AmazonSearchResultDto.builder().id("B01").build());
        });
        try (var workers = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var first = workers.submit(() -> service.searchDetailed("shirt", true));
            org.junit.jupiter.api.Assertions.assertTrue(entered.await(5, java.util.concurrent.TimeUnit.SECONDS));
            var second = workers.submit(() -> service.searchDetailed(" SHIRT ", true));
            release.countDown();
            assertEquals("B01", first.get(5, java.util.concurrent.TimeUnit.SECONDS).items().getFirst().getId());
            assertEquals("B01", second.get(5, java.util.concurrent.TimeUnit.SECONDS).items().getFirst().getId());
        } finally {
            release.countDown();
        }
        org.mockito.Mockito.verify(searchProvider, org.mockito.Mockito.times(1)).search("shirt");
    }

    private SearchCache cache(List<AmazonSearchResultDto> results, Instant lastUpdated) throws Exception {
        SearchCache cache = new SearchCache();
        cache.setKeyword("shirt");
        cache.setResultsJson(objectMapper.writeValueAsString(results));
        cache.setLastUpdated(lastUpdated);
        return cache;
    }
}
