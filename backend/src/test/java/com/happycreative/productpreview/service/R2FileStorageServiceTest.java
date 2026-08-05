package com.happycreative.productpreview.service;

import com.happycreative.productpreview.config.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class R2FileStorageServiceTest {

    @Mock
    private S3Client s3Client;

    private StorageProperties properties;
    private R2FileStorageService service;

    @BeforeEach
    void setUp() {
        properties = new StorageProperties();
        properties.setKeyPrefix("product-previews");
        properties.getR2().setBucket("preview-media");
        properties.getR2().setPublicBaseUrl("https://assets.happycreative.example/");
        service = new R2FileStorageService(s3Client, properties);
    }

    @Test
    void uploadsWithMediaMetadataAndReturnsPublicUrl() {
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        String url = service.storeFile(new MockMultipartFile(
                "file",
                "preview.WEBP",
                "image/webp",
                "content".getBytes()));

        ArgumentCaptor<PutObjectRequest> requestCaptor =
                ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));
        PutObjectRequest request = requestCaptor.getValue();
        assertEquals("preview-media", request.bucket());
        assertTrue(request.key().startsWith("product-previews/"));
        assertTrue(request.key().endsWith(".webp"));
        assertEquals("image/webp", request.contentType());
        assertEquals("public, max-age=31536000, immutable", request.cacheControl());
        assertEquals("https://assets.happycreative.example/" + request.key(), url);
    }

    @Test
    void deletesOnlyObjectsOwnedByConfiguredPublicDomain() {
        String ownedUrl = "https://assets.happycreative.example/product-previews/2026/08/file.png";

        assertTrue(service.deleteFile(ownedUrl));

        ArgumentCaptor<DeleteObjectRequest> requestCaptor =
                ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(requestCaptor.capture());
        assertEquals("preview-media", requestCaptor.getValue().bucket());
        assertEquals("product-previews/2026/08/file.png", requestCaptor.getValue().key());

        clearInvocations(s3Client);
        assertFalse(service.deleteFile("https://images.amazon.com/product.png"));
        verifyNoInteractions(s3Client);
    }
}
