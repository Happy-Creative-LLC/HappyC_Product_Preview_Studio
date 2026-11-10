package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.dto.CommentRequest;
import com.happycreative.productpreview.dto.CommentResponse;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.service.CommentService;
import com.happycreative.productpreview.service.PreviewAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final PreviewAccessService previewAccessService;

    @GetMapping("/api/previews/{previewId}/comments")
    public ResponseEntity<List<CommentResponse>> getPreviewComments(
            @PathVariable UUID previewId,
            @RequestParam(required = false) String component,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadablePreview(userDetails, previewId);
        return ResponseEntity.ok(commentService.getPreviewComments(previewId));
    }

    @PostMapping("/api/previews/{previewId}/comments")
    public ResponseEntity<CommentResponse> addPreviewComment(
            @PathVariable UUID previewId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadablePreview(userDetails, previewId);
        return ResponseEntity.ok(commentService.addPreviewComment(previewId, userDetails.getUserId(), request));
    }

    @GetMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<List<CommentResponse>> getTaskComments(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadableTask(userDetails, taskId);
        return ResponseEntity.ok(commentService.getTaskComments(taskId));
    }

    @GetMapping("/api/tasks/{taskId}/comment-users")
    public ResponseEntity<?> getMentionableUsers(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadableTask(userDetails, taskId);
        return ResponseEntity.ok(commentService.getMentionableUsers(taskId));
    }

    @PostMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<CommentResponse> addTaskComment(
            @PathVariable UUID taskId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadableTask(userDetails, taskId);
        return ResponseEntity.ok(commentService.addTaskComment(taskId, userDetails.getUserId(), request));
    }

    // PUT /api/comments/{id}/resolve
    @PutMapping("/api/comments/{id}/resolve")
    public ResponseEntity<CommentResponse> resolveComment(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadableComment(userDetails, id);
        return ResponseEntity.ok(commentService.resolveComment(id, userDetails.getUserId()));
    }
}
