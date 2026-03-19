package com.urva.myfinance.coinTrack.security.service;

import java.security.Key;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.util.HashUtil;
import com.urva.myfinance.coinTrack.user.model.RefreshToken;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.RefreshTokenRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;

/**
 * JWT + Refresh Token service.
 *
 * Changed:
 * - generateToken now takes User, adds userId + email claims
 * - Added extractUserId / extractEmail
 * - Added refresh token generation + rotation
 * - Added TokenPair record
 */
@Service
public class JWTService {

    private static final Logger logger = LoggerFactory.getLogger(JWTService.class);

    private static final long ACCESS_TOKEN_EXPIRY_MS = 1000 * 60 * 30; // 30 minutes
    private static final Duration REFRESH_TOKEN_EXPIRY = Duration.ofDays(30);
    private static final int REFRESH_TOKEN_BYTES = 32; // 256 bits

    private final String secretKey;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public record TokenPair(String accessToken, String refreshToken) {}

    public JWTService(@Value("${jwt.secret}") String secret,
                      RefreshTokenRepository refreshTokenRepository) {
        this.secretKey = Base64.getEncoder().encodeToString(secret.getBytes());
        this.refreshTokenRepository = refreshTokenRepository;
    }

    // ── Access Token ────────────────────────────────────────────────

    /**
     * Generates an access token with userId and email in claims.
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());

        return Jwts.builder()
                .claims(claims)
                .subject(user.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRY_MS))
                .signWith(getKey())
                .compact();
    }

    // ── Refresh Token ───────────────────────────────────────────────

    /**
     * Generates a cryptographically secure refresh token.
     * Only the SHA-256 hash is stored in MongoDB — the plaintext is returned
     * to the caller once and never persisted on the server.
     */
    public String generateRefreshToken(String userId, String deviceInfo, String ipAddress) {
        byte[] randomBytes = new byte[REFRESH_TOKEN_BYTES];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = HashUtil.sha256(rawToken);

        RefreshToken entity = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .deviceInfo(truncate(deviceInfo, 200))
                .ipAddress(ipAddress)
                .expiresAt(Instant.now().plus(REFRESH_TOKEN_EXPIRY))
                .lastUsedAt(Instant.now())
                .revoked(false)
                .build();

        refreshTokenRepository.save(entity);
        return rawToken;
    }

    /**
     * Validates and rotates a refresh token (one-time use).
     * If a revoked token is presented, all tokens for that user are revoked
     * (token reuse = potential breach).
     */
    public TokenPair validateAndRotateRefreshToken(String rawToken, User user,
                                                    String deviceInfo, String ipAddress) {
        String tokenHash = HashUtil.sha256(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new com.urva.myfinance.coinTrack.common.exception.AuthenticationException(
                        "Invalid refresh token"));

        // Token reuse detection — revoked token presented = breach
        if (stored.isRevoked()) {
            logger.warn("Refresh token reuse detected for userId={}. Revoking all tokens.", stored.getUserId());
            refreshTokenRepository.revokeAllByUserId(stored.getUserId());
            throw new com.urva.myfinance.coinTrack.common.exception.AuthenticationException(
                    "Session compromised. All sessions revoked. Please log in again.");
        }

        // Expiry check
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new com.urva.myfinance.coinTrack.common.exception.AuthenticationException(
                    "Session expired. Please log in again.");
        }

        // Revoke old token
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        // Issue new pair
        String newAccessToken = generateToken(user);
        String newRefreshToken = generateRefreshToken(user.getId(), deviceInfo, ipAddress);

        return new TokenPair(newAccessToken, newRefreshToken);
    }

    /**
     * Revokes all refresh tokens for a user (logout from all devices).
     */
    public void revokeAllRefreshTokens(String userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    // ── Temp Token (TOTP flows) ─────────────────────────────────────

    public String generateTempToken(User user, String purpose, int expiryMinutes) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("purpose", purpose);
        claims.put("userId", user.getId());

        return Jwts.builder()
                .claims(claims)
                .subject(user.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000L))
                .signWith(getKey())
                .compact();
    }

    /** Temp token for PENDING users (not yet in DB — no userId). */
    public String generateTempToken(String username, String purpose) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("purpose", purpose);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 15 * 60 * 1000L))
                .signWith(getKey())
                .compact();
    }

    public String extractPurpose(String token) {
        try {
            return extractClaim(token, claims -> claims.get("purpose", String.class));
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isValidTempToken(String token, String expectedPurpose) {
        try {
            String purpose = extractPurpose(token);
            String username = extractUsername(token);
            return purpose != null && purpose.equals(expectedPurpose)
                    && username != null && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // ── Claim extraction ────────────────────────────────────────────

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", String.class));
    }

    public String extractEmail(String token) {
        return extractClaim(token, claims -> claims.get("email", String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // ── Validation ──────────────────────────────────────────────────

    public boolean validateToken(String token, String expectedUsername) {
        try {
            String username = extractUsername(token);
            return username.equals(expectedUsername) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * @deprecated Use {@link #validateToken(String, String)} — avoids DB lookup.
     */
    @Deprecated
    public boolean validateToken(String token, org.springframework.security.core.userdetails.UserDetails userDetails) {
        return validateToken(token, userDetails.getUsername());
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    // ── Internal helpers ────────────────────────────────────────────

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith((SecretKey) getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new RuntimeException("Failed to extract claims from token", e);
        }
    }

    private Key getKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (DecodingException | WeakKeyException e) {
            throw new RuntimeException("Failed to decode secret key for JWT", e);
        }
    }

    private static String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
