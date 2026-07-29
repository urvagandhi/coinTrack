package com.urva.myfinance.coinTrack.mutualfund.repository;

import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SipContributionRepository extends MongoRepository<SipContribution, String> {
    List<SipContribution> findByUserId(String userId);

    List<SipContribution> findByUserIdAndSchemeId(String userId, String schemeId);

    List<SipContribution> findByUserIdAndSipMandateId(String userId, String sipMandateId);

    List<SipContribution> findByUserIdAndContributionDateBetween(String userId, LocalDate startDate, LocalDate endDate);
    boolean existsBySipMandateIdAndContributionDateBetween(String sipMandateId, LocalDate startDate, LocalDate endDate);

    void deleteBySipMandateIdAndContributionDateAfter(String sipMandateId, LocalDate date);
}
