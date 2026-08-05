package com.happycreative.productpreview.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminUserRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Tên nhân sự không được để trống")
    private String fullName;

    @NotNull(message = "Vai trò không được để trống")
    private String role;

    private String projectKey;

    private String status;
}
