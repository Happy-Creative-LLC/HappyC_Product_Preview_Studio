package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.AdminUserRequest;
import com.happycreative.productpreview.dto.AdminUserResponse;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String projectKey) {
        return ResponseEntity.ok(adminUserService.getUsers(projectKey));
    }

    @PostMapping
    public ResponseEntity<AdminUserResponse> createUser(@Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(adminUserService.createUser(request));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminUserRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(adminUserService.updateUser(userId, request, userDetails));
    }
}
