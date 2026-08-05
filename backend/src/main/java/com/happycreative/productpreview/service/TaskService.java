package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.TaskRequest;
import com.happycreative.productpreview.dto.TaskResponse;
import com.happycreative.productpreview.entity.Platform;
import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;

    public List<TaskResponse> getTasksByProject(UUID projectId, CustomUserDetails userDetails) {
        Project project = findProject(projectId);
        accessControlService.requireProjectReadAccess(userDetails, project);

        return taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse createTask(
            UUID projectId,
            TaskRequest request,
            CustomUserDetails userDetails) {
        Project project = findProject(projectId);
        accessControlService.requireTaskCreateAccess(userDetails, project);
        validateRequest(request);

        User createdBy = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> notFound("Không tìm thấy người dùng hiện tại."));

        Task task = new Task();
        task.setProject(project);
        task.setCreatedBy(createdBy);
        task.setTitle(requireTitle(request.getTitle()));
        task.setPlatform(request.getPlatform() == null
                ? Platform.AMAZON
                : parseEnum(request.getPlatform(), Platform.class, "nền tảng"));
        task.setCategory(request.getCategory() == null ? 1 : requireValidCategory(request.getCategory()));
        task.setStatus(TaskStatus.PENDING_UPLOADS);

        return TaskResponse.from(taskRepository.save(task));
    }

    public TaskResponse getTaskById(UUID taskId, CustomUserDetails userDetails) {
        Task task = findTask(taskId);
        accessControlService.requireProjectReadAccess(userDetails, task.getProject());
        return TaskResponse.from(task);
    }

    public TaskResponse updateTask(
            UUID taskId,
            TaskRequest request,
            CustomUserDetails userDetails) {
        Task task = findTask(taskId);
        accessControlService.requireTaskUpdateAccess(userDetails, task);
        validateRequest(request);

        if (request.getTitle() != null) {
            task.setTitle(requireTitle(request.getTitle()));
        }
        if (request.getPlatform() != null) {
            task.setPlatform(parseEnum(request.getPlatform(), Platform.class, "nền tảng"));
        }
        if (request.getCategory() != null) {
            task.setCategory(requireValidCategory(request.getCategory()));
        }
        if (request.getStatus() != null) {
            task.setStatus(parseEnum(request.getStatus(), TaskStatus.class, "trạng thái"));
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    private Project findProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> notFound("Không tìm thấy project."));
    }

    private Task findTask(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> notFound("Không tìm thấy task."));
    }

    private void validateRequest(TaskRequest request) {
        if (request == null) {
            throw badRequest("Dữ liệu task không hợp lệ.");
        }
    }

    private String requireTitle(String title) {
        if (title == null || title.isBlank()) {
            throw badRequest("Tên task không được để trống.");
        }
        return title.trim();
    }

    private int requireValidCategory(int category) {
        if (category < 1 || category > 3) {
            throw badRequest("Danh mục task phải nằm trong khoảng từ 1 đến 3.");
        }
        return category;
    }

    private <E extends Enum<E>> E parseEnum(String value, Class<E> enumType, String fieldName) {
        if (value == null || value.isBlank()) {
            throw badRequest("Giá trị " + fieldName + " không hợp lệ.");
        }

        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw badRequest("Giá trị " + fieldName + " không hợp lệ.");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
