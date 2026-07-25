package com.urva.myfinance.coinTrack.ppf.service;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.exception.InsufficientPpfBalanceException;
import com.urva.myfinance.coinTrack.ppf.model.PpfTransaction;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;

@Service
public class PpfBalanceRecalculationService {

    private static final Logger logger = LoggerFactory.getLogger(PpfBalanceRecalculationService.class);

    private final PpfTransactionRepository ppfTransactionRepository;

    @Autowired
    public PpfBalanceRecalculationService(PpfTransactionRepository ppfTransactionRepository) {
        this.ppfTransactionRepository = ppfTransactionRepository;
    }

    /**
     * Recalculates the entire ledger for a given user.
     * Must be called within a MongoDB transaction context or be annotated with @Transactional.
     */
    @Transactional
    public void recalculateLedger(String userId) {
        logger.debug("Recalculating PPF ledger for user: {}", userId);

        Sort sort = Sort.by(Sort.Direction.ASC, "transactionDate")
                .and(Sort.by(Sort.Direction.ASC, "createdAt"));

        List<PpfTransaction> sortedTransactions = ppfTransactionRepository.findByUserId(userId, sort);

        BigDecimal runningBalance = BigDecimal.ZERO;
        boolean balanceChanged = false;

        for (PpfTransaction txn : sortedTransactions) {
            if (txn.getCreditAmount() != null) {
                runningBalance = runningBalance.add(txn.getCreditAmount());
            } else if (txn.getDebitAmount() != null) {
                runningBalance = runningBalance.subtract(txn.getDebitAmount());
            }

            if (runningBalance.compareTo(BigDecimal.ZERO) < 0) {
                throw new InsufficientPpfBalanceException(
                        "Transaction on " + txn.getTransactionDate() + " results in a negative balance: " + runningBalance);
            }

            if (txn.getBalance() == null || txn.getBalance().compareTo(runningBalance) != 0) {
                txn.setBalance(runningBalance);
                balanceChanged = true;
            }
        }

        if (balanceChanged) {
            ppfTransactionRepository.saveAll(sortedTransactions);
            logger.debug("Successfully recalculated and saved PPF ledger for user: {}", userId);
        } else {
            logger.debug("No balance changes detected during recalculation for user: {}", userId);
        }
    }
}
