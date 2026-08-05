package com.happycreative.productpreview.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class R2StorageConfig {

    @Bean(destroyMethod = "close")
    @ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "r2")
    public S3Client r2S3Client(StorageProperties properties) {
        StorageProperties.R2 r2 = properties.getR2();
        requireConfigured("R2_ACCOUNT_ID", r2.getAccountId());
        requireConfigured("R2_ACCESS_KEY_ID", r2.getAccessKeyId());
        requireConfigured("R2_SECRET_ACCESS_KEY", r2.getSecretAccessKey());
        requireConfigured("R2_BUCKET", r2.getBucket());
        requireConfigured("R2_PUBLIC_BASE_URL", r2.getPublicBaseUrl());

        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                r2.getAccessKeyId(),
                r2.getSecretAccessKey());

        S3Configuration serviceConfiguration = S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .chunkedEncodingEnabled(false)
                .build();

        return S3Client.builder()
                .endpointOverride(URI.create(
                        "https://" + r2.getAccountId().trim() + ".r2.cloudflarestorage.com"))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of("auto"))
                .serviceConfiguration(serviceConfiguration)
                .build();
    }

    private void requireConfigured(String environmentVariable, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Thiếu cấu hình " + environmentVariable + " để sử dụng Cloudflare R2");
        }
    }
}
