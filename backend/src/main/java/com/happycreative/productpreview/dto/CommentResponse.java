package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.Comment;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CommentResponse {
    private UUID id;
    private UUID previewId;
    private UUID taskId;
    private UUID parentCommentId;
    private String content;
    private String authorName;
    private String authorRole;
    private String audience;
    private List<CommentMentionResponse> mentions;
    private boolean resolved;
    private String resolvedByName;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    public static CommentResponse from(Comment c) {
        CommentResponse dto = new CommentResponse();
        dto.setId(c.getId());
        dto.setPreviewId(c.getPreview() != null ? c.getPreview().getId() : null);
        dto.setTaskId(c.getTask() != null ? c.getTask().getId() : null);
        dto.setParentCommentId(c.getParentComment() != null ? c.getParentComment().getId() : null);
        dto.setContent(c.getContent());
        dto.setAuthorName(c.getUser() != null ? c.getUser().getFullName() : "Unknown");
        dto.setAuthorRole(c.getAuthorRole());
        dto.setAudience(c.getAudience());
        dto.setMentions(c.getMentions().stream().map(CommentMentionResponse::from).toList());
        dto.setResolved(c.isResolved());
        if (c.getResolvedBy() != null) {
            dto.setResolvedByName(c.getResolvedBy().getFullName());
        }
        dto.setResolvedAt(c.getResolvedAt());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
