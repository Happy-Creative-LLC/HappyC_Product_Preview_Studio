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
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
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

    // Dữ liệu Amazon được làm mới định kỳ bởi job nền Chủ nhật
    // (SearchCacheRefreshService), không phải theo từng lượt người dùng search.
    // Giá trị này chỉ dùng để cảnh báo trong log khi dữ liệu quá cũ — KHÔNG dùng
    // để chặn việc trả cache, vì yêu cầu là không bao giờ làm gián đoạn công việc.
    @Value("${app.search-cache.max-age-days:15}")
    private int maxAgeDays;

    // Không đặt default trỏ tới một host cụ thể — host/key phải được cấu hình
    // tường minh theo đúng sản phẩm RapidAPI đang subscribe, tránh âm thầm gọi
    // nhầm sang một host không còn hợp lệ.
    @Value("${rapidapi.amazon.host:}")
    private String rapidapiHost;

    @Value("${rapidapi.amazon.key:}")
    private String rapidapiKey;

    private final RestTemplate restTemplate = createRestTemplate();

    // Trên Windows, JVM không tin các chứng chỉ gốc do Windows quản lý nên gọi
    // RapidAPI qua HTTPS có thể fail handshake. Nạp thêm kho "Windows-ROOT" để
    // dùng đúng bộ chứng chỉ của máy; hệ điều hành khác giữ nguyên mặc định.
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

    /**
     * Trả kết quả search cho người dùng.
     *
     * <p><b>Luôn ưu tiên cache, kể cả cache đã cũ.</b> Dữ liệu Amazon được làm mới
     * theo lịch nền (Chủ nhật) chứ không theo từng lượt search, nên Seller không bao
     * giờ phải đợi RapidAPI 2-3 giây giữa lúc đang làm việc. Chỉ gọi API đồng bộ khi
     * thật sự chưa có gì trong cache (từ khoá mới) hoặc khi người dùng chủ động bấm
     * "Cập nhật từ Amazon" ({@code forceRefresh}).</p>
     */
    public List<AmazonSearchResultDto> searchAmazon(String keyword, boolean forceRefresh) {
        String normalizedKeyword = keyword.trim().toLowerCase();
        Optional<SearchCache> cacheOpt = searchCacheRepository.findByKeywordIgnoreCase(normalizedKeyword);

        if (!forceRefresh && cacheOpt.isPresent()) {
            List<AmazonSearchResultDto> cached = readCache(cacheOpt.get());
            if (cached != null) {
                warnIfStale(cacheOpt.get());
                log.info("Returning cached results for keyword: {}", normalizedKeyword);
                return cached;
            }
            log.warn("Cache của '{}' không đọc được, buộc phải gọi API để phục hồi.", normalizedKeyword);
        }

        List<AmazonSearchResultDto> results = scrapeAmazonWithRapidApi(normalizedKeyword);
        saveCache(normalizedKeyword, results, cacheOpt);
        return results;
    }

    /** Thời điểm dữ liệu của một từ khoá được lấy về lần gần nhất (null nếu chưa có). */
    public Optional<Instant> findLastUpdated(String keyword) {
        return searchCacheRepository.findByKeywordIgnoreCase(keyword.trim().toLowerCase())
                .map(SearchCache::getLastUpdated);
    }

    /**
     * Làm mới một từ khoá — dùng bởi job nền. Trả về true nếu lấy được dữ liệu mới.
     * Nuốt lỗi có chủ đích: một từ khoá hỏng không được làm dừng cả mẻ làm mới,
     * và cache cũ vẫn được giữ nguyên để người dùng tiếp tục làm việc bình thường.
     */
    public boolean refreshKeyword(String keyword) {
        String normalizedKeyword = keyword.trim().toLowerCase();
        try {
            List<AmazonSearchResultDto> results = scrapeAmazonWithRapidApi(normalizedKeyword);
            saveCache(normalizedKeyword, results,
                    searchCacheRepository.findByKeywordIgnoreCase(normalizedKeyword));
            return !results.isEmpty();
        } catch (RuntimeException e) {
            log.error("Không làm mới được từ khoá '{}': {}", normalizedKeyword, e.getMessage());
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

    private void warnIfStale(SearchCache cache) {
        Instant lastUpdated = cache.getLastUpdated();
        if (lastUpdated == null) return;
        Duration age = Duration.between(lastUpdated, Instant.now());
        if (age.toDays() > maxAgeDays) {
            log.warn("Dữ liệu '{}' đã {} ngày tuổi (quá mốc {} ngày) — kiểm tra job làm mới Chủ nhật.",
                    cache.getKeyword(), age.toDays(), maxAgeDays);
        }
    }

    private void saveCache(String keyword,
                           List<AmazonSearchResultDto> results,
                           Optional<SearchCache> existing) {
        // Không bao giờ ghi đè cache đang tốt bằng danh sách rỗng.
        if (results.isEmpty()) return;
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

    /**
     * Gọi "Real-Time Amazon Data" (letscrape, RapidAPI) — GET /search?query=&country=&page=.
     * Đã verify bằng curl thật trước khi viết parser này (không suy đoán field từ tài liệu vendor khác).
     *
     * <p>Không bao giờ fallback về dữ liệu giả: nếu chưa cấu hình host/key hoặc lời gọi
     * thất bại, ném {@link ResponseStatusException} để Seller thấy lỗi rõ ràng thay vì
     * nhầm sản phẩm mẫu với đối thủ thật (TechBrief mục III yêu cầu dữ liệu thời gian thực).</p>
     */
    private List<AmazonSearchResultDto> scrapeAmazonWithRapidApi(String keyword) {
        if (rapidapiKey == null || rapidapiKey.isBlank() || rapidapiHost == null || rapidapiHost.isBlank()) {
            log.error("RapidAPI host/key chưa được cấu hình — không thể lấy dữ liệu Amazon thật.");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình RapidAPI cho Search Preview. Liên hệ Admin để thiết lập.");
        }

        List<AmazonSearchResultDto> results = new ArrayList<>();
        try {
            URI uri = UriComponentsBuilder.fromUriString("https://" + rapidapiHost + "/search")
                    .queryParam("query", keyword)
                    .queryParam("country", "US")
                    .queryParam("page", 1)
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("x-rapidapi-host", rapidapiHost);
            headers.set("x-rapidapi-key", rapidapiKey);

            log.info("Sending request to RapidAPI for keyword: {}", keyword);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Không lấy được dữ liệu thật từ Amazon. Vui lòng thử lại sau.");
            }

            JsonNode products = objectMapper.readTree(response.getBody()).path("data").path("products");
            if (products.isArray()) {
                for (JsonNode item : products) {
                    if (results.size() >= 12) break;

                    String title = HtmlUtils.htmlUnescape(item.path("product_title").asText(""));
                    String image = textOrNull(item, "product_photo");
                    if (title.isEmpty() || image == null) continue;

                    results.add(AmazonSearchResultDto.builder()
                            .id(item.path("asin").asText("amz-" + results.size()))
                            .title(title)
                            .image(image)
                            .price(parsePrice(textOrNull(item, "product_price")))
                            .originalPrice(parsePrice(textOrNull(item, "product_original_price")))
                            .rating(textOrNull(item, "product_star_rating"))
                            .reviews(String.valueOf(item.path("product_num_ratings").asInt(0)))
                            // Endpoint này không trả cờ quảng cáo — để false thay vì suy đoán.
                            .isSponsored(false)
                            .badge(item.path("is_amazon_choice").asBoolean(false) ? "Amazon's Choice" : null)
                            .salesVolume(textOrNull(item, "sales_volume"))
                            .build());
                }
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calling RapidAPI for keyword: " + keyword, e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không lấy được dữ liệu thật từ Amazon. Vui lòng thử lại sau.");
        }

        return results;
    }

    private String textOrNull(JsonNode item, String field) {
        JsonNode value = item.path(field);
        return (value.isMissingNode() || value.isNull()) ? null : value.asText();
    }

    private Double parsePrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw.replaceAll("[^0-9.]", ""));
        } catch (NumberFormatException e) {
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
