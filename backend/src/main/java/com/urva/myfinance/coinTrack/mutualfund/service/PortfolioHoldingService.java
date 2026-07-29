package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.*;
import com.urva.myfinance.coinTrack.mutualfund.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class PortfolioHoldingService {

    @Autowired
    private PortfolioHoldingRepository holdingRepository;
    @Autowired
    private LumpsumTransactionRepository lumpsumRepository;
    @Autowired
    private SipContributionRepository sipRepository;
    @Autowired
    private RedemptionTransactionRepository redemptionRepository;
    @Autowired
    private ValuationSnapshotRepository valuationRepository;

    public PortfolioHolding updateHoldingForScheme(String userId, String schemeId) {
        PortfolioHolding holding = holdingRepository.findByUserIdAndSchemeId(userId, schemeId)
                .orElse(new PortfolioHolding());

        holding.setUserId(userId);
        holding.setSchemeId(schemeId);

        List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserIdAndSchemeId(userId, schemeId);
        List<SipContribution> sips = sipRepository.findByUserIdAndSchemeId(userId, schemeId);
        List<RedemptionTransaction> redemptions = redemptionRepository.findByUserIdAndSchemeId(userId, schemeId);

        BigDecimal totalLumpsumUnits = lumpsums.stream()
                .map(LumpsumTransaction::getTotalUnit)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLumpsumInvested = lumpsums.stream()
                .map(LumpsumTransaction::getLumpsumInvestment)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSipUnits = sips.stream()
                .map(SipContribution::getTotalUnit)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSipInvested = sips.stream()
                .map(SipContribution::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRedeemedUnits = redemptions.stream()
                .map(RedemptionTransaction::getRedemptionUnit)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal realizedGain = redemptions.stream()
                .map(RedemptionTransaction::getCapitalGain)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPurchasedUnits = totalLumpsumUnits.add(totalSipUnits);
        BigDecimal totalInvestedAmount = totalLumpsumInvested.add(totalSipInvested);

        BigDecimal currentUnits = totalPurchasedUnits.subtract(totalRedeemedUnits);
        holding.setCurrentUnits(currentUnits);

        BigDecimal averageCost = BigDecimal.ZERO;
        if (totalPurchasedUnits.compareTo(BigDecimal.ZERO) > 0) {
            averageCost = totalInvestedAmount.divide(totalPurchasedUnits, 4, RoundingMode.HALF_UP);
        }
        holding.setAverageCost(averageCost);

        BigDecimal currentInvestment = currentUnits.multiply(averageCost);
        holding.setCurrentInvestment(currentInvestment);
        holding.setRealizedGain(realizedGain);

        // Valuation / NAV
        BigDecimal latestNav = null;
        for (int i = lumpsums.size() - 1; i >= 0; i--) {
            if (lumpsums.get(i).getNavPrice() != null) {
                latestNav = lumpsums.get(i).getNavPrice();
                break;
            }
        }
        if (latestNav == null) {
            for (int i = sips.size() - 1; i >= 0; i--) {
                if (sips.get(i).getNavPrice() != null) {
                    latestNav = sips.get(i).getNavPrice();
                    break;
                }
            }
        }
        if (latestNav == null) {
            latestNav = BigDecimal.ZERO;
        }

        holding.setLatestNav(latestNav);

        BigDecimal currentValue = currentUnits.multiply(latestNav);
        holding.setCurrentValue(currentValue);

        BigDecimal marketGain = currentValue.subtract(currentInvestment);
        holding.setMarketGain(marketGain);
        holding.setUnrealizedGain(marketGain);

        if (currentInvestment.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal absoluteReturn = marketGain.divide(currentInvestment, 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            holding.setAbsoluteReturnPercentage(absoluteReturn);
        } else {
            holding.setAbsoluteReturnPercentage(BigDecimal.ZERO);
        }

        // XIRR calculation placeholder
        holding.setXirr(BigDecimal.ZERO);

        holding.setLastUpdated(Instant.now());

        return holdingRepository.save(holding);
    }

}
