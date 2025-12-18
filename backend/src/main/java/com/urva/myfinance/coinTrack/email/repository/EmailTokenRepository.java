package com.urva.myfinance.coinTrack.email.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.email.model.EmailToken;

/**
 * MongoDB repository for email tokens.
 *
 * Note: Expired tokens are automatically deleted by MongoDB TTL index,
 * so findByIdAndUsedFalse will not return expired tokens even if they
 * haven't been cleaned up yet (MongoDB runs TTL cleanup every 60 seconds).
 */
@Repository
public interface EmailTokenRepository extends MongoRepository<EmailToken, String> {

    /**
     * Find a token by ID that hasn't been used yet.
     * Used for token validation during verification.
     */
    Optional<EmailToken> findByIdAndUsedFalse(String id);

    /**
     * Find all unused tokens for a user.
     * Used for invalidation on sensitive account changes.
     */
    List<EmailToken> findAllByUserIdAndUsedFalse(String userId);

    /**
     * Find all tokens for a user (including used ones).
     * Used for audit/admin purposes.
     */
    List<EmailToken> findAllByUserId(String userId);

    /**
     * Delete all tokens for a user.
     * Used when invalidating all tokens on credential changes.
     */
    void deleteAllByUserId(String userId);

    /**
     * Find unused tokens by user and purpose.
     * Useful for checking if a verification is already pending.
     */
    List<EmailToken> findAllByUserIdAndPurposeAndUsedFalse(String userId, String purpose);
}
