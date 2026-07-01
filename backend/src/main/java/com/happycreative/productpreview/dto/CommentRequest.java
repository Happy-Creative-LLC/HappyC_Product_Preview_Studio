package com.happycreative.productpreview.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private String content;
    private String targetComponent; // IMAGE | VIDEO | TEXT | APLUS | GENERAL
}
