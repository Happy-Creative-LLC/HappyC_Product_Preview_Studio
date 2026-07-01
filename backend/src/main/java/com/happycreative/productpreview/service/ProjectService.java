package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.ProjectResponse;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    public List<ProjectResponse> getProjectsForUser(CustomUserDetails userDetails) {
        Role role = userDetails.getRole();

        if (role == Role.ADMIN || role == Role.MARVEL) {
            return projectRepository.findAll().stream()
                    .map(ProjectResponse::from)
                    .collect(Collectors.toList());
        }

        String projectKey = userDetails.getProjectKey();
        if (projectKey == null) return List.of();

        return projectRepository.findByKey(projectKey)
                .map(p -> List.of(ProjectResponse.from(p)))
                .orElse(List.of());
    }
}
