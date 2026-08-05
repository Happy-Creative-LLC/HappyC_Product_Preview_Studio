package com.happycreative.productpreview.service;

import com.happycreative.productpreview.config.StorageProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalFileStorageServiceTest {

    @TempDir
    Path tempDirectory;

    @Test
    void storesBrowserReadyUrlAndDeletesOwnedFile() throws Exception {
        StorageProperties properties = new StorageProperties();
        properties.setKeyPrefix("product-previews");
        properties.getLocal().setDirectory(tempDirectory.toString());
        LocalFileStorageService service = new LocalFileStorageService(
                properties,
                "http://localhost:8081/");
        byte[] content = "image-content".getBytes();

        String url = service.storeFile(new MockMultipartFile(
                "file",
                "Hero.PNG",
                "image/png",
                content));

        assertTrue(url.startsWith(
                "http://localhost:8081/uploads/product-previews/"));
        assertTrue(url.endsWith(".png"));
        String objectKey = url.substring(url.indexOf("/uploads/") + "/uploads/".length());
        Path storedFile = tempDirectory.resolve(objectKey);
        assertTrue(Files.exists(storedFile));
        assertArrayEquals(content, Files.readAllBytes(storedFile));

        assertTrue(service.deleteFile(url));
        assertFalse(Files.exists(storedFile));
    }

    @Test
    void ignoresExternalUrlsDuringCleanup() {
        StorageProperties properties = new StorageProperties();
        properties.getLocal().setDirectory(tempDirectory.toString());
        LocalFileStorageService service = new LocalFileStorageService(
                properties,
                "http://localhost:8081");

        assertFalse(service.deleteFile(
                "https://images.amazon.com/uploads/product-previews/product.jpg"));
    }

    @Test
    void usesSameOriginUrlWhenPublicBaseUrlIsNotConfigured() {
        StorageProperties properties = new StorageProperties();
        properties.getLocal().setDirectory(tempDirectory.toString());
        LocalFileStorageService service = new LocalFileStorageService(properties, "");

        String url = service.storeFile(new MockMultipartFile(
                "file",
                "preview.jpg",
                "image/jpeg",
                "content".getBytes()));

        assertTrue(url.startsWith("/uploads/product-previews/"));
    }
}
