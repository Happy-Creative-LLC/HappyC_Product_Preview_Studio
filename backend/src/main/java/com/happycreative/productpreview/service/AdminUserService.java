package com.happycreative.productpreview.service;

import com.happycreative.productpreview.dto.AdminUserRequest;
import com.happycreative.productpreview.dto.AdminUserResponse;
import com.happycreative.productpreview.entity.AuthProvider;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.User;
import com.happycreative.productpreview.entity.UserStatus;
import com.happycreative.productpreview.repository.ProjectRepository;
import com.happycreative.productpreview.repository.UserRepository;
import com.happycreative.productpreview.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public List<AdminUserResponse> getUsers(String projectKey) {
        List<User> users = (projectKey == null || projectKey.isBlank())
                ? userRepository.findAll()
                : userRepository.findByProjectKey(normalizeKey(projectKey));

        return users.stream()
                .sorted(Comparator.comparing(User::getCreatedAt))
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse createUser(AdminUserRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã được thêm vào hệ thống.");
        }

        Role role = parseRole(request.getRole());
        String projectKey = resolveProjectKey(role, request.getProjectKey());

        User user = new User();
        user.setEmail(email);
        user.setFullName(request.getFullName().trim());
        user.setRole(role);
        user.setProjectKey(projectKey);
        // Nhân sự do Admin thêm sẽ đăng nhập bằng Google — không có mật khẩu local.
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setStatus(parseStatus(request.getStatus(), UserStatus.ACTIVE));

        return AdminUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse updateUser(UUID userId, AdminUserRequest request, CustomUserDetails actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân sự."));

        String email = normalizeEmail(request.getEmail());
        userRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã thuộc về nhân sự khác.");
                });

        Role role = parseRole(request.getRole());
        UserStatus status = parseStatus(request.getStatus(), user.getStatus());

        if (userId.equals(actor.getUserId())) {
            if (role != Role.ADMIN) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Bạn không thể tự hạ quyền Admin của chính mình.");
            }
            if (status != UserStatus.ACTIVE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Bạn không thể tự khoá tài khoản của chính mình.");
            }
        }

        user.setEmail(email);
        user.setFullName(request.getFullName().trim());
        user.setRole(role);
        user.setProjectKey(resolveProjectKey(role, request.getProjectKey()));
        user.setStatus(status);

        return AdminUserResponse.from(userRepository.save(user));
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
        }
    }

    private UserStatus parseStatus(String value, UserStatus fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return UserStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ.");
        }
    }

    // ADMIN/MARVEL xem được mọi project nên không gắn projectKey; SELLER/PRODUCT_DESIGN bắt buộc phải có.
    private String resolveProjectKey(Role role, String rawKey) {
        if (role == Role.ADMIN || role == Role.MARVEL) return null;

        if (rawKey == null || rawKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vai trò Seller và Product Design bắt buộc phải thuộc một project.");
        }

        String key = normalizeKey(rawKey);
        if (projectRepository.findByKey(key).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project không tồn tại.");
        }
        return key;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizeKey(String key) {
        return key.trim().toLowerCase();
    }
}
