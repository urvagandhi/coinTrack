package com.urva.myfinance.coinTrack.user.repository;

import com.urva.myfinance.coinTrack.user.model.BackupCode;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for managing TOTP backup codes. Backup codes are tied to a user and a specific TOTP
 * secret version (generation).
 */
@Repository
public interface BackupCodeRepository extends MongoRepository<BackupCode, String> {

  /**
   * Find all unused backup codes for a user. Note: Caller must also check that code.generation
   * matches user.totpSecretVersion
   */
  List<BackupCode> findByUserIdAndUsedFalse(String userId);

  /** Find all backup codes for a user (used and unused). */
  List<BackupCode> findByUserId(String userId);

  /** Delete all backup codes for a user. Used during cleanup or when user is deleted. */
  void deleteByUserId(String userId);

  /**
   * Delete every code of a specific generation (used and unused). Called during secret rotation so
   * the previous version's codes are fully removed instead of lingering as inert rows.
   */
  void deleteByUserIdAndGeneration(String userId, int generation);
}
