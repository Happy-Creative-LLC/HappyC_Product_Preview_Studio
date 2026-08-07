package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.SearchCache;
import com.happycreative.productpreview.repository.SearchCacheRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchCacheRefreshServiceTest {

    @Mock
    private SearchCacheRepository searchCacheRepository;

    @Mock
    private AmazonScraperService amazonScraperService;

    private SearchCacheRefreshService service;

    @BeforeEach
    void setUp() {
        service = new SearchCacheRefreshService(searchCacheRepository, amazonScraperService);
        ReflectionTestUtils.setField(service, "maxAgeDays", 15);
    }

    @Test
    void refreshesOnlyKeywordsOlderThanMaxAge() {
        when(searchCacheRepository.findAll()).thenReturn(List.of(
                cacheAged("fresh keyword", 5),
                cacheAged("stale keyword", 20)));
        when(amazonScraperService.refreshKeyword("stale keyword")).thenReturn(true);

        service.refreshStaleKeywords();

        verify(amazonScraperService).refreshKeyword("stale keyword");
        verify(amazonScraperService, never()).refreshKeyword("fresh keyword");
    }

    @Test
    void doesNothingWhenNoKeywordIsStale() {
        when(searchCacheRepository.findAll()).thenReturn(List.of(cacheAged("fresh", 1)));

        service.refreshStaleKeywords();

        verify(amazonScraperService, never()).refreshKeyword(anyString());
    }

    @Test
    void oneFailedKeywordDoesNotStopTheRest() {
        when(searchCacheRepository.findAll()).thenReturn(List.of(
                cacheAged("first", 20),
                cacheAged("second", 20)));
        when(amazonScraperService.refreshKeyword("first")).thenReturn(false);
        when(amazonScraperService.refreshKeyword("second")).thenReturn(true);

        service.refreshStaleKeywords();

        verify(amazonScraperService).refreshKeyword("first");
        verify(amazonScraperService).refreshKeyword("second");
    }

    @Test
    void treatsNeverUpdatedCacheAsStale() {
        SearchCache neverUpdated = new SearchCache();
        neverUpdated.setKeyword("broken row");
        neverUpdated.setLastUpdated(null);
        when(searchCacheRepository.findAll()).thenReturn(List.of(neverUpdated));

        service.refreshStaleKeywords();

        verify(amazonScraperService).refreshKeyword("broken row");
    }

    private SearchCache cacheAged(String keyword, int daysOld) {
        SearchCache cache = new SearchCache();
        cache.setKeyword(keyword);
        cache.setResultsJson("[]");
        cache.setLastUpdated(Instant.now().minus(daysOld, ChronoUnit.DAYS));
        return cache;
    }
}
