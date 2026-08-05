package com.happycreative.productpreview.service;

import com.happycreative.productpreview.config.StorageProperties;
import com.happycreative.productpreview.entity.StoredFile;
import com.happycreative.productpreview.repository.StoredFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DbFileStorageServiceTest {

    @Mock
    private StoredFileRepository storedFileRepository;

    private StorageProperties properties;

    @BeforeEach
    void setUp() {
        properties = new StorageProperties();
        properties.setKeyPrefix("product-previews");
    }

    @Test
    void storesBytesInDatabaseAndReturnsUploadsUrl() {
        DbFileStorageService service = new DbFileStorageService(
                storedFileRepository,
                properties,
                "http://localhost:8081/");
        byte[] content = "image-content".getBytes();

        String url = service.storeFile(new MockMultipartFile(
                "file",
                "Hero.PNG",
                "image/png",
                content));

        ArgumentCaptor<StoredFile> captor = ArgumentCaptor.forClass(StoredFile.class);
        verify(storedFileRepository).save(captor.capture());
        StoredFile saved = captor.getValue();

        assertTrue(url.startsWith("http://localhost:8081/uploads/product-previews/"));
        assertTrue(url.endsWith(".png"));
        assertEquals("http://localhost:8081/uploads/" + saved.getObjectKey(), url);
        assertEquals("image/png", saved.getContentType());
        assertEquals("Hero.PNG", saved.getOriginalFilename());
        assertEquals(content.length, saved.getSizeBytes());
        assertArrayEquals(content, saved.getData());
    }

    @Test
    void usesSameOriginUrlWhenPublicBaseUrlIsNotConfigured() {
        DbFileStorageService service = new DbFileStorageService(
                storedFileRepository,
                properties,
                "");

        String url = service.storeFile(new MockMultipartFile(
                "file",
                "preview.jpg",
                "image/jpeg",
                "content".getBytes()));

        assertTrue(url.startsWith("/uploads/product-previews/"));
    }

    @Test
    void deletesOwnedKeyAndIgnoresExternalUrls() {
        DbFileStorageService service = new DbFileStorageService(
                storedFileRepository,
                properties,
                "http://localhost:8081");
        when(storedFileRepository.deleteByObjectKey("product-previews/2026/08/file.png"))
                .thenReturn(1);

        assertTrue(service.deleteFile(
                "http://localhost:8081/uploads/product-previews/2026/08/file.png"));
        verify(storedFileRepository).deleteByObjectKey("product-previews/2026/08/file.png");

        clearInvocations(storedFileRepository);
        assertFalse(service.deleteFile("https://images.amazon.com/product.png"));
        verifyNoInteractions(storedFileRepository);
    }

    @Test
    void ignoresEmptyUpload() {
        DbFileStorageService service = new DbFileStorageService(
                storedFileRepository,
                properties,
                "");

        assertEquals(null, service.storeFile(new MockMultipartFile(
                "file",
                "empty.jpg",
                "image/jpeg",
                new byte[0])));
        verify(storedFileRepository, org.mockito.Mockito.never()).save(any());
    }
}
