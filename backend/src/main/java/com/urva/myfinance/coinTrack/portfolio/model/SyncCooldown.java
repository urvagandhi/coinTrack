package com.urva.myfinance.coinTrack.portfolio.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MongoDB-backed cooldown for manual portfolio sync.
 * TTL index on expiresAt — MongoDB auto-deletes after 5 minutes.
 * Replaces in-memory ConcurrentHashMap that was lost on restart
 * and bypassed by horizontal scaling.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "sync_cooldowns")
public class SyncCooldown {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private Instant lastManualSyncAt;

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;
}
