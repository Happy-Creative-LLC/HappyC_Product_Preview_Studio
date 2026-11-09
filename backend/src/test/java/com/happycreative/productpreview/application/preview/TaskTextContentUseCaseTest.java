package com.happycreative.productpreview.application.preview;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.happycreative.productpreview.application.preview.impl.TaskTextContentUseCaseImpl;
import com.happycreative.productpreview.config.ContentProperties;
import com.happycreative.productpreview.domain.preview.Preview;
import com.happycreative.productpreview.domain.preview.PreviewPlatform;
import com.happycreative.productpreview.domain.preview.PreviewRepository;
import com.happycreative.productpreview.domain.preview.ProductData;
import com.happycreative.productpreview.dto.TextContentRequest;
import com.happycreative.productpreview.entity.Platform;
import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskEvent;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.infrastructure.preview.PreviewMapper;
import com.happycreative.productpreview.repository.TaskEventRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.AccessControlService;

class TaskTextContentUseCaseTest {
    private final UUID taskId = UUID.randomUUID();
    private final User user = new User();
    private Task task;
    private TaskRepository taskRepository;
    private UserRepository userRepository;
    private PreviewRepository previewRepository;
    private TaskEventRepository eventRepository;
    private TaskTextContentUseCase useCase;

    @BeforeEach
    void setUp() {
        user.setId(UUID.randomUUID());
        user.setRole(Role.SELLER);
        user.setProjectKey("happy");
        Project project = new Project();
        project.setKey("happy");
        task = new Task();
        task.setId(taskId);
        task.setProject(project);
        task.setTitle("Task title");
        task.setPlatform(Platform.AMAZON);

        taskRepository = mock(TaskRepository.class);
        userRepository = mock(UserRepository.class);
        previewRepository = mock(PreviewRepository.class);
        eventRepository = mock(TaskEventRepository.class);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        ContentProperties properties = new ContentProperties();
        properties.setAmazonProductTypes(List.of("SHIRT"));
        useCase = new TaskTextContentUseCaseImpl(taskRepository, userRepository, previewRepository,
                eventRepository, new AccessControlService(), new PreviewMapper(), properties);
    }

    @Test
    void sellerCreatesCurrentPreviewAndAuditEvent() {
        var saved = useCase.save(taskId, amazonText("New title", "SHIRT"), actor());
        assertEquals(1, saved.version);
        assertTrue(saved.productData.contains("New title"));
        ArgumentCaptor<TaskEvent> event = ArgumentCaptor.forClass(TaskEvent.class);
        verify(eventRepository).save(event.capture());
        assertEquals("TEXT_SAVED", event.getValue().getEventType());
        assertTrue(event.getValue().getDetail().contains("\"version\":1"));
    }

    @Test
    void updatePreservesMediaAndIncrementsVersion() {
        Preview current = Preview.create(UUID.randomUUID(), PreviewPlatform.AMAZON, user.getId(), taskId,
                new ProductData("{\"title\":\"Old\",\"images\":[\"/uploads/a.jpg\"],\"videos\":[\"/uploads/v.mp4\"]}"));
        when(previewRepository.findByTaskId(taskId)).thenReturn(List.of(current));
        var saved = useCase.save(taskId, amazonText("Updated", "SHIRT"), actor());
        assertEquals(current.getId().toUUID(), saved.id);
        assertEquals(2, saved.version);
        assertTrue(saved.productData.contains("/uploads/a.jpg"));
        assertTrue(saved.productData.contains("/uploads/v.mp4"));
    }

    @Test
    void productDesignAndMarvelCannotSaveText() {
        user.setRole(Role.PRODUCT_DESIGN);
        assertStatus(HttpStatus.FORBIDDEN, () -> useCase.save(taskId, amazonText("Title", "SHIRT"), actor()));
        user.setRole(Role.MARVEL);
        user.setProjectKey(null);
        assertStatus(HttpStatus.FORBIDDEN, () -> useCase.save(taskId, amazonText("Title", "SHIRT"), actor()));
    }

    @Test
    void otherProjectIsHiddenBeforeRoleCheck() {
        user.setProjectKey("creative");
        assertStatus(HttpStatus.NOT_FOUND, () -> useCase.save(taskId, amazonText("Title", "SHIRT"), actor()));
        assertStatus(HttpStatus.NOT_FOUND, () -> useCase.getCurrent(taskId, actor()));
    }

    @Test
    void adminCanSaveWithoutProductTypeButUnknownValueIsRejected() {
        user.setRole(Role.ADMIN);
        user.setProjectKey(null);
        var saved = useCase.save(taskId, amazonText("Draft", null), actor());
        assertNotNull(saved);
        assertStatus(HttpStatus.BAD_REQUEST,
                () -> useCase.save(taskId, amazonText("Draft", "UNKNOWN"), actor()));
    }

    private TextContentRequest amazonText(String title, String productType) {
        return new TextContentRequest(title, 19.99, "Brand", null, null, null,
                List.of("Bullet"), List.of("M"), "Description", "search terms", productType,
                null, null, null, null, null, null, null);
    }

    private CustomUserDetails actor() {
        return new CustomUserDetails(user);
    }

    private void assertStatus(HttpStatus expected, Runnable action) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(expected, error.getStatusCode());
    }
}
