package com.urva.myfinance.coinTrack.user.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.user.model.BackupCode;

/**
 * Repository for managing TOTP backup codes.
 * Backup codes are tied to a user and a specific TOTP secret version
 * (generation).
 */
@Repository
public interface BackupCodeRepository extends MongoRepository<BackupCode, String> {

    /**
     * Find all unused backup codes for a user.
     * Note: Caller must also check that code.generation matches
     * user.totpSecretVersion
     */
    List<BackupCode> findByUserIdAndUsedFalse(String userId);

    /**
     * Find all backup codes for a user (used and unused).
     */
    List<BackupCode> findByUserId(String userId);

    /**
     * Delete all backup codes for a user.
     * Used during cleanup or when user is deleted.
     */
    void deleteByUserId(String userId);
}
