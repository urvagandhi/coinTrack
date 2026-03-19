package com.urva.myfinance.coinTrack.portfolio.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.portfolio.model.SyncCooldown;

@Repository
public interface SyncCooldownRepository extends MongoRepository<SyncCooldown, String> {

    boolean existsByUserId(String userId);

    Optional<SyncCooldown> findByUserId(String userId);

    void deleteByUserId(String userId);
}
