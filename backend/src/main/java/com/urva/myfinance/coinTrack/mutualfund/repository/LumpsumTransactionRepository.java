package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LumpsumTransactionRepository extends MongoRepository<LumpsumTransaction, String> {
    List<LumpsumTransaction> findByUserId(String userId);

    List<LumpsumTransaction> findByUserIdAndSchemeId(String userId, String schemeId);

    List<LumpsumTransaction> findByUserIdAndInvestmentDateBetween(String userId, LocalDate startDate, LocalDate endDate);
    
    Page<LumpsumTransaction> findByUserId(String userId, Pageable pageable);
}
