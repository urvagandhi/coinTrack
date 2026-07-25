package com.urva.myfinance.coinTrack.goldsilver.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalRateSnapshot;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

public interface MetalRateSnapshotRepository extends MongoRepository<MetalRateSnapshot, String> {
    Optional<MetalRateSnapshot> findFirstByMetalTypeOrderByFetchedAtDesc(MetalType metalType);
    List<MetalRateSnapshot> findTop10ByMetalTypeOrderByFetchedAtDesc(MetalType metalType);
}
