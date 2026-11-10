package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.User;
import lombok.Data;

import java.util.UUID;

@Data
public class CommentMentionResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String role;

    public static CommentMentionResponse from(User user) {
        CommentMentionResponse response = new CommentMentionResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername() == null || user.getUsername().isBlank()
                ? user.getEmail() : user.getUsername());
        response.setFullName(user.getFullName() == null || user.getFullName().isBlank()
                ? user.getUsername() : user.getFullName());
        response.setRole(user.getRole().name());
        return response;
    }
}
