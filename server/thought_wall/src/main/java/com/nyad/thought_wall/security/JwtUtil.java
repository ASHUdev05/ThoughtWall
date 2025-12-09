package com.nyad.thought_wall.security;

import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {
    // Generate a secure key for HS256 automatically
    private final SecretKey key = Jwts.SIG.HS256.key().build();
    private final long EXPIRATION = 86400000; // 1 day

    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email) // Updated: setSubject -> subject
                .issuedAt(new Date()) // Updated: setIssuedAt -> issuedAt
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION)) // Updated: setExpiration -> expiration
                .signWith(key) // Updated: No algorithm needed, it infers from the key
                .compact();
    }

    public String validateTokenAndGetEmail(String token) {
        // Updated: parserBuilder() -> parser()
        // Updated: setSigningKey() -> verifyWith()
        // Updated: parseClaimsJws() -> parseSignedClaims()
        // Updated: getBody() -> getPayload()
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}