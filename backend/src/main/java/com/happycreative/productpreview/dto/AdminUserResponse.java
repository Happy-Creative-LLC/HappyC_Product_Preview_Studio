package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AdminUserResponse {
    private UUID id;
    private String email;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String role;
    private String projectKey;
    private String authProvider;
    private String status;
    private LocalDateTime createdAt;

    public static AdminUserResponse from(User user) {
        AdminUserResponse dto = new AdminUserResponse();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setRole(user.getRole().name());
        dto.setProjectKey(user.getProjectKey());
        dto.setAuthProvider(user.getAuthProvider().name());
        dto.setStatus(user.getStatus().name());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
