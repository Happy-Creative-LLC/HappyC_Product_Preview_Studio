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
}
