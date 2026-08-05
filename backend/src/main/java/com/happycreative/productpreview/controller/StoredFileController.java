package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.entity.StoredFile;
import com.happycreative.productpreview.service.DbFileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Phục vụ media đang nằm trong Postgres khi {@code STORAGE_PROVIDER=db}.
 *
 * <p>Giữ đúng path {@code /uploads/**} của provider local để frontend và các URL đã
 * lưu trong {@code previews.product_data} không phải đổi. Với provider local thì
 * {@code WebMvcConfig} xử lý path này, với R2 thì file nằm ngoài ứng dụng — cả hai
 * trường hợp controller này không được tạo bean.</p>
 */
@RestController
@ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "db")
@RequiredArgsConstructor
public class StoredFileController {

    private static final String PUBLIC_PATH = "/uploads/";

    private final DbFileStorageService dbFileStorageService;

    @GetMapping("/uploads/**")
    public ResponseEntity<Resource> serve(HttpServletRequest request) {
        String objectKey = extractObjectKey(request);
        StoredFile storedFile = dbFileStorageService.load(objectKey).orElse(null);
        if (storedFile == null) {
            return ResponseEntity.notFound().build();
        }

        // Object key chứa UUID và không bao giờ bị ghi đè nên nội dung là bất biến.
        CacheControl cacheControl = CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable();
        String eTag = "\"" + storedFile.getId() + "\"";
        if (eTag.equals(request.getHeader(HttpHeaders.IF_NONE_MATCH))) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(eTag)
                    .cacheControl(cacheControl)
                    .build();
        }

        return ResponseEntity.ok()
                .contentType(resolveContentType(storedFile.getContentType()))
                .contentLength(storedFile.getData().length)
                .eTag(eTag)
                .cacheControl(cacheControl)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(storedFile))
                .body(new ByteArrayResource(storedFile.getData()));
    }

    private String extractObjectKey(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (!path.startsWith(PUBLIC_PATH)) {
            return null;
        }
        String objectKey = URLDecoder.decode(path.substring(PUBLIC_PATH.length()), StandardCharsets.UTF_8);
        return objectKey.isBlank() ? null : objectKey;
    }

    private MediaType resolveContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (org.springframework.http.InvalidMediaTypeException e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private String contentDisposition(StoredFile storedFile) {
        ContentDisposition.Builder builder = ContentDisposition.inline();
        if (storedFile.getOriginalFilename() != null && !storedFile.getOriginalFilename().isBlank()) {
            builder.filename(storedFile.getOriginalFilename(), StandardCharsets.UTF_8);
        }
        return builder.build().toString();
    }
}
