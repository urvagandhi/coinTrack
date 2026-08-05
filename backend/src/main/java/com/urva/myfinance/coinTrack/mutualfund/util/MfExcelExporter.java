package com.urva.myfinance.coinTrack.mutualfund.util;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.Comparator;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.urva.myfinance.coinTrack.common.util.ExcelExportUtil;
import com.urva.myfinance.coinTrack.mutualfund.dto.OverallSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.dto.SchemeSummaryDto;
import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.MfScheme;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.model.ValuationSnapshot;
import com.urva.myfinance.coinTrack.mutualfund.model.FundStatus;

public class MfExcelExporter {

    private MfExcelExporter() {
        // Private constructor for utility class
    }

    public static ResponseEntity<byte[]> export(
            List<SchemeSummaryDto> summaries,
            List<ValuationSnapshot> snapshots,
            List<LumpsumTransaction> lumpsums,
            List<RedemptionTransaction> redemptions,
            List<SipContribution> sips,
            Map<String, MfScheme> schemeMap) {
        return export(summaries, snapshots, lumpsums, redemptions, sips, schemeMap, null);
    }

    public static ResponseEntity<byte[]> export(
            List<SchemeSummaryDto> summaries,
            List<ValuationSnapshot> snapshots,
            List<LumpsumTransaction> lumpsums,
            List<RedemptionTransaction> redemptions,
            List<SipContribution> sips,
            Map<String, MfScheme> schemeMap,
            OverallSummaryDto summary) {

        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle rightAlignStyle = createRightAlignStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);

            // Tab 1: MF Investment (Scheme Summary) - Pass Overall Summary for Header Card
            createMfInvestmentSheet(workbook, "MF Investment", summaries, schemeMap, summary, sips, headerStyle, dataStyle,
                    currencyStyle, boldStyle, rightAlignStyle);

            // Tab 2: Investment & Valuation
            createValuationSheet(workbook, "Investment & Valuation", snapshots, headerStyle, dataStyle, currencyStyle,
                    percentStyle, boldStyle);

            // Tab 3: Lumpsum Investment
            createLumpsumSheet(workbook, "Lumpsum Investment", lumpsums, schemeMap, headerStyle, dataStyle,
                    currencyStyle, rightAlignStyle, boldStyle);

            // Tab 4: Redemption Investment
            createRedemptionSheet(workbook, "Redemption Investment", redemptions, schemeMap, headerStyle, dataStyle,
                    currencyStyle, rightAlignStyle, boldStyle);

            // Tab 5: SIP Details
            createSipSheet(workbook, "SIP Details", sips, schemeMap, headerStyle, dataStyle, currencyStyle, boldStyle);

            workbook.write(out);
            byte[] bytes = out.toByteArray();

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Mutual_Funds_Ledger.xlsx\"");

            return ResponseEntity.ok()
                    .headers(httpHeaders)
                    .body(bytes);

        } catch (Exception e) {
            throw new RuntimeException("Error generating Mutual Funds Excel export", e);
        }
    }

    // ── Helper to render Sheet Title Row ───────────────────────────────────────
    private static void renderSheetTitle(Sheet sheet, Workbook workbook, String title, int colCount) {
        Row titleRow = sheet.createRow(0);
        titleRow.setHeightInPoints(28);
        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 14));
        setCellBackground(workbook, titleStyle, "#dbeafe");
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, titleStyle);

        // Fill all cells in title row for styling
        for (int col = 0; col < colCount; col++) {
            Cell c = titleRow.createCell(col);
            c.setCellStyle(titleStyle);
        }
        titleRow.getCell(0).setCellValue(title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, colCount - 1));

        // Row 1: Spacer
        Row spacerRow = sheet.createRow(1);
        spacerRow.setHeightInPoints(15);
    }

    // ── Helper to render Summary Card/Header on main page (like EPF Exporter) ──
    private static int renderSummaryHeader(Sheet sheet, Workbook workbook, OverallSummaryDto summary, int colCount) {
        if (summary == null) {
            return 0;
        }

        // Row 0: Title row
        renderSheetTitle(sheet, workbook, "Mutual Fund Portfolio Summary", colCount);

        // Row 2: Summary Header labels
        Row sumHeaderRow = sheet.createRow(2);
        sumHeaderRow.setHeightInPoints(20);

        CellStyle sumHeaderStyle = workbook.createCellStyle();
        setCellBackground(workbook, sumHeaderStyle, "#e2e8f0");
        sumHeaderStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 10));
        sumHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
        sumHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, sumHeaderStyle);

        String[] sumHeaders = {
                "Total Invested", "Current Invested (Ledger)", "Total Redeemed", "Overall Valuation P&L",
                "Active SIPs Count"
        };

        for (int i = 0; i < sumHeaders.length; i++) {
            Cell cell = sumHeaderRow.createCell(i);
            cell.setCellValue(sumHeaders[i]);
            cell.setCellStyle(sumHeaderStyle);
        }
        // Fill remaining columns of Row 2 with empty cells styled with sumHeaderStyle
        for (int i = sumHeaders.length; i < colCount; i++) {
            Cell cell = sumHeaderRow.createCell(i);
            cell.setCellStyle(sumHeaderStyle);
        }

        // Row 3: Summary Values row
        Row sumValueRow = sheet.createRow(3);
        sumValueRow.setHeightInPoints(24);

        CellStyle sumValueStyle = workbook.createCellStyle();
        setCellBackground(workbook, sumValueStyle, "#e2f2e9");
        sumValueStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 11));
        sumValueStyle.setAlignment(HorizontalAlignment.RIGHT);
        sumValueStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        sumValueStyle.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
        applyGridBorders(workbook, sumValueStyle);

        CellStyle countStyle = workbook.createCellStyle();
        countStyle.cloneStyleFrom(sumValueStyle);
        countStyle.setAlignment(HorizontalAlignment.CENTER);
        countStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));

        double totInvested = summary.getTotalInvested() != null ? summary.getTotalInvested().doubleValue() : 0.0;
        double currentInvest = summary.getCurrentInvestment() != null ? summary.getCurrentInvestment().doubleValue()
                : 0.0;
        double totRedeemed = summary.getTotalRedeemed() != null ? summary.getTotalRedeemed().doubleValue() : 0.0;
        double overallPL = summary.getOverallPL() != null ? summary.getOverallPL().doubleValue() : 0.0;
        int activeSips = summary.getActiveSipCount();

        Cell c0 = sumValueRow.createCell(0);
        c0.setCellValue(totInvested);
        c0.setCellStyle(sumValueStyle);
        Cell c1 = sumValueRow.createCell(1);
        c1.setCellValue(currentInvest);
        c1.setCellStyle(sumValueStyle);
        Cell c2 = sumValueRow.createCell(2);
        c2.setCellValue(totRedeemed);
        c2.setCellStyle(sumValueStyle);
        Cell c3 = sumValueRow.createCell(3);
        c3.setCellValue(overallPL);
        c3.setCellStyle(sumValueStyle);
        Cell c4 = sumValueRow.createCell(4);
        c4.setCellValue(activeSips);
        c4.setCellStyle(countStyle);

        // Fill remaining columns of Row 3 with empty cells styled with sumValueStyle
        for (int i = 5; i < colCount; i++) {
            Cell cell = sumValueRow.createCell(i);
            cell.setCellStyle(sumValueStyle);
        }

        // Row 4: Empty spacer row
        Row spacerRow = sheet.createRow(4);
        spacerRow.setHeightInPoints(15);

        return 5;
    }

        // ── Tab 1: MF Investment ──────────────────────────────────────────────────
    private static void createMfInvestmentSheet(Workbook workbook, String sheetName, List<SchemeSummaryDto> data,
            Map<String, MfScheme> schemeMap, OverallSummaryDto summary, List<SipContribution> sips,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle currencyStyle, CellStyle boldStyle,
            CellStyle rightAlignStyle) {
        Sheet sheet = workbook.createSheet(sheetName);

        // Sort data: Place -> Status Priority -> Scheme Name (Ascending)
        List<SchemeSummaryDto> sortedData = new ArrayList<>(data);
        sortedData.sort(Comparator.comparing((SchemeSummaryDto dto) -> dto.getPlatform() != null ? dto.getPlatform() : "")
                .thenComparing((SchemeSummaryDto dto) -> {
                    Set<FundStatus> statuses = dto.getStatuses() != null ? dto.getStatuses() : new HashSet<>();
                    if (statuses.contains(FundStatus.SIP)) return 1;
                    if (statuses.contains(FundStatus.LUMPSUM) && !statuses.contains(FundStatus.FULLY_REDEEMED)) return 2;
                    return 3;
                })
                .thenComparing(dto -> dto.getSchemeName() != null ? dto.getSchemeName() : ""));

        // Determine min and max SIP months for dynamic columns
        YearMonth minMonth = null;
        YearMonth maxMonth = null;
        Map<String, Map<YearMonth, BigDecimal>> sipMatrix = new HashMap<>();
        Map<String, LocalDate> sipStartDates = new HashMap<>();
        Map<String, LocalDate> sipStopDates = new HashMap<>();

        if (sips != null && !sips.isEmpty()) {
            for (SipContribution sip : sips) {
                if (sip.getContributionDate() == null || sip.getAmount() == null) continue;
                YearMonth ym = YearMonth.from(sip.getContributionDate());
                if (minMonth == null || ym.isBefore(minMonth)) minMonth = ym;
                if (maxMonth == null || ym.isAfter(maxMonth)) maxMonth = ym;

                sipMatrix.computeIfAbsent(sip.getSchemeId(), k -> new HashMap<>())
                        .merge(ym, sip.getAmount(), BigDecimal::add);

                LocalDate currStart = sipStartDates.get(sip.getSchemeId());
                if (currStart == null || sip.getContributionDate().isBefore(currStart)) {
                    sipStartDates.put(sip.getSchemeId(), sip.getContributionDate());
                }

                LocalDate currStop = sipStopDates.get(sip.getSchemeId());
                if (currStop == null || sip.getContributionDate().isAfter(currStop)) {
                    sipStopDates.put(sip.getSchemeId(), sip.getContributionDate());
                }
            }
        }

        List<YearMonth> dynamicMonths = new ArrayList<>();
        if (minMonth != null && maxMonth != null) {
            YearMonth curr = minMonth;
            while (!curr.isAfter(maxMonth)) {
                dynamicMonths.add(curr);
                curr = curr.plusMonths(1);
            }
        }

        String[] staticHeaders = {
                "Mutual Fund Scheme", "Place", "MF Category", "Bank", "Folio No.", 
                "SIP start date", "SIP stop date", "Total Unit", "Total Investment", 
                "Current Investment", "Total Traded Value", "Lumpsum Investment", "SIP Investment"
        };

        int totalCols = staticHeaders.length + dynamicMonths.size();

        // Row 0: Summary header card
        int startRow = renderSummaryHeader(sheet, workbook, summary, totalCols);
        
        // Row 1: Merged Title Row (Krishil Mutual Fund & SIP details)
        Row titleRow = sheet.createRow(startRow);
        titleRow.setHeightInPoints(28);
        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 14));
        setCellBackground(workbook, titleStyle, "#dbeafe");
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        titleStyle.setAlignment(HorizontalAlignment.CENTER);
        applyGridBorders(workbook, titleStyle);

        for (int i = 0; i < totalCols; i++) {
            Cell c = titleRow.createCell(i);
            c.setCellStyle(titleStyle);
        }
        String dynamicHolderName = "User";
        if (data != null && !data.isEmpty()) {
            for (SchemeSummaryDto dto : data) {
                if (dto.getHolderName() != null && !dto.getHolderName().trim().isEmpty()) {
                    dynamicHolderName = dto.getHolderName();
                    break;
                }
            }
        }
        titleRow.getCell(0).setCellValue(dynamicHolderName + " Mutual Fund");
        sheet.addMergedRegion(new CellRangeAddress(startRow, startRow, 0, staticHeaders.length - 1));

        if (!dynamicMonths.isEmpty()) {
            titleRow.getCell(staticHeaders.length).setCellValue("SIP details");
            sheet.addMergedRegion(new CellRangeAddress(startRow, startRow, staticHeaders.length, totalCols - 1));
        }

        // Row 2: Headers
        Row headerRow = sheet.createRow(startRow + 1);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < staticHeaders.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(staticHeaders[i]);
            cell.setCellStyle(headerStyle);
        }
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM-yy");
        for (int i = 0; i < dynamicMonths.size(); i++) {
            Cell cell = headerRow.createCell(staticHeaders.length + i);
            cell.setCellValue(dynamicMonths.get(i).format(monthFormatter));
            cell.setCellStyle(headerStyle);
        }

        // Styles for Green and Red rows
        CellStyle greenRowStyle = workbook.createCellStyle();
        greenRowStyle.cloneStyleFrom(dataStyle);
        setCellBackground(workbook, greenRowStyle, "#dcfce7"); // Light Green

        CellStyle redRowStyle = workbook.createCellStyle();
        redRowStyle.cloneStyleFrom(dataStyle);
        setCellBackground(workbook, redRowStyle, "#fee2e2"); // Light Red

        CellStyle greenCurrencyStyle = workbook.createCellStyle();
        greenCurrencyStyle.cloneStyleFrom(currencyStyle);
        setCellBackground(workbook, greenCurrencyStyle, "#dcfce7");

        CellStyle redCurrencyStyle = workbook.createCellStyle();
        redCurrencyStyle.cloneStyleFrom(currencyStyle);
        setCellBackground(workbook, redCurrencyStyle, "#fee2e2");

        CellStyle unitStyle = createUnitStyle(workbook);
        CellStyle greenUnitStyle = workbook.createCellStyle();
        greenUnitStyle.cloneStyleFrom(unitStyle);
        setCellBackground(workbook, greenUnitStyle, "#dcfce7");

        CellStyle redUnitStyle = workbook.createCellStyle();
        redUnitStyle.cloneStyleFrom(unitStyle);
        setCellBackground(workbook, redUnitStyle, "#fee2e2");

        // Freeze Panes: freeze rows up to headers, freeze only the first column (Mutual Fund Scheme)
        sheet.createFreezePane(1, startRow + 2);

        int rowIdx = startRow + 2;
        String currentPlace = null;
        int placeStartRow = rowIdx;

        for (int i = 0; i < sortedData.size(); i++) {
            SchemeSummaryDto dto = sortedData.get(i);
            MfScheme scheme = schemeMap.get(dto.getSchemeId());
            Set<FundStatus> statuses = dto.getStatuses() != null ? dto.getStatuses() : new HashSet<>();
            
            CellStyle currentRowStyle = dataStyle;
            CellStyle currentCurStyle = currencyStyle;
            CellStyle currentUnitStyle = unitStyle;

            if (statuses.contains(FundStatus.FULLY_REDEEMED)) {
                currentRowStyle = redRowStyle;
                currentCurStyle = redCurrencyStyle;
                currentUnitStyle = redUnitStyle;
            } else if (statuses.contains(FundStatus.SIP)) {
                currentRowStyle = greenRowStyle;
                currentCurStyle = greenCurrencyStyle;
                currentUnitStyle = greenUnitStyle;
            }

            Row row = sheet.createRow(rowIdx);
            row.setHeight((short)-1); // Auto fit height for wrapped text

            String place = dto.getPlatform() != null ? dto.getPlatform() : "-";
            
            // Merge Place cells if Place changes or at the end
            if (i > 0 && !place.equals(currentPlace)) {
                if (rowIdx - 1 > placeStartRow) {
                    sheet.addMergedRegion(new CellRangeAddress(placeStartRow, rowIdx - 1, 1, 1));
                }
                placeStartRow = rowIdx;
            }
            currentPlace = place;

            createCell(row, 0, dto.getSchemeName(), currentRowStyle);
            createCell(row, 1, place, currentRowStyle); // Will be merged
            createCell(row, 2, scheme != null ? scheme.getMfCategory() : "-", currentRowStyle);
            createCell(row, 3, dto.getBank() != null ? dto.getBank() : (scheme != null ? scheme.getBank() : "-"), currentRowStyle);
            createCell(row, 4, scheme != null ? scheme.getFolioNo() : "-", currentRowStyle);
            
            LocalDate startDate = sipStartDates.get(dto.getSchemeId());
            LocalDate stopDate = sipStopDates.get(dto.getSchemeId());
            createCell(row, 5, startDate != null ? formatDate(startDate) : "-", currentRowStyle);
            createCell(row, 6, stopDate != null ? formatDate(stopDate) : "-", currentRowStyle);
            
            createNumericCell(row, 7, dto.getTotalUnit() != null ? dto.getTotalUnit().doubleValue() : 0.0, currentUnitStyle);
            createNumericCell(row, 8, dto.getTotalInvestment() != null ? dto.getTotalInvestment().doubleValue() : 0.0, currentCurStyle);
            createNumericCell(row, 9, dto.getCurrentInvestment() != null ? dto.getCurrentInvestment().doubleValue() : 0.0, currentCurStyle);
            createNumericCell(row, 10, dto.getTotalTradedValue() != null ? dto.getTotalTradedValue().doubleValue() : 0.0, currentCurStyle);
            createNumericCell(row, 11, dto.getLumpsumInvestment() != null ? dto.getLumpsumInvestment().doubleValue() : 0.0, currentCurStyle);
            createNumericCell(row, 12, dto.getSipInvestment() != null ? dto.getSipInvestment().doubleValue() : 0.0, currentCurStyle);

            Map<YearMonth, BigDecimal> schemeSips = sipMatrix.getOrDefault(dto.getSchemeId(), Collections.emptyMap());
            for (int m = 0; m < dynamicMonths.size(); m++) {
                BigDecimal sipAmt = schemeSips.get(dynamicMonths.get(m));
                if (sipAmt != null && sipAmt.compareTo(BigDecimal.ZERO) > 0) {
                    createNumericCell(row, staticHeaders.length + m, sipAmt.doubleValue(), currentCurStyle);
                } else {
                    createCell(row, staticHeaders.length + m, "-", currentRowStyle);
                }
            }
            rowIdx++;
        }

        // Merge the last place group
        if (rowIdx - 1 > placeStartRow) {
            sheet.addMergedRegion(new CellRangeAddress(placeStartRow, rowIdx - 1, 1, 1));
        }

        ExcelExportUtil.autoSizeColumns(sheet, totalCols, 20);
    }

    // ── Tab 2: Investment & Valuation ──────────────────────────────────────────
    private static void createValuationSheet(Workbook workbook, String sheetName, List<ValuationSnapshot> data,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle currencyStyle, CellStyle percentStyle,
            CellStyle boldStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        String[] headers = {
                "Holder Name", "Platform", "Snapshot Date", "Invested Value", "Current Value", "Period P&L",
                "Period P&L %"
        };

        renderSheetTitle(sheet, workbook, "Mutual Fund Valuation History", headers.length);
        int startRow = 2;

        Row headerRow = sheet.createRow(startRow);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (int i = 0; i < data.size(); i++) {
            ValuationSnapshot snap = data.get(i);
            Row row = sheet.createRow(startRow + 1 + i);
            row.setHeightInPoints(22);

            createCell(row, 0, snap.getHolderName(), dataStyle);
            createCell(row, 1, snap.getPlatform(), boldStyle);
            createCell(row, 2, formatDate(snap.getSnapshotDate()), dataStyle);

            createNumericCell(row, 3, snap.getInvestmentValue() != null ? snap.getInvestmentValue().doubleValue() : 0.0,
                    currencyStyle);
            createNumericCell(row, 4, snap.getCurrentValue() != null ? snap.getCurrentValue().doubleValue() : 0.0,
                    currencyStyle);
            createNumericCell(row, 5, snap.getPeriodPL() != null ? snap.getPeriodPL().doubleValue() : 0.0,
                    currencyStyle);
            createNumericCell(row, 6,
                    snap.getPeriodPLPercent() != null ? snap.getPeriodPLPercent().doubleValue() / 100.0 : 0.0,
                    percentStyle);
        }

        if (!data.isEmpty()) {
            int totalRowIdx = startRow + 1 + data.size();
            Row totalRow = sheet.createRow(totalRowIdx);
            totalRow.setHeightInPoints(24);

            CellStyle totalLabelStyle = createTotalLabelStyle(workbook);
            CellStyle totalCurrencyStyle = createTotalCurrencyStyle(workbook);

            for (int col = 0; col < headers.length; col++) {
                Cell cell = totalRow.createCell(col);
                cell.setCellStyle(totalLabelStyle);
            }

            totalRow.getCell(0).setCellValue("Total");

            double totInvested = data.stream()
                    .mapToDouble(d -> d.getInvestmentValue() != null ? d.getInvestmentValue().doubleValue() : 0.0)
                    .sum();
            double totCurrent = data.stream()
                    .mapToDouble(d -> d.getCurrentValue() != null ? d.getCurrentValue().doubleValue() : 0.0).sum();
            double totPL = data.stream().mapToDouble(d -> d.getPeriodPL() != null ? d.getPeriodPL().doubleValue() : 0.0)
                    .sum();

            Cell c3 = totalRow.getCell(3);
            c3.setCellValue(totInvested);
            c3.setCellStyle(totalCurrencyStyle);
            Cell c4 = totalRow.getCell(4);
            c4.setCellValue(totCurrent);
            c4.setCellStyle(totalCurrencyStyle);
            Cell c5 = totalRow.getCell(5);
            c5.setCellValue(totPL);
            c5.setCellStyle(totalCurrencyStyle);

            if (totInvested != 0.0) {
                double overallPLPercent = totPL / totInvested;
                CellStyle totalPercentStyle = workbook.createCellStyle();
                totalPercentStyle.cloneStyleFrom(totalCurrencyStyle);
                totalPercentStyle.setDataFormat(workbook.createDataFormat().getFormat("0.00%"));
                Cell c6 = totalRow.getCell(6);
                c6.setCellValue(overallPLPercent);
                c6.setCellStyle(totalPercentStyle);
            }
        }

        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
    }

    // ── Tab 3: Lumpsum Investment ──────────────────────────────────────────────
    private static void createLumpsumSheet(Workbook workbook, String sheetName, List<LumpsumTransaction> data,
            Map<String, MfScheme> schemeMap,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle currencyStyle, CellStyle rightAlignStyle,
            CellStyle boldStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        String[] headers = {
                "Investment date", "Mutual Fund Scheme", "Folio No.", "Place", "Whom MF", "Lumpsum Amount", 
                "NAV Price", "Units", "Debited Bank", "Remarks"
        };

        renderSheetTitle(sheet, workbook, "Lumpsum Investments", headers.length);
        int startRow = 2;

        Row headerRow = sheet.createRow(startRow);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        CellStyle unitStyle = createUnitStyle(workbook);
        CellStyle fyHeaderStyle = createFyHeaderStyle(workbook);
        CellStyle subtotalCurrencyStyle = createSubtotalCurrencyStyle(workbook);
        
        CellStyle totalUnitStyle = workbook.createCellStyle();
        totalUnitStyle.cloneStyleFrom(createTotalLabelStyle(workbook));
        totalUnitStyle.setAlignment(HorizontalAlignment.RIGHT);
        totalUnitStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.000"));

        List<LumpsumTransaction> sortedData = new java.util.ArrayList<>(data);
        sortedData.sort((t1, t2) -> {
            if (t1.getInvestmentDate() == null && t2.getInvestmentDate() == null) return 0;
            if (t1.getInvestmentDate() == null) return 1;
            if (t2.getInvestmentDate() == null) return -1;
            return t1.getInvestmentDate().compareTo(t2.getInvestmentDate());
        });

        java.util.Map<String, List<LumpsumTransaction>> fyMap = new java.util.LinkedHashMap<>();
        for (LumpsumTransaction tx : sortedData) {
            String fy = tx.getInvestmentDate() != null ? getFinancialYear(tx.getInvestmentDate()) : "Unknown";
            fyMap.computeIfAbsent(fy, k -> new java.util.ArrayList<>()).add(tx);
        }

        int currentRow = startRow + 1;
        for (Map.Entry<String, List<LumpsumTransaction>> entry : fyMap.entrySet()) {
            String fy = entry.getKey();
            List<LumpsumTransaction> txs = entry.getValue();

            Row fyRow = sheet.createRow(currentRow++);
            fyRow.setHeightInPoints(22);
            Cell fyCell = fyRow.createCell(0);
            fyCell.setCellValue(fy);
            fyCell.setCellStyle(fyHeaderStyle);
            sheet.addMergedRegion(new CellRangeAddress(fyRow.getRowNum(), fyRow.getRowNum(), 0, headers.length - 1));

            double fyTotLumpsum = 0.0;
            double fyTotUnits = 0.0;

            for (LumpsumTransaction tx : txs) {
                MfScheme scheme = schemeMap.get(tx.getSchemeId());
                Row row = sheet.createRow(currentRow++);
                row.setHeightInPoints(22);

                createCell(row, 0, formatDate(tx.getInvestmentDate()), dataStyle);
                createCell(row, 1, scheme != null ? scheme.getSchemeName() : "-", boldStyle);
                createCell(row, 2, scheme != null ? scheme.getFolioNo() : "-", dataStyle);
                createCell(row, 3, scheme != null ? scheme.getPlatform() : "-", dataStyle);
                createCell(row, 4, scheme != null ? scheme.getHolderName() : "-", dataStyle);

                double amt = tx.getLumpsumInvestment() != null ? tx.getLumpsumInvestment().doubleValue() : 0.0;
                createNumericCell(row, 5, amt, currencyStyle);
                fyTotLumpsum += amt;

                createNumericCell(row, 6, tx.getNavPrice() != null ? tx.getNavPrice().doubleValue() : 0.0, currencyStyle);
                
                double units = tx.getTotalUnit() != null ? tx.getTotalUnit().doubleValue() : 0.0;
                createNumericCell(row, 7, units, unitStyle);
                fyTotUnits += units;

                createCell(row, 8, tx.getDebitedBank() != null ? tx.getDebitedBank() : "-", dataStyle);
                createCell(row, 9, tx.getRemarks() != null ? tx.getRemarks() : "-", dataStyle);
            }

            Row subtotalRow = sheet.createRow(currentRow++);
            subtotalRow.setHeightInPoints(24);
            
            Cell totalLabelCell = subtotalRow.createCell(0);
            totalLabelCell.setCellValue("Total " + fy);
            totalLabelCell.setCellStyle(createTotalLabelStyle(workbook));
            
            Cell c5 = subtotalRow.createCell(5);
            c5.setCellValue(fyTotLumpsum);
            c5.setCellStyle(subtotalCurrencyStyle);

            Cell c7 = subtotalRow.createCell(7);
            c7.setCellValue(fyTotUnits);
            c7.setCellStyle(totalUnitStyle);

            Row spacerRow = sheet.createRow(currentRow++);
            spacerRow.setHeightInPoints(15);
        }

        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
    }

    // ── Tab 4: Redemption Investment ───────────────────────────────────────────
    private static void createRedemptionSheet(Workbook workbook, String sheetName, List<RedemptionTransaction> data,
            Map<String, MfScheme> schemeMap,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle currencyStyle, CellStyle rightAlignStyle,
            CellStyle boldStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        String[] headers = {
                "Redemption date", "Mutual Fund Scheme", "Folio No.", "Place", "Whom MF", "Total Unit",
                "Redemption Unit", "Balance Unit", "Total Investment", "Trade Investment Value",
                "Balance Investment", "Redemption NAV", "Redemption value", "LTCG/STCG",
                "Annum return %", "Amount credited Bank", "Remarks"
        };

        int startRow = 0;

        Row headerRow = sheet.createRow(startRow);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        CellStyle unitStyle = createUnitStyle(workbook);
        CellStyle fyHeaderStyle = createFyHeaderStyle(workbook);
        CellStyle subtotalCurrencyStyle = createSubtotalCurrencyStyle(workbook);
        
        CellStyle multilineCurrencyStyle = workbook.createCellStyle();
        multilineCurrencyStyle.cloneStyleFrom(currencyStyle);
        multilineCurrencyStyle.setWrapText(true);

        List<RedemptionTransaction> sortedData = new java.util.ArrayList<>(data);
        sortedData.sort((t1, t2) -> {
            if (t1.getRedemptionDate() == null && t2.getRedemptionDate() == null) return 0;
            if (t1.getRedemptionDate() == null) return 1;
            if (t2.getRedemptionDate() == null) return -1;
            return t1.getRedemptionDate().compareTo(t2.getRedemptionDate());
        });

        java.util.Map<String, List<RedemptionTransaction>> fyMap = new java.util.LinkedHashMap<>();
        for (RedemptionTransaction tx : sortedData) {
            String fy = tx.getRedemptionDate() != null ? getFinancialYear(tx.getRedemptionDate()) : "Unknown";
            fyMap.computeIfAbsent(fy, k -> new java.util.ArrayList<>()).add(tx);
        }

        int currentRow = startRow + 1;
        for (Map.Entry<String, List<RedemptionTransaction>> entry : fyMap.entrySet()) {
            String fy = entry.getKey();
            List<RedemptionTransaction> txs = entry.getValue();

            Row fyRow = sheet.createRow(currentRow++);
            fyRow.setHeightInPoints(22);
            Cell fyCell = fyRow.createCell(0);
            fyCell.setCellValue(fy);
            fyCell.setCellStyle(fyHeaderStyle);
            sheet.addMergedRegion(new CellRangeAddress(fyRow.getRowNum(), fyRow.getRowNum(), 0, headers.length - 1));

            double fyTotRedemptionValue = 0.0;
            double fyTotGain = 0.0;

            for (RedemptionTransaction tx : txs) {
                MfScheme scheme = schemeMap.get(tx.getSchemeId());
                Row row = sheet.createRow(currentRow++);
                row.setHeightInPoints(22);

                createCell(row, 0, formatDate(tx.getRedemptionDate()), dataStyle);
                createCell(row, 1, scheme != null ? scheme.getSchemeName() : "-", boldStyle);
                createCell(row, 2, scheme != null ? scheme.getFolioNo() : "-", dataStyle);
                createCell(row, 3, scheme != null ? scheme.getPlatform() : "-", dataStyle);
                createCell(row, 4, scheme != null ? scheme.getHolderName() : "-", dataStyle);

                createNumericCell(row, 5, tx.getTotalUnit() != null ? tx.getTotalUnit().doubleValue() : 0.0, unitStyle);
                createNumericCell(row, 6, tx.getRedemptionUnit() != null ? tx.getRedemptionUnit().doubleValue() : 0.0, unitStyle);
                createNumericCell(row, 7, tx.getBalanceUnit() != null ? tx.getBalanceUnit().doubleValue() : 0.0, unitStyle);

                createNumericCell(row, 8, tx.getTotalInvestment() != null ? tx.getTotalInvestment().doubleValue() : 0.0, currencyStyle);
                createNumericCell(row, 9, tx.getTradeInvestmentValue() != null ? tx.getTradeInvestmentValue().doubleValue() : 0.0, currencyStyle);
                createNumericCell(row, 10, tx.getBalanceInvestment() != null ? tx.getBalanceInvestment().doubleValue() : 0.0, currencyStyle);

                createNumericCell(row, 11, tx.getRedemptionNav() != null ? tx.getRedemptionNav().doubleValue() : 0.0, dataStyle); // NAV
                
                double redVal = tx.getNetRedemptionValue() != null ? tx.getNetRedemptionValue().doubleValue()
                        : (tx.getRedemptionValue() != null ? tx.getRedemptionValue().doubleValue() : 0.0);
                        
                // NOTE: Kept for reference. Using multiline strings breaks Excel's ability to sum rows natively.
                /*
                boolean hasDeductions = (tx.getSttAmount() != null && tx.getSttAmount().doubleValue() > 0) 
                                     || (tx.getExitLoadDeducted() != null && tx.getExitLoadDeducted().doubleValue() > 0);
                                     
                if (hasDeductions) {
                    java.text.NumberFormat format = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("en", "IN"));
                    StringBuilder sb = new StringBuilder();
                    sb.append(format.format(redVal)).append("\n-- Deductions --\nGross: ")
                      .append(format.format(tx.getRedemptionValue()));
                    if (tx.getExitLoadDeducted() != null && tx.getExitLoadDeducted().doubleValue() > 0) {
                        sb.append("\nExit Load: -").append(format.format(tx.getExitLoadDeducted()));
                    }
                    if (tx.getSttAmount() != null && tx.getSttAmount().doubleValue() > 0) {
                        sb.append("\nSTT: -").append(format.format(tx.getSttAmount()));
                    }
                    Cell cell = row.createCell(12);
                    cell.setCellValue(sb.toString());
                    cell.setCellStyle(multilineCurrencyStyle);
                    row.setHeight((short)-1); // Auto fit height for multiline
                } else {
                    createNumericCell(row, 12, redVal, currencyStyle);
                }
                */
                
                createNumericCell(row, 12, redVal, currencyStyle);
                fyTotRedemptionValue += redVal;

                double gain = tx.getCapitalGain() != null ? tx.getCapitalGain().doubleValue() : 0.0;
                
                /*
                if (tx.getGainType() != null) {
                    java.text.NumberFormat format = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("en", "IN"));
                    String gainText = format.format(gain) + "\n" + tx.getGainType().name();
                    Cell cell = row.createCell(13);
                    cell.setCellValue(gainText);
                    cell.setCellStyle(multilineCurrencyStyle);
                    row.setHeight((short)-1); // Auto fit height
                } else {
                    createNumericCell(row, 13, gain, currencyStyle);
                }
                */
                
                createNumericCell(row, 13, gain, currencyStyle);
                fyTotGain += gain;

                createCell(row, 14, "", dataStyle); // Annum return %
                createCell(row, 15, scheme != null ? scheme.getBank() : "-", dataStyle);
                createCell(row, 16, tx.getRemarks() != null ? tx.getRemarks() : "", dataStyle);
            }

            Row subtotalRow = sheet.createRow(currentRow++);
            subtotalRow.setHeightInPoints(24);
            
            Cell totalLabelCell = subtotalRow.createCell(0);
            totalLabelCell.setCellValue("Total " + fy);
            totalLabelCell.setCellStyle(createTotalLabelStyle(workbook));
            
            Cell c12 = subtotalRow.createCell(12);
            c12.setCellValue(fyTotRedemptionValue);
            c12.setCellStyle(subtotalCurrencyStyle);

            Cell c13 = subtotalRow.createCell(13);
            c13.setCellValue(fyTotGain);
            c13.setCellStyle(subtotalCurrencyStyle);

            Row spacerRow = sheet.createRow(currentRow++);
            spacerRow.setHeightInPoints(15);
        }

        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
    }

    // ── Tab 5: SIP Details ────────────────────────────────────────────────────
    private static void createSipSheet(Workbook workbook, String sheetName, List<SipContribution> data,
            Map<String, MfScheme> schemeMap,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle currencyStyle, CellStyle boldStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        String[] headers = {
                "Holder Name", "Scheme Name", "Contribution Month", "Amount", "Remarks"
        };

        renderSheetTitle(sheet, workbook, "SIP Contributions", headers.length);
        int startRow = 2;

        Row headerRow = sheet.createRow(startRow);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (int i = 0; i < data.size(); i++) {
            SipContribution tx = data.get(i);
            MfScheme scheme = schemeMap.get(tx.getSchemeId());
            Row row = sheet.createRow(startRow + 1 + i);
            row.setHeightInPoints(22);

            createCell(row, 0, scheme != null ? scheme.getHolderName() : "-", dataStyle);
            createCell(row, 1, scheme != null ? scheme.getSchemeName() : "-", boldStyle);
            createCell(row, 2, formatDate(tx.getContributionDate()), dataStyle);
            createNumericCell(row, 3, tx.getAmount() != null ? tx.getAmount().doubleValue() : 0.0, currencyStyle);
            createCell(row, 4, tx.getRemarks() != null ? tx.getRemarks() : "-", dataStyle);
        }

        if (!data.isEmpty()) {
            int totalRowIdx = startRow + 1 + data.size();
            Row totalRow = sheet.createRow(totalRowIdx);
            totalRow.setHeightInPoints(24);

            CellStyle totalLabelStyle = createTotalLabelStyle(workbook);
            CellStyle totalCurrencyStyle = createTotalCurrencyStyle(workbook);

            for (int col = 0; col < headers.length; col++) {
                Cell cell = totalRow.createCell(col);
                cell.setCellStyle(totalLabelStyle);
            }

            totalRow.getCell(0).setCellValue("Total");

            double totAmt = data.stream().mapToDouble(d -> d.getAmount() != null ? d.getAmount().doubleValue() : 0.0)
                    .sum();
            Cell c3 = totalRow.getCell(3);
            c3.setCellValue(totAmt);
            c3.setCellStyle(totalCurrencyStyle);
        }

        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
    }

    // ── Helper Styles & Cell Creators ─────────────────────────────────────────
    private static void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private static void createNumericCell(Row row, int column, Double value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value);
        } else {
            cell.setCellValue("");
        }
        cell.setCellStyle(style);
    }

    private static void applyGridBorders(Workbook workbook, CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        if (style instanceof org.apache.poi.xssf.usermodel.XSSFCellStyle) {
            org.apache.poi.xssf.usermodel.XSSFCellStyle xssfStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) style;
            byte[] borderRgb = new byte[] { (byte) 203, (byte) 213, (byte) 225 }; // #cbd5e1
            org.apache.poi.xssf.usermodel.XSSFColor borderColor = new org.apache.poi.xssf.usermodel.XSSFColor(borderRgb,
                    new org.apache.poi.xssf.usermodel.DefaultIndexedColorMap());
            xssfStyle.setTopBorderColor(borderColor);
            xssfStyle.setBottomBorderColor(borderColor);
            xssfStyle.setLeftBorderColor(borderColor);
            xssfStyle.setRightBorderColor(borderColor);
        }
    }

    private static void setCellBackground(Workbook workbook, CellStyle style, String hexColor) {
        if (style instanceof org.apache.poi.xssf.usermodel.XSSFCellStyle
                && workbook instanceof org.apache.poi.xssf.usermodel.XSSFWorkbook) {
            org.apache.poi.xssf.usermodel.XSSFCellStyle xssfStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) style;
            int r = Integer.parseInt(hexColor.substring(1, 3), 16);
            int g = Integer.parseInt(hexColor.substring(3, 5), 16);
            int b = Integer.parseInt(hexColor.substring(5, 7), 16);
            byte[] rgb = new byte[] { (byte) r, (byte) g, (byte) b };
            org.apache.poi.xssf.usermodel.XSSFColor color = new org.apache.poi.xssf.usermodel.XSSFColor(rgb,
                    new org.apache.poi.xssf.usermodel.DefaultIndexedColorMap());
            xssfStyle.setFillForegroundColor(color);
            xssfStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
    }

    private static Font createCustomFont(Workbook workbook, String hexColor, boolean bold, short heightPoints) {
        Font font = workbook.createFont();
        font.setBold(bold);
        if (heightPoints > 0) {
            font.setFontHeightInPoints(heightPoints);
        }
        if (font instanceof org.apache.poi.xssf.usermodel.XSSFFont
                && workbook instanceof org.apache.poi.xssf.usermodel.XSSFWorkbook) {
            org.apache.poi.xssf.usermodel.XSSFFont xssfFont = (org.apache.poi.xssf.usermodel.XSSFFont) font;
            int r = Integer.parseInt(hexColor.substring(1, 3), 16);
            int g = Integer.parseInt(hexColor.substring(3, 5), 16);
            int b = Integer.parseInt(hexColor.substring(5, 7), 16);
            byte[] rgb = new byte[] { (byte) r, (byte) g, (byte) b };
            org.apache.poi.xssf.usermodel.XSSFColor color = new org.apache.poi.xssf.usermodel.XSSFColor(rgb,
                    new org.apache.poi.xssf.usermodel.DefaultIndexedColorMap());
            xssfFont.setColor(color);
        }
        return font;
    }

    private static CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 11));
        setCellBackground(workbook, style, "#e2e8f0");
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createRightAlignStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createBoldStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("[$₹-en-IN]#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createPercentStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("0.00%"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createTotalLabelStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 11));
        setCellBackground(workbook, style, "#e2e8f0");
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createTotalCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 11));
        setCellBackground(workbook, style, "#e2e8f0");
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("[$₹-en-IN]#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createUnitStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.000"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createFyHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 11)); // bold dark slate
        setCellBackground(workbook, style, "#e2f2e9"); // light green (EPF opening style)
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createSubtotalCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFont(createCustomFont(workbook, "#000000", true, (short) 11)); // bold black
        setCellBackground(workbook, style, "#c6efce"); // light green
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("[$₹-en-IN]#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private static String getFinancialYear(LocalDate date) {
        if (date == null)
            return "Unknown FY";
        int year = date.getYear();
        if (date.getMonthValue() < 4) {
            return "FY " + (year - 1) + " - " + String.format("%02d", year % 100);
        } else {
            return "FY " + year + " - " + String.format("%02d", (year + 1) % 100);
        }
    }

    private static String formatDate(LocalDate date) {
        if (date == null)
            return "-";
        return String.format("%02d.%02d.%d", date.getDayOfMonth(), date.getMonthValue(), date.getYear());
    }

    private static String formatYearMonth(YearMonth ym) {
        if (ym == null)
            return "-";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        return ym.format(formatter);
    }

    private static String formatStatus(java.util.Set<FundStatus> statuses) {
        if (statuses == null || statuses.isEmpty())
            return "";
        return statuses.stream()
                .map(s -> {
                    switch (s) {
                        case SIP:
                            return "SIP";
                        case LUMPSUM:
                            return "Lumpsum";
                        case PARTIALLY_REDEEMED:
                            return "Partially Redeemed";
                        case FULLY_REDEEMED:
                            return "Fully Redeemed";
                        case CREATED:
                            return "Created";
                        default:
                            return s.name();
                    }
                })
                .collect(java.util.stream.Collectors.joining(" + "));
    }
}
