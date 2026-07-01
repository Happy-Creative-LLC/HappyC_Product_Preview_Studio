package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.CommentRequest;
import com.happycreative.productpreview.dto.CommentResponse;
import com.happycreative.productpreview.entity.Comment;
import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.repository.CommentRepository;
import com.happycreative.productpreview.repository.PreviewRepository;
import com.happycreative.productpreview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PreviewRepository previewRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID previewId, String component) {
        List<Comment> comments;
        if (component != null && !component.isBlank()) {
            comments = commentRepository.findByPreview_IdAndTargetComponentOrderByCreatedAtAsc(
                    previewId, component.toUpperCase());
        } else {
            comments = commentRepository.findByPreview_IdOrderByCreatedAtAsc(previewId);
        }
        return comments.stream().map(CommentResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addComment(UUID previewId, UUID userId, CommentRequest request) {
        Preview preview = previewRepository.findById(previewId)
                .orElseThrow(() -> new RuntimeException("Preview not found: " + previewId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        String component = (request.getTargetComponent() != null && !request.getTargetComponent().isBlank())
                ? request.getTargetComponent().toUpperCase()
                : "GENERAL";

        Comment comment = new Comment();
        comment.setPreview(preview);
        comment.setUser(user);
        comment.setContent(request.getContent().trim());
        comment.setTargetComponent(component);
        comment.setAuthorRole(user.getRole().name());

        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional
    public CommentResponse resolveComment(UUID commentId, UUID resolvedByUserId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
        User resolvedBy = userRepository.findById(resolvedByUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + resolvedByUserId));

        comment.setResolved(true);
        comment.setResolvedBy(resolvedBy);
        comment.setResolvedAt(LocalDateTime.now());

        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public long countComments(UUID previewId) {
        return commentRepository.countByPreview_Id(previewId);
    }
}
