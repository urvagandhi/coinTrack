package com.urva.myfinance.coinTrack.mutualfund.util;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

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
            createMfInvestmentSheet(workbook, "MF Investment", summaries, schemeMap, summary, headerStyle, dataStyle,
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
            Map<String, MfScheme> schemeMap, OverallSummaryDto summary,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle currencyStyle, CellStyle boldStyle,
            CellStyle rightAlignStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        String[] headers = {
                "Holder Name", "Scheme Name", "Platform", "Category", "Folio No", "Status",
                "Total Invested", "Current Invested", "Total Redeemed", "Total Units"
        };

        // Render summary header card if overall summary is available
        int startRow = renderSummaryHeader(sheet, workbook, summary, headers.length);
        if (startRow == 0) {
            renderSheetTitle(sheet, workbook, "Mutual Fund Investments", headers.length);
            startRow = 2;
        }

        Row headerRow = sheet.createRow(startRow);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        CellStyle unitStyle = createUnitStyle(workbook);

        for (int i = 0; i < data.size(); i++) {
            SchemeSummaryDto dto = data.get(i);
            MfScheme scheme = schemeMap.get(dto.getSchemeId());
            Row row = sheet.createRow(startRow + 1 + i);
            row.setHeightInPoints(22);

            createCell(row, 0, dto.getHolderName(), dataStyle);
            createCell(row, 1, dto.getSchemeName(), boldStyle);
            createCell(row, 2, dto.getPlatform(), dataStyle);
            createCell(row, 3, scheme != null ? scheme.getMfCategory() : "-", dataStyle);
            createCell(row, 4, scheme != null ? scheme.getFolioNo() : "-", dataStyle);
            createCell(row, 5, formatStatus(dto.getStatuses()), dataStyle);

            createNumericCell(row, 6, dto.getTotalInvestment() != null ? dto.getTotalInvestment().doubleValue() : 0.0,
                    currencyStyle);
            createNumericCell(row, 7,
                    dto.getCurrentInvestment() != null ? dto.getCurrentInvestment().doubleValue() : 0.0, currencyStyle);
            createNumericCell(row, 8, dto.getTotalTradedValue() != null ? dto.getTotalTradedValue().doubleValue() : 0.0,
                    currencyStyle);
            createNumericCell(row, 9, dto.getTotalUnit() != null ? dto.getTotalUnit().doubleValue() : 0.0, unitStyle);
        }

        // Summary Total Row
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
                    .mapToDouble(d -> d.getTotalInvestment() != null ? d.getTotalInvestment().doubleValue() : 0.0)
                    .sum();
            double totCurrent = data.stream()
                    .mapToDouble(d -> d.getCurrentInvestment() != null ? d.getCurrentInvestment().doubleValue() : 0.0)
                    .sum();
            double totRedeemed = data.stream()
                    .mapToDouble(d -> d.getTotalTradedValue() != null ? d.getTotalTradedValue().doubleValue() : 0.0)
                    .sum();
            double totUnits = data.stream()
                    .mapToDouble(d -> d.getTotalUnit() != null ? d.getTotalUnit().doubleValue() : 0.0).sum();

            Cell c6 = totalRow.getCell(6);
            c6.setCellValue(totInvested);
            c6.setCellStyle(totalCurrencyStyle);
            Cell c7 = totalRow.getCell(7);
            c7.setCellValue(totCurrent);
            c7.setCellStyle(totalCurrencyStyle);
            Cell c8 = totalRow.getCell(8);
            c8.setCellValue(totRedeemed);
            c8.setCellStyle(totalCurrencyStyle);

            CellStyle totalUnitStyle = workbook.createCellStyle();
            totalUnitStyle.cloneStyleFrom(totalLabelStyle);
            totalUnitStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalUnitStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.000"));
            Cell c9 = totalRow.getCell(9);
            c9.setCellValue(totUnits);
            c9.setCellStyle(totalUnitStyle);
        }

        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
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
                "Txn No", "Holder Name", "Scheme Name", "Date", "Lumpsum Amount", "Units", "NAV Price", "Debited Bank",
                "Remarks"
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

        for (int i = 0; i < data.size(); i++) {
            LumpsumTransaction tx = data.get(i);
            MfScheme scheme = schemeMap.get(tx.getSchemeId());
            Row row = sheet.createRow(startRow + 1 + i);
            row.setHeightInPoints(22);

            createNumericCell(row, 0, tx.getTransactionNo() != null ? tx.getTransactionNo().doubleValue() : null,
                    rightAlignStyle);
            createCell(row, 1, scheme != null ? scheme.getHolderName() : "-", dataStyle);
            createCell(row, 2, scheme != null ? scheme.getSchemeName() : "-", boldStyle);
            createCell(row, 3, formatDate(tx.getInvestmentDate()), dataStyle);

            createNumericCell(row, 4, tx.getLumpsumInvestment() != null ? tx.getLumpsumInvestment().doubleValue() : 0.0,
                    currencyStyle);
            createNumericCell(row, 5, tx.getTotalUnit() != null ? tx.getTotalUnit().doubleValue() : 0.0, unitStyle);
            createNumericCell(row, 6, tx.getNavPrice() != null ? tx.getNavPrice().doubleValue() : 0.0, currencyStyle);

            createCell(row, 7, tx.getDebitedBank() != null ? tx.getDebitedBank() : "-", dataStyle);
            createCell(row, 8, tx.getRemarks() != null ? tx.getRemarks() : "-", dataStyle);
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

            double totAmt = data.stream()
                    .mapToDouble(d -> d.getLumpsumInvestment() != null ? d.getLumpsumInvestment().doubleValue() : 0.0)
                    .sum();
            Cell c4 = totalRow.getCell(4);
            c4.setCellValue(totAmt);
            c4.setCellStyle(totalCurrencyStyle);

            double totUnits = data.stream()
                    .mapToDouble(d -> d.getTotalUnit() != null ? d.getTotalUnit().doubleValue() : 0.0).sum();
            CellStyle totalUnitStyle = workbook.createCellStyle();
            totalUnitStyle.cloneStyleFrom(totalLabelStyle);
            totalUnitStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalUnitStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.000"));
            Cell c5 = totalRow.getCell(5);
            c5.setCellValue(totUnits);
            c5.setCellStyle(totalUnitStyle);
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
                "Txn No", "Holder Name", "Scheme Name", "Redemption Date", "Units Redeemed", "Redemption Value",
                "Capital Gain", "Gain Type", "Credited Bank"
        };

        renderSheetTitle(sheet, workbook, "Redemption Transactions", headers.length);
        int startRow = 2;

        Row headerRow = sheet.createRow(startRow);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        CellStyle unitStyle = createUnitStyle(workbook);

        for (int i = 0; i < data.size(); i++) {
            RedemptionTransaction tx = data.get(i);
            MfScheme scheme = schemeMap.get(tx.getSchemeId());
            Row row = sheet.createRow(startRow + 1 + i);
            row.setHeightInPoints(22);

            createNumericCell(row, 0, tx.getTransactionNo() != null ? tx.getTransactionNo().doubleValue() : null,
                    rightAlignStyle);
            createCell(row, 1, scheme != null ? scheme.getHolderName() : "-", dataStyle);
            createCell(row, 2, scheme != null ? scheme.getSchemeName() : "-", boldStyle);
            createCell(row, 3, formatDate(tx.getRedemptionDate()), dataStyle);

            createNumericCell(row, 4, tx.getRedemptionUnit() != null ? tx.getRedemptionUnit().doubleValue() : 0.0,
                    unitStyle);
            createNumericCell(row, 5, tx.getRedemptionValue() != null ? tx.getRedemptionValue().doubleValue() : 0.0,
                    currencyStyle);
            createNumericCell(row, 6, tx.getCapitalGain() != null ? tx.getCapitalGain().doubleValue() : 0.0,
                    currencyStyle);

            createCell(row, 7, tx.getGainType() != null ? tx.getGainType().name() : "-", dataStyle);
            createCell(row, 8, tx.getAmountCreditedBank() != null ? tx.getAmountCreditedBank() : "-", dataStyle);
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

            double totUnits = data.stream()
                    .mapToDouble(d -> d.getRedemptionUnit() != null ? d.getRedemptionUnit().doubleValue() : 0.0).sum();
            double totVal = data.stream()
                    .mapToDouble(d -> d.getRedemptionValue() != null ? d.getRedemptionValue().doubleValue() : 0.0)
                    .sum();
            double totGain = data.stream()
                    .mapToDouble(d -> d.getCapitalGain() != null ? d.getCapitalGain().doubleValue() : 0.0).sum();

            CellStyle totalUnitStyle = workbook.createCellStyle();
            totalUnitStyle.cloneStyleFrom(totalLabelStyle);
            totalUnitStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalUnitStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.000"));

            Cell c4 = totalRow.getCell(4);
            c4.setCellValue(totUnits);
            c4.setCellStyle(totalUnitStyle);
            Cell c5 = totalRow.getCell(5);
            c5.setCellValue(totVal);
            c5.setCellStyle(totalCurrencyStyle);
            Cell c6 = totalRow.getCell(6);
            c6.setCellValue(totGain);
            c6.setCellStyle(totalCurrencyStyle);
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
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setVerticalAlignment(VerticalAlignment.CENTER);
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
