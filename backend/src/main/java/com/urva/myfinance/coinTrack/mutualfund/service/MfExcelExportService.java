package com.urva.myfinance.coinTrack.mutualfund.service;

import com.urva.myfinance.coinTrack.mutualfund.dto.OverallSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.dto.SchemeSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.ValuationSnapshotRepository;
import com.urva.myfinance.coinTrack.mutualfund.util.MfExcelExporter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * MfExcelExportService — single-responsibility service for generating the 5-sheet
 * Mutual Fund Excel workbook (§8 of the engineering spec).
 *
 * It reads all data for the user, delegates aggregation to MfSchemeAggregationService,
 * and passes the results to MfExcelExporter. This keeps export concerns separated
 * from the aggregation/calculation logic in MfSchemeAggregationService.
 */
@Service
public class MfExcelExportService {

    @Autowired
    private MfSchemeRepository schemeRepository;
    @Autowired
    private LumpsumTransactionRepository lumpsumRepository;
    @Autowired
    private SipContributionRepository sipContributionRepository;
    @Autowired
    private RedemptionTransactionRepository redemptionRepository;
    @Autowired
    private ValuationSnapshotRepository valuationSnapshotRepository;
    @Autowired
    private MfSchemeAggregationService aggregationService;

    /**
     * Builds and returns the 5-sheet Excel workbook for the given user.
     * Sheets:
     *   1. MF Investment (Scheme Summary)
     *   2. Investment & Valuation (Valuation Snapshots)
     *   3. Lumpsum Investment
     *   4. Redemption Investment
     *   5. SIP Details (Contributions)
     */
    public ResponseEntity<byte[]> exportToExcel(String userId) {
        List<MfScheme> schemes = schemeRepository.findByUserId(userId);
        Map<String, MfScheme> schemeMap = schemes.stream()
                .collect(Collectors.toMap(MfScheme::getId, s -> s));

        List<SchemeSummaryDto> summaries = schemes.stream()
                .map(s -> aggregationService.calculateSummary(userId, s.getId()))
                .collect(Collectors.toList());

        List<ValuationSnapshot> snapshots = valuationSnapshotRepository.findByUserId(userId);
        List<LumpsumTransaction> lumpsums = lumpsumRepository.findByUserId(userId);
        List<RedemptionTransaction> redemptions = redemptionRepository.findByUserId(userId);
        List<SipContribution> sips = sipContributionRepository.findByUserId(userId);

        OverallSummaryDto overallSummary = aggregationService.calculateOverallSummary(userId);

        return MfExcelExporter.export(summaries, snapshots, lumpsums, redemptions, sips, schemeMap, overallSummary);
    }
}
