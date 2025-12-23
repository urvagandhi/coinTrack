package com.urva.myfinance.coinTrack.user.model;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Refresh token for session continuity.
 * Only the SHA-256 hash is stored — the plaintext token is returned to the
 * client once and never persisted on the server.
 *
 * TTL index on expiresAt auto-deletes expired tokens (30 days).
 */
@Document(collection = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed(unique = true)
    private String tokenHash;

    private String deviceInfo;
    private String ipAddress;

    @CreatedDate
    private Instant createdAt;

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    private Instant lastUsedAt;

    @Builder.Default
    private boolean revoked = false;
}
