package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.MfPortfolioMetrics;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MfPortfolioMetricsRepository extends MongoRepository<MfPortfolioMetrics, String> {
  Optional<MfPortfolioMetrics> findByUserId(String userId);

  void deleteByUserId(String userId);
}
