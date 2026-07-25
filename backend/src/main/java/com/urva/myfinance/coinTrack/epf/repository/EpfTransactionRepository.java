package com.urva.myfinance.coinTrack.epf.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;

@Repository
public interface EpfTransactionRepository extends MongoRepository<EpfTransaction, String> {
    List<EpfTransaction> findByUserId(String userId, Sort sort);
    Optional<EpfTransaction> findByIdAndUserId(String id, String userId);
}
