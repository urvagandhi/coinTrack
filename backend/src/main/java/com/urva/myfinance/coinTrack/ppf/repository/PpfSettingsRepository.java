package com.urva.myfinance.coinTrack.ppf.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.ppf.model.PpfSettings;

@Repository
public interface PpfSettingsRepository extends MongoRepository<PpfSettings, String> {

    Optional<PpfSettings> findByUserId(String userId);
}
