package com.urva.myfinance.coinTrack.epf.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.epf.model.EpfSettings;

@Repository
public interface EpfSettingsRepository extends MongoRepository<EpfSettings, String> {
    Optional<EpfSettings> findByUserId(String userId);
}
