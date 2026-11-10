package com.happycreative.productpreview.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CommentRequest {
    private String content;
    private String audience;
    private String targetComponent;
    private UUID parentCommentId;
    private List<UUID> mentionIds;
}
