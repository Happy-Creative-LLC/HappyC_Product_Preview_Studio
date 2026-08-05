package com.happycreative.productpreview.service;

import com.happycreative.productpreview.config.StorageProperties;
import com.happycreative.productpreview.entity.StoredFile;
import com.happycreative.productpreview.repository.StoredFileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.Optional;

/**
 * Lưu media trực tiếp vào Postgres (bảng {@code stored_files}).
 *
 * <p>Dùng trong giai đoạn test: toàn bộ dữ liệu demo nằm gọn trong volume Docker,
 * mang đi bằng {@code pg_dump} thay vì phải đồng bộ thư mục {@code backend/uploads/}.
 * URL trả về giữ nguyên dạng {@code /uploads/{objectKey}} như provider local, nên
 * frontend không cần đổi gì; file được phục vụ bởi {@code StoredFileController}.</p>
 *
 * <p>Production đặt {@code STORAGE_PROVIDER=r2} và khởi động với DB rỗng.</p>
 */
@Service
@ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "db")
@Slf4j
public class DbFileStorageService implements FileStorageService {

    static final String PUBLIC_PATH = "/uploads/";

    private static final int MAX_FILENAME_LENGTH = 255;

    private final StoredFileRepository storedFileRepository;
    private final StorageProperties properties;
    private final String publicBaseUrl;

    public DbFileStorageService(
            StoredFileRepository storedFileRepository,
            StorageProperties properties,
            @Value("${app.base-url:}") String publicBaseUrl) {
        this.storedFileRepository = storedFileRepository;
        this.properties = properties;
        this.publicBaseUrl = stripTrailingSlash(publicBaseUrl);
    }

    @Override
    @Transactional
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String objectKey = StorageObjectKeyFactory.create(
                properties.getKeyPrefix(),
                file.getOriginalFilename());

        StoredFile storedFile = new StoredFile();
        storedFile.setObjectKey(objectKey);
        storedFile.setOriginalFilename(truncate(file.getOriginalFilename()));
        storedFile.setContentType(file.getContentType());
        storedFile.setSizeBytes(file.getSize());
        try {
            storedFile.setData(file.getBytes());
        } catch (IOException e) {
            throw new StorageException("Không thể đọc file để lưu vào database", e);
        }

        storedFileRepository.save(storedFile);
        log.debug("Đã lưu file vào database: {} ({} bytes)", objectKey, file.getSize());
        return publicBaseUrl + PUBLIC_PATH + objectKey;
    }

    @Override
    @Transactional
    public boolean deleteFile(String fileUrl) {
        String objectKey = ownedObjectKey(fileUrl);
        if (objectKey == null) {
            return false;
        }

        boolean deleted = storedFileRepository.deleteByObjectKey(objectKey) > 0;
        if (deleted) {
            log.debug("Đã xóa file khỏi database: {}", objectKey);
        }
        return deleted;
    }

    /**
     * Nạp file để phục vụ qua HTTP. Object key luôn được so khớp chính xác trong DB
     * nên không có rủi ro path traversal.
     */
    @Transactional(readOnly = true)
    public Optional<StoredFile> load(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return Optional.empty();
        }
        return storedFileRepository.findByObjectKey(objectKey);
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

    private String truncate(String originalFilename) {
        if (originalFilename == null) {
            return null;
        }
        String trimmed = originalFilename.trim();
        return trimmed.length() <= MAX_FILENAME_LENGTH
                ? trimmed
                : trimmed.substring(0, MAX_FILENAME_LENGTH);
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim().replaceAll("/+$", "");
    }
}
