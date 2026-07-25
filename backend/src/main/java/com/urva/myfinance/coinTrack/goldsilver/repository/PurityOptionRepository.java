package com.urva.myfinance.coinTrack.goldsilver.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.PurityOption;

public interface PurityOptionRepository extends MongoRepository<PurityOption, String> {
    List<PurityOption> findByMetalType(MetalType metalType);
    Optional<PurityOption> findByLabelIgnoreCase(String label);
    boolean existsByLabelIgnoreCaseAndMetalType(String label, MetalType metalType);
}
