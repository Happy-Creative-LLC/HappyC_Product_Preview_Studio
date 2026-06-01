package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.service.PreviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/previews")
@CrossOrigin(origins = "http://localhost:5174")
@RequiredArgsConstructor
public class PreviewController {

    private final PreviewService previewService;

    @PostMapping("/upload")
    public ResponseEntity<Preview> uploadPreview(
            @RequestParam("projectName") String projectName,
            @RequestParam("platform") String platform,
            @RequestParam("title") String title,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "mainImage", required = false) MultipartFile mainImage,
            @RequestParam(value = "galleryImages", required = false) List<MultipartFile> galleryImages,
            @RequestParam(value = "video", required = false) MultipartFile video
    ) {
        Preview preview = previewService.createPreview(projectName, platform, title, price, mainImage, galleryImages, video);
        return ResponseEntity.ok(preview);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Preview> getPreview(@PathVariable java.util.UUID id) {
        return previewService.getPreviewById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
