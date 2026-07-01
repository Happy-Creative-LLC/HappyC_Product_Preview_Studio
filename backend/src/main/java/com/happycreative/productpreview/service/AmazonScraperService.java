package com.happycreative.productpreview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.dto.AmazonSearchResultDto;
import com.happycreative.productpreview.entity.SearchCache;
import com.happycreative.productpreview.repository.SearchCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-rapidapi-host", rapidapiHost);
                headers.set("x-rapidapi-key", rapidapiKey);
                headers.set("Content-Type", "application/json");

                String payload = String.format("{\"source\":\"amazon_search\",\"query\":\"%s\",\"geo_location\":\"90210\",\"parse\":true}", keyword.replace("\"", "\\\""));

                HttpEntity<String> request = new HttpEntity<>(payload, headers);

                log.info("Sending request to RapidAPI for keyword: {}", keyword);
                ResponseEntity<String> response = restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        request,
                        String.class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode resultsArray = root.path("results").get(0).path("content").path("results").path("organic");

                    if (resultsArray.isArray()) {
                        for (int i = 0; i < resultsArray.size(); i++) {
                            if (results.size() >= 12) break;

                            JsonNode item = resultsArray.get(i);
                            
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

    public ObjectNode scrapeProductByAsin(String asinOrUrl) {
        String asin = extractAsin(asinOrUrl);
        if (asin.isEmpty()) {
            asin = "MOCKASIN123";
        }
        
        if (rapidapiKey == null || rapidapiKey.isEmpty()) {
            log.warn("RapidAPI key is missing! Cannot fetch real product data. Using mock.");
            return createMockProductData(asin);
        }
        
        try {
            String url = "https://" + rapidapiHost + "/queries";
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-rapidapi-host", rapidapiHost);
            headers.set("x-rapidapi-key", rapidapiKey);
            headers.set("Content-Type", "application/json");

            String payload = String.format("{\"source\":\"amazon_product\",\"query\":\"%s\",\"geo_location\":\"90210\",\"parse\":true}", asin.replace("\"", "\\\""));
            HttpEntity<String> request = new HttpEntity<>(payload, headers);

            log.info("Sending request to RapidAPI for ASIN: {}", asin);
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode result = root.path("results").get(0).path("content");

                ObjectNode productData = objectMapper.createObjectNode();
                productData.put("title", result.path("title").asText("Mock Product Title"));
                productData.put("price", result.path("pricing").path("price").asDouble(29.99));
                productData.put("brand", result.path("brand").asText("Mock Brand"));
                productData.put("origin", "Imported");
                productData.put("careInstructions", "Machine Wash");
                productData.put("fabricType", "Mixed");

                ArrayNode bulletPoints = productData.putArray("bulletPoints");
                JsonNode featureBullets = result.path("feature_bullets");
                if (featureBullets.isArray() && featureBullets.size() > 0) {
                    for (JsonNode bp : featureBullets) {
                        bulletPoints.add(bp.asText());
                    }
                } else {
                    bulletPoints.add("Premium quality material");
                    bulletPoints.add("Comfortable fit for everyday use");
                    bulletPoints.add("Durable and long-lasting design");
                }

                ArrayNode imagesArray = productData.putArray("images");
                JsonNode images = result.path("images");
                if (images.isArray() && images.size() > 0) {
                    for (JsonNode img : images) {
                        imagesArray.add(img.path("link").asText());
                    }
                } else {
                    String mainImg = result.path("images").asText("");
                    if (mainImg.isEmpty()) mainImg = result.path("main_image").asText("");
                    if (!mainImg.isEmpty()) {
                        imagesArray.add(mainImg);
                    } else {
                        imagesArray.add("https://m.media-amazon.com/images/I/71zKuqJOKxL._AC_UY1000_.jpg");
                        imagesArray.add("https://m.media-amazon.com/images/I/81f-H1gBhtL._AC_UY1000_.jpg");
                    }
                }

                return productData;
            }
        } catch (Exception e) {
            log.error("Error calling RapidAPI for ASIN: " + asin, e);
        }
        
        return createMockProductData(asin);
    }

    private String extractAsin(String input) {
        if (input == null || input.isEmpty()) return "";
        if (!input.contains("http")) {
            return input.trim();
        }
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("/(?:dp|o|p|product|gp/product)/(B[A-Z0-9]{9})").matcher(input);
        if (m.find()) return m.group(1);
        return "B08J5F3G18"; // default if not found
    }

    private ObjectNode createMockProductData(String asin) {
        ObjectNode productData = objectMapper.createObjectNode();
        productData.put("title", "Mock Imported Amazon Product - " + asin);
        productData.put("price", 29.99);
        productData.put("brand", "MockBrand");
        productData.put("fabricType", "100% Cotton");
        productData.put("careInstructions", "Machine Wash");
        productData.put("origin", "Imported");
        
        ArrayNode bulletPoints = productData.putArray("bulletPoints");
        bulletPoints.add("This is a mock bullet point 1 for ASIN " + asin);
        bulletPoints.add("This is a mock bullet point 2 for ASIN " + asin);
        bulletPoints.add("This is a mock bullet point 3 for ASIN " + asin);
        
        ArrayNode imagesArray = productData.putArray("images");
        imagesArray.add("https://m.media-amazon.com/images/I/71zKuqJOKxL._AC_UY1000_.jpg");
        imagesArray.add("https://m.media-amazon.com/images/I/81f-H1gBhtL._AC_UY1000_.jpg");
        
        return productData;
    }
}
