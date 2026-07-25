package com.urva.myfinance.coinTrack.epf.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.epf.model.EpfInterestRate;

@Repository
public interface EpfInterestRateRepository extends MongoRepository<EpfInterestRate, String> {
    Optional<EpfInterestRate> findByFinancialYear(String financialYear);
}
