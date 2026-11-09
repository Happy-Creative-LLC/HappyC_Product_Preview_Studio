package com.happycreative.productpreview.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@ConfigurationProperties(prefix = "app.content")
@Getter
@Setter
public class ContentProperties {
    private List<String> amazonProductTypes = List.of();
}
