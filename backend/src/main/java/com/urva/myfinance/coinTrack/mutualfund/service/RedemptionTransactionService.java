package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.TransactionStatus;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.common.service.SequenceGeneratorService;
import com.urva.myfinance.coinTrack.common.service.TransactionSequenceService;
import com.urva.myfinance.coinTrack.mutualfund.config.MfChargesConfig;
import com.urva.myfinance.coinTrack.mutualfund.util.MfCategoryHelper;
import com.urva.myfinance.coinTrack.mutualfund.service.settlement.SettlementDateCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.mutualfund.util.MfRoundingHelper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class RedemptionTransactionService {

    private static final Logger logger = LoggerFactory.getLogger(RedemptionTransactionService.class);

    @Autowired
    private RedemptionTransactionRepository repository;
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
    private MfChargesConfig mfChargesConfig;
    @Autowired
    private MfFifoEngine fifoEngine;
    @Autowired
    private SettlementDateCalculator settlementDateCalculator;
    @Autowired
    private SipContributionRepository sipRepository;
    @Autowired
    private LumpsumTransactionRepository lumpsumRepository;

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

    public RedemptionTransaction createTransaction(String userId, RedemptionTransaction transaction) {
        validateSchemeOwnership(userId, transaction.getSchemeId());
        transaction.setUserId(userId);
        transaction.setTransactionNo(0L);
        transaction.setCreatedAt(Instant.now());
        transaction.setStatus(TransactionStatus.PENDING_NAV);
        transaction.setRetryCount(0);

        LocalDate applicableDate = settlementDateCalculator.calculateApplicableDate(transaction.getRedemptionDate(),
                transaction.getIsAfterCutoff());
        transaction.setApplicableDate(applicableDate);

        schemeRepository.findById(transaction.getSchemeId()).ifPresent(scheme -> {
            transaction.setSettlementDate(
                    settlementDateCalculator.calculateSettlementDate(applicableDate, scheme.getSettlementType()));

            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
                if (nav != null) {
                    transaction.setRedemptionNav(nav);
                    if (transaction.getRedemptionUnit() == null && transaction.getRedemptionValue() != null) {
                        BigDecimal units = transaction.getRedemptionValue().divide(nav, MfRoundingHelper.UNIT_PRECISION,
                                java.math.RoundingMode.HALF_UP);
                        transaction.setRedemptionUnit(units);
                    } else if (transaction.getRedemptionValue() == null && transaction.getRedemptionUnit() != null) {
                        transaction.setRedemptionValue(transaction.getRedemptionUnit().multiply(nav));
                    }

                    // We only calculate STT if NAV is resolved, and we know the redemption value
                    if (transaction.getRedemptionValue() != null) {
                        BigDecimal exitLoad = transaction.getExitLoadDeducted() != null ? transaction.getExitLoadDeducted() : BigDecimal.ZERO;
                        if (MfCategoryHelper.isEquityOriented(scheme.getMfCategory())) {
                            BigDecimal sttRate = mfChargesConfig.getSttRateForDate(applicableDate);
                            if (sttRate != null && sttRate.compareTo(BigDecimal.ZERO) > 0) {
                                BigDecimal stt = transaction.getRedemptionValue().multiply(sttRate).divide(
                                        new BigDecimal("100"), MfRoundingHelper.FIAT_PRECISION,
                                        java.math.RoundingMode.HALF_UP);
                                transaction.setSttAmount(stt);
                                transaction.setNetRedemptionValue(transaction.getRedemptionValue().subtract(stt).subtract(exitLoad));
                            } else {
                                transaction.setSttAmount(BigDecimal.ZERO);
                                transaction.setNetRedemptionValue(transaction.getRedemptionValue().subtract(exitLoad));
                            }
                        } else {
                            transaction.setSttAmount(BigDecimal.ZERO);
                            transaction.setNetRedemptionValue(transaction.getRedemptionValue().subtract(exitLoad));
                        }
                    }

                    transaction.setStatus(TransactionStatus.COMPLETED);
                } else {
                    transaction.setRedemptionNav(null);
                    transaction.setSttAmount(null);
                    transaction.setNetRedemptionValue(null);
                    transaction.setCapitalGain(null);
                    transaction.setTradeInvestmentValue(null);
                    transaction.setGainType(null);
                }
            } else {
                transaction.setStatus(TransactionStatus.NAV_UNAVAILABLE);
            }
        });

        // Run FIFO engine ONLY if NAV is resolved and units are known
        if (transaction.getStatus() == TransactionStatus.COMPLETED && transaction.getRedemptionUnit() != null) {
            logger.info("Executing FIFO for Scheme: {}, Units: {}, Date: {}", transaction.getSchemeId(),
                    transaction.getRedemptionUnit(), applicableDate);
            MfFifoEngine.FifoResult fifoResult = fifoEngine.calculateRedemptionCost(userId, transaction.getSchemeId(),
                    applicableDate, transaction.getRedemptionUnit());
            if (transaction.getTradeInvestmentValue() == null) {
                transaction.setTradeInvestmentValue(fifoResult.totalCostValue);
            }
            logger.info("Trade Investment Value used: {}", transaction.getTradeInvestmentValue());

            if (transaction.getRedemptionValue() != null) {
                BigDecimal exitLoad = transaction.getExitLoadDeducted() != null ? transaction.getExitLoadDeducted() : BigDecimal.ZERO;
                transaction.setCapitalGain(
                        transaction.getRedemptionValue().subtract(exitLoad).subtract(transaction.getTradeInvestmentValue()));
                logger.info("Calculated Capital Gain: {}", transaction.getCapitalGain());
            }

            if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                    && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
                transaction.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.LTCG);
            } else if (fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                    && fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
                transaction.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG);
            } else if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                    && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0) {
                transaction.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG_LTCG);
            }

            // Auto-calculate totalUnit, totalInvestment, balanceUnit, balanceInvestment
            populateHoldingSummary(userId, transaction);
        }

        RedemptionTransaction saved = repository.save(transaction);
        if (saved.getStatus() == TransactionStatus.COMPLETED) {
            portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
        }
        transactionSequenceService.reorderRedemptionTransactions(userId);
        return saved;
    }

    public RedemptionTransaction updateTransaction(String userId, String id, RedemptionTransaction updatedTransaction) {
        RedemptionTransaction existing = repository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        existing.setRedemptionDate(updatedTransaction.getRedemptionDate());
        existing.setTotalUnit(updatedTransaction.getTotalUnit()); // Note: holding updates this usually, but keep for
                                                                  // manual
        existing.setBalanceUnit(updatedTransaction.getBalanceUnit());
        existing.setTotalInvestment(updatedTransaction.getTotalInvestment());
        existing.setBalanceInvestment(updatedTransaction.getBalanceInvestment());
        existing.setAmountCreditedBank(updatedTransaction.getAmountCreditedBank());
        existing.setStatus(TransactionStatus.PENDING_NAV);

        // Accept the new user input
        existing.setRedemptionUnit(updatedTransaction.getRedemptionUnit());
        existing.setRedemptionValue(updatedTransaction.getRedemptionValue());
        existing.setTradeInvestmentValue(updatedTransaction.getTradeInvestmentValue());

        // Wipe historical calculations
        existing.setCapitalGain(null);
        existing.setGainType(null);
        existing.setSttAmount(null);
        existing.setNetRedemptionValue(null);
        
        // Preserve user input for exit load if provided, else keep existing
        if (updatedTransaction.getExitLoadDeducted() != null) {
            existing.setExitLoadDeducted(updatedTransaction.getExitLoadDeducted());
        }
        
        existing.setIsAfterCutoff(updatedTransaction.getIsAfterCutoff());

        LocalDate applicableDate = settlementDateCalculator
                .calculateApplicableDate(updatedTransaction.getRedemptionDate(), updatedTransaction.getIsAfterCutoff());
        existing.setApplicableDate(applicableDate);

        schemeRepository.findById(existing.getSchemeId()).ifPresent(scheme -> {
            existing.setSettlementDate(
                    settlementDateCalculator.calculateSettlementDate(applicableDate, scheme.getSettlementType()));

            if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().isEmpty()) {
                BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), applicableDate);
                if (nav != null) {
                    existing.setRedemptionNav(nav);
                    if (existing.getRedemptionUnit() == null && existing.getRedemptionValue() != null) {
                        BigDecimal units = existing.getRedemptionValue().divide(nav, MfRoundingHelper.UNIT_PRECISION,
                                java.math.RoundingMode.HALF_UP);
                        existing.setRedemptionUnit(units);
                    } else if (existing.getRedemptionValue() == null && existing.getRedemptionUnit() != null) {
                        existing.setRedemptionValue(existing.getRedemptionUnit().multiply(nav));
                    }

                    if (existing.getRedemptionValue() != null) {
                        BigDecimal exitLoad = existing.getExitLoadDeducted() != null ? existing.getExitLoadDeducted() : BigDecimal.ZERO;
                        if (MfCategoryHelper.isEquityOriented(scheme.getMfCategory())) {
                            BigDecimal sttRate = mfChargesConfig.getSttRateForDate(applicableDate);
                            if (sttRate != null && sttRate.compareTo(BigDecimal.ZERO) > 0) {
                                BigDecimal stt = existing.getRedemptionValue().multiply(sttRate).divide(
                                        new BigDecimal("100"), MfRoundingHelper.FIAT_PRECISION,
                                        java.math.RoundingMode.HALF_UP);
                                existing.setSttAmount(stt);
                                existing.setNetRedemptionValue(existing.getRedemptionValue().subtract(stt).subtract(exitLoad));
                            } else {
                                existing.setSttAmount(BigDecimal.ZERO);
                                existing.setNetRedemptionValue(existing.getRedemptionValue().subtract(exitLoad));
                            }
                        } else {
                            existing.setSttAmount(BigDecimal.ZERO);
                            existing.setNetRedemptionValue(existing.getRedemptionValue().subtract(exitLoad));
                        }
                    }

                    existing.setStatus(TransactionStatus.COMPLETED);
                } else {
                    existing.setRedemptionNav(null);
                }
            } else {
                existing.setStatus(TransactionStatus.NAV_UNAVAILABLE);
            }
        });

        if (existing.getStatus() == TransactionStatus.COMPLETED && existing.getRedemptionUnit() != null) {
            MfFifoEngine.FifoResult fifoResult = fifoEngine.calculateRedemptionCost(userId, existing.getSchemeId(),
                    applicableDate, existing.getRedemptionUnit());
            if (existing.getTradeInvestmentValue() == null) {
                existing.setTradeInvestmentValue(fifoResult.totalCostValue);
            }
            if (existing.getRedemptionValue() != null) {
                BigDecimal exitLoad = existing.getExitLoadDeducted() != null ? existing.getExitLoadDeducted() : BigDecimal.ZERO;
                existing.setCapitalGain(existing.getRedemptionValue().subtract(exitLoad).subtract(existing.getTradeInvestmentValue()));
            }

            if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                    && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
                existing.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.LTCG);
            } else if (fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                    && fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
                existing.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG);
            } else if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                    && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0) {
                existing.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG_LTCG);
            }

            // Auto-calculate totalUnit, totalInvestment, balanceUnit, balanceInvestment
            populateHoldingSummary(userId, existing);
        }

        RedemptionTransaction saved = repository.save(existing);
        if (saved.getStatus() == TransactionStatus.COMPLETED) {
            portfolioHoldingService.updateHoldingForScheme(userId, saved.getSchemeId());
        }
        transactionSequenceService.reorderRedemptionTransactions(userId);
        return saved;
    }

    public void deleteTransaction(String userId, String id) {
        RedemptionTransaction existing = getTransaction(userId, id);
        repository.delete(existing);
        portfolioHoldingService.updateHoldingForScheme(userId, existing.getSchemeId());
        transactionSequenceService.reorderRedemptionTransactions(userId);
    }

    public MfFifoEngine.FifoResult previewFifo(String userId, String schemeId, LocalDate date, BigDecimal units) {
        validateSchemeOwnership(userId, schemeId);
        LocalDate applicableDate = settlementDateCalculator.calculateApplicableDate(date, false);
        return fifoEngine.calculateRedemptionCost(userId, schemeId, applicableDate, units);
    }

    /**
     * Auto-calculates totalUnit, totalInvestment, balanceUnit, and
     * balanceInvestment
     * from actual SIP + Lumpsum purchase data minus prior redemptions.
     *
     * Formulas (matching manual Excel sheet):
     * totalUnit = sum of all purchased units (SIPs + Lumpsums)
     * totalInvestment = sum of all gross invested amounts (SIPs + Lumpsums)
     * balanceUnit = totalUnit - sum of all redeemed units (including this one)
     * balanceInvestment = totalInvestment - tradeInvestmentValue (cost basis of
     * this redemption)
     * adjusted for prior redemptions' trade investment values too
     */
    private void populateHoldingSummary(String userId, RedemptionTransaction transaction) {
        logger.info("Populating holding summary for Scheme: {}", transaction.getSchemeId());
        List<SipContribution> sips = sipRepository.findByUserIdAndSchemeId(userId, transaction.getSchemeId());
        List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserIdAndSchemeId(userId,
                transaction.getSchemeId());
        List<RedemptionTransaction> allRedemptions = repository.findByUserIdAndSchemeId(userId,
                transaction.getSchemeId());

        // Total purchased units
        BigDecimal totalPurchasedUnits = BigDecimal.ZERO;
        for (SipContribution sip : sips) {
                if (sip.getTotalUnit() != null) {
                    totalPurchasedUnits = totalPurchasedUnits.add(sip.getTotalUnit());
                }
            }
            for (LumpsumTransaction lump : lumpsums) {
                if (lump.getTotalUnit() != null) {
                    totalPurchasedUnits = totalPurchasedUnits.add(lump.getTotalUnit());
                }
            }

        // Total gross investment
        BigDecimal totalGrossInvestment = BigDecimal.ZERO;
        for (SipContribution sip : sips) {
            if (sip.getAmount() != null) {
                totalGrossInvestment = totalGrossInvestment.add(sip.getAmount());
            }
        }
        for (LumpsumTransaction lump : lumpsums) {
            if (lump.getLumpsumInvestment() != null) {
                totalGrossInvestment = totalGrossInvestment.add(lump.getLumpsumInvestment());
            }
        }

        // Total redeemed units (including this transaction)
        BigDecimal totalRedeemedUnits = BigDecimal.ZERO;
        BigDecimal totalRedeemedCostBasis = BigDecimal.ZERO;
        for (RedemptionTransaction r : allRedemptions) {
            if (r.getRedemptionUnit() != null) {
                totalRedeemedUnits = totalRedeemedUnits.add(r.getRedemptionUnit());
            }
            if (r.getTradeInvestmentValue() != null) {
                totalRedeemedCostBasis = totalRedeemedCostBasis.add(r.getTradeInvestmentValue());
            }
        }
        // If this transaction is new (not yet saved), its units won't be in
        // allRedemptions
        boolean alreadyIncluded = allRedemptions.stream()
                .anyMatch(r -> r.getId() != null && r.getId().equals(transaction.getId()));
        if (!alreadyIncluded) {
            if (transaction.getRedemptionUnit() != null) {
                totalRedeemedUnits = totalRedeemedUnits.add(transaction.getRedemptionUnit());
            }
            if (transaction.getTradeInvestmentValue() != null) {
                totalRedeemedCostBasis = totalRedeemedCostBasis.add(transaction.getTradeInvestmentValue());
            }
        }

        transaction.setTotalUnit(totalPurchasedUnits.setScale(3, RoundingMode.HALF_UP));
        transaction.setTotalInvestment(totalGrossInvestment.setScale(2, RoundingMode.HALF_UP));
        
        BigDecimal balanceUnits = totalPurchasedUnits.subtract(totalRedeemedUnits);
        com.urva.myfinance.coinTrack.mutualfund.model.MfScheme scheme = schemeRepository
                .findById(transaction.getSchemeId()).orElse(null);
        if (scheme != null && scheme.getManualTotalUnits() != null
                && scheme.getManualTotalUnits().compareTo(BigDecimal.ZERO) >= 0) {
            balanceUnits = scheme.getManualTotalUnits();
        }
        
        transaction.setBalanceUnit(balanceUnits.setScale(3, RoundingMode.HALF_UP));
        transaction.setBalanceInvestment(
                totalGrossInvestment.subtract(totalRedeemedCostBasis).setScale(2, RoundingMode.HALF_UP));

        logger.info("Holding Summary - Total Purchased Units: {}, Total Gross Investment: {}", totalPurchasedUnits,
                totalGrossInvestment);
        logger.info("Holding Summary - Total Redeemed Units: {}, Total Redeemed Cost Basis: {}", totalRedeemedUnits,
                totalRedeemedCostBasis);
        logger.info("Holding Summary - Calculated Balance Units: {}, Calculated Balance Investment: {}",
                transaction.getBalanceUnit(), transaction.getBalanceInvestment());
    }

    public void recalculateRedemptionsAfterDate(String userId, String schemeId, LocalDate afterDate) {
        logger.info("Recalculating redemptions for scheme {} after date {}", schemeId, afterDate);
        // We use minusDays(1) so it includes redemptions on the same date as well.
        List<RedemptionTransaction> futureRedemptions = repository
                .findByUserIdAndSchemeIdAndRedemptionDateAfterOrderByRedemptionDateAsc(
                        userId, schemeId, afterDate.minusDays(1));

        for (RedemptionTransaction redemption : futureRedemptions) {
            if (redemption.getStatus() == TransactionStatus.COMPLETED && redemption.getRedemptionUnit() != null) {
                logger.info("Recalculating FIFO for redemption ID: {} on date: {}", redemption.getId(),
                        redemption.getApplicableDate());
                MfFifoEngine.FifoResult fifoResult = fifoEngine.calculateRedemptionCost(userId, schemeId,
                        redemption.getApplicableDate(), redemption.getRedemptionUnit());
                redemption.setTradeInvestmentValue(fifoResult.totalCostValue);

                if (redemption.getRedemptionValue() != null) {
                    BigDecimal exitLoad = redemption.getExitLoadDeducted() != null ? redemption.getExitLoadDeducted() : BigDecimal.ZERO;
                    redemption.setCapitalGain(
                            redemption.getRedemptionValue().subtract(exitLoad).subtract(redemption.getTradeInvestmentValue()));
                }

                if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                        && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
                    redemption.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.LTCG);
                } else if (fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                        && fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) == 0) {
                    redemption.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG);
                } else if (fifoResult.ltcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0
                        && fifoResult.stcgUnits.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    redemption.setGainType(com.urva.myfinance.coinTrack.mutualfund.model.GainType.STCG_LTCG);
                }

                populateHoldingSummary(userId, redemption);
                repository.save(redemption);
                // We don't need to recursively recalculate holding here because we recalculate
                // for all future redemptions
                // and the portfolio holding is just the aggregate of all these.
                portfolioHoldingService.updateHoldingForScheme(userId, schemeId);
            }
        }
    }
}
