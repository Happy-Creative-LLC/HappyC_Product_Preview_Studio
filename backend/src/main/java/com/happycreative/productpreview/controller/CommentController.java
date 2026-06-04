package com.happycreative.productpreview.controller;

import com.happycreative.productpreview.entity.Comment;
import com.happycreative.productpreview.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentRepository commentRepository;

    @GetMapping
    public ResponseEntity<List<Comment>> getComments(@RequestParam(required = false) String component, @RequestParam String role) {
        // Enforce role-based visibility
        if ("PRODUCT_DESIGN".equalsIgnoreCase(role) && component != null && !component.equalsIgnoreCase("IMAGE")) {
            return ResponseEntity.status(403).build(); // Design can only see IMAGE
        }
        if ("MARVEL".equalsIgnoreCase(role) && component != null && !component.equalsIgnoreCase("VIDEO")) {
            return ResponseEntity.status(403).build(); // Media can only see VIDEO
        }
        
        List<Comment> comments;
        if (component != null && !component.isEmpty()) {
            comments = commentRepository.findByTargetComponentOrderByCreatedAtDesc(component);
        } else {
            comments = commentRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(comments);
    }

    @PostMapping
    public ResponseEntity<Comment> addComment(@RequestBody Comment comment) {
        // Enforce role-based post permission
        String role = comment.getAuthorRole();
        String comp = comment.getTargetComponent();
        
        if ("PRODUCT_DESIGN".equalsIgnoreCase(role) && !comp.equalsIgnoreCase("IMAGE")) {
            return ResponseEntity.status(403).build();
        }
        if ("MARVEL".equalsIgnoreCase(role) && !comp.equalsIgnoreCase("VIDEO")) {
            return ResponseEntity.status(403).build();
        }

        comment.setCreatedAt(LocalDateTime.now());
        Comment savedComment = commentRepository.save(comment);
        return ResponseEntity.ok(savedComment);
    }
}
