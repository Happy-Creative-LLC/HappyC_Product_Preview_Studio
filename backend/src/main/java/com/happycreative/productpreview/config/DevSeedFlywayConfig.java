package com.happycreative.productpreview.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.flyway.autoconfigure.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Chỉ tồn tại ở profile {@code dev}. Seed user dev nằm ở {@code db/seed-dev}; mật khẩu không
 * được viết trong code hay SQL mà lấy từ biến môi trường {@code DEV_SEED_PASSWORD}, băm BCrypt
 * lúc khởi động rồi truyền vào migration qua placeholder {@code devSeedPasswordHash}.
 */
@Configuration
@Profile("dev")
public class DevSeedFlywayConfig {

    static final String PLACEHOLDER = "devSeedPasswordHash";
    static final int MIN_PASSWORD_LENGTH = 8;
    // BCrypt chỉ dùng 72 byte đầu của mật khẩu.
    static final int MAX_PASSWORD_BYTES = 72;

    @Bean
    FlywayConfigurationCustomizer devSeedPlaceholders(@Value("${app.dev-seed.password:}") String password) {
        String hash = hashOrFail(password);
        return configuration -> configuration.placeholders(Map.of(PLACEHOLDER, hash));
    }

    static String hashOrFail(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Thiếu biến môi trường DEV_SEED_PASSWORD. Profile dev seed user dev nên cần đặt "
                            + "DEV_SEED_PASSWORD (từ " + MIN_PASSWORD_LENGTH + " ký tự) trong .env hoặc biến môi trường.");
        }
        if (password.length() < MIN_PASSWORD_LENGTH
                || password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new IllegalStateException(
                    "DEV_SEED_PASSWORD phải từ " + MIN_PASSWORD_LENGTH + " ký tự và không quá "
                            + MAX_PASSWORD_BYTES + " byte.");
        }
        return new BCryptPasswordEncoder().encode(password);
    }
}
