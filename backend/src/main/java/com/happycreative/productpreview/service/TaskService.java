package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.TaskRequest;
import com.happycreative.productpreview.dto.TaskResponse;
import com.happycreative.productpreview.entity.*;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<TaskResponse> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public TaskResponse createTask(UUID projectId, TaskRequest request, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        User createdBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Task task = new Task();
        task.setProject(project);
        task.setCreatedBy(createdBy);
        task.setTitle(request.getTitle());
        task.setPlatform(Platform.valueOf(request.getPlatform().toUpperCase()));
        task.setCategory(request.getCategory() > 0 ? request.getCategory() : 1);
        task.setStatus(TaskStatus.PENDING_UPLOADS);

        return TaskResponse.from(taskRepository.save(task));
    }

    public TaskResponse getTaskById(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        return TaskResponse.from(task);
    }

    public TaskResponse updateTask(UUID taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle());
        }
        if (request.getCategory() > 0) {
            task.setCategory(request.getCategory());
        }
        if (request.getStatus() != null) {
            task.setStatus(TaskStatus.valueOf(request.getStatus().toUpperCase()));
        }

        return TaskResponse.from(taskRepository.save(task));
    }
}
