package com.urva.myfinance.coinTrack.portfolio.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;

@Repository
public interface SyncLogRepository extends MongoRepository<SyncLog, String> {
    List<SyncLog> findByUserId(String userId);

    List<SyncLog> findByUserIdOrderByTimestampDesc(String userId);

    java.util.Optional<SyncLog> findFirstByUserIdAndStatusOrderByTimestampDesc(String userId,
            com.urva.myfinance.coinTrack.portfolio.model.SyncStatus status);
}
