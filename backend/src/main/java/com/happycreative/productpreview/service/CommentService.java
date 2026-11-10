package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.CommentRequest;
import com.happycreative.productpreview.dto.CommentResponse;
import com.happycreative.productpreview.dto.CommentMentionResponse;
import com.happycreative.productpreview.entity.Comment;
import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.entity.UserStatus;
import com.happycreative.productpreview.repository.CommentRepository;
import com.happycreative.productpreview.repository.PreviewRepository;
import com.happycreative.productpreview.repository.TaskRepository;
import com.happycreative.productpreview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PreviewRepository previewRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(UUID taskId) {
        return commentRepository.findByTask_IdOrderByCreatedAtAsc(taskId).stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getPreviewComments(UUID previewId) {
        Preview preview = previewRepository.findById(previewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy preview."));
        if (preview.getTask() != null) return getTaskComments(preview.getTask().getId());
        return commentRepository.findByPreview_IdOrderByCreatedAtAsc(previewId).stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommentMentionResponse> getMentionableUsers(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task."));
        return userRepository.findAll().stream()
                .filter(user -> user.getStatus() == UserStatus.ACTIVE && canMentionInProject(user, task))
                .sorted((left, right) -> safeName(left).compareToIgnoreCase(safeName(right)))
                .map(CommentMentionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addTaskComment(UUID taskId, UUID userId, CommentRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isBlank() || content.length() > 5000) {
            throw new IllegalArgumentException("Nội dung comment phải có từ 1 đến 5000 ký tự.");
        }

        Comment parent = null;
        if (request.getParentCommentId() != null) {
            parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy comment cần trả lời."));
            if (parent.getTask() == null || !parent.getTask().getId().equals(taskId)) {
                throw new IllegalArgumentException("Comment trả lời phải thuộc cùng task.");
            }
        }

        Comment comment = new Comment();
        comment.setTask(task);
        comment.setParentComment(parent);
        comment.setUser(user);
        comment.setContent(content);
        comment.setAudience("TASK");
        comment.setAuthorRole(user.getRole().name());
        comment.setMentions(resolveMentions(task, request.getMentionIds()));
        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional
    public CommentResponse addPreviewComment(UUID previewId, UUID userId, CommentRequest request) {
        Preview preview = previewRepository.findById(previewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy preview."));
        if (preview.getTask() != null) {
            if (request.getAudience() == null || request.getAudience().isBlank()) {
                request.setAudience("TASK");
            }
            return addTaskComment(preview.getTask().getId(), userId, request);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isBlank() || content.length() > 5000) {
            throw new IllegalArgumentException("Nội dung comment phải có từ 1 đến 5000 ký tự.");
        }
        Comment comment = new Comment();
        comment.setPreview(preview);
        comment.setUser(user);
        comment.setContent(content);
        comment.setAudience("TASK");
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

    private Set<User> resolveMentions(Task task, List<UUID> mentionIds) {
        if (mentionIds == null || mentionIds.isEmpty()) return Set.of();
        Set<UUID> requestedIds = mentionIds.stream().filter(id -> id != null).collect(Collectors.toSet());
        List<User> found = userRepository.findAllById(requestedIds);
        if (found.size() != requestedIds.size() || found.stream().anyMatch(user ->
                user.getStatus() != UserStatus.ACTIVE || !canMentionInProject(user, task))) {
            throw new IllegalArgumentException("Chỉ có thể tag thành viên đang hoạt động trong project này.");
        }
        return found.stream().collect(Collectors.toSet());
    }

    private boolean canMentionInProject(User user, Task task) {
        return switch (user.getRole()) {
            case ADMIN, MARVEL -> true;
            case SELLER, PRODUCT_DESIGN -> user.getProjectKey() != null
                    && user.getProjectKey().equalsIgnoreCase(task.getProject().getKey());
        };
    }

    private String safeName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) return user.getFullName();
        return user.getUsername() == null ? user.getEmail() : user.getUsername();
    }
}
