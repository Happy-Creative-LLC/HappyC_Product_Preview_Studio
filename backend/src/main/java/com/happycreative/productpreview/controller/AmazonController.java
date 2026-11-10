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
