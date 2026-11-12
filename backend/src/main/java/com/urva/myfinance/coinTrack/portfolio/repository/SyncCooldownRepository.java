package com.urva.myfinance.coinTrack.portfolio.repository;

import com.urva.myfinance.coinTrack.portfolio.model.SyncCooldown;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SyncCooldownRepository extends MongoRepository<SyncCooldown, String> {

  boolean existsByUserId(String userId);

  Optional<SyncCooldown> findByUserId(String userId);

  void deleteByUserId(String userId);
}
