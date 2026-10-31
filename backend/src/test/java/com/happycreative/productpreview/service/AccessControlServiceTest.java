package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.TaskStatus;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.service.AccessControlService.ContentZone;
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

    @Test
    void taskOfAnotherProjectIsNotFoundForSellerAndProductDesign() {
        Task task = new Task();
        task.setProject(project("creative"));

        assertDoesNotThrow(() -> accessControlService.requireTaskVisible(principal(Role.ADMIN, null), task));
        assertDoesNotThrow(() -> accessControlService.requireTaskVisible(principal(Role.MARVEL, null), task));
        assertDoesNotThrow(() -> accessControlService.requireTaskVisible(principal(Role.SELLER, "creative"), task));

        assertNotFound(() -> accessControlService.requireTaskVisible(principal(Role.SELLER, "happy"), task));
        assertNotFound(() -> accessControlService.requireTaskVisible(principal(Role.PRODUCT_DESIGN, "happy"), task));
        assertNotFound(() -> accessControlService.requireTaskVisible(principal(Role.SELLER, null), task));
        assertNotFound(() -> accessControlService.requireTaskVisible(principal(Role.ADMIN, null), null));
    }

    @Test
    void eachContentZoneBelongsToOneRoleAndAdminOwnsAll() {
        for (ContentZone zone : ContentZone.values()) {
            assertDoesNotThrow(() -> accessControlService.requireZoneEditAccess(principal(Role.ADMIN, null), zone));
        }

        assertDoesNotThrow(() -> accessControlService.requireZoneEditAccess(
                principal(Role.SELLER, "happy"), ContentZone.TEXT));
        assertDoesNotThrow(() -> accessControlService.requireZoneEditAccess(
                principal(Role.PRODUCT_DESIGN, "happy"), ContentZone.IMAGE));
        assertDoesNotThrow(() -> accessControlService.requireZoneEditAccess(
                principal(Role.MARVEL, null), ContentZone.VIDEO));

        assertForbidden(() -> accessControlService.requireZoneEditAccess(
                principal(Role.SELLER, "happy"), ContentZone.IMAGE));
        assertForbidden(() -> accessControlService.requireZoneEditAccess(
                principal(Role.SELLER, "happy"), ContentZone.VIDEO));
        assertForbidden(() -> accessControlService.requireZoneEditAccess(
                principal(Role.PRODUCT_DESIGN, "happy"), ContentZone.TEXT));
        assertForbidden(() -> accessControlService.requireZoneEditAccess(
                principal(Role.PRODUCT_DESIGN, "happy"), ContentZone.VIDEO));
        assertForbidden(() -> accessControlService.requireZoneEditAccess(
                principal(Role.MARVEL, null), ContentZone.TEXT));
        assertForbidden(() -> accessControlService.requireZoneEditAccess(
                principal(Role.MARVEL, null), ContentZone.IMAGE));
    }

    @Test
    void adminMayMoveTaskToAnyStatus() {
        CustomUserDetails admin = principal(Role.ADMIN, null);
        for (TaskStatus from : TaskStatus.values()) {
            for (TaskStatus to : TaskStatus.values()) {
                assertDoesNotThrow(() -> accessControlService.requireStatusChange(admin, from, to));
            }
        }
    }

    @Test
    void sellerMayOnlySubmitPendingTaskForReview() {
        CustomUserDetails seller = principal(Role.SELLER, "happy");

        for (TaskStatus from : TaskStatus.values()) {
            for (TaskStatus to : TaskStatus.values()) {
                boolean allowed = from == to
                        || (from == TaskStatus.PENDING_UPLOADS && to == TaskStatus.IN_REVIEW);
                if (allowed) {
                    assertDoesNotThrow(() -> accessControlService.requireStatusChange(seller, from, to));
                } else {
                    assertForbidden(() -> accessControlService.requireStatusChange(seller, from, to));
                }
            }
        }
    }

    @Test
    void marvelAndProductDesignCannotChangeTaskStatus() {
        for (CustomUserDetails user : new CustomUserDetails[] {
                principal(Role.MARVEL, null), principal(Role.PRODUCT_DESIGN, "happy")}) {
            assertForbidden(() -> accessControlService.requireStatusChange(
                    user, TaskStatus.PENDING_UPLOADS, TaskStatus.IN_REVIEW));
            assertForbidden(() -> accessControlService.requireStatusChange(
                    user, TaskStatus.IN_REVIEW, TaskStatus.APPROVED));
        }
    }

    private void assertNotFound(Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
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
