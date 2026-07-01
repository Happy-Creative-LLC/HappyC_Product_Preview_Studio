package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.TaskRequest;
import com.happycreative.productpreview.dto.TaskResponse;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<?> createTask(
            @PathVariable UUID projectId,
            @RequestBody TaskRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Role role = userDetails.getRole();
        if (role == Role.PRODUCT_DESIGN) {
            return ResponseEntity.status(403).body("Product Design không có quyền tạo task");
        }

        TaskResponse created = taskService.createTask(projectId, request, userDetails.getUserId());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/api/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID taskId,
            @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }
}
