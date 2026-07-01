package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.ProjectResponse;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(projectService.getProjectsForUser(userDetails));
    }
}
