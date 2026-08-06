package com.happycreative.productpreview.domain.preview;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class Preview {
    private final PreviewId id;
    private int version;
    private PreviewStatus status;
    private final PreviewPlatform platform;
    private ProductData productData;
    private final java.util.UUID ownerId;
    private final java.util.UUID taskId;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Preview(PreviewId id, int version, PreviewStatus status, PreviewPlatform platform, ProductData productData,
                    java.util.UUID ownerId, java.util.UUID taskId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.version = version;
        this.status = status;
        this.platform = platform;
        this.productData = productData;
        this.ownerId = ownerId;
        this.taskId = taskId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Reconstitute a Preview aggregate from persisted state.
     * Used by repository adapters to rebuild a domain object from the JPA entity.
     */
    public static Preview reconstitute(PreviewId id, int version, PreviewStatus status, PreviewPlatform platform,
                                       ProductData productData, java.util.UUID ownerId, java.util.UUID taskId,
                                       LocalDateTime createdAt, LocalDateTime updatedAt) {
        return new Preview(id, version, status, platform, productData, ownerId, taskId, createdAt, updatedAt);
    }

    public static Preview create(java.util.UUID id, PreviewPlatform platform, java.util.UUID ownerId,
                                 java.util.UUID taskId, ProductData productData) {
        PreviewId pid = PreviewId.of(id);
        LocalDateTime now = LocalDateTime.now();
        return new Preview(pid, 1, PreviewStatus.DRAFT, platform, productData, ownerId, taskId, now, now);
    }

    public PreviewId getId() { return id; }
    public int getVersion() { return version; }
    public PreviewStatus getStatus() { return status; }
    public PreviewPlatform getPlatform() { return platform; }
    public ProductData getProductData() { return productData; }
    public java.util.UUID getOwnerId() { return ownerId; }
    public java.util.UUID getTaskId() { return taskId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void update(ProductData newData) {
        Objects.requireNonNull(newData);
        this.productData = newData;
        incrementVersion();
    }

    public void submitForReview(java.util.UUID submitterId) {
        // basic permission placeholder
        if (!Objects.equals(submitterId, ownerId)) {
            // in real app check roles
        }
        productData.validateForCase(0);
        this.status = PreviewStatus.SUBMITTED;
        incrementVersion();
    }

    public void approve(java.util.UUID approverId) { this.status = PreviewStatus.APPROVED; incrementVersion(); }
    public void reject(java.util.UUID approverId, String reason) { this.status = PreviewStatus.REJECTED; incrementVersion(); }

    private void incrementVersion() { this.version = this.version + 1; this.updatedAt = LocalDateTime.now(); }
}
