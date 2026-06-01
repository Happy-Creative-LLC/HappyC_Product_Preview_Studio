package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.repository.PreviewRepository;
import com.happycreative.productpreview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PreviewService {
    
    private final PreviewRepository previewRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public Preview createPreview(String projectName, String platform, String title, Double price,
                                 MultipartFile mainImage, List<MultipartFile> galleryImages, MultipartFile video) {
        
        // Mock user logic: find or create a dummy Design user
        User user = userRepository.findByEmail("Happyc.design@gmail.com").orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail("Happyc.design@gmail.com");
            newUser.setPasswordHash("dummyHash123");
            newUser.setFullName("Design Team");
            newUser.setDepartment("DESIGN");
            newUser.setActive(true);
            return userRepository.save(newUser);
        });

        // Store files
        String mainImageUrl = fileStorageService.storeFile(mainImage);
        String videoUrl = fileStorageService.storeFile(video);
        
        // Build JSON product data
        ObjectNode productData = objectMapper.createObjectNode();
        productData.put("title", title);
        if (price != null) {
            productData.put("price", price);
        }
        
        ArrayNode imagesArray = productData.putArray("images");
        if (mainImageUrl != null) {
            imagesArray.add("http://localhost:8081" + mainImageUrl); // Hardcoding localhost for demo
        }
        
        if (galleryImages != null && !galleryImages.isEmpty()) {
            for (MultipartFile img : galleryImages) {
                String imgUrl = fileStorageService.storeFile(img);
                if (imgUrl != null) {
                    imagesArray.add("http://localhost:8081" + imgUrl);
                }
            }
        }
        
        if (videoUrl != null) {
            ArrayNode videosArray = productData.putArray("videos");
            videosArray.add("http://localhost:8081" + videoUrl);
        }

        // Create Preview entity
        Preview preview = new Preview();
        preview.setUser(user);
        preview.setProjectName(projectName);
        preview.setPlatform(platform.toUpperCase());
        
        try {
            preview.setProductData(objectMapper.writeValueAsString(productData));
        } catch (Exception e) {
            throw new RuntimeException("Error processing JSON data", e);
        }
        
        preview.setStatus("DRAFT");
        preview.setCreatedAt(LocalDateTime.now());
        preview.setUpdatedAt(LocalDateTime.now());

        return previewRepository.save(preview);
    }

    public Optional<Preview> getPreviewById(java.util.UUID id) {
        return previewRepository.findById(id);
    }
}
