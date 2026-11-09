package com.happycreative.productpreview.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.happycreative.productpreview.config.ContentProperties;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ContentConfigController {
    private final ContentProperties contentProperties;

    @GetMapping("/api/content/amazon-product-types")
    public List<String> amazonProductTypes() {
        return contentProperties.getAmazonProductTypes();
    }
}
