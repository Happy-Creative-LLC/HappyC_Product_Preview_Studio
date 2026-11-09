package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.application.preview.TaskTextContentUseCase;
import com.happycreative.productpreview.application.preview.dto.PreviewDto;
import com.happycreative.productpreview.dto.TaskRequest;
import com.happycreative.productpreview.dto.TaskResponse;
import com.happycreative.productpreview.dto.TextContentRequest;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskTextContentUseCase taskTextContentUseCase;

    @GetMapping("/api/tasks/{taskId}/preview")
    public ResponseEntity<PreviewDto> getTaskPreview(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        PreviewDto preview = taskTextContentUseCase.getCurrent(taskId, userDetails);
        return preview == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(preview);
    }

    @PutMapping("/api/tasks/{taskId}/content/text")
    public ResponseEntity<PreviewDto> saveTaskText(
            @PathVariable UUID taskId,
            @RequestBody TextContentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(taskTextContentUseCase.save(taskId, request, userDetails));
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, userDetails));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @PathVariable UUID projectId,
            @RequestBody TaskRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(taskService.createTask(projectId, request, userDetails));
    }

    @GetMapping("/api/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(taskService.getTaskById(taskId, userDetails));
    }

    @PutMapping("/api/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID taskId,
            @RequestBody TaskRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request, userDetails));
    }
}
