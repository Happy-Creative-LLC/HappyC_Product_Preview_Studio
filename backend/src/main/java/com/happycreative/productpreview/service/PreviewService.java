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
                                 String brand, String fabricType, String careInstructions, String origin, List<String> bulletPoints,
                                 MultipartFile mainImage, List<MultipartFile> galleryImages, 
                                 List<String> colorNames, List<MultipartFile> colorImages, 
                                 List<String> sizes, MultipartFile video) {
        
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
        if (brand != null && !brand.isEmpty()) {
            productData.put("brand", brand);
        }
        if (fabricType != null && !fabricType.isEmpty()) {
            productData.put("fabricType", fabricType);
        }
        if (careInstructions != null && !careInstructions.isEmpty()) {
            productData.put("careInstructions", careInstructions);
        }
        if (origin != null && !origin.isEmpty()) {
            productData.put("origin", origin);
        }
        if (bulletPoints != null && !bulletPoints.isEmpty()) {
            ArrayNode bpArray = productData.putArray("bulletPoints");
            for (String bp : bulletPoints) {
                bpArray.add(bp);
            }
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
        
        if (colorNames != null && colorImages != null && colorNames.size() == colorImages.size()) {
            ArrayNode colorsArray = productData.putArray("colors");
            for (int i = 0; i < colorNames.size(); i++) {
                String cUrl = fileStorageService.storeFile(colorImages.get(i));
                if (cUrl != null) {
                    ObjectNode colorObj = objectMapper.createObjectNode();
                    colorObj.put("name", colorNames.get(i));
                    colorObj.put("image", "http://localhost:8081" + cUrl);
                    colorsArray.add(colorObj);
                }
            }
        }
        
        if (sizes != null && !sizes.isEmpty()) {
            ArrayNode sizesArray = productData.putArray("sizes");
            for (String size : sizes) {
                sizesArray.add(size);
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
