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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

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

    // Cache valid for 10 days
    private static final int CACHE_VALIDITY_DAYS = 10;

    @Value("${rapidapi.amazon.host:amazon-data-scraper-api3.p.rapidapi.com}")
    private String rapidapiHost;

    @Value("${rapidapi.amazon.key:}")
    private String rapidapiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<AmazonSearchResultDto> searchAmazon(String keyword, boolean forceRefresh) {
        String normalizedKeyword = keyword.trim().toLowerCase();

        // 1. Check Cache
        Optional<SearchCache> cacheOpt = searchCacheRepository.findByKeywordIgnoreCase(normalizedKeyword);
        if (!forceRefresh && cacheOpt.isPresent()) {
            SearchCache cache = cacheOpt.get();
            if (cache.getLastUpdated() != null && cache.getLastUpdated().plusDays(CACHE_VALIDITY_DAYS).isAfter(LocalDateTime.now())) {
                log.info("Returning cached results for keyword: {}", normalizedKeyword);
                try {
                    return objectMapper.readValue(cache.getResultsJson(), new TypeReference<List<AmazonSearchResultDto>>(){});
                } catch (Exception e) {
                    log.error("Failed to parse cached JSON", e);
                }
            } else {
                log.info("Cache expired (older than 10 days) for keyword: {}, fetching from API...", normalizedKeyword);
            }
        }

        // 2. Scrape Amazon using RapidAPI
        List<AmazonSearchResultDto> results = scrapeAmazonWithRapidApi(normalizedKeyword);

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

    private List<AmazonSearchResultDto> scrapeAmazonWithRapidApi(String keyword) {
        List<AmazonSearchResultDto> results = new ArrayList<>();
        
        if (rapidapiKey == null || rapidapiKey.isEmpty()) {
            log.error("RapidAPI key is missing! Cannot fetch real data.");
        } else {
            try {
                String url = "https://" + rapidapiHost + "/queries";

                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("x-rapidapi-host", rapidapiHost);
                headers.set("x-rapidapi-key", rapidapiKey);
                headers.set("Content-Type", "application/json");

                String payload = String.format("{\"source\":\"amazon_search\",\"query\":\"%s\",\"geo_location\":\"90210\",\"parse\":true}", keyword.replace("\"", "\\\""));

                org.springframework.http.HttpEntity<String> request = new org.springframework.http.HttpEntity<>(payload, headers);
                
                log.info("Sending request to RapidAPI for keyword: {}", keyword);
                org.springframework.http.ResponseEntity<String> response = restTemplate.exchange(
                        url,
                        org.springframework.http.HttpMethod.POST,
                        request,
                        String.class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(response.getBody());
                    com.fasterxml.jackson.databind.JsonNode resultsArray = root.path("results").get(0).path("content").path("results").path("organic");
                    
                    if (resultsArray.isArray()) {
                        for (int i = 0; i < resultsArray.size(); i++) {
                            if (results.size() >= 12) break; // Limit to 12 results
                            
                            com.fasterxml.jackson.databind.JsonNode item = resultsArray.get(i);
                            
                            String title = item.path("title").asText("");
                            String image = item.path("url_image").asText("");
                            Double price = item.path("price").asDouble(0.0);
                            String rating = item.path("rating").asText("");
                            String reviews = item.path("reviews_count").asText("");
                            boolean isSponsored = item.path("is_sponsored").asBoolean(false);
                            String badge = item.path("is_amazons_choice").asBoolean(false) ? "Amazon's Choice" : null;
                            String brand = item.path("brand").asText("");
                            String salesVolume = item.path("sales_volume").asText("");
                            Double originalPrice = item.path("price_strikethrough").asDouble(0.0);

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
                                        .brand(brand)
                                        .salesVolume(salesVolume)
                                        .originalPrice(originalPrice)
                                        .build());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error calling RapidAPI for keyword: " + keyword, e);
            }
        }

        if (results.isEmpty()) {
            log.warn("Scraping returned no results, falling back to mock data.");
            for (int i = 0; i < 5; i++) {
                results.add(AmazonSearchResultDto.builder()
                        .id("mock-" + i)
                        .title("Mock Amazon Product for " + keyword + " " + i)
                        .image("https://via.placeholder.com/150")
                        .price(19.99 + i)
                        .rating("4." + i)
                        .reviews("10" + i)
                        .isSponsored(i == 0)
                        .build());
            }
        }

        return results;
    }
}
