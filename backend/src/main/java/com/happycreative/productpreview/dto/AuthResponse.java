package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private String email;
    private String fullName;
    private Role role;
    
    public AuthResponse(String token, String email, String fullName, Role role) {
        this.token = token;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }
}
