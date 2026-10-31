package com.happycreative.productpreview.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DevSeedFlywayConfigTest {

    @Test
    void missingPasswordStopsStartupWithClearMessage() {
        for (String password : new String[] {null, "", "   "}) {
            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> DevSeedFlywayConfig.hashOrFail(password));
            assertTrue(exception.getMessage().contains("DEV_SEED_PASSWORD"));
        }
    }

    @Test
    void tooShortOrTooLongPasswordIsRejected() {
        assertThrows(IllegalStateException.class, () -> DevSeedFlywayConfig.hashOrFail("short"));
        assertThrows(IllegalStateException.class, () -> DevSeedFlywayConfig.hashOrFail("x".repeat(73)));
    }

    @Test
    void validPasswordIsHashedWithBcryptAndNeverReturnedAsPlainText() {
        String password = "a-dev-only-password";

        String hash = DevSeedFlywayConfig.hashOrFail(password);

        assertFalse(hash.contains(password));
        assertTrue(new BCryptPasswordEncoder().matches(password, hash));
    }
}
