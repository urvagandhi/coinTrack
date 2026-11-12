package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.model.*;
import com.urva.myfinance.coinTrack.mutualfund.repository.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PortfolioHoldingService {

  private static final Logger logger = LoggerFactory.getLogger(PortfolioHoldingService.class);

  @Autowired private PortfolioHoldingRepository holdingRepository;
  @Autowired private RedemptionTransactionRepository redemptionRepository;
  @Autowired private ValuationSnapshotRepository valuationRepository;
  @Autowired private MfNavService navService;
  @Autowired private MfSchemeRepository schemeRepository;
  @Autowired private MfSchemeAggregationService mfSchemeAggregationService;

  public void updateHoldingForScheme(String userId, String schemeId) {
    MfScheme scheme = schemeRepository.findById(schemeId).orElse(null);
    String targetUserId = (scheme != null) ? scheme.getUserId() : userId;

    PortfolioHolding holding =
        holdingRepository
            .findByUserIdAndSchemeId(targetUserId, schemeId)
            .orElse(new PortfolioHolding());

    holding.setUserId(targetUserId);
    holding.setSchemeId(schemeId);

    com.urva.myfinance.coinTrack.mutualfund.dto.SchemeSummaryDto summary =
        mfSchemeAggregationService.calculateSummary(targetUserId, schemeId);

    BigDecimal currentUnits = summary.getTotalUnit();
    holding.setCurrentUnits(currentUnits);
    holding.setTotalStampDuty(summary.getTotalStampDuty());
    holding.setTotalSttPaid(summary.getTotalSttPaid());

    holding.setAverageCost(summary.getAverageNav());
    BigDecimal currentInvestment = summary.getCurrentInvestment();
    if (currentInvestment == null) {
      currentInvestment = BigDecimal.ZERO;
    }
    holding.setCurrentInvestment(currentInvestment);
    holding.setRealizedGain(summary.getRealizedGain());

    // Valuation / NAV determination with multi-tier fallback
    BigDecimal latestNav = null;

    // 1. Try live NAV (or local cache via MfNavService)
    if (scheme != null && scheme.getAmfiCode() != null && !scheme.getAmfiCode().trim().isEmpty()) {
      latestNav = navService.fetchLatestNav(scheme.getAmfiCode());
    }

    // 2. Fallback to existing saved holding NAV if live fetch failed
    if (latestNav == null || latestNav.compareTo(BigDecimal.ZERO) <= 0) {
      if (holding.getLatestNav() != null && holding.getLatestNav().compareTo(BigDecimal.ZERO) > 0) {
        latestNav = holding.getLatestNav();
      }
    }

    // 3. Fallback to average purchase NAV if no historical or live NAV exists
    if (latestNav == null || latestNav.compareTo(BigDecimal.ZERO) <= 0) {
      if (summary.getAverageNav() != null
          && summary.getAverageNav().compareTo(BigDecimal.ZERO) > 0) {
        latestNav = summary.getAverageNav();
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
      BigDecimal absoluteReturn =
          marketGain
              .divide(currentInvestment, 6, RoundingMode.HALF_UP)
              .multiply(new BigDecimal("100"));
      holding.setAbsoluteReturnPercentage(absoluteReturn);
    } else {
      holding.setAbsoluteReturnPercentage(BigDecimal.ZERO);
    }

    if (holding.getXirr() == null) {
      holding.setXirr(BigDecimal.ZERO);
    }

    holding.setLastUpdated(Instant.now());

    holdingRepository.save(holding);

    logger.info(
        "[HOLDING-UPDATED] User: {} | Scheme ID: {} | Units: {} | Avg NAV: ₹{} | Latest NAV: ₹{} | Current Inv: ₹{} | Current Val: ₹{} | Unrealized Gain: ₹{}",
        targetUserId,
        schemeId,
        currentUnits,
        holding.getAverageCost(),
        latestNav,
        currentInvestment,
        currentValue,
        marketGain);
  }

  public void refreshAllHoldingsLiveNav(String userId) {
    List<PortfolioHolding> holdings = holdingRepository.findByUserId(userId);
    for (PortfolioHolding h : holdings) {
      MfScheme scheme = schemeRepository.findById(h.getSchemeId()).orElse(null);
      if (scheme != null
          && scheme.getAmfiCode() != null
          && !scheme.getAmfiCode().trim().isEmpty()) {
        BigDecimal latestNav = navService.fetchLatestNav(scheme.getAmfiCode());
        if (latestNav != null) {
          h.setLatestNav(latestNav);

          BigDecimal currentValue = h.getCurrentUnits().multiply(latestNav);
          h.setCurrentValue(currentValue);

          BigDecimal marketGain = currentValue.subtract(h.getCurrentInvestment());
          h.setMarketGain(marketGain);
          h.setUnrealizedGain(marketGain);

          if (h.getCurrentInvestment().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal absoluteReturn =
                marketGain
                    .divide(h.getCurrentInvestment(), 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            h.setAbsoluteReturnPercentage(absoluteReturn);
          } else {
            h.setAbsoluteReturnPercentage(BigDecimal.ZERO);
          }

          h.setLastUpdated(Instant.now());
          holdingRepository.save(h);
        }
      }
    }
  }
}
