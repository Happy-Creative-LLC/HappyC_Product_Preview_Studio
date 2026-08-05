package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccessControlService {

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
