package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.Comment;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CommentResponse {
    private UUID id;
    private UUID previewId;
    private String content;
    private String authorName;
    private String authorRole;
    private String targetComponent;
    private boolean resolved;
    private String resolvedByName;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    public static CommentResponse from(Comment c) {
        CommentResponse dto = new CommentResponse();
        dto.setId(c.getId());
        dto.setPreviewId(c.getPreview().getId());
        dto.setContent(c.getContent());
        dto.setAuthorName(c.getUser() != null ? c.getUser().getFullName() : "Unknown");
        dto.setAuthorRole(c.getAuthorRole());
        dto.setTargetComponent(c.getTargetComponent());
        dto.setResolved(c.isResolved());
        if (c.getResolvedBy() != null) {
            dto.setResolvedByName(c.getResolvedBy().getFullName());
        }
        dto.setResolvedAt(c.getResolvedAt());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
