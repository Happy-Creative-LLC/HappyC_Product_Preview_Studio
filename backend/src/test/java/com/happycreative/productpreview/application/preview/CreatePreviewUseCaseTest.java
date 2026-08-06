package com.happycreative.productpreview.application.preview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.application.preview.impl.CreatePreviewUseCaseImpl;
import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewPlatform;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.domain.preview.ProductData;
import com.happycreative.productpreview.infrastructure.preview.PreviewMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CreatePreviewUseCaseTest {

    @Test
    void createsPreviewAndReturnsDto() {
        UUID taskId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        MockMultipartFile imageFile = new MockMultipartFile(
                "mainImage",
                "product.jpg",
                "image/jpeg",
                "binary-image-content".getBytes(StandardCharsets.UTF_8)
        );

        PreviewRepository previewRepository = mock(PreviewRepository.class);
        doAnswer(invocation -> {
            com.happycreative.productpreview.domain.preview.Preview preview = invocation.getArgument(0);
            assertNotNull(preview);
            assertEquals(userId, preview.getOwnerId());
            assertEquals(taskId, preview.getTaskId());
            assertEquals(PreviewPlatform.AMAZON, preview.getPlatform());
            assertNotNull(preview.getProductData());
            assertTrue(preview.getProductData().toJson().contains("Test Product"));
            return null;
        }).when(previewRepository).save(any());

        com.happycreative.productpreview.repository.UserRepository userRepository = mock(com.happycreative.productpreview.repository.UserRepository.class);
        when(userRepository.existsById(eq(userId))).thenReturn(true);

        com.happycreative.productpreview.repository.TaskRepository taskRepository = mock(com.happycreative.productpreview.repository.TaskRepository.class);
        when(taskRepository.existsById(eq(taskId))).thenReturn(true);

        com.happycreative.productpreview.service.FileStorageService fileStorageService = mock(com.happycreative.productpreview.service.FileStorageService.class);
        when(fileStorageService.storeFile(any())).thenReturn("/uploads/product.jpg");

        com.happycreative.productpreview.service.AmazonScraperService amazonScraperService = mock(com.happycreative.productpreview.service.AmazonScraperService.class);

        CreatePreviewUseCaseImpl useCase = new CreatePreviewUseCaseImpl(
                previewRepository,
                userRepository,
                taskRepository,
                fileStorageService,
                amazonScraperService,
                new PreviewMapper(),
                new ObjectMapper()
        );

        CreatePreviewCommand command = new CreatePreviewCommand(
                taskId,
                userId,
                "AMAZON",
                null,
                "Test Product",
                123.45,
                "Test Brand",
                "Cotton",
                "Care well",
                "Vietnam",
                List.of("Bullet 1", "Bullet 2"),
                imageFile,
                null,
                null,
                null,
                List.of("S", "M"),
                null,
                null
        );

        PreviewDto dto = useCase.execute(command);

        assertNotNull(dto);
        assertEquals(taskId, dto.taskId);
        assertEquals(userId, dto.ownerId);
        assertEquals("DRAFT", dto.status);
        assertTrue(dto.productData.contains("Test Product"));
    }

    @Test
    void createsPreviewFromAsinAndSkipsFileStorage() {
        UUID taskId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String asin = "B000TESTASIN";

        PreviewRepository previewRepository = mock(PreviewRepository.class);

        com.happycreative.productpreview.repository.UserRepository userRepository = mock(com.happycreative.productpreview.repository.UserRepository.class);
        when(userRepository.existsById(eq(userId))).thenReturn(true);

        com.happycreative.productpreview.repository.TaskRepository taskRepository = mock(com.happycreative.productpreview.repository.TaskRepository.class);
        when(taskRepository.existsById(eq(taskId))).thenReturn(true);

        com.happycreative.productpreview.service.FileStorageService fileStorageService = mock(com.happycreative.productpreview.service.FileStorageService.class);

        com.happycreative.productpreview.service.AmazonScraperService amazonScraperService = mock(com.happycreative.productpreview.service.AmazonScraperService.class);
        ObjectNode scraped = new ObjectMapper().createObjectNode();
        scraped.put("title", "Scraped Product");
        when(amazonScraperService.scrapeProductByAsin(eq(asin))).thenReturn(scraped);

        CreatePreviewUseCaseImpl useCase = new CreatePreviewUseCaseImpl(
                previewRepository,
                userRepository,
                taskRepository,
                fileStorageService,
                amazonScraperService,
                new PreviewMapper(),
                new ObjectMapper()
        );

        CreatePreviewCommand command = new CreatePreviewCommand(
                taskId,
                userId,
                "AMAZON",
                asin,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        PreviewDto dto = useCase.execute(command);

        assertNotNull(dto);
        assertTrue(dto.productData.contains("Scraped Product"));

        ArgumentCaptor<Preview> previewCaptor = ArgumentCaptor.forClass(Preview.class);
        verify(previewRepository).save(previewCaptor.capture());
        assertTrue(previewCaptor.getValue().getProductData().toJson().contains("Scraped Product"));

        verifyNoInteractions(fileStorageService);
    }

    @Test
    void throwsWhenUserDoesNotExistAndNeverSaves() {
        UUID taskId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        PreviewRepository previewRepository = mock(PreviewRepository.class);

        com.happycreative.productpreview.repository.UserRepository userRepository = mock(com.happycreative.productpreview.repository.UserRepository.class);
        when(userRepository.existsById(eq(userId))).thenReturn(false);

        com.happycreative.productpreview.repository.TaskRepository taskRepository = mock(com.happycreative.productpreview.repository.TaskRepository.class);
        com.happycreative.productpreview.service.FileStorageService fileStorageService = mock(com.happycreative.productpreview.service.FileStorageService.class);
        com.happycreative.productpreview.service.AmazonScraperService amazonScraperService = mock(com.happycreative.productpreview.service.AmazonScraperService.class);

        CreatePreviewUseCaseImpl useCase = new CreatePreviewUseCaseImpl(
                previewRepository,
                userRepository,
                taskRepository,
                fileStorageService,
                amazonScraperService,
                new PreviewMapper(),
                new ObjectMapper()
        );

        CreatePreviewCommand command = new CreatePreviewCommand(
                taskId, userId, "AMAZON", null, "Test Product", null, null, null, null, null,
                null, null, null, null, null, null, null, null
        );

        assertThrows(IllegalArgumentException.class, () -> useCase.execute(command));
        verify(previewRepository, never()).save(any());
    }

    @Test
    void throwsWhenTaskDoesNotExistAndNeverSaves() {
        UUID taskId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        PreviewRepository previewRepository = mock(PreviewRepository.class);

        com.happycreative.productpreview.repository.UserRepository userRepository = mock(com.happycreative.productpreview.repository.UserRepository.class);
        when(userRepository.existsById(eq(userId))).thenReturn(true);

        com.happycreative.productpreview.repository.TaskRepository taskRepository = mock(com.happycreative.productpreview.repository.TaskRepository.class);
        when(taskRepository.existsById(eq(taskId))).thenReturn(false);

        com.happycreative.productpreview.service.FileStorageService fileStorageService = mock(com.happycreative.productpreview.service.FileStorageService.class);
        com.happycreative.productpreview.service.AmazonScraperService amazonScraperService = mock(com.happycreative.productpreview.service.AmazonScraperService.class);

        CreatePreviewUseCaseImpl useCase = new CreatePreviewUseCaseImpl(
                previewRepository,
                userRepository,
                taskRepository,
                fileStorageService,
                amazonScraperService,
                new PreviewMapper(),
                new ObjectMapper()
        );

        CreatePreviewCommand command = new CreatePreviewCommand(
                taskId, userId, "AMAZON", null, "Test Product", null, null, null, null, null,
                null, null, null, null, null, null, null, null
        );

        assertThrows(IllegalArgumentException.class, () -> useCase.execute(command));
        verify(previewRepository, never()).save(any());
    }

    @Test
    void storesMultipleVideosInOrderAsJsonArray() throws Exception {
        UUID taskId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        MockMultipartFile video1 = new MockMultipartFile(
                "videos", "v1.mp4", "video/mp4", "video-1-content".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile video2 = new MockMultipartFile(
                "videos", "v2.mp4", "video/mp4", "video-2-content".getBytes(StandardCharsets.UTF_8));

        PreviewRepository previewRepository = mock(PreviewRepository.class);

        com.happycreative.productpreview.repository.UserRepository userRepository = mock(com.happycreative.productpreview.repository.UserRepository.class);
        when(userRepository.existsById(eq(userId))).thenReturn(true);

        com.happycreative.productpreview.repository.TaskRepository taskRepository = mock(com.happycreative.productpreview.repository.TaskRepository.class);
        when(taskRepository.existsById(eq(taskId))).thenReturn(true);

        com.happycreative.productpreview.service.FileStorageService fileStorageService = mock(com.happycreative.productpreview.service.FileStorageService.class);
        when(fileStorageService.storeFile(any())).thenReturn("/uploads/v1.mp4", "/uploads/v2.mp4");

        com.happycreative.productpreview.service.AmazonScraperService amazonScraperService = mock(com.happycreative.productpreview.service.AmazonScraperService.class);

        CreatePreviewUseCaseImpl useCase = new CreatePreviewUseCaseImpl(
                previewRepository,
                userRepository,
                taskRepository,
                fileStorageService,
                amazonScraperService,
                new PreviewMapper(),
                new ObjectMapper()
        );

        CreatePreviewCommand command = new CreatePreviewCommand(
                taskId,
                userId,
                "AMAZON",
                null,
                "Test Product",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(video1, video2),
                null
        );

        PreviewDto dto = useCase.execute(command);

        assertNotNull(dto);
        JsonNode root = new ObjectMapper().readTree(dto.productData);
        assertTrue(root.has("videos"));
        JsonNode videosNode = root.get("videos");
        assertEquals(2, videosNode.size());
        assertEquals("/uploads/v1.mp4", videosNode.get(0).asText());
        assertEquals("/uploads/v2.mp4", videosNode.get(1).asText());
    }
}
