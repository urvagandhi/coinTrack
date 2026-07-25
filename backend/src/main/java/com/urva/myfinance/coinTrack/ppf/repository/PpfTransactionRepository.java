package com.urva.myfinance.coinTrack.ppf.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;

@Repository
public interface PpfTransactionRepository extends MongoRepository<PpfTransaction, String> {

    Optional<PpfTransaction> findByIdAndUserId(String id, String userId);

    List<PpfTransaction> findByUserId(String userId, Sort sort);
}
