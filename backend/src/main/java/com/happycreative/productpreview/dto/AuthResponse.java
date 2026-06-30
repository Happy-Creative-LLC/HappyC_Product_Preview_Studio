package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.Role;
import lombok.Data;

import java.util.UUID;

@Data
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private UUID userId;
    private String email;
    private String fullName;
    private Role role;
    private String projectKey;

    public AuthResponse(String token, UUID userId, String email, String fullName, Role role, String projectKey) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.projectKey = projectKey;
    }
}
