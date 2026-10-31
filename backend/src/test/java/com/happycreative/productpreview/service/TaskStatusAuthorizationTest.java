package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.TaskRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Quy tắc đổi trạng thái của PUT /api/tasks/{id}, chạy với AccessControlService thật
 * (TaskServiceTest mock lớp này nên không kiểm được quy tắc).
 */
class TaskStatusAuthorizationTest {

    private TaskRepository taskRepository;
    private TaskService taskService;
    private Task task;

    @BeforeEach
    void setUp() {
        taskRepository = mock(TaskRepository.class);
        taskService = new TaskService(
                taskRepository, mock(ProjectRepository.class), mock(UserRepository.class), new AccessControlService());

        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setKey("happy");
        task = new Task();
        task.setId(UUID.randomUUID());
        task.setProject(project);
        task.setCreatedBy(new User());
        task.setTitle("Original");
        task.setPlatform(Platform.AMAZON);
        task.setCategory(1);
        task.setStatus(TaskStatus.PENDING_UPLOADS);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void sellerOfOwningProjectCanSubmitPendingTaskForReview() {
        taskService.updateTask(task.getId(), status("IN_REVIEW"), principal(Role.SELLER, "happy"));

        assertEquals(TaskStatus.IN_REVIEW, task.getStatus());
        verify(taskRepository).save(task);
    }

    @Test
    void sellerCannotApproveOrRejectTheirOwnTask() {
        for (String target : new String[] {"APPROVED", "REJECTED"}) {
            assertForbidden(() -> taskService.updateTask(task.getId(), status(target), principal(Role.SELLER, "happy")));
        }

        assertEquals(TaskStatus.PENDING_UPLOADS, task.getStatus());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void sellerCannotMoveTaskBackOrOutOfReview() {
        task.setStatus(TaskStatus.IN_REVIEW);

        assertForbidden(() -> taskService.updateTask(task.getId(), status("PENDING_UPLOADS"), principal(Role.SELLER, "happy")));
        assertForbidden(() -> taskService.updateTask(task.getId(), status("APPROVED"), principal(Role.SELLER, "happy")));

        assertEquals(TaskStatus.IN_REVIEW, task.getStatus());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void deniedStatusChangeAlsoLeavesOtherFieldsUntouched() {
        TaskRequest request = status("APPROVED");
        request.setTitle("Sneaky rename");

        assertForbidden(() -> taskService.updateTask(task.getId(), request, principal(Role.SELLER, "happy")));

        assertEquals("Original", task.getTitle());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void sellerOfAnotherProjectCannotChangeStatus() {
        assertForbidden(() -> taskService.updateTask(task.getId(), status("IN_REVIEW"), principal(Role.SELLER, "creative")));

        assertEquals(TaskStatus.PENDING_UPLOADS, task.getStatus());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void marvelAndProductDesignCannotChangeStatus() {
        assertForbidden(() -> taskService.updateTask(task.getId(), status("IN_REVIEW"), principal(Role.MARVEL, null)));
        assertForbidden(() -> taskService.updateTask(task.getId(), status("IN_REVIEW"), principal(Role.PRODUCT_DESIGN, "happy")));

        assertEquals(TaskStatus.PENDING_UPLOADS, task.getStatus());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void adminCanApproveAndReject() {
        CustomUserDetails admin = principal(Role.ADMIN, null);

        taskService.updateTask(task.getId(), status("APPROVED"), admin);
        assertEquals(TaskStatus.APPROVED, task.getStatus());

        taskService.updateTask(task.getId(), status("REJECTED"), admin);
        assertEquals(TaskStatus.REJECTED, task.getStatus());
    }

    @Test
    void sellerCanStillRenameTaskWithoutTouchingStatus() {
        TaskRequest request = new TaskRequest();
        request.setTitle("Renamed");

        taskService.updateTask(task.getId(), request, principal(Role.SELLER, "happy"));

        assertEquals("Renamed", task.getTitle());
        assertEquals(TaskStatus.PENDING_UPLOADS, task.getStatus());
    }

    private TaskRequest status(String value) {
        TaskRequest request = new TaskRequest();
        request.setStatus(value);
        return request;
    }

    private void assertForbidden(Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    private CustomUserDetails principal(Role role, String projectKey) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        user.setProjectKey(projectKey);
        return new CustomUserDetails(user);
    }
}
