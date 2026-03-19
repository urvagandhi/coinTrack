package com.urva.myfinance.coinTrack.security.model;

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
 * JWT blacklist entry for logout invalidation.
 * TTL index on expiresAt ensures the collection never grows unbounded —
 * MongoDB auto-deletes entries when the JWT would have expired anyway.
 */
@Document(collection = "invalidated_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvalidatedToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tokenHash;

    private String userId;

    @CreatedDate
    private Instant invalidatedAt;

    /** Set to the JWT's exp claim — MongoDB TTL deletes after this. */
    @Indexed(expireAfter = "0s")
    private Instant expiresAt;
}
