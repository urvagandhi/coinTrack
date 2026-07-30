package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class RedemptionTransactionService {

    @Autowired
    private RedemptionTransactionRepository repository;
    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private SequenceGeneratorService sequenceGeneratorService;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;
    @Autowired
    private MfNavService mfNavService;

    /**
     * Validates that the schemeId belongs to the given userId.
     * Enforces §4 rule 1: every redemption must reference a real, user-owned
     * MfScheme.
     */
    private void validateSchemeOwnership(String userId, String schemeId) {
        schemeRepository.findById(schemeId)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException(
                        "Scheme not found or does not belong to this user: " + schemeId));
    }

    public List<RedemptionTransaction> getTransactions(String userId, String schemeId) {
        if (schemeId == null || schemeId.isEmpty()) {
            return repository.findByUserId(userId);
        }
        return repository.findByUserIdAndSchemeId(userId, schemeId);
    }

    public RedemptionTransaction getTransaction(String userId, String id) {
        return repository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    public List<RedemptionTransaction> getTransactionsByDateRange(String userId, LocalDate startDate,
            LocalDate endDate) {
        return repository.findByUserIdAndRedemptionDateBetween(userId, startDate, endDate);
    }

    public List<RedemptionTransaction> getTransactionsByFinancialYear(String userId, int startYear) {
        LocalDate startDate = LocalDate.of(startYear, 4, 1);
        LocalDate endDate = LocalDate.of(startYear + 1, 3, 31);
        return repository.findByUserIdAndRedemptionDateBetween(userId, startDate, endDate);
    }

    @Autowired
    private MfFifoEngine fifoEngine;

    public RedemptionTransaction createTransaction(String userId, RedemptionTransaction transaction) {
        validateSchemeOwnership(userId, transaction.getSchemeId());
        transaction.setUserId(userId);
        transaction.setTransactionNo(
                sequenceGeneratorService.getNextSequence(RedemptionTransaction.class.getSimpleName()));

        schemeRepository.findById(transaction.getSchemeId()).ifPresent(scheme -> {
            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), transaction.getRedemptionDate());
                if (nav != null) {
                    transaction.setRedemptionNav(nav);
                    if (transaction.getRedemptionUnit() == null && transaction.getRedemptionValue() != null) {
                        BigDecimal units = transaction.getRedemptionValue().divide(nav, 3,
                                java.math.RoundingMode.HALF_UP);
                        transaction.setRedemptionUnit(units);
                    }
                }
            }
        });

        MfFifoEngine.FifoResult fifoResult = fifoEngine.calculateRedemptionCost(userId, transaction.getSchemeId(),
                transaction.getRedemptionDate(), transaction.getRedemptionUnit());
        transaction.setTradeInvestmentValue(fifoResult.totalCostValue);

        if (transaction.getRedemptionValue() != null) {
            transaction
                    .setCapitalGain(transaction.getRedemptionValue().subtract(transaction.getTradeInvestmentValue()));
        }

        if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
            transaction.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.LTCG);
        } else if (fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                && fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
            transaction.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG);
        } else if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0) {
            transaction.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG_LTCG); // Based on
                                                                                                       // recent fixes
                                                                                                       // the user made
        }

        transaction.setCreatedAt(Instant.now());
        RedemptionTransaction saved = repository.save(transaction);
        portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
        return saved;
    }

    public RedemptionTransaction updateTransaction(String userId, String id, RedemptionTransaction updatedTransaction) {
        RedemptionTransaction existing = repository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        existing.setRedemptionDate(updatedTransaction.getRedemptionDate());
        existing.setRedemptionUnit(updatedTransaction.getRedemptionUnit());
        existing.setTotalUnit(updatedTransaction.getTotalUnit());
        existing.setBalanceUnit(updatedTransaction.getBalanceUnit());
        existing.setTotalInvestment(updatedTransaction.getTotalInvestment());
        existing.setBalanceInvestment(updatedTransaction.getBalanceInvestment());
        existing.setTradeInvestmentValue(updatedTransaction.getTradeInvestmentValue());
        existing.setRedemptionValue(updatedTransaction.getRedemptionValue());
        // Always recompute; fall back to explicit value only if inputs are missing
        if (updatedTransaction.getRedemptionValue() != null && updatedTransaction.getTradeInvestmentValue() != null) {
            existing.setCapitalGain(
                    updatedTransaction.getRedemptionValue().subtract(updatedTransaction.getTradeInvestmentValue()));
        } else {
            existing.setCapitalGain(updatedTransaction.getCapitalGain());
        }
        existing.setGainType(updatedTransaction.getGainType());
        existing.setRedemptionNav(updatedTransaction.getRedemptionNav());
        existing.setAmountCreditedBank(updatedTransaction.getAmountCreditedBank());
        RedemptionTransaction saved = repository.save(existing);
        portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
        return saved;
    }

    public void deleteTransaction(String userId, String id) {
        RedemptionTransaction existing = repository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        repository.delete(existing);
        portfolioHoldingService.updateHoldingForScheme(userId, existing.getSchemeId());
    }
}
