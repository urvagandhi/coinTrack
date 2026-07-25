package com.urva.myfinance.coinTrack.epf.service;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.exception.InsufficientEpfBalanceException;
import com.urva.myfinance.coinTrack.epf.model.EpfTransaction;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;

@Service
public class EpfBalanceRecalculationService {

    private static final Logger logger = LoggerFactory.getLogger(EpfBalanceRecalculationService.class);

    private final EpfTransactionRepository epfTransactionRepository;

    @Autowired
    public EpfBalanceRecalculationService(EpfTransactionRepository epfTransactionRepository) {
        this.epfTransactionRepository = epfTransactionRepository;
    }

    /**
     * Recalculates the dual running balances (EPF and EPS) for a given user.
     * Must be called within a MongoDB transaction context or be annotated with @Transactional.
     */
    @Transactional
    public void recalculateLedger(String userId) {
        logger.debug("Recalculating EPF/EPS ledger for user: {}", userId);

        Sort sort = Sort.by(Sort.Direction.ASC, "transactionDate")
                .and(Sort.by(Sort.Direction.ASC, "createdAt"));

        List<EpfTransaction> sortedTransactions = epfTransactionRepository.findByUserId(userId, sort);

        BigDecimal runningEpfBalance = BigDecimal.ZERO;
        BigDecimal runningEpsBalance = BigDecimal.ZERO;
        boolean balanceChanged = false;

        for (EpfTransaction txn : sortedTransactions) {
            BigDecimal empContr = txn.getEmployeeContribution() != null ? txn.getEmployeeContribution() : BigDecimal.ZERO;
            BigDecimal emprEpfContr = txn.getEmployerEpfContribution() != null ? txn.getEmployerEpfContribution() : BigDecimal.ZERO;
            BigDecimal vpf = txn.getVpfAmount() != null ? txn.getVpfAmount() : BigDecimal.ZERO;
            BigDecimal withdrawal = txn.getWithdrawalAmount() != null ? txn.getWithdrawalAmount() : BigDecimal.ZERO;
            BigDecimal emprEpsContr = txn.getEmployerEpsContribution() != null ? txn.getEmployerEpsContribution() : BigDecimal.ZERO;

            runningEpfBalance = runningEpfBalance.add(empContr).add(emprEpfContr).add(vpf).subtract(withdrawal);
            runningEpsBalance = runningEpsBalance.add(emprEpsContr);

            if (runningEpfBalance.compareTo(BigDecimal.ZERO) < 0) {
                throw new InsufficientEpfBalanceException(
                        "Transaction on " + txn.getTransactionDate() + " results in a negative EPF balance: " + runningEpfBalance);
            }
            if (runningEpsBalance.compareTo(BigDecimal.ZERO) < 0) {
                throw new InsufficientEpfBalanceException(
                        "Transaction on " + txn.getTransactionDate() + " results in a negative EPS balance: " + runningEpsBalance);
            }

            boolean epfChanged = txn.getEpfBalance() == null || txn.getEpfBalance().compareTo(runningEpfBalance) != 0;
            boolean epsChanged = txn.getEpsBalance() == null || txn.getEpsBalance().compareTo(runningEpsBalance) != 0;

            if (epfChanged || epsChanged) {
                txn.setEpfBalance(runningEpfBalance);
                txn.setEpsBalance(runningEpsBalance);
                balanceChanged = true;
            }
        }

        if (balanceChanged) {
            epfTransactionRepository.saveAll(sortedTransactions);
            logger.debug("Successfully recalculated and saved EPF/EPS ledger for user: {}", userId);
        } else {
            logger.debug("No balance changes detected during recalculation for user: {}", userId);
        }
    }
}
