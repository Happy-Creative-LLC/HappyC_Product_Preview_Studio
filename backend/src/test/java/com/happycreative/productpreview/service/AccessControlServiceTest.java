package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.security.CustomUserDetails;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AccessControlServiceTest {

    private final AccessControlService accessControlService = new AccessControlService();

    @Test
    void adminAndMarvelCanReadEveryProject() {
        Project project = project("creative");

        assertDoesNotThrow(() -> accessControlService.requireProjectReadAccess(
                principal(Role.ADMIN, null), project));
        assertDoesNotThrow(() -> accessControlService.requireProjectReadAccess(
                principal(Role.MARVEL, null), project));
    }

    @Test
    void sellerAndProductDesignCanReadOnlyTheirProject() {
        Project ownProject = project("happy");
        Project otherProject = project("creative");

        assertDoesNotThrow(() -> accessControlService.requireProjectReadAccess(
                principal(Role.SELLER, "happy"), ownProject));
        assertDoesNotThrow(() -> accessControlService.requireProjectReadAccess(
                principal(Role.PRODUCT_DESIGN, "HAPPY"), ownProject));

        assertForbidden(() -> accessControlService.requireProjectReadAccess(
                principal(Role.SELLER, "happy"), otherProject));
        assertForbidden(() -> accessControlService.requireProjectReadAccess(
                principal(Role.PRODUCT_DESIGN, "happy"), otherProject));
    }

    @Test
    void onlyAdminAndSellerFromOwningProjectCanCreateTasks() {
        Project project = project("happy");

        assertDoesNotThrow(() -> accessControlService.requireTaskCreateAccess(
                principal(Role.ADMIN, null), project));
        assertDoesNotThrow(() -> accessControlService.requireTaskCreateAccess(
                principal(Role.SELLER, "happy"), project));

        assertForbidden(() -> accessControlService.requireTaskCreateAccess(
                principal(Role.SELLER, "creative"), project));
        assertForbidden(() -> accessControlService.requireTaskCreateAccess(
                principal(Role.MARVEL, null), project));
        assertForbidden(() -> accessControlService.requireTaskCreateAccess(
                principal(Role.PRODUCT_DESIGN, "happy"), project));
    }

    @Test
    void onlyAdminAndSellerFromOwningProjectCanUpdateTasks() {
        Project project = project("happy");
        Task task = new Task();
        task.setProject(project);

        assertDoesNotThrow(() -> accessControlService.requireTaskUpdateAccess(
                principal(Role.ADMIN, null), task));
        assertDoesNotThrow(() -> accessControlService.requireTaskUpdateAccess(
                principal(Role.SELLER, "happy"), task));

        assertForbidden(() -> accessControlService.requireTaskUpdateAccess(
                principal(Role.SELLER, "creative"), task));
        assertForbidden(() -> accessControlService.requireTaskUpdateAccess(
                principal(Role.MARVEL, null), task));
        assertForbidden(() -> accessControlService.requireTaskUpdateAccess(
                principal(Role.PRODUCT_DESIGN, "happy"), task));
    }

    private void assertForbidden(Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    private Project project(String key) {
        Project project = new Project();
        project.setKey(key);
        return project;
    }

    private CustomUserDetails principal(Role role, String projectKey) {
        User user = new User();
        user.setRole(role);
        user.setProjectKey(projectKey);
        return new CustomUserDetails(user);
    }
}
