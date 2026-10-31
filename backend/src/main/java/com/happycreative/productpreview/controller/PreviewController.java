package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.application.preview.CreatePreviewCommand;
import com.happycreative.productpreview.application.preview.CreatePreviewUseCase;
import com.happycreative.productpreview.application.preview.GetPreviewUseCase;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.PreviewAccessService;
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

    private final CreatePreviewUseCase createPreviewUseCase;
    private final GetPreviewUseCase getPreviewUseCase;
    private final PreviewAccessService previewAccessService;

    @PostMapping("/upload")
    public ResponseEntity<PreviewDto> uploadPreview(
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
        PreviewDto previewDto = createPreviewUseCase.execute(
                new CreatePreviewCommand(
                        taskId,
                        userDetails.getUserId(),
                        platform,
                        null,
                        title,
                        price,
                        brand,
                        fabricType,
                        careInstructions,
                        origin,
                        bulletPoints,
                        mainImage,
                        galleryImages,
                        colorNames,
                        colorImages,
                        sizes,
                        mergeVideos(video, videos),
                        aPlusImages
                )
        );
        return ResponseEntity.ok(previewDto);
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
    public ResponseEntity<PreviewDto> importPreview(
            @RequestParam("taskId") UUID taskId,
            @RequestParam("platform") String platform,
            @RequestParam("asin") String asin,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        PreviewDto previewDto = createPreviewUseCase.execute(
                new CreatePreviewCommand(
                        taskId,
                        userDetails.getUserId(),
                        platform,
                        asin,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                )
        );
        return ResponseEntity.ok(previewDto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PreviewDto> getPreview(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        previewAccessService.requireReadablePreview(userDetails, id);
        PreviewDto dto = getPreviewUseCase.execute(com.happycreative.productpreview.domain.preview.PreviewId.of(id));
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }
}
