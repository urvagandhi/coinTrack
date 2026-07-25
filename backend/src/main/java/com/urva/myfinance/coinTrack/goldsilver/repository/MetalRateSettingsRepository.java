package com.urva.myfinance.coinTrack.goldsilver.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSettings;

public interface MetalRateSettingsRepository extends MongoRepository<MetalRateSettings, String> {
    Optional<MetalRateSettings> findByUserId(String userId);
}
