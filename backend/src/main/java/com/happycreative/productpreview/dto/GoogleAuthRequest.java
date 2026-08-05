package com.happycreative.productpreview.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {

    @NotBlank(message = "Google credential không được để trống")
    private String credential;
}
