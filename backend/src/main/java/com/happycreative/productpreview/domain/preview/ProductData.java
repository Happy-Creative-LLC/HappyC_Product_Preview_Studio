package com.happycreative.productpreview.domain.preview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public final class ProductData {
    private final String rawJson;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public ProductData(String rawJson) {
        this.rawJson = rawJson == null ? "{}" : rawJson;
    }

    public String getRawJson() {
        return rawJson;
    }

    public void validateForCase(int caseType) {
        if (rawJson == null || rawJson.isBlank()) {
            throw new IllegalArgumentException("Yêu cầu productData không được bỏ trống.");
        }
        try {
            JsonNode json = MAPPER.readTree(rawJson);
            String title = json.path("title").asText(null);
            if (title == null || title.isBlank()) {
                throw new IllegalArgumentException("Tiêu đề sản phẩm là bắt buộc.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("productData phải là JSON hợp lệ.", e);
        }
    }

    public String toJson() {
        return rawJson;
    }

    public static ProductData fromJson(String json) {
        return new ProductData(json);
    }

    public ObjectNode toObjectNode() {
        try {
            return (ObjectNode) MAPPER.readTree(rawJson);
        } catch (Exception e) {
            throw new RuntimeException("Không thể parse productData", e);
        }
    }
}
