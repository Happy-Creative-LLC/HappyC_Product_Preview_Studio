package com.happycreative.productpreview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO này được Jackson ghi/đọc lại từ bảng search_cache, nên BẮT BUỘC có constructor
 * mặc định. Nếu chỉ để @Data + @Builder, Lombok không sinh no-arg constructor và
 * Jackson ghi cache được nhưng không đọc lại được — cache trở nên vô dụng, mọi lượt
 * search đều gọi lại RapidAPI (tốn quota + chậm 2-3s).
 */
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
