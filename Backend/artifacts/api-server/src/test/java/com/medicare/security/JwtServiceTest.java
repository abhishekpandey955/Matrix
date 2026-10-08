package com.medicare.security;

import static org.junit.jupiter.api.Assertions.*;

import com.medicare.domain.Role;
import com.medicare.domain.UserAccount;
import io.jsonwebtoken.Claims;
import java.lang.reflect.Field;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
    private static final String TEST_SECRET =
        "test-only-random-secret-with-at-least-32-characters";

    @Test
    void issuedTokenContainsOnlyIdentityAndRoleClaims() throws Exception {
        UserAccount user = new UserAccount("patient@example.test", "not-a-real-password-hash",
            Role.PATIENT, "Test Patient", "555-0100");
        Field id = UserAccount.class.getDeclaredField("id");
        id.setAccessible(true);
        id.set(user, UUID.fromString("6f16bd0c-1d4d-4fc7-86a7-e2c20d6f1110"));

        JwtService service = new JwtService(TEST_SECRET, Duration.ofMinutes(10));
        Instant now = Instant.now();
        Claims claims = service.parse(service.issue(user, now));

        assertEquals("6f16bd0c-1d4d-4fc7-86a7-e2c20d6f1110", claims.getSubject());
        assertEquals("PATIENT", claims.get("role"));
        long expectedExpiration = now.plus(Duration.ofMinutes(10)).toEpochMilli() / 1000 * 1000;
        assertEquals(expectedExpiration, claims.getExpiration().getTime());
        assertNull(claims.get("email"));
        assertNull(claims.get("password"));
        assertNull(claims.get("fullName"));
    }

    @Test
    void refusesSigningSecretsShorterThan32Bytes() {
        assertThrows(IllegalStateException.class,
            () -> new JwtService("too-short", Duration.ofHours(1)));
    }
}