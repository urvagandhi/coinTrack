package com.urva.myfinance.coinTrack.goldsilver.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;

@Repository
public interface GoldSilverInvestmentRepository extends MongoRepository<GoldSilverInvestment, String> {

    Optional<GoldSilverInvestment> findByIdAndUserId(String id, String userId);

    List<GoldSilverInvestment> findByUserId(String userId);

    List<GoldSilverInvestment> findByStatusNot(GsStatus status);
}
