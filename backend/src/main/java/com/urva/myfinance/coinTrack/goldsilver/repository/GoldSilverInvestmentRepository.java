package com.urva.myfinance.coinTrack.goldsilver.repository;

import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GoldSilverInvestmentRepository
    extends MongoRepository<GoldSilverInvestment, String> {

  Optional<GoldSilverInvestment> findByIdAndUserId(String id, String userId);

  List<GoldSilverInvestment> findByUserId(String userId);

  List<GoldSilverInvestment> findByStatusNot(GsStatus status);

  void deleteByUserId(String userId);
}
