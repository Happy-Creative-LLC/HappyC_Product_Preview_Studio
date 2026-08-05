package com.happycreative.productpreview.dto;

import lombok.Data;

@Data
public class TaskRequest {
    private String title;
    private String platform;
    private Integer category;
    private String status;
}
