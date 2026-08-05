package com.happycreative.productpreview.service;

import com.happycreative.productpreview.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;

@Service
@ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "r2")
@Slf4j
public class R2FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final StorageProperties properties;
    private final String publicBaseUrl;

    public R2FileStorageService(S3Client s3Client, StorageProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
        this.publicBaseUrl = stripTrailingSlash(properties.getR2().getPublicBaseUrl());
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String objectKey = StorageObjectKeyFactory.create(
                properties.getKeyPrefix(),
                file.getOriginalFilename());

        PutObjectRequest.Builder request = PutObjectRequest.builder()
                .bucket(properties.getR2().getBucket())
                .key(objectKey)
                .contentLength(file.getSize())
                .cacheControl("public, max-age=31536000, immutable");
        if (file.getContentType() != null && !file.getContentType().isBlank()) {
            request.contentType(file.getContentType());
        }

        try (InputStream inputStream = file.getInputStream()) {
            s3Client.putObject(
                    request.build(),
                    RequestBody.fromInputStream(inputStream, file.getSize()));
            return publicBaseUrl + "/" + objectKey;
        } catch (IOException | SdkException e) {
            throw new StorageException("Không thể tải file lên Cloudflare R2", e);
        }
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        String objectKey = ownedObjectKey(fileUrl);
        if (objectKey == null) {
            return false;
        }

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(properties.getR2().getBucket())
                    .key(objectKey)
                    .build());
            log.debug("Đã xóa object R2: {}", objectKey);
            return true;
        } catch (SdkException e) {
            throw new StorageException("Không thể xóa file khỏi Cloudflare R2", e);
        }
    }

    private String ownedObjectKey(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return null;
        }
        String prefix = publicBaseUrl + "/";
        if (!fileUrl.startsWith(prefix)) {
            return null;
        }
        String objectKey = fileUrl.substring(prefix.length());
        return objectKey.isBlank() ? null : objectKey;
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim().replaceAll("/+$", "");
    }
}
