package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.AmazonSearchResultDto;
import com.happycreative.productpreview.service.AmazonScraperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/amazon")
@RequiredArgsConstructor
public class AmazonController {

    private final AmazonScraperService amazonScraperService;

    @GetMapping("/product")
    public ResponseEntity<com.fasterxml.jackson.databind.node.ObjectNode> getAmazonProduct(
            @RequestParam String asin,
            @RequestParam(defaultValue = "desktop") String device) {
        AmazonScraperService.ProductOutcome result = amazonScraperService.getProductByAsin(asin, device);
        return ResponseEntity.ok()
                .header("X-Product-Source", result.source())
                .header("X-Product-Stale", String.valueOf(result.stale()))
                .header("X-Product-Device", device.toLowerCase(java.util.Locale.ROOT))
                .header("X-Product-Fetched-At", result.fetchedAt().toString())
                .body(result.product());
    }

    @GetMapping("/search")
    public ResponseEntity<List<AmazonSearchResultDto>> searchAmazon(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        
        AmazonScraperService.SearchOutcome result = amazonScraperService.searchDetailed(keyword, forceRefresh);
        var response = ResponseEntity.ok()
                .header("X-Search-Source", result.source())
                .header("X-Search-Stale", String.valueOf(result.stale()));
        if (result.fetchedAt() != null) response.header("X-Search-Fetched-At", result.fetchedAt().toString());
        if (result.notice() != null) response.header("X-Search-Notice", result.notice());
        return response.body(result.items());
    }
}
