package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.ProjectResponse;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.TaskStatus;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public List<ProjectResponse> getProjectsForUser(CustomUserDetails userDetails) {
        Role role = userDetails.getRole();

        if (role == Role.ADMIN || role == Role.MARVEL) {
            return projectRepository.findAll().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        String projectKey = userDetails.getProjectKey();
        if (projectKey == null) return List.of();

        return projectRepository.findByKey(projectKey)
                .map(p -> List.of(toResponse(p)))
                .orElse(List.of());
    }

    private ProjectResponse toResponse(com.happycreative.productpreview.entity.Project project) {
        ProjectResponse dto = ProjectResponse.from(project);
        dto.setPendingTaskCount(
            taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.PENDING_UPLOADS)
        );
        return dto;
    }
}
