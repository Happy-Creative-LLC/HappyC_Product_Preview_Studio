package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.Comment;
import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.repository.CommentRepository;
import com.happycreative.productpreview.repository.PreviewRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Preview và comment đi theo task, task đi theo project: user chỉ đọc/ghi được khi xem được
 * project của task. Không có quyền thì trả 404 giống hệt trường hợp không tồn tại.
 */
@Service
@RequiredArgsConstructor
public class PreviewAccessService {

    private final PreviewRepository previewRepository;
    private final CommentRepository commentRepository;
    private final AccessControlService accessControlService;

    @Transactional(readOnly = true)
    public void requireReadablePreview(CustomUserDetails userDetails, UUID previewId) {
        Preview preview = previewRepository.findById(previewId)
                .orElseThrow(() -> notFound("Không tìm thấy preview."));
        if (!canRead(userDetails, preview.getTask())) {
            throw notFound("Không tìm thấy preview.");
        }
    }

    @Transactional(readOnly = true)
    public void requireReadableComment(CustomUserDetails userDetails, UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> notFound("Không tìm thấy comment."));
        if (!canRead(userDetails, comment.getPreview().getTask())) {
            throw notFound("Không tìm thấy comment.");
        }
    }

    // Preview không gắn task (dữ liệu cũ) chỉ Admin xem được.
    private boolean canRead(CustomUserDetails userDetails, Task task) {
        if (task == null) {
            return userDetails != null && userDetails.getRole() == Role.ADMIN;
        }
        return accessControlService.canReadProject(userDetails, task.getProject());
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
