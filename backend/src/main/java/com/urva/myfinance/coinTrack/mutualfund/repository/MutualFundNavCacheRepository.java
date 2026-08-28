package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.MutualFundNavCache;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MutualFundNavCacheRepository extends MongoRepository<MutualFundNavCache, String> {
  Optional<MutualFundNavCache> findBySchemeCodeAndNavDate(String schemeCode, LocalDate navDate);
}
