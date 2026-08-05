package com.happycreative.productpreview.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(storageProperties.getLocal().getDirectory())
                .toAbsolutePath()
                .normalize();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadDir.toUri().toString());
    }
}
