package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import com.happycreative.productpreview.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccessControlService {

    /** Vùng nội dung của listing, mỗi vùng thuộc về một vai trò (Admin được tất cả). */
    public enum ContentZone {
        TEXT(Role.SELLER, "Text"),
        IMAGE(Role.PRODUCT_DESIGN, "Ảnh"),
        VIDEO(Role.MARVEL, "Video");

        private final Role owner;
        private final String label;

        ContentZone(Role owner, String label) {
            this.owner = owner;
            this.label = label;
        }
    }

    public void requireProjectReadAccess(CustomUserDetails userDetails, Project project) {
        if (!canReadProject(userDetails, project)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền truy cập project này."
            );
        }
    }

    public void requireTaskCreateAccess(CustomUserDetails userDetails, Project project) {
        if (!canManageTasks(userDetails, project)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền tạo task trong project này."
            );
        }
    }

    public void requireTaskUpdateAccess(CustomUserDetails userDetails, Task task) {
        if (task == null || !canManageTasks(userDetails, task.getProject())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền cập nhật task này."
            );
        }
    }

    /**
     * Task phải thuộc project mà user được xem; ngược lại trả 404 (không phải 403) để không
     * lộ sự tồn tại của task thuộc project khác.
     */
    public void requireTaskVisible(CustomUserDetails userDetails, Task task) {
        if (task == null || !canReadProject(userDetails, task.getProject())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy task.");
        }
    }

    public boolean canEditZone(CustomUserDetails userDetails, ContentZone zone) {
        if (userDetails == null || userDetails.getRole() == null) {
            return false;
        }
        return userDetails.getRole() == Role.ADMIN || userDetails.getRole() == zone.owner;
    }

    public void requireZoneEditAccess(CustomUserDetails userDetails, ContentZone zone) {
        if (!canEditZone(userDetails, zone)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền chỉnh sửa vùng " + zone.label + " của task này."
            );
        }
    }

    /**
     * Chuyển trạng thái task. Cho tới khi có quyền Duyệt (P5): Admin đặt trạng thái bất kỳ,
     * Seller chỉ gửi duyệt (PENDING_UPLOADS sang IN_REVIEW), các vai trò khác không đổi được.
     * Giữ nguyên trạng thái hiện tại không tính là chuyển.
     */
    public void requireStatusChange(CustomUserDetails userDetails, TaskStatus from, TaskStatus to) {
        if (from == to) {
            return;
        }
        Role role = userDetails == null ? null : userDetails.getRole();
        boolean allowed = role == Role.ADMIN
                || (role == Role.SELLER
                    && from == TaskStatus.PENDING_UPLOADS
                    && to == TaskStatus.IN_REVIEW);
        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền chuyển trạng thái task này."
            );
        }
    }

    public boolean canReadProject(CustomUserDetails userDetails, Project project) {
        if (userDetails == null || project == null || userDetails.getRole() == null) {
            return false;
        }

        Role role = userDetails.getRole();
        return role == Role.ADMIN
                || role == Role.MARVEL
                || ((role == Role.SELLER || role == Role.PRODUCT_DESIGN)
                    && belongsToProject(userDetails, project));
    }

    private boolean canManageTasks(CustomUserDetails userDetails, Project project) {
        if (userDetails == null || project == null || userDetails.getRole() == null) {
            return false;
        }

        return userDetails.getRole() == Role.ADMIN
                || (userDetails.getRole() == Role.SELLER && belongsToProject(userDetails, project));
    }

    private boolean belongsToProject(CustomUserDetails userDetails, Project project) {
        String userProjectKey = userDetails.getProjectKey();
        String projectKey = project.getKey();
        return userProjectKey != null
                && !userProjectKey.isBlank()
                && projectKey != null
                && userProjectKey.equalsIgnoreCase(projectKey);
    }
}
