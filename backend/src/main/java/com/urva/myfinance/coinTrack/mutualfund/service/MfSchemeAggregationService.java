package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.dto.SchemeSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.dto.OverallSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.dto.OverallSummaryDto.DiscrepancyReport;
import com.urva.myfinance.coinTrack.mutualfund.model.*;
import com.urva.myfinance.coinTrack.mutualfund.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MfSchemeAggregationService {

    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private LumpsumTransactionRepository lumpsumRepository;
    @Autowired
    private SipContributionRepository sipContributionRepository;
    @Autowired
    private RedemptionTransactionRepository redemptionRepository;
    @Autowired
    private SipMandateRepository sipMandateRepository;
    @Autowired
    private ValuationSnapshotRepository valuationSnapshotRepository;

    public SchemeSummaryDto calculateSummary(String userId, String schemeId) {
        MfScheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new RuntimeException("Scheme not found"));
        if (!scheme.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserIdAndSchemeId(userId, schemeId);
        List<SipContribution> sips = sipContributionRepository.findByUserIdAndSchemeId(userId, schemeId);
        List<RedemptionTransaction> redemptions = redemptionRepository.findByUserIdAndSchemeId(userId, schemeId);
        List<SipMandate> mandates = sipMandateRepository.findByUserIdAndSchemeIdAndActiveTrue(userId, schemeId);

        BigDecimal lumpsumInvestment = lumpsums.stream()
                .map(LumpsumTransaction::getLumpsumInvestment)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lumpsumUnits = lumpsums.stream()
                .map(LumpsumTransaction::getTotalUnit)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sipInvestment = sips.stream()
                .map(SipContribution::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal redeemedUnits = redemptions.stream()
                .map(RedemptionTransaction::getRedemptionUnit)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTradedValue = redemptions.stream()
                .map(RedemptionTransaction::getTradeInvestmentValue)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sipUnits = sips.stream()
                .map(SipContribution::getTotalUnit)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalInvestment = lumpsumInvestment.add(sipInvestment);
        BigDecimal currentInvestment = totalInvestment.subtract(totalTradedValue);
        BigDecimal totalUnit;
        if (scheme.getManualTotalUnits() != null && scheme.getManualTotalUnits().compareTo(BigDecimal.ZERO) > 0) {
            totalUnit = scheme.getManualTotalUnits().subtract(redeemedUnits);
        } else {
            totalUnit = lumpsumUnits.add(sipUnits).subtract(redeemedUnits);
        }

        java.util.Set<FundStatus> statuses = new java.util.HashSet<>();
        if (scheme.getStatuses() != null) {
            statuses.addAll(scheme.getStatuses());
        }

        boolean hasInvestments = false;

        if (lumpsumUnits.compareTo(BigDecimal.ZERO) > 0 || lumpsumInvestment.compareTo(BigDecimal.ZERO) > 0
                || (scheme.getManualTotalUnits() != null && scheme.getManualTotalUnits().compareTo(BigDecimal.ZERO) > 0)) {
            statuses.add(FundStatus.LUMPSUM);
            hasInvestments = true;
        }

        if (sipUnits.compareTo(BigDecimal.ZERO) > 0 || sipInvestment.compareTo(BigDecimal.ZERO) > 0
                || !mandates.isEmpty() || scheme.getSipStartDate() != null) {
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

        if (statuses.contains(FundStatus.LUMPSUM) || statuses.contains(FundStatus.SIP)
                || statuses.contains(FundStatus.PARTIALLY_REDEEMED) || statuses.contains(FundStatus.FULLY_REDEEMED)) {
            statuses.remove(FundStatus.CREATED);
        } else if (statuses.isEmpty()) {
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
        dto.setTotalTradedValue(totalTradedValue);
        dto.setCurrentInvestment(currentInvestment);
        dto.setStatuses(statuses);

        return dto;
    }

    public OverallSummaryDto calculateOverallSummary(String userId) {
        List<MfScheme> allSchemes = schemeRepository.findByUserId(userId);

        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal currentInvestment = BigDecimal.ZERO;
        BigDecimal totalRedeemed = BigDecimal.ZERO;
        int activeSipCount = 0;

        // Bucket ledger totals by holder + platform
        Map<String, BigDecimal> ledgerTotalsByBucket = new HashMap<>();

        for (MfScheme s : allSchemes) {
            SchemeSummaryDto sm = calculateSummary(userId, s.getId());
            totalInvested = totalInvested.add(sm.getTotalInvestment());
            currentInvestment = currentInvestment.add(sm.getCurrentInvestment());
            totalRedeemed = totalRedeemed.add(sm.getTotalTradedValue());

            if (sm.getStatuses() != null && sm.getStatuses().contains(FundStatus.SIP)) {
                activeSipCount++;
            }

            String bucketKey = s.getHolderName() + "|" + s.getPlatform();
            ledgerTotalsByBucket.put(bucketKey,
                    ledgerTotalsByBucket.getOrDefault(bucketKey, BigDecimal.ZERO).add(sm.getTotalInvestment()));
        }

        OverallSummaryDto overall = new OverallSummaryDto();
        overall.setTotalInvested(totalInvested);
        overall.setCurrentInvestment(currentInvestment);
        overall.setTotalRedeemed(totalRedeemed);
        overall.setActiveSipCount(activeSipCount);

        // Group snapshots by holderName and platform, key: holderName + "|" + platform,
        // keeping only the latest snapshot
        Map<String, ValuationSnapshot> latestSnapshotsByBucket = new HashMap<>();
        List<ValuationSnapshot> allSnapshots = valuationSnapshotRepository.findByUserId(userId);
        for (ValuationSnapshot snapshot : allSnapshots) {
            String key = snapshot.getHolderName() + "|" + snapshot.getPlatform();
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
            String bucketKey = snapshot.getHolderName() + "|" + snapshot.getPlatform();
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
        BigDecimal overallPL = latestSnapshotsByBucket.values().stream()
                .map(ValuationSnapshot::getPeriodPL)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overall.setOverallPL(overallPL);

        return overall;
    }

}
