package com.happycreative.productpreview.dto;

import com.happycreative.productpreview.entity.Project;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ProjectResponse {
    private UUID id;
    private String key;
    private String name;
    private String description;
    private boolean isActive;
    private LocalDateTime createdAt;

    public static ProjectResponse from(Project project) {
        ProjectResponse dto = new ProjectResponse();
        dto.setId(project.getId());
        dto.setKey(project.getKey());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setActive(project.isActive());
        dto.setCreatedAt(project.getCreatedAt());
        return dto;
    }
}
