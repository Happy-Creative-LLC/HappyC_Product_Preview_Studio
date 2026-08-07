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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.net.http.HttpClient;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AmazonScraperService {

    private final SearchCacheRepository searchCacheRepository;
    private final ObjectMapper objectMapper;

    // SRS 3.8 / NFR: cache kết quả tìm kiếm Amazon tối đa 24 giờ.
    private static final int CACHE_VALIDITY_HOURS = 24;

    @Value("${rapidapi.amazon.host:real-time-amazon-data.p.rapidapi.com}")
    private String rapidapiHost;

    @Value("${rapidapi.amazon.key:}")
    private String rapidapiKey;

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        String osName = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (!osName.startsWith("windows")) {
            return new RestTemplate();
        }

        try {
            KeyStore windowsRoot = KeyStore.getInstance("Windows-ROOT");
            windowsRoot.load(null, null);

            TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(
                    TrustManagerFactory.getDefaultAlgorithm()
            );
            trustManagerFactory.init(windowsRoot);

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustManagerFactory.getTrustManagers(), new SecureRandom());

            HttpClient httpClient = HttpClient.newBuilder()
                    .sslContext(sslContext)
                    .build();
            return new RestTemplate(new JdkClientHttpRequestFactory(httpClient));
        } catch (Exception exception) {
            log.warn("Could not load Windows certificate store; using the JVM default trust store.", exception);
            return new RestTemplate();
        }
    }

    public List<AmazonSearchResultDto> searchAmazon(String keyword, boolean forceRefresh) {
        String normalizedKeyword = keyword.trim().toLowerCase();

        // 1. Check Cache
        Optional<SearchCache> cacheOpt = searchCacheRepository.findByKeywordIgnoreCase(normalizedKeyword);
        if (!forceRefresh && cacheOpt.isPresent()) {
            SearchCache cache = cacheOpt.get();
            if (cache.getLastUpdated() != null && cache.getLastUpdated().plusHours(CACHE_VALIDITY_HOURS).isAfter(LocalDateTime.now())) {
                log.info("Returning cached results for keyword: {}", normalizedKeyword);
                try {
                    List<AmazonSearchResultDto> cachedResults = objectMapper.readValue(
                            cache.getResultsJson(),
                            new TypeReference<List<AmazonSearchResultDto>>() {}
                    );
                    boolean containsLegacyMock = cachedResults.stream()
                            .anyMatch(item -> item.getId() != null && item.getId().startsWith("mock-"));
                    if (!containsLegacyMock) {
                        return cachedResults;
                    }
                    log.warn("Ignoring legacy mock cache for keyword: {}", normalizedKeyword);
                } catch (Exception e) {
                    log.error("Failed to parse cached JSON", e);
                }
            } else {
                log.info("Cache expired (older than 24 hours) for keyword: {}, fetching from API...", normalizedKeyword);
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

        if (!StringUtils.hasText(rapidapiKey)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ tìm kiếm Amazon chưa được cấu hình."
            );
        }

        try {
            String url = UriComponentsBuilder
                    .fromUriString("https://" + rapidapiHost + "/search")
                    .queryParam("query", keyword)
                    .queryParam("page", 1)
                    .queryParam("country", "US")
                    .queryParam("sort_by", "RELEVANCE")
                    .queryParam("product_condition", "ALL")
                    .queryParam("is_prime", false)
                    .queryParam("deals_and_discounts", "NONE")
                    .build()
                    .encode()
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("x-rapidapi-host", rapidapiHost);
            headers.set("x-rapidapi-key", rapidapiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            log.info("Sending request to RapidAPI for keyword: {}", keyword);
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    request,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không lấy được dữ liệu từ Amazon.");
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode resultsArray = root.path("data").path("products");

            if (resultsArray.isArray()) {
                for (int i = 0; i < resultsArray.size(); i++) {
                    if (results.size() >= 12) break;

                    JsonNode item = resultsArray.get(i);
                    String title = item.path("product_title").asText("");
                    String image = item.path("product_photo").asText("");

                    if (title.isBlank() || image.isBlank()) continue;

                    String asin = item.path("asin").asText("");
                    String badge = item.path("product_badge").asText("");
                    if (badge.isBlank() && item.path("is_amazon_choice").asBoolean(false)) {
                        badge = "Amazon's Choice";
                    } else if (badge.isBlank() && item.path("is_best_seller").asBoolean(false)) {
                        badge = "Best Seller";
                    }

                    results.add(AmazonSearchResultDto.builder()
                            .id(asin.isBlank() ? "amz-" + i : "amz-" + asin)
                            .title(title)
                            .image(image)
                            .price(readNullablePrice(item.path("product_price")))
                            .rating(item.path("product_star_rating").asText(""))
                            .reviews(item.path("product_num_ratings").asText(""))
                            .isSponsored(item.path("is_sponsored").asBoolean(false))
                            .badge(badge.isBlank() ? null : badge)
                            .brand(item.path("brand").asText(""))
                            .salesVolume(item.path("sales_volume").asText(""))
                            .originalPrice(readNullablePrice(item.path("product_original_price")))
                            .build());
                }
            }
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            log.error("Error calling RapidAPI for keyword: {}", keyword, exception);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Không lấy được dữ liệu từ Amazon.",
                    exception
            );
        }

        return results;
    }

    private Double readNullablePrice(JsonNode value) {
        if (value == null || value.isNull() || value.isMissingNode()) return null;
        if (value.isNumber()) return value.doubleValue();

        String normalized = value.asText("").replaceAll("[^0-9.]", "");
        if (normalized.isBlank()) return null;
        try {
            return Double.valueOf(normalized);
        } catch (NumberFormatException exception) {
            return null;
        }
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
            String url = UriComponentsBuilder
                    .fromUriString("https://" + rapidapiHost + "/product-details")
                    .queryParam("asin", asin)
                    .queryParam("country", "US")
                    .build()
                    .encode()
                    .toUriString();
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-rapidapi-host", rapidapiHost);
            headers.set("x-rapidapi-key", rapidapiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            log.info("Sending request to RapidAPI for ASIN: {}", asin);
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    request,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode result = root.path("data");

                ObjectNode productData = objectMapper.createObjectNode();
                productData.put("title", result.path("product_title").asText(""));
                Double price = readNullablePrice(result.path("product_price"));
                if (price == null) {
                    productData.putNull("price");
                } else {
                    productData.put("price", price);
                }
                productData.put("brand", result.path("product_byline").asText(""));
                productData.put("origin", "");
                productData.put("careInstructions", "");
                productData.put("fabricType", "");

                ArrayNode bulletPoints = productData.putArray("bulletPoints");
                JsonNode featureBullets = result.path("about_product");
                if (featureBullets.isArray() && featureBullets.size() > 0) {
                    for (JsonNode bp : featureBullets) {
                        bulletPoints.add(bp.asText());
                    }
                }

                ArrayNode imagesArray = productData.putArray("images");
                JsonNode images = result.path("product_photos");
                if (images.isArray() && images.size() > 0) {
                    for (JsonNode img : images) {
                        String imageUrl = img.isTextual()
                                ? img.asText("")
                                : img.path("url").asText(img.path("link").asText(""));
                        if (!imageUrl.isBlank()) {
                            imagesArray.add(imageUrl);
                        }
                    }
                } else {
                    String mainImg = result.path("product_photo").asText("");
                    if (!mainImg.isEmpty()) {
                        imagesArray.add(mainImg);
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
