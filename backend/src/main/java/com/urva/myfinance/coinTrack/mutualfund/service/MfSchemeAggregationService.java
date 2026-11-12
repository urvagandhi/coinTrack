package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.common.util.OwnerGrouping;
import com.urva.myfinance.coinTrack.mutualfund.dto.OverallSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.dto.OverallSummaryDto.DiscrepancyReport;
import com.urva.myfinance.coinTrack.mutualfund.dto.SchemeSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.model.*;
import com.urva.myfinance.coinTrack.mutualfund.repository.*;
import java.math.BigDecimal;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MfSchemeAggregationService {

  private static final Logger logger = LoggerFactory.getLogger(MfSchemeAggregationService.class);

  @Autowired private MfSchemeRepository schemeRepository;
  @Autowired private LumpsumTransactionRepository lumpsumRepository;
  @Autowired private SipContributionRepository sipContributionRepository;
  @Autowired private RedemptionTransactionRepository redemptionRepository;
  @Autowired private SipMandateRepository sipMandateRepository;
  @Autowired private ValuationSnapshotRepository valuationSnapshotRepository;
  @Autowired private PortfolioHoldingRepository portfolioHoldingRepository;
  @Autowired private MfNavService navService;

  public SchemeSummaryDto calculateSummary(String userId, String schemeId) {
    MfScheme scheme =
        schemeRepository
            .findById(schemeId)
            .orElseThrow(() -> new RuntimeException("Scheme not found"));
    if (!scheme.getUserId().equals(userId)) {
      throw new RuntimeException("Unauthorized");
    }

    List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserIdAndSchemeId(userId, schemeId);
    List<SipContribution> sips =
        sipContributionRepository.findByUserIdAndSchemeId(userId, schemeId);
    List<RedemptionTransaction> redemptions =
        redemptionRepository.findByUserIdAndSchemeId(userId, schemeId);
    List<SipMandate> mandates =
        sipMandateRepository.findByUserIdAndSchemeIdAndActiveTrue(userId, schemeId);

    BigDecimal lumpsumInvestment =
        lumpsums.stream()
            .map(LumpsumTransaction::getLumpsumInvestment)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal lumpsumUnits =
        lumpsums.stream()
            .map(LumpsumTransaction::getTotalUnit)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal sipInvestment =
        sips.stream()
            .map(SipContribution::getAmount)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal redeemedUnits =
        redemptions.stream()
            .map(RedemptionTransaction::getRedemptionUnit)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal totalTradedValue =
        redemptions.stream()
            .map(RedemptionTransaction::getTradeInvestmentValue)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal totalSttPaid =
        redemptions.stream()
            .map(RedemptionTransaction::getSttAmount)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal realizedGain =
        redemptions.stream()
            .map(RedemptionTransaction::getCapitalGain)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal sipUnits =
        sips.stream()
            .map(SipContribution::getTotalUnit)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal lumpsumStampDuty =
        lumpsums.stream()
            .map(LumpsumTransaction::getStampDuty)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal sipStampDuty =
        sips.stream()
            .map(SipContribution::getStampDuty)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal totalStampDuty = lumpsumStampDuty.add(sipStampDuty);
    BigDecimal totalInvestment = lumpsumInvestment.add(sipInvestment);
    BigDecimal netInvestment = totalInvestment.subtract(totalStampDuty);
    BigDecimal currentInvestment = totalInvestment.subtract(totalTradedValue);
    if (currentInvestment.compareTo(BigDecimal.ZERO) < 0) {
      currentInvestment = BigDecimal.ZERO;
    }
    BigDecimal totalUnit;
    if (scheme.getManualTotalUnits() != null
        && scheme.getManualTotalUnits().compareTo(BigDecimal.ZERO) >= 0) {
      totalUnit = scheme.getManualTotalUnits();
    } else {
      totalUnit = lumpsumUnits.add(sipUnits).subtract(redeemedUnits);
    }

    BigDecimal totalPurchasedUnits = lumpsumUnits.add(sipUnits);
    // Do not override totalPurchasedUnits with manualTotalUnits (which represents current balance)
    // to keep historical average Nav calculation accurate.
    PortfolioHolding holding =
        portfolioHoldingRepository
            .findByUserIdAndSchemeId(scheme.getUserId(), schemeId)
            .orElse(null);
    BigDecimal averageNav =
        holding != null && holding.getAverageCost() != null
            ? holding.getAverageCost()
            : BigDecimal.ZERO;
    if ((averageNav == null || averageNav.compareTo(BigDecimal.ZERO) == 0)
        && totalPurchasedUnits.compareTo(BigDecimal.ZERO) > 0) {
      averageNav = totalInvestment.divide(totalPurchasedUnits, 8, java.math.RoundingMode.HALF_UP);
    }

    logger.info(
        "Aggregation for Scheme {}: Lumpsum Inv={}, SIP Inv={}, Total Inv={}, Total Traded={}, Current Inv={}",
        schemeId,
        lumpsumInvestment,
        sipInvestment,
        totalInvestment,
        totalTradedValue,
        currentInvestment);

    java.util.Set<FundStatus> statuses = new java.util.HashSet<>();

    boolean hasInvestments = false;

    if (lumpsumUnits.compareTo(BigDecimal.ZERO) > 0
        || lumpsumInvestment.compareTo(BigDecimal.ZERO) > 0
        || (scheme.getManualTotalUnits() != null
            && scheme.getManualTotalUnits().compareTo(BigDecimal.ZERO) > 0)) {
      statuses.add(FundStatus.LUMPSUM);
      hasInvestments = true;
    }

    if (sipUnits.compareTo(BigDecimal.ZERO) > 0
        || sipInvestment.compareTo(BigDecimal.ZERO) > 0
        || !mandates.isEmpty()) {
      statuses.add(FundStatus.SIP);
      hasInvestments = true;
    }

    if (redeemedUnits.compareTo(BigDecimal.ZERO) > 0) {
      if (totalUnit.compareTo(BigDecimal.ZERO) <= 0) {
        statuses.add(FundStatus.FULLY_REDEEMED);
      } else {
        statuses.add(FundStatus.PARTIALLY_REDEEMED);
      }
    } else if (currentInvestment.compareTo(BigDecimal.ZERO) <= 0
        && totalTradedValue.compareTo(BigDecimal.ZERO) > 0) {
      statuses.add(FundStatus.FULLY_REDEEMED);
    }

    if (statuses.isEmpty()) {
      statuses.add(FundStatus.CREATED);
    }

    SchemeSummaryDto dto = new SchemeSummaryDto();
    dto.setSchemeId(schemeId);
    dto.setSchemeName(scheme.getSchemeName());
    dto.setHolderName(scheme.getHolderName());
    dto.setPlatform(scheme.getPlatform());
    dto.setMfCategory(scheme.getMfCategory());
    dto.setFolioNo(scheme.getFolioNo());
    dto.setBank(scheme.getBank());
    dto.setTotalUnit(totalUnit);
    dto.setLumpsumInvestment(lumpsumInvestment);
    dto.setSipInvestment(sipInvestment);
    dto.setTotalInvestment(totalInvestment);
    dto.setTotalStampDuty(totalStampDuty);
    dto.setNetInvestment(netInvestment);
    dto.setTotalTradedValue(totalTradedValue);
    dto.setCurrentInvestment(currentInvestment);
    dto.setAverageNav(averageNav);
    dto.setTotalSttPaid(totalSttPaid);
    dto.setRealizedGain(realizedGain);

    // Compute currentValue live: fetch latest NAV and multiply by current units.
    // This avoids staleness — the holding's persisted currentValue is only updated
    // on transaction events, so reading it here would show 0 until a transaction fires.
    BigDecimal liveNav = null;
    if (scheme.getAmfiCode() != null && !scheme.getAmfiCode().trim().isEmpty()) {
      liveNav = navService.fetchLatestNav(scheme.getAmfiCode());
    }

    // 2. Fallback to saved holding NAV if live fetch returned null or 0
    if (liveNav == null || liveNav.compareTo(BigDecimal.ZERO) <= 0) {
      if (holding != null
          && holding.getLatestNav() != null
          && holding.getLatestNav().compareTo(BigDecimal.ZERO) > 0) {
        liveNav = holding.getLatestNav();
      }
    }

    // 3. Fallback to average purchase NAV if no historical or live NAV exists
    if (liveNav == null || liveNav.compareTo(BigDecimal.ZERO) <= 0) {
      if (averageNav != null && averageNav.compareTo(BigDecimal.ZERO) > 0) {
        liveNav = averageNav;
      }
    }

    BigDecimal liveCurrentValue = BigDecimal.ZERO;
    if (liveNav != null
        && liveNav.compareTo(BigDecimal.ZERO) > 0
        && totalUnit.compareTo(BigDecimal.ZERO) > 0) {
      liveCurrentValue = totalUnit.multiply(liveNav).setScale(2, java.math.RoundingMode.HALF_UP);
    } else if (holding != null
        && holding.getCurrentValue() != null
        && holding.getCurrentValue().compareTo(BigDecimal.ZERO) > 0) {
      liveCurrentValue = holding.getCurrentValue();
    }

    boolean isManualOverride =
        scheme.getManualTotalUnits() != null
            && scheme.getManualTotalUnits().compareTo(BigDecimal.ZERO) >= 0;
    logger.info(
        "[VALUATION-SCHEME] Scheme: '{}' (Folio: {}) | ManualOverride: {} (Value: {}) | Effective Units: {} | Avg NAV: ₹{} | Resolved NAV: ₹{} | Gross Inv: ₹{} | Current Inv: ₹{} | Current Val: ₹{}",
        scheme.getSchemeName(),
        scheme.getFolioNo(),
        isManualOverride,
        scheme.getManualTotalUnits(),
        totalUnit,
        averageNav,
        liveNav,
        totalInvestment,
        currentInvestment,
        liveCurrentValue);
    dto.setCurrentValue(liveCurrentValue);

    dto.setStatuses(statuses);

    return dto;
  }

  public OverallSummaryDto calculateOverallSummary(String userId) {
    List<MfScheme> allSchemes = schemeRepository.findByUserId(userId);

    BigDecimal totalInvested = BigDecimal.ZERO;
    BigDecimal currentInvestment = BigDecimal.ZERO;
    BigDecimal totalRedeemed = BigDecimal.ZERO;
    BigDecimal realizedGain = BigDecimal.ZERO;
    int activeSipCount = 0;

    // Bucket ledger totals by holder + platform
    Map<String, BigDecimal> ledgerTotalsByBucket = new HashMap<>();

    for (MfScheme s : allSchemes) {
      SchemeSummaryDto sm = calculateSummary(userId, s.getId());
      totalInvested = totalInvested.add(sm.getTotalInvestment());
      currentInvestment = currentInvestment.add(sm.getCurrentInvestment());
      totalRedeemed = totalRedeemed.add(sm.getTotalTradedValue());
      if (sm.getRealizedGain() != null) {
        realizedGain = realizedGain.add(sm.getRealizedGain());
      }

      if (sm.getStatuses() != null && sm.getStatuses().contains(FundStatus.SIP)) {
        activeSipCount++;
      }

      String bucketKey = OwnerGrouping.groupKey(s.getPlatform(), s.getHolderName());
      ledgerTotalsByBucket.put(
          bucketKey,
          ledgerTotalsByBucket
              .getOrDefault(bucketKey, BigDecimal.ZERO)
              .add(sm.getTotalInvestment()));
    }

    logger.info(
        "[VALUATION-OVERALL] User: {} | Total Schemes: {} | Overall Gross Invested: ₹{} | Overall Current Invested: ₹{} | Total Redeemed: ₹{} | Realized Gain: ₹{} | Active SIPs: {}",
        userId,
        allSchemes.size(),
        totalInvested,
        currentInvestment,
        totalRedeemed,
        realizedGain,
        activeSipCount);

    OverallSummaryDto overall = new OverallSummaryDto();
    overall.setTotalInvested(totalInvested);
    overall.setCurrentInvestment(currentInvestment);
    overall.setTotalRedeemed(totalRedeemed);
    overall.setRealizedGain(realizedGain);
    overall.setActiveSipCount(activeSipCount);

    // Group snapshots by holderName and platform, key: holderName + "|" + platform,
    // keeping only the latest snapshot
    Map<String, ValuationSnapshot> latestSnapshotsByBucket = new HashMap<>();
    List<ValuationSnapshot> allSnapshots = valuationSnapshotRepository.findByUserId(userId);
    for (ValuationSnapshot snapshot : allSnapshots) {
      String key = OwnerGrouping.groupKey(snapshot.getPlatform(), snapshot.getHolderName());
      ValuationSnapshot existing = latestSnapshotsByBucket.get(key);
      if (existing == null || snapshot.getSnapshotDate().isAfter(existing.getSnapshotDate())) {
        latestSnapshotsByBucket.put(key, snapshot);
      }
    }

    // Calculate discrepancies against latest ValuationSnapshots
    List<DiscrepancyReport> discrepancies = new ArrayList<>();
    boolean overallDiscrepancyFlag = false;
    BigDecimal overallDiscrepancyAmount = BigDecimal.ZERO;

    for (ValuationSnapshot snapshot : latestSnapshotsByBucket.values()) {
      String bucketKey = OwnerGrouping.groupKey(snapshot.getPlatform(), snapshot.getHolderName());
      BigDecimal ledgerTotal = ledgerTotalsByBucket.getOrDefault(bucketKey, BigDecimal.ZERO);

      BigDecimal diff = snapshot.getInvestmentValue().subtract(ledgerTotal).abs();
      // Tolerance of 1 rupee for rounding
      if (diff.compareTo(new BigDecimal("1.00")) > 0) {
        DiscrepancyReport dr = new DiscrepancyReport();
        dr.setHolderName(snapshot.getHolderName());
        dr.setPlatform(snapshot.getPlatform());
        dr.setSnapshotInvestmentValue(snapshot.getInvestmentValue());
        dr.setLedgerTotalInvestment(ledgerTotal);
        dr.setDiscrepancyFlag(true);
        BigDecimal discAmt = snapshot.getInvestmentValue().subtract(ledgerTotal);
        dr.setDiscrepancyAmount(discAmt);
        discrepancies.add(dr);

        overallDiscrepancyFlag = true;
        overallDiscrepancyAmount = overallDiscrepancyAmount.add(discAmt.abs());
      }
    }
    overall.setDiscrepancies(discrepancies);
    overall.setDiscrepancyFlag(overallDiscrepancyFlag);
    overall.setDiscrepancyAmount(overallDiscrepancyAmount);

    // Overall PL: sum of periodPL of the latest snapshots per bucket
    BigDecimal overallPL =
        latestSnapshotsByBucket.values().stream()
            .map(ValuationSnapshot::getPeriodPL)
            .filter(java.util.Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    overall.setOverallPL(overallPL);

    return overall;
  }
}
