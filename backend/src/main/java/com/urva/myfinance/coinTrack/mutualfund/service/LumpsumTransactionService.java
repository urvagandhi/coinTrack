package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.config.StatutoryChargesConfig;
import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.mutualfund.util.MfRoundingHelper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class LumpsumTransactionService {

    @Autowired
    private LumpsumTransactionRepository repository;
    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private SequenceGeneratorService sequenceGeneratorService;
    @Autowired
    private TransactionSequenceService transactionSequenceService;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;
    @Autowired
    private MfNavService mfNavService;
    @Autowired
    private StatutoryChargesConfig mfChargesConfig;
    @Autowired
    private SettlementDateCalculator settlementDateCalculator;
    @Autowired
    @org.springframework.context.annotation.Lazy
    private RedemptionTransactionService redemptionTransactionService;


    private void validateSchemeOwnership(String userId, String schemeId) {
        schemeRepository.findById(schemeId)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException(
                        "Scheme not found or does not belong to this user: " + schemeId));
    }

    public List<LumpsumTransaction> getTransactions(String userId, String schemeId) {
        if (schemeId == null || schemeId.isEmpty()) {
            return repository.findByUserId(userId);
        }
        return repository.findByUserIdAndSchemeId(userId, schemeId);
    }

    public LumpsumTransaction getTransaction(String userId, String id) {
        return repository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    public List<LumpsumTransaction> getTransactionsByDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        return repository.findByUserIdAndInvestmentDateBetween(userId, startDate, endDate);
    }

    public List<LumpsumTransaction> getTransactionsByFinancialYear(String userId, int startYear) {
        LocalDate startDate = LocalDate.of(startYear, 4, 1);
        LocalDate endDate = LocalDate.of(startYear + 1, 3, 31);
        return repository.findByUserIdAndInvestmentDateBetween(userId, startDate, endDate);
    }

    public Page<LumpsumTransaction> getPaginatedTransactions(String userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }

    public LumpsumTransaction createTransaction(String userId, LumpsumTransaction transaction) {
        validateSchemeOwnership(userId, transaction.getSchemeId());
        transaction.setUserId(userId);
        transaction.setTransactionNo(0L);
        transaction.setCreatedAt(Instant.now());
        transaction.setUpdatedAt(Instant.now());
        transaction.setStatus(TransactionStatus.PENDING_NAV); // default until proven COMPLETED
        transaction.setRetryCount(0);

        LocalDate applicableDate = settlementDateCalculator.calculateApplicableDate(transaction.getInvestmentDate(),
                transaction.getIsAfterCutoff());
        transaction.setApplicableDate(applicableDate);

        schemeRepository.findById(transaction.getSchemeId()).ifPresent(scheme -> {
            transaction.setSettlementDate(
                    settlementDateCalculator.calculateSettlementDate(applicableDate, scheme.getSettlementType()));

            if (transaction.getDebitedBank() == null || transaction.getDebitedBank().trim().isEmpty()) {
                transaction.setDebitedBank(scheme.getBank());
            }

            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                // Pre-deduct stamp duty
                if (transaction.getLumpsumInvestment() != null) {
                    BigDecimal stampDutyRate = mfChargesConfig.getMfStampDutyForDate(applicableDate);
                    BigDecimal stampDutyAmount = transaction.getLumpsumInvestment()
                            .multiply(stampDutyRate)
                            .divide(new BigDecimal("100"), MfRoundingHelper.FIAT_PRECISION, RoundingMode.HALF_UP);

                    transaction.setStampDutyRate(stampDutyRate);
                    transaction.setStampDuty(stampDutyAmount);
                    // Do not overwrite the gross amount
                }

                if (transaction.getNavPrice() != null && transaction.getTotalUnit() != null) {
                    transaction.setStatus(TransactionStatus.COMPLETED);
                } else {
                    // Try fetching NAV
                    BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
                    if (nav != null) {
                        transaction.setNavPrice(nav);
                        transaction.setStatus(TransactionStatus.COMPLETED);
                        if (transaction.getLumpsumInvestment() != null) {
                            BigDecimal netInvestment = transaction.getLumpsumInvestment().subtract(
                                    transaction.getStampDuty() != null ? transaction.getStampDuty() : BigDecimal.ZERO);
                            BigDecimal units = netInvestment.divide(nav, MfRoundingHelper.UNIT_PRECISION,
                                    RoundingMode.HALF_UP);
                            transaction.setTotalUnit(units);
                        }
                    } else {
                        transaction.setNavPrice(null);
                        transaction.setTotalUnit(null);
                    }
                }
            } else {
                if (transaction.getNavPrice() != null && transaction.getTotalUnit() != null) {
                    transaction.setStatus(TransactionStatus.COMPLETED);
                } else {
                    transaction.setStatus(TransactionStatus.NAV_UNAVAILABLE);
                }
            }
        });

        LumpsumTransaction saved = repository.save(transaction);
        if (saved.getStatus() == TransactionStatus.COMPLETED) {
            portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
            redemptionTransactionService.recalculateRedemptionsAfterDate(userId, saved.getSchemeId(), saved.getInvestmentDate());
        }
        transactionSequenceService.reorderLumpsumTransactions(userId);
        return saved;
    }

    public LumpsumTransaction updateTransaction(String userId, String id, LumpsumTransaction transaction) {
        LumpsumTransaction existing = getTransaction(userId, id);
        String oldSchemeId = existing.getSchemeId();
        LocalDate oldDate = existing.getInvestmentDate();

        if (transaction.getSchemeId() != null && !transaction.getSchemeId().equals(oldSchemeId)) {
            validateSchemeOwnership(userId, transaction.getSchemeId());
            existing.setSchemeId(transaction.getSchemeId());
        }

        existing.setInvestmentDate(transaction.getInvestmentDate());
        existing.setLumpsumInvestment(transaction.getLumpsumInvestment());
        existing.setDebitedBank(transaction.getDebitedBank());
        existing.setRemarks(transaction.getRemarks());
        existing.setIsAfterCutoff(transaction.getIsAfterCutoff());
        existing.setUpdatedAt(Instant.now());
        existing.setStatus(TransactionStatus.PENDING_NAV);

        LocalDate applicableDate = settlementDateCalculator.calculateApplicableDate(transaction.getInvestmentDate(),
                transaction.getIsAfterCutoff());
        existing.setApplicableDate(applicableDate);

        schemeRepository.findById(existing.getSchemeId()).ifPresent(scheme -> {
            existing.setSettlementDate(
                    settlementDateCalculator.calculateSettlementDate(applicableDate, scheme.getSettlementType()));

            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                // Force recalculation of net amount and stamp duty on every update
                if (existing.getLumpsumInvestment() != null) {
                    BigDecimal stampDutyRate = mfChargesConfig.getMfStampDutyForDate(applicableDate);
                    BigDecimal stampDutyAmount = existing.getLumpsumInvestment()
                            .multiply(stampDutyRate)
                            .divide(new BigDecimal("100"), MfRoundingHelper.FIAT_PRECISION, RoundingMode.HALF_UP);

                    existing.setStampDutyRate(stampDutyRate);
                    existing.setStampDuty(stampDutyAmount);
                    // Do not overwrite the gross amount
                }

                if (transaction.getNavPrice() != null && transaction.getTotalUnit() != null) {
                    existing.setNavPrice(transaction.getNavPrice());
                    existing.setTotalUnit(transaction.getTotalUnit());
                    existing.setStatus(TransactionStatus.COMPLETED);
                } else {
                    BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
                    if (nav != null) {
                        existing.setNavPrice(nav);
                        existing.setStatus(TransactionStatus.COMPLETED);
                        if (existing.getLumpsumInvestment() != null) {
                            BigDecimal netInvestment = existing.getLumpsumInvestment()
                                    .subtract(existing.getStampDuty() != null ? existing.getStampDuty() : BigDecimal.ZERO);
                            BigDecimal units = netInvestment.divide(nav, MfRoundingHelper.UNIT_PRECISION,
                                    RoundingMode.HALF_UP);
                            existing.setTotalUnit(units);
                        }
                    } else {
                        existing.setNavPrice(null);
                        existing.setTotalUnit(null);
                    }
                }
            } else {
                if (transaction.getNavPrice() != null && transaction.getTotalUnit() != null) {
                    existing.setNavPrice(transaction.getNavPrice());
                    existing.setTotalUnit(transaction.getTotalUnit());
                    existing.setStatus(TransactionStatus.COMPLETED);
                } else {
                    existing.setNavPrice(null);
                    existing.setTotalUnit(null);
                    existing.setLumpsumInvestment(transaction.getLumpsumInvestment()); // fallback
                    existing.setStatus(TransactionStatus.NAV_UNAVAILABLE);
                }
            }
        });

        LumpsumTransaction saved = repository.save(existing);

        // Update holding for new scheme
        if (saved.getStatus() == TransactionStatus.COMPLETED) {
            portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
        }
        // If scheme changed, also update the holding of the old scheme
        if (!oldSchemeId.equals(saved.getSchemeId())) {
            portfolioHoldingService.updateHoldingForScheme(userId, oldSchemeId);
            redemptionTransactionService.recalculateRedemptionsAfterDate(userId, oldSchemeId, oldDate);
            if (saved.getStatus() == TransactionStatus.COMPLETED) {
                redemptionTransactionService.recalculateRedemptionsAfterDate(userId, saved.getSchemeId(), saved.getInvestmentDate());
            }
        } else {
            if (saved.getStatus() == TransactionStatus.COMPLETED) {
                LocalDate earliestDate = oldDate.isBefore(saved.getInvestmentDate()) ? oldDate : saved.getInvestmentDate();
                redemptionTransactionService.recalculateRedemptionsAfterDate(userId, saved.getSchemeId(), earliestDate);
            }
        }

        transactionSequenceService.reorderLumpsumTransactions(userId);
        return saved;
    }

    public void deleteTransaction(String userId, String id) {
        LumpsumTransaction existing = getTransaction(userId, id);
        repository.delete(existing);
        portfolioHoldingService.updateHoldingForScheme(userId, existing.getSchemeId());
        if (existing.getStatus() == TransactionStatus.COMPLETED) {
            redemptionTransactionService.recalculateRedemptionsAfterDate(userId, existing.getSchemeId(), existing.getInvestmentDate());
        }
        transactionSequenceService.reorderLumpsumTransactions(userId);
    }
}
