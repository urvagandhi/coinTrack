package com.urva.myfinance.coinTrack.user.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String password;

    @CreatedDate
    private LocalDate createdAt;

    @LastModifiedDate
    private LocalDate updatedAt;

    // TOTP 2FA Fields
    @Builder.Default
    private boolean totpEnabled = false;

    @Builder.Default
    private boolean totpVerified = false;

    private String totpSecretEncrypted;

    private String totpSecretPending; // Staged secret waiting for verification

    @Builder.Default
    private int totpSecretVersion = 1; // Default version 1

    private LocalDateTime totpSetupAt;
    private LocalDateTime totpLastUsedAt;

    @Builder.Default
    private int totpFailedAttempts = 0;

    private LocalDateTime totpLockedUntil;

    // Email Verification Fields
    @Builder.Default
    private boolean emailVerified = false;

    private LocalDateTime emailVerifiedAt;

    /**
     * Pending email address for email change flow.
     * Set when user requests email change, cleared after verification.
     */
    private String pendingEmail;
}
