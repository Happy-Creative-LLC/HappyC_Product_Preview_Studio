package com.happycreative.productpreview.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happycreative.productpreview.entity.Role;
import com.happycreative.productpreview.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Chốt hành vi của {@link JwtTokenProvider} để nâng thư viện jjwt không làm đổi việc xác thực.
 * Token giả được dựng tay bằng HMAC-SHA512 (không dùng API jjwt) nên test không phụ thuộc phiên bản jjwt.
 * Secret chỉ dùng cho test (HS512 cần tối thiểu 64 byte).
 */
class JwtTokenProviderTest {

    private static final String SECRET = "unit-test-secret-not-for-real-use-0123456789-abcdefghijklmnopqrstuvwxyz";
    private static final String OTHER_SECRET = "another-unit-test-secret-0123456789-abcdefghijklmnopqrstuvwxyz-ABCDEF";
    private static final String HS512_HEADER = "{\"alg\":\"HS512\",\"typ\":\"JWT\"}";
    private static final long FAR_FUTURE_EPOCH_SECONDS = 4_102_444_800L; // 2100-01-01

    private static final ObjectMapper JSON = new ObjectMapper();

    @Test
    void generatedTokenCarriesSubjectRoleAndExpiryAndIsValid() throws Exception {
        JwtTokenProvider provider = provider(SECRET, 60_000);

        String token = provider.generateToken(authentication("hc.seller", Role.SELLER));

        assertTrue(provider.validateJwtToken(token));
        assertEquals("hc.seller", provider.getUsernameFromJwtToken(token));
        JsonNode header = JSON.readTree(decode(token.split("\\.")[0]));
        JsonNode payload = JSON.readTree(decode(token.split("\\.")[1]));
        assertEquals("HS512", header.get("alg").asText());
        assertEquals("hc.seller", payload.get("sub").asText());
        assertEquals("SELLER", payload.get("role").asText());
        long lifetimeSeconds = payload.get("exp").asLong() - payload.get("iat").asLong();
        assertTrue(lifetimeSeconds >= 59 && lifetimeSeconds <= 61, "hạn dùng phải khoảng 60 giây, thực tế " + lifetimeSeconds);
    }

    @Test
    void tokenBuiltByHandWithTheRightSecretIsAccepted() {
        // Đối chứng: chứng minh hàm dựng tay đúng, để các ca từ chối bên dưới từ chối đúng lý do.
        JwtTokenProvider provider = provider(SECRET, 60_000);

        String token = forge(HS512_HEADER, payloadJson("hc.admin", FAR_FUTURE_EPOCH_SECONDS), SECRET);

        assertTrue(provider.validateJwtToken(token));
        assertEquals("hc.admin", provider.getUsernameFromJwtToken(token));
    }

    @Test
    void expiredTokenIsRejected() {
        JwtTokenProvider provider = provider(SECRET, 60_000);

        assertFalse(provider.validateJwtToken(forge(HS512_HEADER, payloadJson("hc.admin", 1L), SECRET)));
        // Token do chính provider sinh nhưng hạn đã lùi về quá khứ
        JwtTokenProvider alreadyExpired = provider(SECRET, -5_000);
        assertFalse(provider.validateJwtToken(alreadyExpired.generateToken(authentication("hc.admin", Role.ADMIN))));
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtTokenProvider provider = provider(SECRET, 60_000);

        String token = forge(HS512_HEADER, payloadJson("hc.admin", FAR_FUTURE_EPOCH_SECONDS), OTHER_SECRET);

        assertFalse(provider.validateJwtToken(token));
    }

    @Test
    void tokenWithTamperedPayloadIsRejected() {
        JwtTokenProvider provider = provider(SECRET, 60_000);
        String valid = provider.generateToken(authentication("hc.seller", Role.SELLER));
        String[] parts = valid.split("\\.");

        // Giữ nguyên chữ ký, thay payload bằng quyền ADMIN
        String tampered = parts[0] + "." + encode(payloadJson("hc.admin", FAR_FUTURE_EPOCH_SECONDS)) + "." + parts[2];

        assertFalse(provider.validateJwtToken(tampered));
    }

    @Test
    void unsignedTokenWithAlgNoneIsRejected() {
        JwtTokenProvider provider = provider(SECRET, 60_000);
        String payload = encode(payloadJson("hc.admin", FAR_FUTURE_EPOCH_SECONDS));

        assertFalse(provider.validateJwtToken(encode("{\"alg\":\"none\"}") + "." + payload + "."));
        assertFalse(provider.validateJwtToken(encode("{\"alg\":\"none\"}") + "." + payload));
    }

    @Test
    void malformedOrEmptyTokensAreRejected() {
        JwtTokenProvider provider = provider(SECRET, 60_000);

        assertFalse(provider.validateJwtToken(null));
        assertFalse(provider.validateJwtToken(""));
        assertFalse(provider.validateJwtToken("   "));
        assertFalse(provider.validateJwtToken("not-a-jwt"));
        assertFalse(provider.validateJwtToken("a.b.c"));
    }

    @Test
    void startupRejectsMissingOrShortSecret() {
        JwtTokenProvider missing = new JwtTokenProvider();
        ReflectionTestUtils.setField(missing, "jwtSecret", "");
        IllegalStateException noSecret = assertThrows(IllegalStateException.class, missing::requireSecret);
        assertTrue(noSecret.getMessage().contains("JWT_SECRET"));

        JwtTokenProvider shortSecret = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortSecret, "jwtSecret", "x".repeat(63));
        assertThrows(IllegalStateException.class, shortSecret::requireSecret);

        JwtTokenProvider enough = new JwtTokenProvider();
        ReflectionTestUtils.setField(enough, "jwtSecret", "x".repeat(64));
        enough.requireSecret();
    }

    private static JwtTokenProvider provider(String secret, int expirationMs) {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", secret);
        ReflectionTestUtils.setField(provider, "jwtExpirationMs", expirationMs);
        provider.requireSecret();
        return provider;
    }

    private static UsernamePasswordAuthenticationToken authentication(String username, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setRole(role);
        CustomUserDetails details = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
    }

    private static String payloadJson(String subject, long expEpochSeconds) {
        return "{\"sub\":\"" + subject + "\",\"role\":\"ADMIN\",\"iat\":1,\"exp\":" + expEpochSeconds + "}";
    }

    private static String forge(String headerJson, String payloadJson, String secret) {
        String signingInput = encode(headerJson) + "." + encode(payloadJson);
        return signingInput + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(hmacSha512(signingInput, secret));
    }

    private static byte[] hmacSha512(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }
}
