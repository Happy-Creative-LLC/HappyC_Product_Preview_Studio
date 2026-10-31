package com.happycreative.productpreview.service;

import com.happycreative.productpreview.entity.Comment;
import com.happycreative.productpreview.entity.Preview;
import com.happycreative.productpreview.entity.Project;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.Task;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.repository.CommentRepository;
import com.happycreative.productpreview.repository.PreviewRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PreviewAccessServiceTest {

    private final UUID previewId = UUID.randomUUID();
    private final UUID commentId = UUID.randomUUID();

    private PreviewRepository previewRepository;
    private CommentRepository commentRepository;
    private PreviewAccessService service;
    private Preview preview;

    @BeforeEach
    void setUp() {
        previewRepository = mock(PreviewRepository.class);
        commentRepository = mock(CommentRepository.class);
        service = new PreviewAccessService(previewRepository, commentRepository, new AccessControlService());

        preview = new Preview();
        preview.setId(previewId);
        preview.setTask(taskOf("creative"));
        when(previewRepository.findById(previewId)).thenReturn(Optional.of(preview));

        Comment comment = new Comment();
        comment.setId(commentId);
        comment.setPreview(preview);
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
    }

    @Test
    void usersOfTheOwningProjectAndAdminAndMarvelCanReadPreviewAndComments() {
        for (CustomUserDetails user : new CustomUserDetails[] {
                principal(Role.SELLER, "creative"), principal(Role.PRODUCT_DESIGN, "creative"),
                principal(Role.ADMIN, null), principal(Role.MARVEL, null)}) {
            assertDoesNotThrow(() -> service.requireReadablePreview(user, previewId));
            assertDoesNotThrow(() -> service.requireReadableComment(user, commentId));
        }
    }

    @Test
    void sellerAndProductDesignOfAnotherProjectGetNotFound() {
        for (CustomUserDetails user : new CustomUserDetails[] {
                principal(Role.SELLER, "happy"), principal(Role.PRODUCT_DESIGN, "happy")}) {
            assertNotFound(() -> service.requireReadablePreview(user, previewId));
            assertNotFound(() -> service.requireReadableComment(user, commentId));
        }
    }

    @Test
    void hiddenAndMissingResourcesLookTheSame() {
        CustomUserDetails outsider = principal(Role.SELLER, "happy");
        when(previewRepository.findById(previewId)).thenReturn(Optional.empty());
        when(commentRepository.findById(commentId)).thenReturn(Optional.empty());

        ResponseStatusException missingPreview = assertThrows(ResponseStatusException.class,
                () -> service.requireReadablePreview(outsider, previewId));
        ResponseStatusException missingComment = assertThrows(ResponseStatusException.class,
                () -> service.requireReadableComment(outsider, commentId));

        assertEquals(HttpStatus.NOT_FOUND, missingPreview.getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, missingComment.getStatusCode());

        // và cùng thông báo với trường hợp tồn tại nhưng thuộc project khác
        when(previewRepository.findById(previewId)).thenReturn(Optional.of(preview));
        ResponseStatusException hiddenPreview = assertThrows(ResponseStatusException.class,
                () -> service.requireReadablePreview(outsider, previewId));
        assertEquals(missingPreview.getReason(), hiddenPreview.getReason());
    }

    @Test
    void previewWithoutTaskIsVisibleToAdminOnly() {
        preview.setTask(null);

        assertDoesNotThrow(() -> service.requireReadablePreview(principal(Role.ADMIN, null), previewId));
        assertNotFound(() -> service.requireReadablePreview(principal(Role.MARVEL, null), previewId));
        assertNotFound(() -> service.requireReadablePreview(principal(Role.SELLER, "creative"), previewId));
        assertNotFound(() -> service.requireReadableComment(principal(Role.SELLER, "creative"), commentId));
    }

    private void assertNotFound(Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    private Task taskOf(String projectKey) {
        Project project = new Project();
        project.setKey(projectKey);
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setProject(project);
        return task;
    }

    private CustomUserDetails principal(Role role, String projectKey) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        user.setProjectKey(projectKey);
        return new CustomUserDetails(user);
    }
}
