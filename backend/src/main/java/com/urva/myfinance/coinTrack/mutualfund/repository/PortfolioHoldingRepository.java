package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.PortfolioHolding;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PortfolioHoldingRepository extends MongoRepository<PortfolioHolding, String> {
  List<PortfolioHolding> findByUserId(String userId);

  Optional<PortfolioHolding> findByUserIdAndSchemeId(String userId, String schemeId);

  void deleteByUserId(String userId);
}
