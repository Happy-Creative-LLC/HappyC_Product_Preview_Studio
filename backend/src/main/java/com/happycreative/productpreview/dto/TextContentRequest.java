package com.happycreative.productpreview.dto;

import java.util.List;

public record TextContentRequest(
        String title,
        Double price,
        String brand,
        String fabricType,
        String careInstructions,
        String origin,
        List<String> bulletPoints,
        List<String> sizes,
        String description,
        String searchTerms,
        String productType,
        List<String> tags,
        List<String> materials,
        String whoMade,
        String whenMade,
        String taxonomyPath,
        Integer quantity,
        List<String> clearFields,
        /** Version của preview mà client đã tải; null khi task chưa có preview. Lệch thì trả 409. */
        Integer version
) {
}
