package com.medicare.security;

import com.medicare.domain.Role;
import com.medicare.domain.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final Duration tokenTtl;

    public JwtService(
        @Value("${medicare.security.jwt-secret}") String secret,
        @Value("${medicare.security.token-ttl:PT2H}") Duration tokenTtl
    ) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "Set JWT_SECRET (or SESSION_SECRET) to a random value of at least 32 bytes."
            );
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.tokenTtl = tokenTtl;
    }

    public String issue(UserAccount user, Instant now) {
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("role", user.getRole().name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(tokenTtl)))
            .signWith(signingKey)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public Instant expiresAt(Instant now) {
        return now.plus(tokenTtl);
    }
}