package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.AmazonSearchResultDto;

import java.util.List;

/** Dữ liệu đối thủ đã chuẩn hoá; cache và phân quyền không phụ thuộc nhà cung cấp. */
public interface AmazonSearchProvider {
    List<AmazonSearchResultDto> search(String keyword);

    com.fasterxml.jackson.databind.node.ObjectNode product(String asin);
}
