package com.happycreative.productpreview.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AmazonSearchResultDto {
    private String id;
    private String title;
    private String image;
    private Double price;
    private String rating;
    private String reviews;
    private boolean isSponsored;
    private String badge;
}
