package com.happycreative.productpreview.application.preview.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class PreviewDto {
    public UUID id;
    public int version;
    public String status;
    public String productData;
    public UUID ownerId;
    public UUID taskId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
