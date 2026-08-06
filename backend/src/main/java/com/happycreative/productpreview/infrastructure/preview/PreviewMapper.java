package com.happycreative.productpreview.infrastructure.preview;

import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewId;
import com.happycreative.productpreview.domain.preview.ProductData;
import org.springframework.stereotype.Component;

import java.util.UUID;

@SuppressWarnings("unused")
@Component
public class PreviewMapper {
    public PreviewDto toDto(Preview domain) {
        PreviewDto dto = new PreviewDto();
        dto.id = domain.getId().toUUID();
        dto.version = domain.getVersion();
        dto.status = domain.getStatus().name();
        dto.productData = domain.getProductData() == null ? null : domain.getProductData().toJson();
        dto.ownerId = domain.getOwnerId();
        dto.taskId = domain.getTaskId();
        dto.createdAt = domain.getCreatedAt();
        dto.updatedAt = domain.getUpdatedAt();
        return dto;
    }

    // mapping from JPA entity to domain is implemented in adapter
}
