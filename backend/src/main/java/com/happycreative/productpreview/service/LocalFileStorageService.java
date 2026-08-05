package com.happycreative.productpreview.service;

import com.happycreative.productpreview.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalFileStorageService implements FileStorageService {

    private static final String PUBLIC_PATH = "/uploads/";

    private final Path storageRoot;
    private final String publicBaseUrl;
    private final StorageProperties properties;

    public LocalFileStorageService(
            StorageProperties properties,
            @Value("${app.base-url:}") String publicBaseUrl) {
        this.properties = properties;
        String localDirectory = properties.getLocal().getDirectory();
        if (localDirectory == null || localDirectory.isBlank()) {
            throw new IllegalStateException("Thiếu cấu hình LOCAL_STORAGE_DIRECTORY");
        }
        this.storageRoot = Paths.get(localDirectory)
                .toAbsolutePath()
                .normalize();
        this.publicBaseUrl = stripTrailingSlash(publicBaseUrl);

        try {
            Files.createDirectories(storageRoot);
        } catch (IOException e) {
            throw new StorageException("Không thể khởi tạo thư mục lưu trữ file", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String objectKey = StorageObjectKeyFactory.create(
                properties.getKeyPrefix(),
                file.getOriginalFilename());
        Path destination = storageRoot.resolve(objectKey).normalize();
        ensureInsideStorageRoot(destination);

        try (InputStream inputStream = file.getInputStream()) {
            Files.createDirectories(destination.getParent());
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            return publicBaseUrl + PUBLIC_PATH + objectKey;
        } catch (IOException e) {
            throw new StorageException("Không thể lưu file lên bộ nhớ local", e);
        }
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        String objectKey = ownedObjectKey(fileUrl);
        if (objectKey == null) {
            return false;
        }

        Path target = storageRoot.resolve(objectKey).normalize();
        ensureInsideStorageRoot(target);
        try {
            boolean deleted = Files.deleteIfExists(target);
            if (deleted) {
                log.debug("Đã xóa file local: {}", target);
            }
            return deleted;
        } catch (IOException e) {
            throw new StorageException("Không thể xóa file khỏi bộ nhớ local", e);
        }
    }

    private String ownedObjectKey(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return null;
        }
        try {
            String candidate = fileUrl.trim();
            URI uri = URI.create(candidate);
            if (uri.isAbsolute() && !candidate.startsWith(publicBaseUrl + PUBLIC_PATH)) {
                return null;
            }
            String path = uri.getPath();
            if (path == null || !path.startsWith(PUBLIC_PATH)) {
                return null;
            }
            String objectKey = path.substring(PUBLIC_PATH.length());
            return objectKey.isBlank() ? null : objectKey;
        } catch (IllegalArgumentException e) {
            log.warn("Bỏ qua URL file không hợp lệ khi cleanup: {}", fileUrl);
            return null;
        }
    }

    private void ensureInsideStorageRoot(Path path) {
        if (!path.startsWith(storageRoot)) {
            throw new StorageException(
                    "Đường dẫn file nằm ngoài thư mục lưu trữ cho phép",
                    new SecurityException(path.toString()));
        }
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim().replaceAll("/+$", "");
    }
}
