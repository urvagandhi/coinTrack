package com.urva.myfinance.coinTrack.user.model;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pending registration stored in MongoDB with TTL auto-cleanup.
 * Replaces the in-memory HashMap that was lost on server restart
 * and broke horizontal scaling.
 */
@Document(collection = "pending_registrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistration {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tempToken;

    private String username;
    private String email;
    private String phoneNumber;
    private String name;
    private String passwordHash;
    private String totpSecretEncrypted;

    @Indexed(unique = true, sparse = true)
    private String googleId;

    private AuthProvider authProvider;
    
    @CreatedDate
    private Instant createdAt;

    /** MongoDB TTL index field — document auto-deleted when this time passes. */
    @Indexed(expireAfter = "0s")
    private Instant expiresAt;
}
