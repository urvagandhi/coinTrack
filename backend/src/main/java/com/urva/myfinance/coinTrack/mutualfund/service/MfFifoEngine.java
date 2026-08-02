package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.mutualfund.util.MfRoundingHelper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MfFifoEngine {

    private static final Logger logger = LoggerFactory.getLogger(MfFifoEngine.class);

    @Autowired
    private LumpsumTransactionRepository lumpsumRepository;
    @Autowired
    private SipContributionRepository sipRepository;
    @Autowired
    private RedemptionTransactionRepository redemptionRepository;
    @Autowired
    private MfSchemeRepository schemeRepository;

    public static class MfLot {
        public LocalDate date;
        public java.time.Instant createdAt;
        public BigDecimal originalUnits;
        public BigDecimal availableUnits;
        public BigDecimal navPrice;

        public MfLot(LocalDate date, java.time.Instant createdAt, BigDecimal originalUnits, BigDecimal availableUnits,
                BigDecimal navPrice) {
            this.date = date;
            this.createdAt = createdAt;
            this.originalUnits = originalUnits;
            this.availableUnits = availableUnits;
            this.navPrice = navPrice;
        }
    }

    public static class FifoResult {
        public BigDecimal totalCostValue = BigDecimal.ZERO;
        public BigDecimal stcgCost = BigDecimal.ZERO; // Cost of units held < 1 year
        public BigDecimal ltcgCost = BigDecimal.ZERO; // Cost of units held >= 1 year
        public BigDecimal stcgUnits = BigDecimal.ZERO;
        public BigDecimal ltcgUnits = BigDecimal.ZERO;
        public BigDecimal availableUnitsBeforeRedemption = BigDecimal.ZERO;
        public BigDecimal availableInvestmentBeforeRedemption = BigDecimal.ZERO;
    }

    /**
     * Rebuilds the FIFO queue of lots by reading all purchases up to the redemption
     * date,
     * and subtracting all prior redemptions.
     * Then calculates the cost basis for the new redemption amount.
     */
    public FifoResult calculateRedemptionCost(String userId, String schemeId, LocalDate redemptionDate,
            BigDecimal redemptionUnits, String excludeTransactionId) {
        logger.info("Starting FIFO calculation for Scheme: {}, Redemption Date: {}, Units: {}", schemeId,
                redemptionDate, redemptionUnits);
        List<MfLot> lots = new ArrayList<>();

        // 1. Fetch all Lumpsum purchases
        List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserIdAndSchemeId(userId, schemeId);
        for (LumpsumTransaction txn : lumpsums) {
            if (txn.getInvestmentDate() != null && !txn.getInvestmentDate().isAfter(redemptionDate)) {
                // Cost per unit = gross investment / units allocated (includes stamp duty in
                // cost basis)
                BigDecimal costPerUnit = txn.getNavPrice();
                if (txn.getLumpsumInvestment() != null && txn.getTotalUnit() != null
                        && txn.getTotalUnit().compareTo(BigDecimal.ZERO) > 0) {
                    costPerUnit = txn.getLumpsumInvestment().divide(txn.getTotalUnit(),
                            MfRoundingHelper.COST_BASIS_PRECISION, RoundingMode.HALF_UP);
                }
                lots.add(new MfLot(txn.getInvestmentDate(), txn.getCreatedAt(), txn.getTotalUnit(), txn.getTotalUnit(),
                        costPerUnit));
            }
        }

        // 2. Fetch all SIP purchases
        List<SipContribution> sips = sipRepository.findByUserIdAndSchemeId(userId, schemeId);
        for (SipContribution sip : sips) {
            LocalDate date = sip.getContributionDate();
            if (date != null && !date.isAfter(redemptionDate) && sip.getTotalUnit() != null) {
                // Cost per unit = gross SIP amount / units allocated (includes stamp duty in
                // cost basis)
                BigDecimal costPerUnit = sip.getNavPrice();
                if (sip.getAmount() != null && sip.getTotalUnit().compareTo(BigDecimal.ZERO) > 0) {
                    costPerUnit = sip.getAmount().divide(sip.getTotalUnit(), MfRoundingHelper.COST_BASIS_PRECISION,
                            RoundingMode.HALF_UP);
                }
                lots.add(new MfLot(date, sip.getCreatedAt(), sip.getTotalUnit(), sip.getTotalUnit(), costPerUnit));
            }
        }

        // 2b. Add manual units as a synthesized lot if necessary
        BigDecimal totalLotUnits = lots.stream().map(l -> l.availableUnits).reduce(BigDecimal.ZERO, BigDecimal::add);
        MfScheme scheme = schemeRepository.findById(schemeId).orElse(null);
        if (scheme != null && scheme.getManualTotalUnits() != null && scheme.getManualTotalUnits().compareTo(totalLotUnits) > 0) {
            BigDecimal missingUnits = scheme.getManualTotalUnits().subtract(totalLotUnits);
            // Synthesize a lot for the missing units. We don't have a real date or cost basis.
            // We use the scheme's averageNav as cost basis, and a very old date (e.g. 1970) so it's always LTCG and consumed first.
            BigDecimal avgNav = scheme.getAverageNav() != null ? scheme.getAverageNav() : BigDecimal.ZERO;
            lots.add(new MfLot(LocalDate.of(1970, 1, 1), java.time.Instant.EPOCH, missingUnits, missingUnits, avgNav));
        }

        // 3. Sort lots by chronological order (FIFO), using createdAt as tie-breaker
        lots.sort(Comparator.comparing((MfLot lot) -> lot.date)
                .thenComparing(lot -> lot.createdAt == null ? java.time.Instant.MIN : lot.createdAt));

        // 4. Fetch prior redemptions to consume the queue up to this point
        List<RedemptionTransaction> priorRedemptions = redemptionRepository.findByUserIdAndSchemeId(userId, schemeId);
        priorRedemptions.sort(Comparator.comparing(RedemptionTransaction::getRedemptionDate)
                .thenComparing(tx -> tx.getCreatedAt() == null ? java.time.Instant.MIN : tx.getCreatedAt()));

        for (RedemptionTransaction prior : priorRedemptions) {
            if (excludeTransactionId != null && prior.getId() != null && prior.getId().equals(excludeTransactionId)) {
                continue;
            }
            if (prior.getRedemptionDate().isBefore(redemptionDate) ||
                    (prior.getRedemptionDate().isEqual(redemptionDate) && prior.getId() != null)) {
                // We consume lots for previous redemptions to find the exact state of holdings
                // at redemptionDate
                consumeUnitsFromLots(lots, prior.getRedemptionUnit());
            }
        }
        logger.info("Prior redemptions consumed. Remaining lots to check: {}", lots.size());

        // 5. Determine LTCG threshold based on category
        int ltcgYears = 1;
        if (scheme != null && scheme.getMfCategory() != null) {
            String category = scheme.getMfCategory().toLowerCase();
            if (category.contains("debt") || category.contains("liquid")) {
                ltcgYears = 3;
            }
        }

        // 6. Now calculate the cost of the current redemption
        FifoResult result = calculateCostForUnits(lots, redemptionUnits, redemptionDate, ltcgYears);
        
        // Calculate the total units that were available before this redemption was processed
        BigDecimal availableBefore = BigDecimal.ZERO;
        BigDecimal investmentBefore = BigDecimal.ZERO;
        for (MfLot lot : lots) {
            availableBefore = availableBefore.add(lot.availableUnits);
            investmentBefore = investmentBefore.add(lot.availableUnits.multiply(lot.navPrice));
        }
        // Since calculateCostForUnits consumes units from the lots, we must add back the consumed units
        // to get the true 'before redemption' amount. 
        result.availableUnitsBeforeRedemption = availableBefore.add(redemptionUnits);
        result.availableInvestmentBeforeRedemption = investmentBefore.add(result.totalCostValue);

        logger.info("FIFO result for Scheme {}: Total Cost: {}, STCG Units: {}, LTCG Units: {}, Available Before: {}", schemeId,
                result.totalCostValue, result.stcgUnits, result.ltcgUnits, result.availableUnitsBeforeRedemption);
        return result;
    }

    private void consumeUnitsFromLots(List<MfLot> lots, BigDecimal unitsToConsume) {
        logger.info("Consuming {} units for prior redemption", unitsToConsume);
        BigDecimal remainingToConsume = unitsToConsume;
        for (MfLot lot : lots) {
            if (remainingToConsume.compareTo(BigDecimal.ZERO) <= 0)
                break;

            if (lot.availableUnits.compareTo(BigDecimal.ZERO) > 0) {
                if (lot.availableUnits.compareTo(remainingToConsume) <= 0) {
                    remainingToConsume = remainingToConsume.subtract(lot.availableUnits);
                    lot.availableUnits = BigDecimal.ZERO;
                } else {
                    lot.availableUnits = lot.availableUnits.subtract(remainingToConsume);
                    remainingToConsume = BigDecimal.ZERO;
                }
            }
        }
    }

    private FifoResult calculateCostForUnits(List<MfLot> lots, BigDecimal unitsToRedeem, LocalDate redemptionDate,
            int ltcgYears) {
        logger.info("Calculating cost for {} units to redeem on {}", unitsToRedeem, redemptionDate);
        FifoResult result = new FifoResult();
        BigDecimal remainingToRedeem = unitsToRedeem;

        for (MfLot lot : lots) {
            if (remainingToRedeem.compareTo(BigDecimal.ZERO) <= 0)
                break;

            if (lot.availableUnits.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal unitsTaken = lot.availableUnits.compareTo(remainingToRedeem) <= 0
                        ? lot.availableUnits
                        : remainingToRedeem;

                BigDecimal costForTheseUnits = unitsTaken.multiply(lot.navPrice);
                logger.info("Taking {} units from lot dated {} (Cost: {}, NAV: {})", unitsTaken, lot.date,
                        costForTheseUnits, lot.navPrice);
                result.totalCostValue = result.totalCostValue.add(costForTheseUnits);

                // STCG vs LTCG
                LocalDate thresholdDate = redemptionDate.minusYears(ltcgYears);
                if (lot.date.isAfter(thresholdDate)) {
                    // STCG: Held for less than threshold
                    result.stcgCost = result.stcgCost.add(costForTheseUnits);
                    result.stcgUnits = result.stcgUnits.add(unitsTaken);
                } else {
                    // LTCG: Held for threshold years or more
                    result.ltcgCost = result.ltcgCost.add(costForTheseUnits);
                    result.ltcgUnits = result.ltcgUnits.add(unitsTaken);
                }

                remainingToRedeem = remainingToRedeem.subtract(unitsTaken);
                lot.availableUnits = lot.availableUnits.subtract(unitsTaken);
            }
        }

        return result;
    }
}
