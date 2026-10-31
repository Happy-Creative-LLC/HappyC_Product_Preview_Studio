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

    private ObjectMapper objectMapper;
    private AmazonScraperService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new AmazonScraperService(searchCacheRepository, objectMapper);
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
    // mới làm mới. Không gọi RapidAPI đồng bộ cho từ khoá đã có cache.
    @Test
    void servesStaleCacheInsteadOfCallingRapidApi() throws Exception {
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

    // Không bao giờ sinh dữ liệu giả: chưa có cache và chưa cấu hình RapidAPI thì báo 503.
    @Test
    void throwsServiceUnavailableWhenNoCacheAndRapidApiNotConfigured() {
        when(searchCacheRepository.findByKeywordIgnoreCase("shirt")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.searchAmazon("shirt", false)
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
    }

    private SearchCache cache(List<AmazonSearchResultDto> results, Instant lastUpdated) throws Exception {
        SearchCache cache = new SearchCache();
        cache.setKeyword("shirt");
        cache.setResultsJson(objectMapper.writeValueAsString(results));
        cache.setLastUpdated(lastUpdated);
        return cache;
    }
}
