package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.dto.AmazonSearchResultDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
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
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** SerpApi Amazon SERP, trang 1, Amazon US và ZIP 10001 như header giả lập. */
@Component
public class SerpApiAmazonSearchProvider implements AmazonSearchProvider {
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final java.util.concurrent.Semaphore searchPermit = new java.util.concurrent.Semaphore(1);
    private volatile java.time.Instant retryAfter = java.time.Instant.EPOCH;
    private ResponseStatusException blockedFailure;

    @Value("${serpapi.api-key:}")
    private String apiKey;

    @Value("${serpapi.free-only:true}")
    private boolean freeOnly = true;

    @Autowired
    public SerpApiAmazonSearchProvider(ObjectMapper objectMapper) {
        this(objectMapper, createRestTemplate());
    }

    SerpApiAmazonSearchProvider(ObjectMapper objectMapper, RestTemplate restTemplate) {
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    private static RestTemplate createRestTemplate() {
        HttpClient.Builder client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5));
        if (System.getProperty("os.name", "").toLowerCase(Locale.ROOT).startsWith("windows")) {
            try {
                KeyStore roots = KeyStore.getInstance("Windows-ROOT");
                roots.load(null, null);
                TrustManagerFactory trust = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
                trust.init(roots);
                SSLContext ssl = SSLContext.getInstance("TLS");
                ssl.init(null, trust.getTrustManagers(), null);
                client.sslContext(ssl);
            } catch (Exception ignored) {
                // Giữ xác minh TLS bằng trust store mặc định nếu không có Windows-ROOT.
            }
        }
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client.build());
        factory.setReadTimeout(Duration.ofSeconds(30));
        return new RestTemplate(factory);
    }

    @Override
    public List<AmazonSearchResultDto> search(String keyword) {
        return withAllowance(() -> fetchResults(keyword));
    }

    private <T> T withAllowance(java.util.function.Supplier<T> operation) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình SerpApi. Admin cần thêm SERPAPI_API_KEY để tìm từ khoá mới.");
        }
        // Account API miễn phí, không tính vào quota. Kiểm tra lại trước mỗi lần search
        // để không dùng gói trả phí hoặc extra credits khi đang ở chế độ miễn phí.
        if (!searchPermit.tryAcquire()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Một tìm kiếm mới đang được xử lý. Vui lòng thử lại sau ít giây.");
        }
        try {
            if (java.time.Instant.now().isBefore(retryAfter)) throw blockedFailure;
            if (freeOnly) checkFreeAllowance();
            return operation.get();
        } catch (ResponseStatusException failure) {
            if (failure != blockedFailure) {
                blockedFailure = failure;
                retryAfter = java.time.Instant.now().plusSeconds(60);
            }
            throw failure;
        } finally {
            searchPermit.release();
        }
    }

    private List<AmazonSearchResultDto> fetchResults(String keyword) {
        JsonNode root = getJson(UriComponentsBuilder.fromUriString("https://serpapi.com/search.json")
                .queryParam("engine", "amazon")
                .queryParam("api_key", apiKey)
                .queryParam("k", keyword)
                .queryParam("amazon_domain", "amazon.com")
                .queryParam("language", "en_US")
                .queryParam("delivery_zip", "10001")
                .queryParam("device", "desktop")
                .queryParam("page", 1)
                // Không dùng no_cache=true: cache miễn phí của SerpApi vẫn được tận dụng.
                .build().encode(StandardCharsets.UTF_8).toUri());

        JsonNode products = root.path("organic_results");
        if (!products.isArray()) {
            if ("Success".equals(root.path("search_metadata").path("status").asText())
                    && root.path("search_information").path("total_results").isNumber()
                    && root.path("search_information").path("total_results").asLong() == 0) {
                return List.of();
            }
            throw unavailable();
        }

        List<AmazonSearchResultDto> results = new ArrayList<>();
        for (JsonNode product : products) {
            String asin = text(product, "asin");
            String title = text(product, "title");
            String image = text(product, "thumbnail");
            if (asin == null || title == null || image == null || !isHttps(image)) continue;
            results.add(AmazonSearchResultDto.builder()
                    .id(asin)
                    .title(HtmlUtils.htmlUnescape(title))
                    .image(image)
                    .position(product.path("position").canConvertToInt() ? product.path("position").asInt() : null)
                    .price(amount(product, "extracted_price", "price"))
                    .originalPrice(amount(product, "extracted_old_price", "old_price"))
                    .rating(scalar(product, "rating"))
                    .reviews(scalar(product, "reviews"))
                    .isSponsored(product.path("sponsored").asBoolean(false))
                    .badge(firstText(product.path("badges")))
                    .brand(text(product, "brand"))
                    .salesVolume(text(product, "bought_last_month"))
                    .promotion(joinOffers(product))
                    .deliveryTime(joinText(product.path("delivery")))
                    .build());
        }
        // Không biến phản hồi sai schema thành thông báo không có kết quả.
        if (!products.isEmpty() && results.isEmpty()) throw unavailable();
        return results;
    }

    @Override
    public com.fasterxml.jackson.databind.node.ObjectNode product(String asin) {
        return withAllowance(() -> {
            JsonNode root = getJson(UriComponentsBuilder.fromUriString("https://serpapi.com/search.json")
                    .queryParam("engine", "amazon_product").queryParam("api_key", apiKey)
                    .queryParam("asin", asin).queryParam("amazon_domain", "amazon.com")
                    .queryParam("delivery_zip", "10001").build().encode(StandardCharsets.UTF_8).toUri());
            JsonNode product = root.path("product_results");
            String title = text(product, "title");
            if (!product.isObject() || title == null) throw unavailable();
            var result = objectMapper.createObjectNode();
            result.put("title", HtmlUtils.htmlUnescape(title));
            result.put("asin", asin);
            String brand = text(product, "brand");
            if (brand != null) result.put("brand", brand);
            Double price = amount(product, "extracted_price", "price");
            if (price == null) price = amount(product.path("buybox"), "extracted_price", "price");
            if (price == null) price = amount(product.path("purchase_options").path("buy_new"), "extracted_price", "price");
            if (price != null) result.put("price", price);
            var bullets = result.putArray("bulletPoints");
            JsonNode about = product.path("about_item");
            if (about.isArray()) for (JsonNode item : about) {
                if (item.isTextual()) bullets.add(HtmlUtils.htmlUnescape(item.asText()));
            }
            var images = result.putArray("images");
            JsonNode thumbnails = product.path("thumbnails");
            if (thumbnails.isArray()) for (JsonNode item : thumbnails) {
                if (item.isTextual() && isHttps(item.asText())) images.add(item.asText());
            }
            String thumbnail = text(product, "thumbnail");
            if (images.isEmpty() && thumbnail != null && isHttps(thumbnail)) images.add(thumbnail);
            String origin = text(product.path("product_details"), "country_of_origin");
            if (origin != null) result.put("origin", origin);
            return result;
        });
    }

    private void checkFreeAllowance() {
        JsonNode account = getJson(UriComponentsBuilder.fromUriString("https://serpapi.com/account.json")
                .queryParam("api_key", apiKey).build().encode(StandardCharsets.UTF_8).toUri());
        if (!account.path("plan_monthly_price").isNumber()
                || account.path("plan_monthly_price").asDouble() != 0) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Search đang ở chế độ miễn phí. Hãy dùng API key của gói SerpApi Free.");
        }
        if (!account.path("plan_searches_left").isIntegralNumber()) throw unavailable();
        if (account.path("plan_searches_left").asLong() <= 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Đã hết lượt tìm kiếm SerpApi miễn phí. Bạn vẫn có thể dùng kết quả đã lưu và thử từ khoá mới khi quota được cấp lại.");
        }
        if (account.path("account_rate_limit_per_hour").isNumber()
                && account.path("this_hour_searches").isNumber()
                && account.path("this_hour_searches").asInt() >= account.path("account_rate_limit_per_hour").asInt()) {
            throw rateLimited();
        }
    }

    private JsonNode getJson(URI uri) {
        try {
            String body = restTemplate.getForObject(uri, String.class);
            if (body == null) throw unavailable();
            JsonNode root = objectMapper.readTree(body);
            if (root == null || !root.isObject() || root.hasNonNull("error")) throw unavailable();
            return root;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (HttpClientErrorException exception) {
            if (exception.getStatusCode().value() == 429) throw rateLimited();
            if (exception.getStatusCode().value() == 401 || exception.getStatusCode().value() == 403) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "SerpApi từ chối API key. Admin cần kiểm tra cấu hình tài khoản.");
            }
            throw unavailable();
        } catch (Exception exception) {
            // URL và response Account API chứa key: không log exception hoặc trả raw JSON.
            throw unavailable();
        }
    }

    private static ResponseStatusException rateLimited() {
        return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Đã đạt giới hạn lượt gọi SerpApi. Hãy dùng kết quả đã lưu hoặc thử lại sau.");
    }

    private static ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Chưa lấy được dữ liệu Amazon từ SerpApi. Vui lòng thử lại sau.");
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isTextual() && !value.asText().isBlank() ? value.asText() : null;
    }

    private static String scalar(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() || value.isTextual() ? value.asText() : null;
    }

    private static boolean isHttps(String value) {
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static Double amount(JsonNode node, String numericField, String displayField) {
        JsonNode numeric = node.path(numericField);
        if (numeric.isNumber()) {
            double value = numeric.asDouble();
            return Double.isFinite(value) && value >= 0 ? value : null;
        }
        String display = text(node, displayField);
        if (display == null || !display.matches("\\$[\\d,]+(?:\\.\\d{1,2})?")) return null;
        try {
            double value = Double.parseDouble(display.substring(1).replace(",", ""));
            return Double.isFinite(value) ? value : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static String firstText(JsonNode values) {
        return values.isArray() && !values.isEmpty() && values.get(0).isTextual()
                ? values.get(0).asText() : null;
    }

    private static String joinText(JsonNode values) {
        if (!values.isArray()) return null;
        List<String> texts = new ArrayList<>();
        for (JsonNode value : values) {
            if (value.isTextual() && !value.asText().isBlank()) texts.add(value.asText());
        }
        return texts.isEmpty() ? null : String.join(" · ", texts);
    }

    private static String joinOffers(JsonNode product) {
        String coupon = text(product, "save_with_coupon");
        String offers = joinText(product.path("offers"));
        if (coupon == null) return offers;
        return offers == null ? coupon : coupon + " · " + offers;
    }
}
