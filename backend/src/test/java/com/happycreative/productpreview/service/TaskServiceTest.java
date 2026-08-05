package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.TaskRequest;
import com.happycreative.productpreview.dto.TaskResponse;
import com.happycreative.productpreview.entity.Platform;
import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccessControlService accessControlService;

    @InjectMocks
    private TaskService taskService;

    private UUID projectId;
    private UUID userId;
    private Project project;
    private User user;
    private CustomUserDetails principal;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();

        project = new Project();
        project.setId(projectId);
        project.setKey("happy");
        project.setName("Happy Project");

        user = new User();
        user.setId(userId);
        user.setRole(Role.SELLER);
        user.setProjectKey("happy");
        user.setFullName("Happy Seller");
        principal = new CustomUserDetails(user);
    }

    @Test
    void getTasksChecksProjectAccessAndUsesDescendingUpdatedOrder() {
        Task newer = task("Newer", 1);
        newer.setUpdatedAt(LocalDateTime.of(2026, 8, 4, 12, 0));
        Task older = task("Older", 2);
        older.setUpdatedAt(LocalDateTime.of(2026, 8, 3, 12, 0));

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId))
                .thenReturn(List.of(newer, older));

        List<TaskResponse> result = taskService.getTasksByProject(projectId, principal);

        assertEquals(List.of("Newer", "Older"), result.stream().map(TaskResponse::getTitle).toList());
        verify(accessControlService).requireProjectReadAccess(principal, project);
        verify(taskRepository).findByProjectIdOrderByUpdatedAtDesc(projectId);
    }

    @Test
    void deniedProjectAccessStopsTaskListQuery() {
        ResponseStatusException forbidden = new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập project này.");
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        doThrow(forbidden).when(accessControlService).requireProjectReadAccess(principal, project);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> taskService.getTasksByProject(projectId, principal));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(taskRepository, never()).findByProjectIdOrderByUpdatedAtDesc(any());
    }

    @Test
    void createTaskDefaultsPlatformAndCategory() {
        TaskRequest request = new TaskRequest();
        request.setTitle("  Summer Shirt  ");
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskResponse response = taskService.createTask(projectId, request, principal);

        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(taskCaptor.capture());
        Task saved = taskCaptor.getValue();
        assertEquals("Summer Shirt", saved.getTitle());
        assertEquals(Platform.AMAZON, saved.getPlatform());
        assertEquals(1, saved.getCategory());
        assertEquals(TaskStatus.PENDING_UPLOADS, saved.getStatus());
        assertEquals("AMAZON", response.getPlatform());
        verify(accessControlService).requireTaskCreateAccess(principal, project);
    }

    @Test
    void updateTaskIsPartialAndDoesNotResetCategory() {
        Task existing = task("Original", 3);
        existing.setStatus(TaskStatus.PENDING_UPLOADS);
        TaskRequest request = new TaskRequest();
        request.setStatus("in_review");

        when(taskRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(taskRepository.save(existing)).thenReturn(existing);

        TaskResponse response = taskService.updateTask(existing.getId(), request, principal);

        assertEquals(3, existing.getCategory());
        assertEquals(Platform.AMAZON, existing.getPlatform());
        assertEquals(TaskStatus.IN_REVIEW, existing.getStatus());
        assertEquals(3, response.getCategory());
        verify(accessControlService).requireTaskUpdateAccess(principal, existing);
    }

    @Test
    void invalidPlatformReturnsBadRequest() {
        TaskRequest request = new TaskRequest();
        request.setTitle("Task");
        request.setPlatform("SHOPIFY");
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertBadRequest(() -> taskService.createTask(projectId, request, principal));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void invalidCategoryReturnsBadRequest() {
        TaskRequest request = new TaskRequest();
        request.setTitle("Task");
        request.setCategory(4);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertBadRequest(() -> taskService.createTask(projectId, request, principal));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void invalidStatusReturnsBadRequest() {
        Task existing = task("Original", 2);
        TaskRequest request = new TaskRequest();
        request.setStatus("DONE");
        when(taskRepository.findById(existing.getId())).thenReturn(Optional.of(existing));

        assertBadRequest(() -> taskService.updateTask(existing.getId(), request, principal));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void missingProjectReturnsNotFoundInVietnamese() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> taskService.getTasksByProject(projectId, principal));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("Không tìm thấy project.", exception.getReason());
    }

    private void assertBadRequest(Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    private Task task(String title, int category) {
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setProject(project);
        task.setCreatedBy(user);
        task.setTitle(title);
        task.setPlatform(Platform.AMAZON);
        task.setCategory(category);
        task.setStatus(TaskStatus.PENDING_UPLOADS);
        task.setCreatedAt(LocalDateTime.of(2026, 8, 1, 12, 0));
        task.setUpdatedAt(LocalDateTime.of(2026, 8, 1, 12, 0));
        return task;
    }
}
