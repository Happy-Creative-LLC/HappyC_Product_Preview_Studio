package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.AuthResponse;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.entity.UserStatus;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.security.GoogleIdentity;
import com.happycreative.productpreview.security.GoogleIdentityVerifier;
import com.happycreative.productpreview.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceTest {

    @Mock
    private GoogleIdentityVerifier googleIdentityVerifier;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private GoogleAuthService googleAuthService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void activeAllowlistedEmailCanLoginAndLinkGoogleSubject() {
        GoogleIdentity identity = identity();
        User user = user(UserStatus.ACTIVE);

        when(googleIdentityVerifier.verify("credential")).thenReturn(identity);
        when(userRepository.findByEmailIgnoreCase(identity.email())).thenReturn(Optional.of(user));
        when(userRepository.findByGoogleSub(identity.subject())).thenReturn(Optional.empty());
        when(userRepository.save(user)).thenReturn(user);
        when(jwtTokenProvider.generateToken(any(Authentication.class))).thenReturn("internal-jwt");

        AuthResponse response = googleAuthService.authenticate("credential");

        assertEquals("internal-jwt", response.getToken());
        assertEquals(user.getId(), response.getUserId());
        assertEquals(identity.subject(), user.getGoogleSub());
        assertEquals(identity.avatarUrl(), user.getAvatarUrl());
        verify(userRepository).save(user);
    }

    @Test
    void emailNotAddedByAdminIsRejected() {
        GoogleIdentity identity = identity();
        when(googleIdentityVerifier.verify("credential")).thenReturn(identity);
        when(userRepository.findByEmailIgnoreCase(identity.email())).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> googleAuthService.authenticate("credential"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void pendingEmailIsRejected() {
        assertStatusRejected(UserStatus.PENDING);
    }

    @Test
    void lockedEmailIsRejected() {
        assertStatusRejected(UserStatus.LOCKED);
    }

    @Test
    void emailAlreadyLinkedToAnotherGoogleAccountIsRejected() {
        GoogleIdentity identity = identity();
        User user = user(UserStatus.ACTIVE);
        user.setGoogleSub("different-subject");

        when(googleIdentityVerifier.verify("credential")).thenReturn(identity);
        when(userRepository.findByEmailIgnoreCase(identity.email())).thenReturn(Optional.of(user));
        when(userRepository.findByGoogleSub(identity.subject())).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> googleAuthService.authenticate("credential"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(userRepository, never()).save(any(User.class));
    }

    private void assertStatusRejected(UserStatus status) {
        GoogleIdentity identity = identity();
        User user = user(status);
        when(googleIdentityVerifier.verify("credential")).thenReturn(identity);
        when(userRepository.findByEmailIgnoreCase(identity.email())).thenReturn(Optional.of(user));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> googleAuthService.authenticate("credential"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(userRepository, never()).save(any(User.class));
    }

    private GoogleIdentity identity() {
        return new GoogleIdentity(
                "google-subject",
                "employee@gmail.com",
                "Happy Employee",
                "https://example.com/avatar.png");
    }

    private User user(UserStatus status) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("employee@gmail.com");
        user.setFullName("Happy Employee");
        user.setRole(Role.SELLER);
        user.setProjectKey("happy");
        user.setStatus(status);
        return user;
    }
}
