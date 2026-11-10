package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

/** Không dùng key thật hoặc gửi request ra Internet trong test. */
class SerpApiAmazonSearchProviderTest {
    private MockRestServiceServer server;
    private SerpApiAmazonSearchProvider provider;
    private static final String FREE_ACCOUNT = """
            {"plan_monthly_price":0,"plan_searches_left":250,
             "this_hour_searches":0,"account_rate_limit_per_hour":50}
            """;

    @BeforeEach
    void setUp() {
        RestTemplate client = new RestTemplate();
        server = MockRestServiceServer.bindTo(client).build();
        provider = new SerpApiAmazonSearchProvider(new ObjectMapper(), client);
        ReflectionTestUtils.setField(provider, "apiKey", "test-key-not-a-secret");
    }

    @AfterEach
    void verifyRequests() {
        server.verify();
    }

    private void account(String json) {
        server.expect(requestTo(startsWith("https://serpapi.com/account.json?")))
                .andExpect(queryParam("api_key", "test-key-not-a-secret"))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
    }

    @Test
    void usesAmazonSearchContractAndMapsRealFieldsWithoutInventedValues() {
        account(FREE_ACCOUNT);
        server.expect(requestTo(startsWith("https://serpapi.com/search.json?")))
                .andExpect(queryParam("engine", "amazon"))
                .andExpect(queryParam("k", "cotton%20%26%20linen"))
                .andExpect(queryParam("amazon_domain", "amazon.com"))
                .andExpect(queryParam("delivery_zip", "10001"))
                .andExpect(queryParam("page", "1"))
                .andExpect(request -> assertFalse(request.getURI().getRawQuery().contains("no_cache=true")))
                .andRespond(withSuccess("""
                    {"organic_results":[{
                      "position":1,"asin":"B012345678","title":"Cotton &amp; Linen",
                      "thumbnail":"https://m.media-amazon.com/images/I/test.jpg",
                      "extracted_price":29.99,"extracted_old_price":39.99,
                      "sponsored":true,"rating":4.7,"reviews":120,
                      "badges":["Amazon's Choice"],"bought_last_month":"100+ bought in past month",
                      "save_with_coupon":"Save 10%","offers":["Limited time deal"],
                      "delivery":["FREE delivery Friday"]
                    }]}
                    """, MediaType.APPLICATION_JSON));

        var product = provider.search("cotton & linen").getFirst();

        assertEquals("B012345678", product.getId());
        assertEquals("Cotton & Linen", product.getTitle());
        assertEquals(1, product.getPosition());
        assertEquals(29.99, product.getPrice());
        assertEquals(39.99, product.getOriginalPrice());
        assertTrue(product.isSponsored());
        assertEquals("Amazon's Choice", product.getBadge());
        assertEquals("4.7", product.getRating());
        assertEquals("120", product.getReviews());
        assertEquals("Save 10% · Limited time deal", product.getPromotion());
        assertEquals("FREE delivery Friday", product.getDeliveryTime());
        assertNull(product.getBrand());
    }

    @Test
    void paidPlanIsRejectedInFreeOnlyModeBeforeSearch() {
        account("{\"plan_monthly_price\":25,\"plan_searches_left\":1000}");

        var failure = assertThrows(ResponseStatusException.class, () -> provider.search("shirt"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, failure.getStatusCode());
        assertTrue(failure.getReason().contains("miễn phí"));
    }

    @Test
    void paidExtraCreditsAreNotUsedAfterFreeQuotaRunsOut() {
        account("{\"plan_monthly_price\":0,\"plan_searches_left\":0,\"extra_credits\":100,\"total_searches_left\":100}");

        var failure = assertThrows(ResponseStatusException.class, () -> provider.search("shirt"));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, failure.getStatusCode());
        assertTrue(failure.getReason().contains("miễn phí"));
    }

    @Test
    void hourlyLimitIsCheckedBeforeSearch() {
        account("{\"plan_monthly_price\":0,\"plan_searches_left\":100,\"this_hour_searches\":50,\"account_rate_limit_per_hour\":50}");

        assertEquals(HttpStatus.TOO_MANY_REQUESTS,
                assertThrows(ResponseStatusException.class, () -> provider.search("shirt")).getStatusCode());
    }

    @Test
    void missingKeyMakesNoRequests() {
        ReflectionTestUtils.setField(provider, "apiKey", "");

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(ResponseStatusException.class, () -> provider.search("shirt")).getStatusCode());
    }

    @Test
    void unknownAccountSchemaFailsClosedRatherThanSpendingQuota() {
        account("{\"unexpected\":true}");

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(ResponseStatusException.class, () -> provider.search("shirt")).getStatusCode());
    }

    @Test
    void providerHttpErrorDoesNotExposeKeyOrRawPayload() {
        account(FREE_ACCOUNT);
        server.expect(requestTo(startsWith("https://serpapi.com/search.json?")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .body("raw provider message test-key-not-a-secret"));

        var failure = assertThrows(ResponseStatusException.class, () -> provider.search("shirt"));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, failure.getStatusCode());
        assertFalse(failure.getMessage().contains("test-key-not-a-secret"));
        assertFalse(failure.getMessage().contains("raw provider message"));
        assertNull(failure.getCause());
    }

    @Test
    void failedProviderHasCooldownInsteadOfRepeatedRequests() {
        account(FREE_ACCOUNT);
        server.expect(requestTo(startsWith("https://serpapi.com/search.json?")))
                .andRespond(withServerError());

        assertThrows(ResponseStatusException.class, () -> provider.search("shirt"));
        // Không thêm expectation HTTP: lần gọi sau phải dùng cooldown, không gọi provider.
        assertThrows(ResponseStatusException.class, () -> provider.search("another keyword"));
    }

    @Test
    void malformedSearchResponseIsAnErrorInsteadOfFakeEmptyResults() {
        account(FREE_ACCOUNT);
        server.expect(requestTo(startsWith("https://serpapi.com/search.json?")))
                .andRespond(withSuccess("{\"unexpected\":true}", MediaType.APPLICATION_JSON));

        assertEquals(HttpStatus.BAD_GATEWAY,
                assertThrows(ResponseStatusException.class, () -> provider.search("shirt")).getStatusCode());
    }

    @Test
    void legitimateEmptyArrayIsReturnedForNegativeCaching() {
        account(FREE_ACCOUNT);
        server.expect(requestTo(startsWith("https://serpapi.com/search.json?")))
                .andRespond(withSuccess("{\"organic_results\":[]}", MediaType.APPLICATION_JSON));

        assertTrue(provider.search("no matches").isEmpty());
    }

    @Test
    void asinImportUsesSerpApiProductContractAndSameFreeAllowance() {
        account(FREE_ACCOUNT);
        server.expect(requestTo(startsWith("https://serpapi.com/search.json?")))
                .andExpect(queryParam("engine", "amazon_product"))
                .andExpect(queryParam("asin", "B012345678"))
                .andExpect(queryParam("device", "desktop"))
                .andRespond(withSuccess("""
                    {"product_results":{"title":"Family &amp; Friends","brand":"Happy",
                      "purchase_options":{"buy_new":{"extracted_price":29.99}},
                      "about_item":["Soft cotton"],
                      "thumbnails":["https://m.media-amazon.com/shirt.jpg"]}}
                    """, MediaType.APPLICATION_JSON));

        var product = provider.product("B012345678");

        assertEquals("Family & Friends", product.path("title").asText());
        assertEquals(29.99, product.path("price").asDouble());
        assertEquals("Soft cotton", product.path("bulletPoints").get(0).asText());
        assertEquals("https://m.media-amazon.com/shirt.jpg", product.path("images").get(0).asText());
        assertFalse(product.has("fabricType"));
    }

    @Test
    void supportsUsdPriceFallbackAndMissingOptionalFields() {
        account(FREE_ACCOUNT);
        server.expect(requestTo(startsWith("https://serpapi.com/search.json?")))
                .andRespond(withSuccess("""
                    {"organic_results":[{"asin":"B01","title":"Chair",
                     "thumbnail":"https://m.media-amazon.com/chair.jpg","price":"$1,249.95"}]}
                    """, MediaType.APPLICATION_JSON));

        var product = provider.search("chair").getFirst();

        assertEquals(1249.95, product.getPrice());
        assertNull(product.getRating());
        assertNull(product.getPromotion());
        assertNull(product.getOriginalPrice());
    }
}
