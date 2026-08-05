package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.entity.*;
import com.happycreative.productpreview.repository.PreviewRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PreviewService {

    private final PreviewRepository previewRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;
    private final AmazonScraperService amazonScraperService;

    public Preview createPreview(UUID taskId, UUID userId, String platform, String title, Double price,
                                 String brand, String fabricType, String careInstructions, String origin,
                                 List<String> bulletPoints, MultipartFile mainImage,
                                 List<MultipartFile> galleryImages, List<String> colorNames,
                                 List<MultipartFile> colorImages, List<String> sizes,
                                 List<MultipartFile> videos, List<MultipartFile> aPlusImages) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        ObjectNode productData = buildProductData(title, price, brand, fabricType, careInstructions,
                origin, bulletPoints, mainImage, galleryImages, colorNames, colorImages, sizes, videos, aPlusImages);

        Preview preview = new Preview();
        preview.setUser(user);
        preview.setTask(task);
        preview.setPlatform(Platform.valueOf(platform.toUpperCase()));
        preview.setStatus(PreviewStatus.DRAFT);

        try {
            preview.setProductData(objectMapper.writeValueAsString(productData));
        } catch (Exception e) {
            throw new RuntimeException("Error processing JSON data", e);
        }

        return previewRepository.save(preview);
    }

    public Optional<Preview> getPreviewById(UUID id) {
        return previewRepository.findById(id);
    }

    public Preview createPreviewFromAsin(UUID taskId, UUID userId, String platform, String asin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        ObjectNode productData = amazonScraperService.scrapeProductByAsin(asin);

        Preview preview = new Preview();
        preview.setUser(user);
        preview.setTask(task);
        preview.setPlatform(Platform.valueOf(platform.toUpperCase()));
        preview.setStatus(PreviewStatus.DRAFT);

        try {
            preview.setProductData(objectMapper.writeValueAsString(productData));
        } catch (Exception e) {
            throw new RuntimeException("Error processing JSON data", e);
        }

        return previewRepository.save(preview);
    }

    private ObjectNode buildProductData(String title, Double price, String brand, String fabricType,
                                        String careInstructions, String origin, List<String> bulletPoints,
                                        MultipartFile mainImage, List<MultipartFile> galleryImages,
                                        List<String> colorNames, List<MultipartFile> colorImages,
                                        List<String> sizes, List<MultipartFile> videos,
                                        List<MultipartFile> aPlusImages) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("title", title);
        if (price != null) data.put("price", price);
        if (brand != null && !brand.isEmpty()) data.put("brand", brand);
        if (fabricType != null && !fabricType.isEmpty()) data.put("fabricType", fabricType);
        if (careInstructions != null && !careInstructions.isEmpty()) data.put("careInstructions", careInstructions);
        if (origin != null && !origin.isEmpty()) data.put("origin", origin);

        if (bulletPoints != null && !bulletPoints.isEmpty()) {
            ArrayNode bpArray = data.putArray("bulletPoints");
            bulletPoints.forEach(bpArray::add);
        }

        ArrayNode imagesArray = data.putArray("images");
        String mainImageUrl = fileStorageService.storeFile(mainImage);
        if (mainImageUrl != null) imagesArray.add(mainImageUrl);

        if (galleryImages != null) {
            for (MultipartFile img : galleryImages) {
                String url = fileStorageService.storeFile(img);
                if (url != null) imagesArray.add(url);
            }
        }

        if (colorImages != null && !colorImages.isEmpty()) {
            ArrayNode colorsArray = data.putArray("colors");
            for (int i = 0; i < colorImages.size(); i++) {
                String url = fileStorageService.storeFile(colorImages.get(i));
                if (url != null) {
                    ObjectNode colorObj = objectMapper.createObjectNode();
                    colorObj.put("name", (colorNames != null && colorNames.size() > i) ? colorNames.get(i) : "");
                    colorObj.put("image", url);
                    colorsArray.add(colorObj);
                }
            }
        }

        if (sizes != null && !sizes.isEmpty()) {
            ArrayNode sizesArray = data.putArray("sizes");
            sizes.forEach(sizesArray::add);
        }

        // Nhiều video: Case 2/3 theo TechBrief cho phép hơn 1. Số lượng tối đa chưa
        // chốt (Open Issue #1) nên không chặn ở đây — chỉ lưu đúng những gì gửi lên.
        if (videos != null && !videos.isEmpty()) {
            ArrayNode videosArray = data.putArray("videos");
            for (MultipartFile videoFile : videos) {
                String url = fileStorageService.storeFile(videoFile);
                if (url != null) videosArray.add(url);
            }
        }

        if (aPlusImages != null && !aPlusImages.isEmpty()) {
            ArrayNode aPlusArray = data.putArray("aPlusImages");
            for (MultipartFile ap : aPlusImages) {
                String url = fileStorageService.storeFile(ap);
                if (url != null) aPlusArray.add(url);
            }
        }

        return data;
    }
}
