package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MfFifoEngine {

    @Autowired
    private LumpsumTransactionRepository lumpsumRepository;
    @Autowired
    private SipContributionRepository sipRepository;
    @Autowired
    private RedemptionTransactionRepository redemptionRepository;

    public static class MfLot {
        public LocalDate date;
        public BigDecimal originalUnits;
        public BigDecimal availableUnits;
        public BigDecimal navPrice;

        public MfLot(LocalDate date, BigDecimal originalUnits, BigDecimal availableUnits, BigDecimal navPrice) {
            this.date = date;
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
    }

    /**
     * Rebuilds the FIFO queue of lots by reading all purchases up to the redemption
     * date,
     * and subtracting all prior redemptions.
     * Then calculates the cost basis for the new redemption amount.
     */
    public FifoResult calculateRedemptionCost(String userId, String schemeId, LocalDate redemptionDate,
            BigDecimal redemptionUnits) {
        List<MfLot> lots = new ArrayList<>();

        // 1. Fetch all Lumpsum purchases
        List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserIdAndSchemeId(userId, schemeId);
        for (LumpsumTransaction txn : lumpsums) {
            if (txn.getInvestmentDate() != null && !txn.getInvestmentDate().isAfter(redemptionDate)) {
                lots.add(new MfLot(txn.getInvestmentDate(), txn.getTotalUnit(), txn.getTotalUnit(), txn.getNavPrice()));
            }
        }

        // 2. Fetch all SIP purchases (Assuming we add contributionDate, totalUnit,
        // navPrice to SipContribution)
        // If they don't exist yet, we treat amount/nav if available. We will update
        // SipContribution shortly.
        List<SipContribution> sips = sipRepository.findByUserIdAndSchemeId(userId, schemeId);
        for (SipContribution sip : sips) {
            LocalDate date = sip.getContributionDate();
            if (date != null && !date.isAfter(redemptionDate) && sip.getTotalUnit() != null) {
                lots.add(new MfLot(date, sip.getTotalUnit(), sip.getTotalUnit(), sip.getNavPrice()));
            }
        }

        // 3. Sort lots by chronological order (FIFO)
        lots.sort(Comparator.comparing(lot -> lot.date));

        // 4. Fetch prior redemptions to consume the queue up to this point
        List<RedemptionTransaction> priorRedemptions = redemptionRepository.findByUserIdAndSchemeId(userId, schemeId);
        priorRedemptions.sort(Comparator.comparing(RedemptionTransaction::getRedemptionDate));

        for (RedemptionTransaction prior : priorRedemptions) {
            if (prior.getRedemptionDate().isBefore(redemptionDate) ||
                    (prior.getRedemptionDate().isEqual(redemptionDate) && prior.getId() != null)) {
                // We consume lots for previous redemptions to find the exact state of holdings
                // at redemptionDate
                consumeUnitsFromLots(lots, prior.getRedemptionUnit());
            }
        }

        // 5. Now calculate the cost of the current redemption
        return calculateCostForUnits(lots, redemptionUnits, redemptionDate);
    }

    private void consumeUnitsFromLots(List<MfLot> lots, BigDecimal unitsToConsume) {
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

    private FifoResult calculateCostForUnits(List<MfLot> lots, BigDecimal unitsToRedeem, LocalDate redemptionDate) {
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
                result.totalCostValue = result.totalCostValue.add(costForTheseUnits);

                // STCG vs LTCG
                LocalDate oneYearAgo = redemptionDate.minusYears(1);
                if (lot.date.isAfter(oneYearAgo)) {
                    // STCG: Held for less than 1 year
                    result.stcgCost = result.stcgCost.add(costForTheseUnits);
                    result.stcgUnits = result.stcgUnits.add(unitsTaken);
                } else {
                    // LTCG: Held for 1 year or more
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
