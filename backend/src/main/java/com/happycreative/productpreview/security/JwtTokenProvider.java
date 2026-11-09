package com.happycreative.productpreview.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // HS512 (jjwt) yêu cầu khoá tối thiểu 512 bit = 64 byte.
    private static final int MIN_SECRET_BYTES = 64;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private int jwtExpirationMs;

    @PostConstruct
    void requireSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "Thiếu biến môi trường JWT_SECRET. Đặt JWT_SECRET (tối thiểu "
                            + MIN_SECRET_BYTES + " ký tự ASCII) trong .env hoặc biến môi trường rồi chạy lại.");
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET quá ngắn: cần tối thiểu " + MIN_SECRET_BYTES + " byte (512 bit) cho HS512.");
        }
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        Date now = new Date();

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("role", userPrincipal.getRole().name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + jwtExpirationMs))
                .signWith(key(), Jwts.SIG.HS512)
                .compact();
    }

    public String getUsernameFromJwtToken(String token) {
        return Jwts.parser().verifyWith(key()).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    /**
     * Token hợp lệ khi đúng chữ ký, chưa hết hạn và không phải token không ký. Mọi lỗi của jjwt
     * (chữ ký sai, hết hạn, sai định dạng, không hỗ trợ) đều là JwtException nên trả false, không ném ra ngoài.
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
