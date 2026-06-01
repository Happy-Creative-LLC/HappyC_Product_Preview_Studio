package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.AmazonSearchResultDto;
import com.happycreative.productpreview.service.AmazonScraperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/amazon")
@CrossOrigin(origins = "http://localhost:5174")
@RequiredArgsConstructor
public class AmazonController {

    private final AmazonScraperService amazonScraperService;

    @GetMapping("/search")
    public ResponseEntity<List<AmazonSearchResultDto>> searchAmazon(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        List<AmazonSearchResultDto> results = amazonScraperService.searchAmazon(keyword, forceRefresh);
        return ResponseEntity.ok(results);
    }
}
