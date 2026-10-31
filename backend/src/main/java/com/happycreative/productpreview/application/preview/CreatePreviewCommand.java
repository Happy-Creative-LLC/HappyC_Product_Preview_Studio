package com.happycreative.productpreview.application.preview;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public class CreatePreviewCommand {
    public final UUID taskId;
    public final UUID userId;
    public final String platform;
    public final String asin;
    public final String title;
    public final Double price;
    public final String brand;
    public final String fabricType;
    public final String careInstructions;
    public final String origin;
    public final List<String> bulletPoints;
    public final MultipartFile mainImage;
    public final List<MultipartFile> galleryImages;
    public final List<String> colorNames;
    public final List<MultipartFile> colorImages;
    public final List<String> sizes;
    public final List<MultipartFile> videos;
    public final List<MultipartFile> aPlusImages;

    public CreatePreviewCommand(UUID taskId, UUID userId, String platform, String asin, String title, Double price,
                                String brand, String fabricType, String careInstructions, String origin,
                                List<String> bulletPoints, MultipartFile mainImage, List<MultipartFile> galleryImages,
                                List<String> colorNames, List<MultipartFile> colorImages, List<String> sizes,
                                List<MultipartFile> videos, List<MultipartFile> aPlusImages) {
        this.taskId = taskId;
        this.userId = userId;
        this.platform = platform;
        this.asin = asin;
        this.title = title;
        this.price = price;
        this.brand = brand;
        this.fabricType = fabricType;
        this.careInstructions = careInstructions;
        this.origin = origin;
        this.bulletPoints = bulletPoints;
        this.mainImage = mainImage;
        this.galleryImages = galleryImages;
        this.colorNames = colorNames;
        this.colorImages = colorImages;
        this.sizes = sizes;
        this.videos = videos;
        this.aPlusImages = aPlusImages;
    }

    /**
     * Request có ghi vùng Text không. Tiêu đề không tính: form luôn gửi kèm tiêu đề của task
     * dù người lưu chỉ sửa ảnh hoặc video. Import từ ASIN ghi cả text lẫn ảnh.
     */
    public boolean touchesText() {
        return hasText(asin)
                || price != null
                || hasText(brand) || hasText(fabricType) || hasText(careInstructions) || hasText(origin)
                || hasAnyText(bulletPoints) || hasAnyText(sizes);
    }

    /** Request có ghi vùng Ảnh không (ảnh chính, gallery, swatch màu và tên màu đi kèm, A+). */
    public boolean touchesImages() {
        return hasText(asin)
                || hasAnyFile(java.util.Collections.singletonList(mainImage))
                || hasAnyFile(galleryImages) || hasAnyFile(colorImages) || hasAnyFile(aPlusImages)
                || hasAnyText(colorNames);
    }

    public boolean touchesVideo() {
        return hasAnyFile(videos);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean hasAnyText(List<String> values) {
        return values != null && values.stream().anyMatch(CreatePreviewCommand::hasText);
    }

    private static boolean hasAnyFile(List<MultipartFile> files) {
        return files != null && files.stream().anyMatch(file -> file != null && !file.isEmpty());
    }
}
