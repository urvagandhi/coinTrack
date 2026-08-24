package com.urva.myfinance.coinTrack.user.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.user.model.UserDeletionAudit;

/**
 * Append-only store for account-deletion audit trails.
 * Rows are written before the User document is destroyed and are never
 * exposed through any controller — compliance/investigation access only.
 */
@Repository
public interface UserDeletionAuditRepository extends MongoRepository<UserDeletionAudit, String> {

    List<UserDeletionAudit> findByUserIdOrderByDeletionRequestedAtDesc(String userId);
}
