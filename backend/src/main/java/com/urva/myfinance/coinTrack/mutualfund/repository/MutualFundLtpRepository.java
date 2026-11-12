package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.MutualFundLtp;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MutualFundLtpRepository extends MongoRepository<MutualFundLtp, String> {
  Optional<MutualFundLtp> findByIsinGrowth(String isinGrowth);
  Optional<MutualFundLtp> findByIsinDiv(String isinDiv);
}
