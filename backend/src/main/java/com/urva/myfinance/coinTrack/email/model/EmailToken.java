package com.urva.myfinance.coinTrack.email.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Email token entity for magic link verification.
 *
 * Tokens are used for:
 * - EMAIL_VERIFY: Registration email verification
 * - PASSWORD_RESET: Forgot password flow
 * - EMAIL_CHANGE_VERIFY: New email verification before update
 *
 * Security Rules:
 * - Single-use only (marked as used after verification)
 * - Short-lived (10 minutes by default)
 * - Purpose-bound (must match expected purpose)
 * - Auto-deleted via MongoDB TTL index on expiresAt
 *
 * IMPORTANT: JWT validation alone is NOT sufficient.
 * Token MUST exist in DB with used=false to be valid.
 */
@Document(collection = "email_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailToken {

    @Id
    private String id;

    /**
     * User ID this token belongs to
     */
    @Indexed
    private String userId;

    /**
     * Token purpose: EMAIL_VERIFY | PASSWORD_RESET | EMAIL_CHANGE_VERIFY
     */
    private String purpose;

    /**
     * New email address (only for EMAIL_CHANGE_VERIFY purpose)
     */
    private String newEmail;

    /**
     * Token expiration time.
     * MongoDB TTL index automatically deletes expired documents.
     * expireAfterSeconds=0 means delete when current time >= expiresAt
     */
    @SuppressWarnings("removal") // expireAfterSeconds deprecated but no replacement exists yet
    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiresAt;

    /**
     * Whether this token has been used.
     * Once used, token cannot be reused.
     */
    @Builder.Default
    private boolean used = false;

    /**
     * IP address of the request that created this token.
     * For security auditing.
     */
    private String ipAddress;

    /**
     * User agent of the request that created this token.
     * For security auditing.
     */
    private String userAgent;

    /**
     * Token creation timestamp.
     */
    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Token purpose constants
     */
    public static final String PURPOSE_EMAIL_VERIFY = "EMAIL_VERIFY";
    public static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";
    public static final String PURPOSE_EMAIL_CHANGE_VERIFY = "EMAIL_CHANGE_VERIFY";

    /**
     * Check if token has expired
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if token is valid (not used and not expired)
     */
    public boolean isValid() {
        return !used && !isExpired();
    }
}
