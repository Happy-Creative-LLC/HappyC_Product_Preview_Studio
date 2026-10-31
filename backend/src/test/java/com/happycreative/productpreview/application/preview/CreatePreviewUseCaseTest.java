package com.happycreative.productpreview.application.preview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.application.preview.impl.CreatePreviewUseCaseImpl;
import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewPlatform;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.infrastructure.preview.PreviewMapper;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.service.AccessControlService;
import com.happycreative.productpreview.service.AmazonScraperService;
import com.happycreative.productpreview.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CreatePreviewUseCaseTest {

    private static final String TASK_TITLE = "Task Title";

    private final UUID taskId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    private PreviewRepository previewRepository;
    private UserRepository userRepository;
    private TaskRepository taskRepository;
    private FileStorageService fileStorageService;
    private AmazonScraperService amazonScraperService;
    private CreatePreviewUseCaseImpl useCase;

    @BeforeEach
    void setUp() {
        previewRepository = mock(PreviewRepository.class);
        userRepository = mock(UserRepository.class);
        taskRepository = mock(TaskRepository.class);
        fileStorageService = mock(FileStorageService.class);
        amazonScraperService = mock(AmazonScraperService.class);
        when(fileStorageService.storeFile(any())).thenReturn("/uploads/a.bin", "/uploads/b.bin", "/uploads/c.bin");
        useCase = new CreatePreviewUseCaseImpl(
                previewRepository,
                userRepository,
                taskRepository,
                fileStorageService,
                amazonScraperService,
                new PreviewMapper(),
                new ObjectMapper(),
                new AccessControlService()
        );
    }

    // ---------- hành vi cơ bản (Admin được mọi vùng) ----------

    @Test
    void createsPreviewAndReturnsDto() {
        givenUser(Role.ADMIN, null);
        givenTask("happy");

        PreviewDto dto = useCase.execute(command("Test Product", 123.45, "Test Brand", List.of("Bullet 1", "Bullet 2"),
                image(), null, List.of("S", "M")));

        assertNotNull(dto);
        assertEquals(taskId, dto.taskId);
        assertEquals(userId, dto.ownerId);
        assertEquals("DRAFT", dto.status);
        assertTrue(dto.productData.contains("Test Product"));

        ArgumentCaptor<Preview> captor = ArgumentCaptor.forClass(Preview.class);
        verify(previewRepository).save(captor.capture());
        assertEquals(PreviewPlatform.AMAZON, captor.getValue().getPlatform());
        assertEquals(userId, captor.getValue().getOwnerId());
        assertEquals(taskId, captor.getValue().getTaskId());
    }

    @Test
    void createsPreviewFromAsinAndSkipsFileStorage() {
        givenUser(Role.ADMIN, null);
        givenTask("happy");
        ObjectNode scraped = new ObjectMapper().createObjectNode();
        scraped.put("title", "Scraped Product");
        when(amazonScraperService.scrapeProductByAsin(eq("B000TESTASIN"))).thenReturn(scraped);

        PreviewDto dto = useCase.execute(asinCommand("B000TESTASIN"));

        assertTrue(dto.productData.contains("Scraped Product"));
        verify(previewRepository).save(any());
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void throwsWhenUserDoesNotExistAndNeverSaves() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> useCase.execute(command("Test Product", null, null, null, null, null, null)));
        verify(previewRepository, never()).save(any());
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void missingTaskReturnsNotFoundAndNeverSaves() {
        givenUser(Role.ADMIN, null);
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        assertStatus(HttpStatus.NOT_FOUND,
                () -> useCase.execute(command("Test Product", null, null, null, null, null, null)));
        verify(previewRepository, never()).save(any());
    }

    @Test
    void marvelStoresMultipleVideosInOrderAsJsonArray() throws Exception {
        givenUser(Role.MARVEL, null);
        givenTask("happy");
        when(fileStorageService.storeFile(any())).thenReturn("/uploads/v1.mp4", "/uploads/v2.mp4");

        PreviewDto dto = useCase.execute(command(null, null, null, null, null,
                List.of(video("v1.mp4"), video("v2.mp4")), null));

        JsonNode videos = new ObjectMapper().readTree(dto.productData).get("videos");
        assertEquals(2, videos.size());
        assertEquals("/uploads/v1.mp4", videos.get(0).asText());
        assertEquals("/uploads/v2.mp4", videos.get(1).asText());
    }

    // ---------- vùng nội dung theo vai trò ----------

    @Test
    void adminCanWriteEveryZoneInOneRequest() {
        givenUser(Role.ADMIN, null);
        givenTask("creative");

        PreviewDto dto = useCase.execute(command("Title", 10.0, null, List.of("b"), image(),
                List.of(video("v.mp4")), null));

        assertNotNull(dto);
        verify(previewRepository).save(any());
    }

    @Test
    void sellerCanWriteTextOfOwnProject() {
        givenUser(Role.SELLER, "happy");
        givenTask("happy");

        PreviewDto dto = useCase.execute(command("Seller Title", 12.5, "Brand", List.of("b1"), null, null,
                List.of("S")));

        assertTrue(dto.productData.contains("Seller Title"));
        verify(previewRepository).save(any());
    }

    @Test
    void sellerCannotUploadImagesOrVideo() {
        givenUser(Role.SELLER, "happy");
        givenTask("happy");

        assertStatus(HttpStatus.FORBIDDEN,
                () -> useCase.execute(command("Title", null, null, null, image(), null, null)));
        assertStatus(HttpStatus.FORBIDDEN,
                () -> useCase.execute(command("Title", null, null, null, null, List.of(video("v.mp4")), null)));
        verify(previewRepository, never()).save(any());
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void productDesignCanUploadImagesAndTitleComesFromTask() {
        givenUser(Role.PRODUCT_DESIGN, "happy");
        givenTask("happy");

        PreviewDto dto = useCase.execute(command("Tiêu đề do PD tự gõ", null, null, null, image(), null, null));

        assertTrue(dto.productData.contains(TASK_TITLE));
        assertFalse(dto.productData.contains("Tiêu đề do PD tự gõ"));
        verify(fileStorageService).storeFile(any());
    }

    @Test
    void productDesignCannotWriteTextOrVideo() {
        givenUser(Role.PRODUCT_DESIGN, "happy");
        givenTask("happy");

        assertStatus(HttpStatus.FORBIDDEN,
                () -> useCase.execute(command("Title", 9.99, null, null, image(), null, null)));
        assertStatus(HttpStatus.FORBIDDEN,
                () -> useCase.execute(command("Title", null, null, List.of("bullet"), image(), null, null)));
        assertStatus(HttpStatus.FORBIDDEN,
                () -> useCase.execute(command("Title", null, null, null, null, List.of(video("v.mp4")), null)));
        verify(previewRepository, never()).save(any());
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void marvelCannotWriteTextOrImages() {
        givenUser(Role.MARVEL, null);
        givenTask("happy");

        assertStatus(HttpStatus.FORBIDDEN,
                () -> useCase.execute(command("Title", null, "Brand", null, null, List.of(video("v.mp4")), null)));
        assertStatus(HttpStatus.FORBIDDEN,
                () -> useCase.execute(command("Title", null, null, null, image(), List.of(video("v.mp4")), null)));
        verify(previewRepository, never()).save(any());
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void marvelCanUploadVideoToTaskOfAnyProject() {
        givenUser(Role.MARVEL, null);
        givenTask("creative");

        PreviewDto dto = useCase.execute(command(null, null, null, null, null, List.of(video("v.mp4")), null));

        assertNotNull(dto);
        verify(previewRepository).save(any());
    }

    // ---------- project ----------

    @Test
    void sellerAndProductDesignOfAnotherProjectGetNotFound() {
        givenTask("creative");

        givenUser(Role.SELLER, "happy");
        assertStatus(HttpStatus.NOT_FOUND,
                () -> useCase.execute(command("Title", 9.0, null, null, null, null, null)));

        givenUser(Role.PRODUCT_DESIGN, "happy");
        assertStatus(HttpStatus.NOT_FOUND,
                () -> useCase.execute(command("Title", null, null, null, image(), null, null)));

        verify(previewRepository, never()).save(any());
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void otherProjectIsNotFoundEvenBeforeZoneCheck() {
        // Seller khác project gửi ảnh: phải là 404 (không lộ task), không phải 403 của vùng ảnh.
        givenTask("creative");
        givenUser(Role.SELLER, "happy");

        assertStatus(HttpStatus.NOT_FOUND,
                () -> useCase.execute(command("Title", null, null, null, image(), null, null)));
    }

    // ---------- import từ ASIN: ghi cả text lẫn ảnh nên chỉ Admin ----------

    @Test
    void importFromAsinIsAdminOnly() {
        givenTask("happy");
        ObjectNode scraped = new ObjectMapper().createObjectNode();
        scraped.put("title", "Scraped");
        when(amazonScraperService.scrapeProductByAsin(any())).thenReturn(scraped);

        for (Role role : List.of(Role.SELLER, Role.PRODUCT_DESIGN, Role.MARVEL)) {
            givenUser(role, role == Role.MARVEL ? null : "happy");
            assertStatus(HttpStatus.FORBIDDEN, () -> useCase.execute(asinCommand("B000TESTASIN")));
        }
        verify(previewRepository, never()).save(any());
        verifyNoInteractions(fileStorageService);
    }

    // ---------- helpers ----------

    private void givenUser(Role role, String projectKey) {
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setProjectKey(projectKey);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    }

    private void givenTask(String projectKey) {
        Project project = new Project();
        project.setKey(projectKey);
        Task task = new Task();
        task.setId(taskId);
        task.setProject(project);
        task.setTitle(TASK_TITLE);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
    }

    private MockMultipartFile image() {
        return new MockMultipartFile("mainImage", "product.jpg", "image/jpeg",
                "binary-image-content".getBytes(StandardCharsets.UTF_8));
    }

    private MockMultipartFile video(String name) {
        return new MockMultipartFile("videos", name, "video/mp4",
                (name + "-content").getBytes(StandardCharsets.UTF_8));
    }

    private CreatePreviewCommand command(String title, Double price, String brand, List<String> bullets,
                                         MockMultipartFile mainImage, List<MockMultipartFile> videos,
                                         List<String> sizes) {
        return new CreatePreviewCommand(taskId, userId, "AMAZON", null, title, price, brand, null, null, null,
                bullets, mainImage, null, null, null, sizes,
                videos == null ? null : List.copyOf(videos), null);
    }

    private CreatePreviewCommand asinCommand(String asin) {
        return new CreatePreviewCommand(taskId, userId, "AMAZON", asin, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null);
    }

    private void assertStatus(HttpStatus expected, Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(expected, exception.getStatusCode());
    }
}
