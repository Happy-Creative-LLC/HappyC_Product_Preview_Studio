package com.happycreative.productpreview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmazonSearchResultDto {
    private String id;
    private String title;
    private String image;
    private Double price;
    private String rating;
    private String reviews;
    private boolean isSponsored;
    private String badge;
    private String brand;
    private String salesVolume;
    private Double originalPrice;
}
