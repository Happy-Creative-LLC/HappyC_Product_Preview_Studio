package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.Task;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TaskResponse {
    private UUID id;
    private UUID projectId;
    private String projectName;
    private String title;
    private String platform;
    private int category;
    private String status;
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse from(Task task) {
        TaskResponse dto = new TaskResponse();
        dto.setId(task.getId());
        dto.setProjectId(task.getProject().getId());
        dto.setProjectName(task.getProject().getName());
        dto.setTitle(task.getTitle());
        dto.setPlatform(task.getPlatform().name());
        dto.setCategory(task.getCategory());
        dto.setStatus(task.getStatus().name());
        dto.setCreatedById(task.getCreatedBy().getId());
        dto.setCreatedByName(task.getCreatedBy().getFullName());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        return dto;
    }
}
