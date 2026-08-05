package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.PreviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/previews")
@RequiredArgsConstructor
public class PreviewController {

    private final PreviewService previewService;

    @PostMapping("/upload")
    public ResponseEntity<Preview> uploadPreview(
            @RequestParam("taskId") UUID taskId,
            @RequestParam("platform") String platform,
            @RequestParam("title") String title,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "fabricType", required = false) String fabricType,
            @RequestParam(value = "careInstructions", required = false) String careInstructions,
            @RequestParam(value = "origin", required = false) String origin,
            @RequestParam(value = "bulletPoints", required = false) List<String> bulletPoints,
            @RequestParam(value = "mainImage", required = false) MultipartFile mainImage,
            @RequestParam(value = "galleryImages", required = false) List<MultipartFile> galleryImages,
            @RequestParam(value = "colorNames", required = false) List<String> colorNames,
            @RequestParam(value = "colorImages", required = false) List<MultipartFile> colorImages,
            @RequestParam(value = "sizes", required = false) List<String> sizes,
            // "video" = key cũ (1 file). "videos" = key mới, nhiều file — Case 2/3
            // theo TechBrief cho nhiều hơn 1 video. Cả hai đều nhận để không phá
            // client cũ; số lượng tối đa CHƯA chốt (Open Issue #1) nên không giới hạn ở đây.
            @RequestParam(value = "video", required = false) MultipartFile video,
            @RequestParam(value = "videos", required = false) List<MultipartFile> videos,
            @RequestParam(value = "aPlusImages", required = false) List<MultipartFile> aPlusImages,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Preview preview = previewService.createPreview(
                taskId, userDetails.getUserId(), platform, title, price, brand,
                fabricType, careInstructions, origin, bulletPoints,
                mainImage, galleryImages, colorNames, colorImages, sizes,
                mergeVideos(video, videos), aPlusImages);
        return ResponseEntity.ok(preview);
    }

    /** Gộp key cũ "video" và key mới "videos" thành một danh sách, giữ đúng thứ tự gửi lên. */
    private List<MultipartFile> mergeVideos(MultipartFile video, List<MultipartFile> videos) {
        List<MultipartFile> merged = new ArrayList<>();
        if (video != null && !video.isEmpty()) {
            merged.add(video);
        }
        if (videos != null) {
            videos.stream().filter(file -> file != null && !file.isEmpty()).forEach(merged::add);
        }
        return merged;
    }

    @PostMapping("/import")
    public ResponseEntity<Preview> importPreview(
            @RequestParam("taskId") UUID taskId,
            @RequestParam("platform") String platform,
            @RequestParam("asin") String asin,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Preview preview = previewService.createPreviewFromAsin(
                taskId, userDetails.getUserId(), platform, asin);
        return ResponseEntity.ok(preview);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Preview> getPreview(@PathVariable UUID id) {
        return previewService.getPreviewById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
