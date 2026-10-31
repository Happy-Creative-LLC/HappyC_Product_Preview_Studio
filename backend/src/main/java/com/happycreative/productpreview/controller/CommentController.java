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

    // GET /api/previews/{previewId}/comments?component=IMAGE
    @GetMapping("/api/previews/{previewId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable UUID previewId,
            @RequestParam(required = false) String component,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadablePreview(userDetails, previewId);
        return ResponseEntity.ok(commentService.getComments(previewId, component));
    }

    // POST /api/previews/{previewId}/comments
    @PostMapping("/api/previews/{previewId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID previewId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        previewAccessService.requireReadablePreview(userDetails, previewId);
        return ResponseEntity.ok(commentService.addComment(previewId, userDetails.getUserId(), request));
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
