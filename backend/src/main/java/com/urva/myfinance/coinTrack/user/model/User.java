package com.urva.myfinance.coinTrack.user.model;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User entity stored in MongoDB.
 * Changed: Added passwordFailedAttempts + passwordLockedUntil for login rate limiting.
 */
@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;
    @Indexed(unique = true)
    private String username;
    private String name;
    private LocalDate dateOfBirth;
    private String email;
    private String phoneNumber;
    private String bio;
    private String location;
    @JsonIgnore
    private String password;

    @CreatedDate
    private LocalDate createdAt;

    @LastModifiedDate
    private LocalDate updatedAt;

    // ── Password rate limiting ──────────────────────────────────────
    @Builder.Default
    private int passwordFailedAttempts = 0;

    private Instant passwordLockedUntil;

    // ── TOTP 2FA Fields ─────────────────────────────────────────────
    @Builder.Default
    private boolean totpEnabled = false;

    @Builder.Default
    private boolean totpVerified = false;

    @JsonIgnore
    private String totpSecretEncrypted;

    @JsonIgnore
    private String totpSecretPending;

    @Builder.Default
    private int totpSecretVersion = 1;

    private LocalDateTime totpSetupAt;
    private LocalDateTime totpLastUsedAt;

    @Builder.Default
    private int totpFailedAttempts = 0;

    private LocalDateTime totpLockedUntil;

    // ── Email Verification ──────────────────────────────────────────
    @Builder.Default
    private boolean emailVerified = false;

    private LocalDateTime emailVerifiedAt;

    private String pendingEmail;

    // ── OAuth 2.0 / SSO ─────────────────────────────────────────────
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @JsonIgnore
    private String googleId;

    // ── Embedded Settings (replaces 3 separate collections) ─────────

    /**
     * User's EPF configuration — embedded to avoid a separate epf_settings collection.
     * Null until the user sets up their EPF for the first time.
     */
    private EpfSettingsEmbed epfSettings;

    /**
     * User's PPF account info — embedded to avoid a separate ppf_settings collection.
     * Null until the user sets up their PPF for the first time.
     */
    private PpfSettingsEmbed ppfSettings;

    /**
     * User's local gold/silver premium config — embedded to avoid a separate
     * metal_rate_settings collection. Null until the user customizes rates.
     */
    private MetalRateSettingsEmbed metalRateSettings;
}
