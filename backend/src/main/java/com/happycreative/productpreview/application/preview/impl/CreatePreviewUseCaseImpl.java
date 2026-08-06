package com.happycreative.productpreview.application.preview.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.application.preview.CreatePreviewCommand;
import com.happycreative.productpreview.application.preview.CreatePreviewUseCase;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewPlatform;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.domain.preview.ProductData;
import com.happycreative.productpreview.infrastructure.preview.PreviewMapper;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.service.AmazonScraperService;
import com.happycreative.productpreview.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreatePreviewUseCaseImpl implements CreatePreviewUseCase {

    private final PreviewRepository previewRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final FileStorageService fileStorageService;
    private final AmazonScraperService amazonScraperService;
    private final PreviewMapper mapper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PreviewDto execute(CreatePreviewCommand command) {
        ProductData productData;
        if (command.asin != null && !command.asin.isBlank()) {
            productData = buildProductDataFromAsin(command.asin);
        } else {
            productData = buildProductData(command.title, command.price, command.brand, command.fabricType,
                    command.careInstructions, command.origin, command.bulletPoints,
                    command.mainImage, command.galleryImages, command.colorNames, command.colorImages,
                    command.sizes, command.videos, command.aPlusImages);
        }

        UUID userId = command.userId;
        UUID taskId = command.taskId;
        PreviewPlatform platform = PreviewPlatform.fromString(command.platform);

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        if (!taskRepository.existsById(taskId)) {
            throw new IllegalArgumentException("Task not found: " + taskId);
        }

        Preview preview = Preview.create(UUID.randomUUID(), platform, userId, taskId, productData);
        previewRepository.save(preview);
        return mapper.toDto(preview);
    }

    private ProductData buildProductDataFromAsin(String asin) {
        ObjectNode scraped = amazonScraperService.scrapeProductByAsin(asin);
        return new ProductData(scraped.toString());
    }

    private ProductData buildProductData(String title, Double price, String brand, String fabricType,
                                         String careInstructions, String origin, List<String> bulletPoints,
                                         MultipartFile mainImage, List<MultipartFile> galleryImages,
                                         List<String> colorNames, List<MultipartFile> colorImages,
                                         List<String> sizes, List<MultipartFile> videos,
                                         List<MultipartFile> aPlusImages) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("title", title);
        if (price != null) data.put("price", price);
        if (brand != null && !brand.isBlank()) data.put("brand", brand);
        if (fabricType != null && !fabricType.isBlank()) data.put("fabricType", fabricType);
        if (careInstructions != null && !careInstructions.isBlank()) data.put("careInstructions", careInstructions);
        if (origin != null && !origin.isBlank()) data.put("origin", origin);

        if (bulletPoints != null && !bulletPoints.isEmpty()) {
            ArrayNode bpArray = data.putArray("bulletPoints");
            bulletPoints.forEach(bpArray::add);
        }

        ArrayNode imagesArray = data.putArray("images");
        if (mainImage != null && !mainImage.isEmpty()) {
            imagesArray.add(fileStorageService.storeFile(mainImage));
        }
        if (galleryImages != null) {
            for (MultipartFile file : galleryImages) {
                if (file != null && !file.isEmpty()) {
                    imagesArray.add(fileStorageService.storeFile(file));
                }
            }
        }

        if (colorImages != null && !colorImages.isEmpty()) {
            ArrayNode colorsArray = data.putArray("colors");
            for (int i = 0; i < colorImages.size(); i++) {
                MultipartFile file = colorImages.get(i);
                if (file == null || file.isEmpty()) continue;
                ObjectNode colorObject = objectMapper.createObjectNode();
                colorObject.put("name", (colorNames != null && colorNames.size() > i) ? colorNames.get(i) : "");
                colorObject.put("image", fileStorageService.storeFile(file));
                colorsArray.add(colorObject);
            }
        }

        if (sizes != null && !sizes.isEmpty()) {
            ArrayNode sizesArray = data.putArray("sizes");
            sizes.forEach(sizesArray::add);
        }

        if (videos != null && !videos.isEmpty()) {
            ArrayNode videosArray = data.putArray("videos");
            for (MultipartFile file : videos) {
                if (file != null && !file.isEmpty()) {
                    videosArray.add(fileStorageService.storeFile(file));
                }
            }
        }

        if (aPlusImages != null && !aPlusImages.isEmpty()) {
            ArrayNode aPlusArray = data.putArray("aPlusImages");
            for (MultipartFile file : aPlusImages) {
                if (file != null && !file.isEmpty()) {
                    aPlusArray.add(fileStorageService.storeFile(file));
                }
            }
        }

        return new ProductData(data.toString());
    }
}
