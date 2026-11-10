package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/** Opt-in: đúng một truy vấn thật, chỉ bật khi chủ tài khoản yêu cầu kiểm tra kết nối. */
@org.springframework.boot.test.context.SpringBootTest(properties = "logging.level.org.springframework.web=DEBUG")
@org.springframework.test.context.ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "SERPAPI_LIVE_TEST", matches = "true")
class SerpApiLiveSmokeTest {
    @org.springframework.beans.factory.annotation.Autowired
    private SerpApiAmazonSearchProvider provider;

    @Test
    void freeAccountCanSearchAmazon() throws Exception {
        String key = System.getenv("SERPAPI_API_KEY");
        assertNotNull(key, "Cần SERPAPI_API_KEY trong môi trường của tiến trình test.");
        ReflectionTestUtils.setField(provider, "apiKey", key);
        assertFalse(org.slf4j.LoggerFactory.getLogger("org.springframework.web.client.RestTemplate").isDebugEnabled());
        assertFalse(org.slf4j.LoggerFactory.getLogger("org.springframework.web.HttpLogging").isDebugEnabled());

        var repository = org.mockito.Mockito.mock(
                com.happycreative.productpreview.repository.SearchCacheRepository.class);
        var rows = new java.util.HashMap<String, com.happycreative.productpreview.entity.SearchCache>();
        org.mockito.Mockito.when(repository.findByKeywordIgnoreCase(org.mockito.ArgumentMatchers.anyString()))
                .thenAnswer(call -> java.util.Optional.ofNullable(rows.get(call.getArgument(0))));
        org.mockito.Mockito.when(repository.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(call -> {
                    var row = (com.happycreative.productpreview.entity.SearchCache) call.getArgument(0);
                    rows.put(row.getKeyword(), row);
                    return row;
                });
        var service = new AmazonScraperService(repository, new ObjectMapper(), provider);
        var first = service.searchDetailed("cotton shirt", false);
        var repeated = service.searchDetailed("cotton shirt", false);
        assertEquals("serpapi", first.source());
        assertEquals("cache", repeated.source());
        var products = first.items();
        java.nio.file.Path output = java.nio.file.Path.of("../.playwright-mcp/serpapi-live-results.json");
        java.nio.file.Files.createDirectories(output.getParent());
        java.nio.file.Files.writeString(output, new ObjectMapper().writeValueAsString(products));

        assertFalse(products.isEmpty(), "Truy vấn smoke test cần trả sản phẩm Amazon thật.");
        assertTrue(products.stream().allMatch(product -> product.getId() != null && !product.isDemo()));
        System.out.println("SerpApi Free: kết nối thành công, sản phẩm thật trả về: " + products.size());
    }
}
