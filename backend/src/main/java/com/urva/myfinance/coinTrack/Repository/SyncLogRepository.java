package com.urva.myfinance.coinTrack.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.Model.SyncLog;

@Repository
public interface SyncLogRepository extends MongoRepository<SyncLog, String> {
    List<SyncLog> findByUserId(String userId);

    List<SyncLog> findByUserIdOrderByTimestampDesc(String userId);
}
