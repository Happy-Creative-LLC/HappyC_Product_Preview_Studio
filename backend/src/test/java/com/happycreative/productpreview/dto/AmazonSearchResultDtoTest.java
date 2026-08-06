package com.happycreative.productpreview.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * search_cache lưu danh sách DTO này dưới dạng JSON rồi đọc lại ở lần search sau.
 * Nếu round-trip hỏng, cache im lặng trở nên vô dụng: mỗi lượt search lại gọi
 * RapidAPI thật (chậm 2-3s + tốn quota) mà không có lỗi nào nổi lên UI.
 */
class AmazonSearchResultDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void survivesJsonRoundTripSoSearchCacheCanBeRead() throws Exception {
        List<AmazonSearchResultDto> original = List.of(
                AmazonSearchResultDto.builder()
                        .id("B0DZBHV19C")
                        .title("Custom Hawaiian Shirt with Face Photo")
                        .image("https://m.media-amazon.com/images/I/81moQYlv-WL._AC_UL960_QL65_.jpg")
                        .price(9.95)
                        .originalPrice(12.99)
                        .rating("4.7")
                        .reviews("135")
                        .isSponsored(true)
                        .badge("Amazon's Choice")
                        .brand("AlohaInk")
                        .salesVolume("100+ bought in past month")
                        .build());

        String json = objectMapper.writeValueAsString(original);
        List<AmazonSearchResultDto> restored =
                objectMapper.readValue(json, new TypeReference<List<AmazonSearchResultDto>>() {});

        assertEquals(original, restored);
    }

    @Test
    void keepsNullOptionalFieldsThroughRoundTrip() throws Exception {
        // Amazon thường trả null cho originalPrice/salesVolume/badge — cache phải
        // đọc lại được những bản ghi như vậy, không chỉ bản ghi đầy đủ trường.
        List<AmazonSearchResultDto> original = List.of(
                AmazonSearchResultDto.builder()
                        .id("B0C49NHSKL")
                        .title("Custom Hawaiian Shirt")
                        .image("https://example.com/a.jpg")
                        .price(12.99)
                        .rating("4.7")
                        .reviews("597")
                        .build());

        String json = objectMapper.writeValueAsString(original);
        List<AmazonSearchResultDto> restored =
                objectMapper.readValue(json, new TypeReference<List<AmazonSearchResultDto>>() {});

        assertEquals(original, restored);
    }
}
