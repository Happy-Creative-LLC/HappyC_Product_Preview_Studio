package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.AuthResponse;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.entity.UserStatus;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import com.happycreative.productpreview.security.GoogleIdentity;
import com.happycreative.productpreview.security.GoogleIdentityVerifier;
import com.happycreative.productpreview.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final GoogleIdentityVerifier googleIdentityVerifier;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse authenticate(String credential) {
        GoogleIdentity identity = googleIdentityVerifier.verify(credential);
        User user = userRepository.findByEmailIgnoreCase(identity.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Email này chưa được Admin cấp quyền truy cập hệ thống."));

        requireActive(user);
        linkGoogleIdentity(user, identity);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtTokenProvider.generateToken(authentication);
        return new AuthResponse(
                jwt,
                userDetails.getUserId(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                userDetails.getRole(),
                userDetails.getProjectKey());
    }

    private void requireActive(User user) {
        if (user.getStatus() == UserStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đang chờ Admin phê duyệt.");
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa. Vui lòng liên hệ Admin.");
        }
    }

    private void linkGoogleIdentity(User user, GoogleIdentity identity) {
        userRepository.findByGoogleSub(identity.subject())
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.FORBIDDEN,
                            "Tài khoản Google này đã được liên kết với nhân sự khác.");
                });

        if (StringUtils.hasText(user.getGoogleSub())
                && !user.getGoogleSub().equals(identity.subject())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Email này đã được liên kết với một tài khoản Google khác.");
        }

        user.setGoogleSub(identity.subject());
        if (!StringUtils.hasText(user.getFullName()) && StringUtils.hasText(identity.fullName())) {
            user.setFullName(identity.fullName());
        }
        if (StringUtils.hasText(identity.avatarUrl())) {
            user.setAvatarUrl(identity.avatarUrl());
        }
        userRepository.save(user);
    }
}
