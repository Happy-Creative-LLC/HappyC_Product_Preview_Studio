package com.happycreative.productpreview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.dto.AmazonSearchResultDto;
import com.happycreative.productpreview.entity.SearchCache;
import com.happycreative.productpreview.repository.SearchCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AmazonScraperService {

    private final SearchCacheRepository searchCacheRepository;
    private final ObjectMapper objectMapper;

    // Cache valid for 7 days
    private static final int CACHE_VALIDITY_DAYS = 7;

    public List<AmazonSearchResultDto> searchAmazon(String keyword) {
        String normalizedKeyword = keyword.trim().toLowerCase();

        // 1. Check Cache
        Optional<SearchCache> cacheOpt = searchCacheRepository.findByKeywordIgnoreCase(normalizedKeyword);
        if (cacheOpt.isPresent()) {
            SearchCache cache = cacheOpt.get();
            if (cache.getLastUpdated().plusDays(CACHE_VALIDITY_DAYS).isAfter(LocalDateTime.now())) {
                log.info("Returning cached results for keyword: {}", normalizedKeyword);
                try {
                    return objectMapper.readValue(cache.getResultsJson(), new TypeReference<List<AmazonSearchResultDto>>(){});
                } catch (Exception e) {
                    log.error("Failed to parse cached JSON", e);
                    // Fallthrough to scrape again
                }
            } else {
                log.info("Cache expired for keyword: {}", normalizedKeyword);
            }
        }

        // 2. Scrape Amazon
        List<AmazonSearchResultDto> results = scrapeAmazon(normalizedKeyword);

        // 3. Update Cache
        if (!results.isEmpty()) {
            try {
                String json = objectMapper.writeValueAsString(results);
                SearchCache cache = cacheOpt.orElse(new SearchCache());
                cache.setKeyword(normalizedKeyword);
                cache.setResultsJson(json);
                cache.setLastUpdated(LocalDateTime.now());
                searchCacheRepository.save(cache);
                log.info("Cache updated for keyword: {}", normalizedKeyword);
            } catch (Exception e) {
                log.error("Failed to save results to cache", e);
            }
        }

        return results;
    }

    private List<AmazonSearchResultDto> scrapeAmazon(String keyword) {
        List<AmazonSearchResultDto> results = new ArrayList<>();
        try {
            String encodedKeyword = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
            String url = "https://www.amazon.com/s?k=" + encodedKeyword;

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                    .timeout(10000)
                    .get();

            Elements items = doc.select("div[data-component-type=\"s-search-result\"]");

            for (int i = 0; i < items.size(); i++) {
                if (results.size() >= 12) break; // Limit to 12 results

                Element item = items.get(i);
                
                String title = item.select("h2 a span").text();
                String image = item.select("img.s-image").attr("src");
                
                String priceStr = item.select("span.a-price span.a-offscreen").text();
                Double price = 0.0;
                if (!priceStr.isEmpty()) {
                    try {
                        price = Double.parseDouble(priceStr.replace("$", "").replace(",", "").trim());
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }

                String rating = item.select("span.a-icon-alt").text();
                if (rating.contains(" out of")) {
                    rating = rating.split(" out of")[0];
                }

                String reviews = item.select("span.a-size-base.s-underline-text").text();

                boolean isSponsored = !item.select(".s-sponsored-label-info-icon").isEmpty();
                
                String badge = item.select("span.a-badge-text").text();
                if (badge.isEmpty()) badge = null;

                if (!title.isEmpty() && !image.isEmpty()) {
                    results.add(AmazonSearchResultDto.builder()
                            .id("amz-" + i)
                            .title(title)
                            .image(image)
                            .price(price)
                            .rating(rating)
                            .reviews(reviews)
                            .isSponsored(isSponsored)
                            .badge(badge)
                            .build());
                }
            }

        } catch (Exception e) {
            log.error("Error scraping Amazon for keyword: " + keyword, e);
        }
        return results;
    }
}
