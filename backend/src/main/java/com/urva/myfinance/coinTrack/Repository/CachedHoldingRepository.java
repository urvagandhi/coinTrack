package com.urva.myfinance.coinTrack.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.Model.CachedHolding;

@Repository
public interface CachedHoldingRepository extends MongoRepository<CachedHolding, String> {
    List<CachedHolding> findByUserId(String userId);

    Optional<CachedHolding> findByUserIdAndSymbol(String userId, String symbol);
}
