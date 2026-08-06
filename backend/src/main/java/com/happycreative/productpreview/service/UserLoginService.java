package com.happycreative.productpreview.service;

import com.happycreative.productpreview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Ghi mốc đăng nhập thành công để Admin theo dõi trong trang Quản lý nhân sự.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserLoginService {

    private final UserRepository userRepository;

    /**
     * Cập nhật {@code last_login_at}. Đây là dữ liệu theo dõi, không phải nghiệp vụ
     * bắt buộc — ghi hỏng thì log lại chứ không được làm hỏng phiên đăng nhập vừa
     * xác thực thành công.
     */
    @Transactional
    public void recordLogin(UUID userId) {
        if (userId == null) {
            return;
        }
        try {
            userRepository.findById(userId).ifPresent(user -> {
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
            });
        } catch (RuntimeException e) {
            log.warn("Không ghi được thời điểm đăng nhập cho user {}: {}", userId, e.getMessage());
        }
    }
}
