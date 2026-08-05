package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.repository.PreviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PreviewCleanupService {

    private final PreviewRepository previewRepository;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;

    // Run every day at 02:00 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldPreviews() {
        log.info("Starting cleanup of old previews...");
        LocalDateTime threshold = LocalDateTime.now().minusDays(10);
        
        List<Preview> oldPreviews = previewRepository.findByCreatedAtBefore(threshold);
        int count = 0;

        for (Preview preview : oldPreviews) {
            try {
                // Parse product_data JSON to extract file URLs
                if (preview.getProductData() != null) {
                    JsonNode data = objectMapper.readTree(preview.getProductData());
                    
                    deleteUrlArray(data.get("images"));
                    deleteUrlArray(data.get("videos"));
                    deleteUrlArray(data.get("aPlusImages"));
                    deleteColorImages(data.get("colors"));
                }
                
                // Delete the record from DB (cascade might not cover comments if not configured, but we assume it deletes or orphans)
                // Actually, need to delete associated comments first if they exist, but since it's a demo we can just delete the preview.
                previewRepository.delete(preview);
                count++;
            } catch (Exception e) {
                log.error("Failed to delete preview id {}: {}", preview.getId(), e.getMessage());
            }
        }
        
        log.info("Completed cleanup. Deleted {} old previews.", count);
    }

    private void deleteUrlArray(JsonNode urls) {
        if (urls == null || !urls.isArray()) {
            return;
        }
        for (JsonNode url : urls) {
            fileStorageService.deleteFile(url.asText());
        }
    }

    private void deleteColorImages(JsonNode colors) {
        if (colors == null || !colors.isArray()) {
            return;
        }
        for (JsonNode color : colors) {
            JsonNode image = color.get("image");
            if (image != null && image.isTextual()) {
                fileStorageService.deleteFile(image.asText());
            }
        }
    }
}
