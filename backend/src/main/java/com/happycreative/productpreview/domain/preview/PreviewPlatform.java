package com.happycreative.productpreview.domain.preview;

public enum PreviewPlatform {
    AMAZON,
    ETSY;

    public static PreviewPlatform fromString(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Platform is required");
        }
        try {
            return PreviewPlatform.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid platform: " + value, e);
        }
    }
}
