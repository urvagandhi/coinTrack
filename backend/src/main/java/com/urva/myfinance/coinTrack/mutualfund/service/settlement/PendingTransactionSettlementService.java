package com.urva.myfinance.coinTrack.mutualfund.service.settlement;

import com.urva.myfinance.coinTrack.mutualfund.config.MfChargesConfig;
import com.urva.myfinance.coinTrack.mutualfund.model.*;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.MfFifoEngine;
import com.urva.myfinance.coinTrack.mutualfund.service.MfNavService;
import com.urva.myfinance.coinTrack.mutualfund.service.PortfolioHoldingService;
import com.urva.myfinance.coinTrack.mutualfund.util.MfCategoryHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class PendingTransactionSettlementService {

    private static final Logger logger = LoggerFactory.getLogger(PendingTransactionSettlementService.class);
    private static final int MAX_RETRIES = 5; // e.g. 5 days of retries

    @Autowired
    private LumpsumTransactionRepository lumpsumRepo;
    @Autowired
    private SipContributionRepository sipRepo;
    @Autowired
    private RedemptionTransactionRepository redemptionRepo;
    @Autowired
    private MfSchemeRepository schemeRepo;
    @Autowired
    private MfNavService mfNavService;
    @Autowired
    private PortfolioHoldingService portfolioHoldingService;
    @Autowired
    private MfChargesConfig mfChargesConfig;
    @Autowired
    private MfFifoEngine fifoEngine;

    // Run every day at 23:45 IST (After the 23:30 AMFI sync)
    @Scheduled(cron = "0 45 23 * * ?", zone = "Asia/Kolkata")
    public void processPendingTransactions() {
        logger.info("Starting settlement process for pending Mutual Fund transactions...");
        
        processPendingLumpsum();
        processPendingSip();
        processPendingRedemption();
        
        logger.info("Finished settlement process.");
    }

    private void processPendingLumpsum() {
        List<LumpsumTransaction> pending = lumpsumRepo.findByStatus(TransactionStatus.PENDING_NAV);
        for (LumpsumTransaction t : pending) {
            Optional<MfScheme> optScheme = schemeRepo.findById(t.getSchemeId());
            if (optScheme.isEmpty() || optScheme.get().getAmfiCode() == null || optScheme.get().getAmfiCode().isEmpty()) {
                t.setStatus(TransactionStatus.NAV_UNAVAILABLE);
                lumpsumRepo.save(t);
                continue;
            }
            
            BigDecimal nav = mfNavService.fetchNavForDate(optScheme.get().getAmfiCode(), t.getApplicableDate());
            if (nav != null) {
                t.setNavPrice(nav);
                t.setStatus(TransactionStatus.COMPLETED);
                if (t.getLumpsumInvestment() != null) {
                    t.setTotalUnit(t.getLumpsumInvestment().divide(nav, 3, RoundingMode.HALF_UP));
                }
                lumpsumRepo.save(t);
                portfolioHoldingService.updateHoldingForScheme(t.getUserId(), t.getSchemeId());
            } else {
                incrementRetryLumpsum(t);
            }
        }
    }

    private void incrementRetryLumpsum(LumpsumTransaction t) {
        int retries = t.getRetryCount();
        if (retries >= MAX_RETRIES) {
            t.setStatus(TransactionStatus.FAILED);
            logger.error("Lumpsum Transaction {} failed after {} retries. Needs manual review.", t.getId(), MAX_RETRIES);
        } else {
            t.setRetryCount(retries + 1);
        }
        lumpsumRepo.save(t);
    }

    private void processPendingSip() {
        List<SipContribution> pending = sipRepo.findByStatus(TransactionStatus.PENDING_NAV);
        for (SipContribution t : pending) {
            Optional<MfScheme> optScheme = schemeRepo.findById(t.getSchemeId());
            if (optScheme.isEmpty() || optScheme.get().getAmfiCode() == null || optScheme.get().getAmfiCode().isEmpty()) {
                t.setStatus(TransactionStatus.NAV_UNAVAILABLE);
                sipRepo.save(t);
                continue;
            }
            
            BigDecimal nav = mfNavService.fetchNavForDate(optScheme.get().getAmfiCode(), t.getApplicableDate());
            if (nav != null) {
                t.setNavPrice(nav);
                t.setStatus(TransactionStatus.COMPLETED);
                if (t.getAmount() != null) {
                    t.setTotalUnit(t.getAmount().divide(nav, 3, RoundingMode.HALF_UP));
                }
                sipRepo.save(t);
                portfolioHoldingService.updateHoldingForScheme(t.getUserId(), t.getSchemeId());
            } else {
                incrementRetrySip(t);
            }
        }
    }

    private void incrementRetrySip(SipContribution t) {
        int retries = t.getRetryCount();
        if (retries >= MAX_RETRIES) {
            t.setStatus(TransactionStatus.FAILED);
            logger.error("SIP Contribution {} failed after {} retries. Needs manual review.", t.getId(), MAX_RETRIES);
        } else {
            t.setRetryCount(retries + 1);
        }
        sipRepo.save(t);
    }

    private void processPendingRedemption() {
        List<RedemptionTransaction> pending = redemptionRepo.findByStatus(TransactionStatus.PENDING_NAV);
        for (RedemptionTransaction t : pending) {
            Optional<MfScheme> optScheme = schemeRepo.findById(t.getSchemeId());
            if (optScheme.isEmpty() || optScheme.get().getAmfiCode() == null || optScheme.get().getAmfiCode().isEmpty()) {
                t.setStatus(TransactionStatus.NAV_UNAVAILABLE);
                redemptionRepo.save(t);
                continue;
            }
            
            MfScheme scheme = optScheme.get();
            BigDecimal nav = mfNavService.fetchNavForDate(scheme.getAmfiCode(), t.getApplicableDate());
            if (nav != null) {
                t.setRedemptionNav(nav);
                
                // Reconcile units and value based on what was provided initially
                if (t.getRedemptionUnit() == null && t.getRedemptionValue() != null) {
                    t.setRedemptionUnit(t.getRedemptionValue().divide(nav, 4, RoundingMode.HALF_UP));
                } else if (t.getRedemptionValue() == null && t.getRedemptionUnit() != null) {
                    t.setRedemptionValue(t.getRedemptionUnit().multiply(nav));
                }

                if (t.getRedemptionValue() != null) {
                    if (MfCategoryHelper.isEquityOriented(scheme.getMfCategory())) {
                        BigDecimal sttRate = mfChargesConfig.getSttRateForDate(t.getApplicableDate());
                        if (sttRate != null && sttRate.compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal stt = t.getRedemptionValue().multiply(sttRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                            t.setSttAmount(stt);
                            t.setNetRedemptionValue(t.getRedemptionValue().subtract(stt));
                        } else {
                            t.setSttAmount(BigDecimal.ZERO);
                            t.setNetRedemptionValue(t.getRedemptionValue());
                        }
                    } else {
                        t.setSttAmount(BigDecimal.ZERO);
                        t.setNetRedemptionValue(t.getRedemptionValue());
                    }
                }
                
                // Now run FIFO engine
                if (t.getRedemptionUnit() != null) {
                    MfFifoEngine.FifoResult fifoResult = fifoEngine.calculateRedemptionCost(t.getUserId(), t.getSchemeId(),
                            t.getApplicableDate(), t.getRedemptionUnit());
                    t.setTradeInvestmentValue(fifoResult.totalCostValue);

                    if (t.getRedemptionValue() != null) {
                        t.setCapitalGain(t.getRedemptionValue().subtract(t.getTradeInvestmentValue()));
                    }

                    if (fifoResult.ltcgUnits.compareTo(BigDecimal.ZERO) > 0 && fifoResult.stcgUnits.compareTo(BigDecimal.ZERO) == 0) {
                        t.setGainType(GainType.LTCG);
                    } else if (fifoResult.stcgUnits.compareTo(BigDecimal.ZERO) > 0 && fifoResult.ltcgUnits.compareTo(BigDecimal.ZERO) == 0) {
                        t.setGainType(GainType.STCG);
                    } else if (fifoResult.ltcgUnits.compareTo(BigDecimal.ZERO) > 0 && fifoResult.stcgUnits.compareTo(BigDecimal.ZERO) > 0) {
                        t.setGainType(GainType.STCG_LTCG);
                    }
                }

                t.setStatus(TransactionStatus.COMPLETED);
                redemptionRepo.save(t);
                portfolioHoldingService.updateHoldingForScheme(t.getUserId(), t.getSchemeId());
            } else {
                incrementRetryRedemption(t);
            }
        }
    }

    private void incrementRetryRedemption(RedemptionTransaction t) {
        int retries = t.getRetryCount();
        if (retries >= MAX_RETRIES) {
            t.setStatus(TransactionStatus.FAILED);
            logger.error("Redemption Transaction {} failed after {} retries. Needs manual review.", t.getId(), MAX_RETRIES);
        } else {
            t.setRetryCount(retries + 1);
        }
        redemptionRepo.save(t);
    }
}
