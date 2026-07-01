package com.happycreative.productpreview.dto;

import lombok.Data;

@Data
public class TaskRequest {
    private String title;
    private String platform = "AMAZON";
    private int category = 1;
    private String status;
}
