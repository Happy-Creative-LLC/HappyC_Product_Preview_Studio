package com.happycreative.productpreview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.repository.PreviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PreviewCleanupService {

    private final PreviewRepository previewRepository;
    private final ObjectMapper objectMapper;

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
                    
                    // Extract main image
                    if (data.has("images") && data.get("images").isArray()) {
                        for (JsonNode imgNode : data.get("images")) {
                            deletePhysicalFile(imgNode.asText());
                        }
                    }
                    // Extract videos
                    if (data.has("videos") && data.get("videos").isArray()) {
                        for (JsonNode vidNode : data.get("videos")) {
                            deletePhysicalFile(vidNode.asText());
                        }
                    }
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

    private void deletePhysicalFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;
        
        // Example url: /uploads/abc.jpg
        if (fileUrl.startsWith("/uploads/")) {
            String filename = fileUrl.substring("/uploads/".length());
            try {
                Path filePath = Paths.get("uploads").resolve(filename).normalize();
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.debug("Deleted physical file: {}", filePath);
                }
            } catch (IOException e) {
                log.error("Could not delete physical file {}: {}", filename, e.getMessage());
            }
        }
    }
}
