package com.happycreative.productpreview.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@Component
public class GoogleJwtVerifier implements GoogleIdentityVerifier {

    private static final String GOOGLE_JWK_SET_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> GOOGLE_ISSUERS = Set.of(
            "accounts.google.com",
            "https://accounts.google.com");

    private final String clientId;
    private final JwtDecoder jwtDecoder;

    public GoogleJwtVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.jwtDecoder = createDecoder();
    }

    @Override
    public GoogleIdentity verify(String credential) {
        if (!StringUtils.hasText(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Đăng nhập Google chưa được cấu hình. Vui lòng dùng tài khoản demo.");
        }

        try {
            Jwt jwt = jwtDecoder.decode(credential);
            String email = jwt.getClaimAsString("email");
            Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");
            String subject = jwt.getSubject();

            if (!StringUtils.hasText(email)
                    || !StringUtils.hasText(subject)
                    || !Boolean.TRUE.equals(emailVerified)) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Google không xác minh được địa chỉ email của bạn.");
            }

            return new GoogleIdentity(
                    subject,
                    email.trim().toLowerCase(),
                    jwt.getClaimAsString("name"),
                    jwt.getClaimAsString("picture"));
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (JwtException | IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.");
        }
    }

    private JwtDecoder createDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWK_SET_URI).build();

        OAuth2TokenValidator<Jwt> issuerValidator = token ->
                GOOGLE_ISSUERS.contains(token.getIssuer() != null ? token.getIssuer().toString() : null)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));

        OAuth2TokenValidator<Jwt> audienceValidator = token ->
                token.getAudience() != null && token.getAudience().contains(clientId)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                issuerValidator,
                audienceValidator));
        return decoder;
    }
}
