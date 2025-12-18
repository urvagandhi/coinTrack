package com.urva.myfinance.coinTrack.email.service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.common.util.RequestUtils;
import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.repository.EmailTokenRepository;
import com.urva.myfinance.coinTrack.user.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Service for managing email verification tokens.
 *
 * Token Flow:
 * 1. createToken() - Create JWT + DB record
 * 2. validateToken() - Verify JWT signature AND check DB record
 * 3. markUsed() - Mark token as used (single-use)
 * 4. invalidateAllForUser() - Invalidate all tokens on credential change
 *
 * SECURITY NOTE:
 * JWT validation alone is NOT sufficient. The token MUST exist in DB
 * with used=false to be considered valid. This prevents replay attacks
 * even if an attacker has a valid JWT.
 */
@Service
@RequiredArgsConstructor
public class EmailTokenService {

    private static final Logger logger = LoggerFactory.getLogger(EmailTokenService.class);

    private final EmailTokenRepository repository;
    private final EmailConfigProperties emailConfig;

    /**
     * Create a new email token for the given user and purpose.
     *
     * @param user    The user to create token for
     * @param purpose Token purpose (EMAIL_VERIFY, PASSWORD_RESET,
     *                EMAIL_CHANGE_VERIFY)
     * @param request HTTP request for IP/User-Agent logging
     * @return Signed JWT token
     */
    public String createToken(User user, String purpose, HttpServletRequest request) {
        return createToken(user, purpose, null, request);
    }

    /**
     * Create a new email token for email change verification.
     *
     * @param user     The user to create token for
     * @param purpose  Token purpose (should be EMAIL_CHANGE_VERIFY)
     * @param newEmail The new email address to verify
     * @param request  HTTP request for IP/User-Agent logging
     * @return Signed JWT token
     */
    @SuppressWarnings("null")
    public String createToken(User user, String purpose, String newEmail, HttpServletRequest request) {
        // Generate unique token ID
        String tokenId = UUID.randomUUID().toString();

        // Calculate expiry
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusMinutes(emailConfig.getMagicLinkExpiryMinutes());

        // Extract request details for auditing
        String ipAddress = RequestUtils.extractIpAddress(request);
        String userAgent = RequestUtils.extractUserAgent(request);

        // Create DB record
        EmailToken emailToken = EmailToken.builder()
                .id(tokenId)
                .userId(user.getId())
                .purpose(purpose)
                .newEmail(newEmail)
                .expiresAt(expiresAt)
                .used(false)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .createdAt(LocalDateTime.now())
                .build();

        repository.save(emailToken);
        logger.info("Created email token: purpose={}, userId={}, tokenId={}", purpose, user.getId(), tokenId);

        // Create signed JWT
        return createJwt(tokenId, user.getId(), purpose, expiresAt);
    }

    /**
     * Validate an email token.
     *
     * IMPORTANT: This validates BOTH the JWT signature AND the DB record.
     * Even if the JWT is valid, the token is rejected if:
     * - It doesn't exist in DB
     * - It has been used
     * - The purpose doesn't match
     *
     * @param token           The JWT token to validate
     * @param expectedPurpose Expected token purpose
     * @return EmailToken if valid
     * @throws InvalidEmailTokenException if token is invalid
     */
    public EmailToken validateToken(String token, String expectedPurpose) {
        try {
            // Parse and validate JWT
            Claims claims = parseJwt(token);

            String tokenId = claims.getId();
            String purpose = claims.get("purpose", String.class);

            // Verify purpose matches
            if (!expectedPurpose.equals(purpose)) {
                logger.warn("Token purpose mismatch: expected={}, actual={}", expectedPurpose, purpose);
                throw new InvalidEmailTokenException("Invalid token purpose");
            }

            // CRITICAL: Check token exists in DB and is not used
            EmailToken dbToken = repository.findByIdAndUsedFalse(tokenId)
                    .orElseThrow(() -> {
                        logger.warn("Token not found or already used: tokenId={}", tokenId);
                        return new InvalidEmailTokenException("Token expired or already used");
                    });

            // Double-check purpose matches DB record
            if (!expectedPurpose.equals(dbToken.getPurpose())) {
                logger.warn("DB token purpose mismatch: expected={}, actual={}", expectedPurpose, dbToken.getPurpose());
                throw new InvalidEmailTokenException("Invalid token purpose");
            }

            // Check if token is expired (belt and suspenders with JWT exp)
            if (dbToken.isExpired()) {
                logger.warn("Token expired: tokenId={}, expiresAt={}", tokenId, dbToken.getExpiresAt());
                throw new InvalidEmailTokenException("Token has expired");
            }

            logger.info("Token validated successfully: tokenId={}, purpose={}", tokenId, purpose);
            return dbToken;

        } catch (ExpiredJwtException e) {
            logger.warn("JWT expired: {}", e.getMessage());
            throw new InvalidEmailTokenException("Token has expired");
        } catch (InvalidEmailTokenException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Token validation failed: {}", e.getMessage());
            throw new InvalidEmailTokenException("Invalid token");
        }
    }

    /**
     * Mark a token as used.
     * Must be called after successful verification to prevent reuse.
     *
     * @param tokenId Token ID to mark as used
     */
    @SuppressWarnings("null")
    public void markUsed(String tokenId) {
        repository.findById(tokenId).ifPresent(token -> {
            token.setUsed(true);
            repository.save(token);
            logger.info("Token marked as used: tokenId={}", tokenId);
        });
    }

    /**
     * Invalidate all tokens for a user.
     * Called on sensitive account changes (password, email, TOTP reset, username).
     *
     * @param userId User ID to invalidate tokens for
     */
    public void invalidateAllForUser(String userId) {
        repository.deleteAllByUserId(userId);
        logger.info("Invalidated all email tokens for user: userId={}", userId);
    }

    /**
     * Create a signed JWT token.
     */
    private String createJwt(String tokenId, String userId, String purpose, LocalDateTime expiresAt) {
        SecretKey key = Keys.hmacShaKeyFor(emailConfig.getMagicLinkSecret().getBytes());

        return Jwts.builder()
                .id(tokenId)
                .subject(userId)
                .claim("purpose", purpose)
                .issuedAt(new Date())
                .expiration(java.sql.Timestamp.valueOf(expiresAt))
                .signWith(key)
                .compact();
    }

    /**
     * Parse and validate a JWT token.
     */
    private Claims parseJwt(String token) {
        SecretKey key = Keys.hmacShaKeyFor(emailConfig.getMagicLinkSecret().getBytes());

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Exception for invalid email tokens.
     */
    public static class InvalidEmailTokenException extends RuntimeException {
        public InvalidEmailTokenException(String message) {
            super(message);
        }
    }
}
