package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RedemptionTransactionRepository extends MongoRepository<RedemptionTransaction, String> {
    List<RedemptionTransaction> findByUserId(String userId);

    List<RedemptionTransaction> findByUserIdAndSchemeId(String userId, String schemeId);

    List<RedemptionTransaction> findByUserIdAndSchemeIdAndRedemptionDateAfterOrderByRedemptionDateAsc(String userId,
            String schemeId,
            LocalDate date);

    List<RedemptionTransaction> findByUserIdAndSchemeIdAndRedemptionDateAfter(String userId, String schemeId,
            LocalDate date);

    List<RedemptionTransaction> findByUserIdAndRedemptionDateBetween(String userId, LocalDate startDate,
            LocalDate endDate);

    List<RedemptionTransaction> findByStatus(TransactionStatus status);
}
