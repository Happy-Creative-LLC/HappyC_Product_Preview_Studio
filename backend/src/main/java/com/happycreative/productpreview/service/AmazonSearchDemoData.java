package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.AmazonSearchResultDto;

import java.util.List;

/** Dữ liệu giả lập có nhãn; không lưu vào search_cache và không giả làm đối thủ thật. */
final class AmazonSearchDemoData {
    private AmazonSearchDemoData() {}

    static List<AmazonSearchResultDto> products() {
        return List.of(
                product(1, "Áo thun cotton gia đình", 24.99),
                product(2, "Áo nhóm in hình cá nhân", 29.99),
                product(3, "Áo unisex cổ tròn", 19.99),
                product(4, "Áo cotton quà tặng", 27.99),
                product(5, "Áo thun du lịch gia đình", 22.99),
                product(6, "Áo in hình kỷ niệm", 25.99));
    }

    private static AmazonSearchResultDto product(int position, String title, double price) {
        return AmazonSearchResultDto.builder()
                .id("demo-" + position)
                .title(title)
                .image("/demo/search-shirt.svg")
                .price(price)
                .position(position)
                .demo(true)
                .build();
    }
}
