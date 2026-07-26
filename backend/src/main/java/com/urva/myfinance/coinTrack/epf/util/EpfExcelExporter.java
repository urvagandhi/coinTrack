package com.urva.myfinance.coinTrack.epf.util;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.urva.myfinance.coinTrack.common.util.ExcelExportUtil;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.epf.dto.response.EpfSummaryDTO;
import com.urva.myfinance.coinTrack.epf.model.EpfInterestRate;

public class EpfExcelExporter {

    private EpfExcelExporter() {
    }

    private static class YearBalanceSummary {
        double openingEmpShare;
        double openingEmprShare;
    }

    private static class PrecalcMonthMap {
        String label;
        int creditMonth;
        int creditYearOffset;
        int monthsConsider;

        PrecalcMonthMap(String label, int creditMonth, int creditYearOffset, int monthsConsider) {
            this.label = label;
            this.creditMonth = creditMonth;
            this.creditYearOffset = creditYearOffset;
            this.monthsConsider = monthsConsider;
        }
    }

    private static class PrecalcTxnGroup {
        double employeeContribution = 0.0;
        double employerEpfContribution = 0.0;
        double vpfAmount = 0.0;
        double withdrawalAmount = 0.0;
    }

    private static class MonthDef {
        String label;
        int creditMonth;
        int creditYear;

        MonthDef(String label, int creditMonth, int creditYear) {
            this.label = label;
            this.creditMonth = creditMonth;
            this.creditYear = creditYear;
        }
    }

    private static class TxnGroup {
        double employeeContribution = 0.0;
        double employerEpfContribution = 0.0;
        double employerEpsContribution = 0.0;
        double vpfAmount = 0.0;
        double withdrawalAmount = 0.0;
        Double basicDA = null;
        Double epfBalance = null;
        Double epsBalance = null;
        List<EpfTransactionResponseDTO> txns = new java.util.ArrayList<>();
    }

    public static ResponseEntity<byte[]> export(List<EpfTransactionResponseDTO> transactions) {
        return export(transactions, List.of(), null);
    }

    public static ResponseEntity<byte[]> export(List<EpfTransactionResponseDTO> transactions,
            List<EpfInterestRate> rates) {
        return export(transactions, rates, null);
    }

    public static ResponseEntity<byte[]> export(List<EpfTransactionResponseDTO> transactions,
            List<EpfInterestRate> rates, EpfSummaryDTO summary) {
        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle rightAlignStyle = createRightAlignStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);

            // 1. Precalculate year opening balances (linear O(N) pass)
            Map<String, YearBalanceSummary> yearBalances = new java.util.HashMap<>();
            if (!transactions.isEmpty()) {
                List<EpfTransactionResponseDTO> sortedAll = transactions.stream()
                        .filter(t -> t.getTransactionDate() != null)
                        .sorted(Comparator.comparing(EpfTransactionResponseDTO::getTransactionDate))
                        .collect(Collectors.toList());

                if (!sortedAll.isEmpty()) {
                    int minYear = 2026;
                    int maxYear = 2026;
                    for (EpfTransactionResponseDTO t : sortedAll) {
                        String tFY = getFinancialYear(t.getTransactionDate());
                        if (tFY != null && !tFY.equals("Unknown")) {
                            try {
                                int sy = Integer.parseInt(tFY.split("-")[0]);
                                if (sy < minYear)
                                    minYear = sy;
                                if (sy > maxYear)
                                    maxYear = sy;
                            } catch (Exception e) {
                                // ignore
                            }
                        }
                    }

                    EpfTransactionResponseDTO firstTxn = sortedAll.get(0);
                    double firstTxnEmp = (firstTxn.getEmployeeContribution() != null
                            ? firstTxn.getEmployeeContribution().doubleValue()
                            : 0.0)
                            + (firstTxn.getVpfAmount() != null ? firstTxn.getVpfAmount().doubleValue() : 0.0);
                    double firstTxnEmpr = firstTxn.getEmployerEpfContribution() != null
                            ? firstTxn.getEmployerEpfContribution().doubleValue()
                            : 0.0;
                    double firstTxnWithdrawal = firstTxn.getWithdrawalAmount() != null
                            ? firstTxn.getWithdrawalAmount().doubleValue()
                            : 0.0;
                    double initialBalance = (firstTxn.getEpfBalance() != null ? firstTxn.getEpfBalance().doubleValue()
                            : 0.0)
                            - (firstTxnEmp + firstTxnEmpr - firstTxnWithdrawal);

                    double currentEmpClosing = Math.round((initialBalance / 2.0) * 100.0) / 100.0;
                    double currentEmprClosing = Math.round((initialBalance - currentEmpClosing) * 100.0) / 100.0;

                    List<PrecalcMonthMap> monthsMapping = List.of(
                            new PrecalcMonthMap("Mar", 4, 0, 11),
                            new PrecalcMonthMap("Apr", 5, 0, 10),
                            new PrecalcMonthMap("May", 6, 0, 9),
                            new PrecalcMonthMap("Jun", 7, 0, 8),
                            new PrecalcMonthMap("Jul", 8, 0, 7),
                            new PrecalcMonthMap("Aug", 9, 0, 6),
                            new PrecalcMonthMap("Sep", 10, 0, 5),
                            new PrecalcMonthMap("Oct", 11, 0, 4),
                            new PrecalcMonthMap("Nov", 12, 0, 3),
                            new PrecalcMonthMap("Dec", 1, 1, 2),
                            new PrecalcMonthMap("Jan", 2, 1, 1),
                            new PrecalcMonthMap("Feb", 3, 1, 0));

                    for (int y = minYear; y <= maxYear; y++) {
                        final int constY = y;
                        String yearFY = constY + "-" + String.format("%02d", (constY + 1) % 100);

                        double yearRate = 8.25;
                        if (rates != null) {
                            for (EpfInterestRate r : rates) {
                                if (yearFY.equals(r.getFinancialYear())) {
                                    if (r.getRatePercent() != null) {
                                        yearRate = r.getRatePercent().doubleValue();
                                    }
                                    break;
                                }
                            }
                        }

                        List<EpfTransactionResponseDTO> yearTxns = sortedAll.stream()
                                .filter(t -> t.getTransactionDate() != null
                                        && getFinancialYear(t.getTransactionDate()).equals(yearFY))
                                .collect(Collectors.toList());

                        YearBalanceSummary ySummary = new YearBalanceSummary();
                        ySummary.openingEmpShare = currentEmpClosing;
                        ySummary.openingEmprShare = currentEmprClosing;
                        yearBalances.put(yearFY, ySummary);

                        double yearEmpContrib = 0.0;
                        double yearEmprContrib = 0.0;

                        Map<String, PrecalcTxnGroup> txnMap = new java.util.HashMap<>();
                        for (EpfTransactionResponseDTO txn : yearTxns) {
                            if (txn.getRemarks() != null && txn.getRemarks().startsWith("Annual Interest Credit")) {
                                continue;
                            }
                            LocalDate d = txn.getTransactionDate();
                            String key = String.format("%d-%02d", d.getYear(), d.getMonthValue());
                            PrecalcTxnGroup group = txnMap.computeIfAbsent(key, k -> new PrecalcTxnGroup());
                            group.employeeContribution += (txn.getEmployeeContribution() != null
                                    ? txn.getEmployeeContribution().doubleValue()
                                    : 0.0);
                            group.employerEpfContribution += (txn.getEmployerEpfContribution() != null
                                    ? txn.getEmployerEpfContribution().doubleValue()
                                    : 0.0);
                            group.vpfAmount += (txn.getVpfAmount() != null ? txn.getVpfAmount().doubleValue() : 0.0);
                            group.withdrawalAmount += (txn.getWithdrawalAmount() != null
                                    ? txn.getWithdrawalAmount().doubleValue()
                                    : 0.0);
                        }

                        double yearEmpInterest = Math.round((currentEmpClosing * 12.0 * yearRate) / 1200.0 * 100.0)
                                / 100.0;
                        double yearEmprInterest = Math.round((currentEmprClosing * 12.0 * yearRate) / 1200.0 * 100.0)
                                / 100.0;

                        for (PrecalcMonthMap m : monthsMapping) {
                            int targetYear = constY + m.creditYearOffset;
                            String targetKey = String.format("%d-%02d", targetYear, m.creditMonth);
                            PrecalcTxnGroup grp = txnMap.get(targetKey);

                            double withdrawalAmt = grp != null ? grp.withdrawalAmount : 0.0;
                            double empShare = grp != null
                                    ? (grp.employeeContribution + grp.vpfAmount - (withdrawalAmt / 2.0))
                                    : 0.0;
                            double emprShare = grp != null ? (grp.employerEpfContribution - (withdrawalAmt / 2.0))
                                    : 0.0;

                            yearEmpContrib += empShare;
                            yearEmprContrib += emprShare;

                            yearEmpInterest += Math.round((empShare * m.monthsConsider * yearRate) / 1200.0 * 100.0)
                                    / 100.0;
                            yearEmprInterest += Math.round((emprShare * m.monthsConsider * yearRate) / 1200.0 * 100.0)
                                    / 100.0;
                        }

                        currentEmpClosing = Math.round((currentEmpClosing + yearEmpContrib + yearEmpInterest) * 100.0)
                                / 100.0;
                        currentEmprClosing = Math
                                .round((currentEmprClosing + yearEmprContrib + yearEmprInterest) * 100.0) / 100.0;
                    }
                }
            }

            // Tab 1: All Transactions (Passes summary to createSheet, so summary header is
            // rendered)
            createSheet(workbook, "All Transactions", transactions, summary, headerStyle, dataStyle, rightAlignStyle,
                    boldStyle, currencyStyle, percentStyle);

            // Group by Financial Year (Apr 1 - Mar 31)
            Map<String, List<EpfTransactionResponseDTO>> fyMap = transactions.stream()
                    .collect(Collectors.groupingBy(txn -> getFinancialYear(txn.getTransactionDate())));

            // Sort FYs in descending order
            List<String> sortedFys = fyMap.keySet().stream()
                    .sorted(Comparator.reverseOrder())
                    .collect(Collectors.toList());

            // Tab 2+: Financial Years (Does NOT pass summary to createFySheet, so no
            // summary header)
            for (String fy : sortedFys) {
                List<EpfTransactionResponseDTO> fyList = fyMap.get(fy);
                if (fyList != null && !fyList.isEmpty()) {
                    createFySheet(workbook, fy, fyList, rates, yearBalances, headerStyle, dataStyle, rightAlignStyle,
                            boldStyle, currencyStyle, percentStyle);
                }
            }

            workbook.write(out);
            byte[] bytes = out.toByteArray();

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"epf_transactions.xlsx\"");

            return ResponseEntity.ok()
                    .headers(httpHeaders)
                    .body(bytes);

        } catch (Exception e) {
            throw new RuntimeException("Error generating EPF Excel", e);
        }
    }

    private static String getFinancialYear(LocalDate date) {
        if (date == null)
            return "Unknown";
        int year = date.getYear();
        if (date.getMonthValue() >= 4) {
            return year + "-" + String.valueOf(year + 1).substring(2);
        } else {
            return (year - 1) + "-" + String.valueOf(year).substring(2);
        }
    }

    private static int renderSummaryHeader(Sheet sheet, Workbook workbook, EpfSummaryDTO summary, int colCount) {
        if (summary == null) {
            return 0;
        }

        // Row 0: Employee Provident Fund Title Row
        Row titleRow = sheet.createRow(0);
        titleRow.setHeightInPoints(28);
        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 14));
        setCellBackground(workbook, titleStyle, "#dbeafe");
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, titleStyle);

        // Fill all cells in title row for correct styling of merged cells
        for (int col = 0; col < colCount; col++) {
            Cell c = titleRow.createCell(col);
            c.setCellStyle(titleStyle);
        }
        titleRow.getCell(0).setCellValue("Employee Provident Fund");
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, colCount - 1));

        // Row 2: Summary Header Row
        Row sumHeaderRow = sheet.createRow(2);
        sumHeaderRow.setHeightInPoints(20);

        CellStyle sumHeaderStyle = workbook.createCellStyle();
        setCellBackground(workbook, sumHeaderStyle, "#e2e8f0");
        sumHeaderStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 10));
        sumHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
        sumHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, sumHeaderStyle);

        String[] sumHeaders = {
                "EPF Balance", "EPS Balance", "Employee Share", "Employer EPF Share", "Employer EPS Share",
                "Accrued Interest (FY)"
        };

        for (int i = 0; i < sumHeaders.length; i++) {
            Cell cell = sumHeaderRow.createCell(i);
            cell.setCellValue(sumHeaders[i]);
            cell.setCellStyle(sumHeaderStyle);
        }

        // Row 3: Summary Values Row
        Row sumValueRow = sheet.createRow(3);
        sumValueRow.setHeightInPoints(24);

        CellStyle sumValueStyle = workbook.createCellStyle();
        setCellBackground(workbook, sumValueStyle, "#e2f2e9");
        sumValueStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 11));
        sumValueStyle.setAlignment(HorizontalAlignment.RIGHT);
        sumValueStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        sumValueStyle.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
        applyGridBorders(workbook, sumValueStyle);

        double epfBal = summary.getCurrentEpfBalance() != null ? summary.getCurrentEpfBalance().doubleValue() : 0.0;
        double epsBal = summary.getCurrentEpsBalance() != null ? summary.getCurrentEpsBalance().doubleValue() : 0.0;
        double empShare = (summary.getTotalEmployeeContribution() != null
                ? summary.getTotalEmployeeContribution().doubleValue()
                : 0.0)
                + (summary.getTotalVpfContributed() != null ? summary.getTotalVpfContributed().doubleValue() : 0.0);
        double emprEpf = summary.getTotalEmployerEpfContribution() != null
                ? summary.getTotalEmployerEpfContribution().doubleValue()
                : 0.0;
        double emprEps = summary.getTotalEmployerEpsContribution() != null
                ? summary.getTotalEmployerEpsContribution().doubleValue()
                : 0.0;

        double accruedInterest = 0.0;
        if (summary.getInterestAccruedThisFyEpf() != null) {
            accruedInterest += summary.getInterestAccruedThisFyEpf().doubleValue();
        }
        if (summary.getInterestAccruedThisFyEps() != null) {
            accruedInterest += summary.getInterestAccruedThisFyEps().doubleValue();
        }

        double[] sumValues = {
                epfBal, epsBal, empShare, emprEpf, emprEps, accruedInterest
        };

        for (int i = 0; i < sumValues.length; i++) {
            Cell cell = sumValueRow.createCell(i);
            cell.setCellValue(sumValues[i]);
            cell.setCellStyle(sumValueStyle);
        }

        // Row 4: Empty spacer
        Row spacerRow2 = sheet.createRow(4);
        spacerRow2.setHeightInPoints(15);

        return 5;
    }

    private static void createFySheet(Workbook workbook, String fy, List<EpfTransactionResponseDTO> fyList,
            List<EpfInterestRate> rates, Map<String, YearBalanceSummary> yearBalances,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle rightAlignStyle, CellStyle boldStyle,
            CellStyle currencyStyle, CellStyle percentStyle) {
        Sheet sheet = workbook.createSheet(fy);

        String[] headers = {
                "MONTH", "DATE", "MODE / DETAILS", "BASIC + DA",
                "EMPLOYEE SHARE", "EMPLOYER EPF", "EMPLOYER EPS",
                "VPF", "EPF BALANCE", "EPS BALANCE", "RATE", "EMP INTEREST", "EMPR INTEREST"
        };

        // No summary header for individual financial year tabs. Start Row is 0.
        Row headerRow = sheet.createRow(0);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int startYear = 2026;
        try {
            startYear = Integer.parseInt(fy.split("-")[0]);
        } catch (Exception e) {
            // fallback
        }
        int endYear = startYear + 1;
        String startYearShort = String.valueOf(startYear).substring(2);
        String endYearShort = String.valueOf(endYear).substring(2);

        double openingEmpShare = 0.0;
        double openingEmprShare = 0.0;

        YearBalanceSummary yb = yearBalances.get(fy);
        if (yb != null) {
            openingEmpShare = yb.openingEmpShare;
            openingEmprShare = yb.openingEmprShare;
        }

        double openingBalance = Math.round((openingEmpShare + openingEmprShare) * 100.0) / 100.0;

        double activeRate = 8.25;
        if (rates != null) {
            for (EpfInterestRate r : rates) {
                if (fy.equals(r.getFinancialYear())) {
                    if (r.getRatePercent() != null) {
                        activeRate = r.getRatePercent().doubleValue();
                    }
                    break;
                }
            }
        }

        Row opRow = sheet.createRow(1);
        opRow.setHeightInPoints(22);
        // Opening balance row: subtle accent tint (like frontend bg-accent/5)
        CellStyle openingRowStyle = workbook.createCellStyle();
        setCellBackground(workbook, openingRowStyle, "#e2f2e9");
        openingRowStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
        openingRowStyle.setAlignment(HorizontalAlignment.LEFT);
        openingRowStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, openingRowStyle);

        CellStyle openingCurrencyStyle = workbook.createCellStyle();
        openingCurrencyStyle.cloneStyleFrom(openingRowStyle);
        openingCurrencyStyle.setAlignment(HorizontalAlignment.RIGHT);
        openingCurrencyStyle.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));

        CellStyle openingPercentStyle = workbook.createCellStyle();
        openingPercentStyle.cloneStyleFrom(openingRowStyle);
        openingPercentStyle.setAlignment(HorizontalAlignment.RIGHT);
        openingPercentStyle.setDataFormat(workbook.createDataFormat().getFormat("0.00\"%\""));

        // Fill all cells in opening row with tinted style first
        for (int j = 0; j < headers.length; j++)
            createCell(opRow, j, "-", openingRowStyle);

        createCell(opRow, 0, "Opening balance", openingRowStyle);
        createCell(opRow, 1, "31.03." + startYear, openingRowStyle);
        createCell(opRow, 2, "Opening Balance", openingRowStyle);
        createCell(opRow, 3, "-", openingRowStyle);
        createNumericCell(opRow, 4, openingEmpShare > 0 ? openingEmpShare : null, openingCurrencyStyle);
        createNumericCell(opRow, 5, openingEmprShare > 0 ? openingEmprShare : null, openingCurrencyStyle);
        createCell(opRow, 6, "-", openingRowStyle);
        createCell(opRow, 7, "-", openingRowStyle);
        createNumericCell(opRow, 8, openingBalance > 0 ? openingBalance : null, openingCurrencyStyle);
        createCell(opRow, 9, "-", openingRowStyle);
        createNumericCell(opRow, 10, activeRate, openingPercentStyle);
        createNumericCell(opRow, 11, 0.0, openingCurrencyStyle);
        createNumericCell(opRow, 12, 0.0, openingCurrencyStyle);

        List<MonthDef> monthDefs = List.of(
                new MonthDef("Mar-" + startYearShort, 4, startYear),
                new MonthDef("Apr-" + startYearShort, 5, startYear),
                new MonthDef("May-" + startYearShort, 6, startYear),
                new MonthDef("Jun-" + startYearShort, 7, startYear),
                new MonthDef("Jul-" + startYearShort, 8, startYear),
                new MonthDef("Aug-" + startYearShort, 9, startYear),
                new MonthDef("Sep-" + startYearShort, 10, startYear),
                new MonthDef("Oct-" + startYearShort, 11, startYear),
                new MonthDef("Nov-" + startYearShort, 12, startYear),
                new MonthDef("Dec-" + endYearShort, 1, endYear),
                new MonthDef("Jan-" + endYearShort, 2, endYear),
                new MonthDef("Feb-" + endYearShort, 3, endYear));

        Map<String, TxnGroup> txnMapSelected = new java.util.HashMap<>();
        for (EpfTransactionResponseDTO txn : fyList) {
            if (txn.getRemarks() != null && txn.getRemarks().startsWith("Annual Interest Credit")) {
                continue;
            }
            LocalDate d = txn.getTransactionDate();
            if (d == null)
                continue;
            String key = String.format("%d-%02d", d.getYear(), d.getMonthValue());
            TxnGroup group = txnMapSelected.computeIfAbsent(key, k -> new TxnGroup());
            group.employeeContribution += (txn.getEmployeeContribution() != null
                    ? txn.getEmployeeContribution().doubleValue()
                    : 0.0);
            group.employerEpfContribution += (txn.getEmployerEpfContribution() != null
                    ? txn.getEmployerEpfContribution().doubleValue()
                    : 0.0);
            group.employerEpsContribution += (txn.getEmployerEpsContribution() != null
                    ? txn.getEmployerEpsContribution().doubleValue()
                    : 0.0);
            group.vpfAmount += (txn.getVpfAmount() != null ? txn.getVpfAmount().doubleValue() : 0.0);
            group.withdrawalAmount += (txn.getWithdrawalAmount() != null ? txn.getWithdrawalAmount().doubleValue()
                    : 0.0);
            if (txn.getBasicDA() != null) {
                group.basicDA = txn.getBasicDA().doubleValue();
            }
            group.txns.add(txn);
        }

        for (TxnGroup group : txnMapSelected.values()) {
            group.txns.sort(Comparator.comparing(EpfTransactionResponseDTO::getTransactionDate));
            EpfTransactionResponseDTO lastTxn = group.txns.get(group.txns.size() - 1);
            if (lastTxn.getEpfBalance() != null) {
                group.epfBalance = lastTxn.getEpfBalance().doubleValue();
            }
            if (lastTxn.getEpsBalance() != null) {
                group.epsBalance = lastTxn.getEpsBalance().doubleValue();
            }
        }

        double runningEmp = openingEmpShare;
        double runningEmpr = openingEmprShare;

        double totalEmpShare = openingEmpShare;
        double totalEmprShare = openingEmprShare;

        double sumEmpContrib = 0.0;
        double sumEmprContrib = 0.0;
        double sumEpsContrib = 0.0;
        double sumVpfContrib = 0.0;

        double totalEmpInt = 0.0;
        double totalEmprInt = 0.0;

        CellStyle wrapDataStyle = workbook.createCellStyle();
        wrapDataStyle.cloneStyleFrom(dataStyle);
        wrapDataStyle.setWrapText(true);

        CellStyle rightAlignWrapStyle = workbook.createCellStyle();
        rightAlignWrapStyle.cloneStyleFrom(dataStyle);
        rightAlignWrapStyle.setAlignment(HorizontalAlignment.RIGHT);
        rightAlignWrapStyle.setWrapText(true);

        int rowIdx = 2;

        for (MonthDef md : monthDefs) {
            String key = String.format("%d-%02d", md.creditYear, md.creditMonth);
            TxnGroup grouped = txnMapSelected.get(key);

            double empInt = Math.round((runningEmp * activeRate) / 1200.0 * 100.0) / 100.0;
            double emprInt = Math.round((runningEmpr * activeRate) / 1200.0 * 100.0) / 100.0;

            totalEmpInt += empInt;
            totalEmprInt += emprInt;

            Row row = sheet.createRow(rowIdx++);
            row.setHeightInPoints(22);

            createCell(row, 0, md.label, boldStyle);

            if (grouped != null) {
                // Sort transactions by date
                grouped.txns.sort(Comparator.comparing(EpfTransactionResponseDTO::getTransactionDate));

                // Date
                String dateStr = grouped.txns.stream()
                        .map(t -> {
                            LocalDate d = t.getTransactionDate();
                            return String.format("%02d.%02d.%d", d.getDayOfMonth(), d.getMonthValue(), d.getYear());
                        })
                        .distinct()
                        .collect(Collectors.joining("\n"));

                // Mode / Details
                String modeStr = grouped.txns.stream()
                        .map(t -> {
                            boolean isW = t.getWithdrawalAmount() != null
                                    && t.getWithdrawalAmount().doubleValue() > 0.0;
                            String m = "";
                            if (isW) {
                                m = "Withdrawal: -" + formatCurrency(t.getWithdrawalAmount());
                            } else {
                                String modeLabel = t.getMode() != null ? t.getMode().name() : "";
                                if ("AUTO_SALARY".equals(modeLabel))
                                    m = "Auto Salary";
                                else if ("MANUAL_OVERRIDE".equals(modeLabel))
                                    m = "Manual Entry";
                                else if ("INTEREST".equals(modeLabel))
                                    m = "Interest";
                            }

                            if (t.getTransactionDate() != null) {
                                m += " (" + String.format("%02d", t.getTransactionDate().getDayOfMonth()) + ")";
                            }

                            if (t.getRemarks() != null && !t.getRemarks().isBlank()) {
                                m += "\n" + t.getRemarks();
                            }
                            return m;
                        })
                        .collect(Collectors.joining("\n"));

                double empShareVal = grouped.employeeContribution + grouped.vpfAmount
                        - (grouped.withdrawalAmount / 2.0);
                double emprShareVal = grouped.employerEpfContribution - (grouped.withdrawalAmount / 2.0);

                runningEmp += empShareVal;
                runningEmpr += emprShareVal;

                totalEmpShare += empShareVal;
                totalEmprShare += emprShareVal;

                sumEmpContrib += grouped.employeeContribution;
                sumEmprContrib += grouped.employerEpfContribution;
                sumEpsContrib += grouped.employerEpsContribution;
                sumVpfContrib += grouped.vpfAmount;

                // Build wrapped strings for contributions if there is a withdrawal in this
                // month
                String empShareStr = "";
                if (grouped.employeeContribution > 0.0) {
                    empShareStr += formatCurrency(java.math.BigDecimal.valueOf(grouped.employeeContribution));
                }
                if (grouped.withdrawalAmount > 0.0) {
                    if (!empShareStr.isEmpty())
                        empShareStr += "\n";
                    empShareStr += "-" + formatCurrency(java.math.BigDecimal.valueOf(grouped.withdrawalAmount / 2.0));
                }

                String emprEpfStr = "";
                if (grouped.employerEpfContribution > 0.0) {
                    emprEpfStr += formatCurrency(java.math.BigDecimal.valueOf(grouped.employerEpfContribution));
                }
                if (grouped.withdrawalAmount > 0.0) {
                    if (!emprEpfStr.isEmpty())
                        emprEpfStr += "\n";
                    emprEpfStr += "-" + formatCurrency(java.math.BigDecimal.valueOf(grouped.withdrawalAmount / 2.0));
                }

                // Calculate max lines to set row height
                int linesDate = dateStr.split("\n").length;
                int linesMode = modeStr.split("\n").length;
                int linesEmpShare = empShareStr.split("\n").length;
                int linesEmprEpf = emprEpfStr.split("\n").length;
                int maxLines = Math.max(linesDate, Math.max(linesMode, Math.max(linesEmpShare, linesEmprEpf)));
                row.setHeightInPoints(Math.max(22, maxLines * 16));

                createCell(row, 1, dateStr, wrapDataStyle);
                createCell(row, 2, modeStr, wrapDataStyle);
                createNumericCell(row, 3, grouped.basicDA, currencyStyle);

                if (grouped.withdrawalAmount > 0.0) {
                    createCell(row, 4, empShareStr.isEmpty() ? "-" : empShareStr, rightAlignWrapStyle);
                    createCell(row, 5, emprEpfStr.isEmpty() ? "-" : emprEpfStr, rightAlignWrapStyle);
                } else {
                    createNumericCell(row, 4, grouped.employeeContribution > 0 ? grouped.employeeContribution : null,
                            currencyStyle);
                    createNumericCell(row, 5,
                            grouped.employerEpfContribution > 0 ? grouped.employerEpfContribution : null,
                            currencyStyle);
                }

                createNumericCell(row, 6, grouped.employerEpsContribution > 0 ? grouped.employerEpsContribution : null,
                        currencyStyle);
                createNumericCell(row, 7, grouped.vpfAmount > 0 ? grouped.vpfAmount : null, currencyStyle);
                createNumericCell(row, 8, grouped.epfBalance, currencyStyle);
                createNumericCell(row, 9, grouped.epsBalance, currencyStyle);
                createNumericCell(row, 10, activeRate, percentStyle);
                createNumericCell(row, 11, empInt, currencyStyle);
                createNumericCell(row, 12, emprInt, currencyStyle);
            } else {
                createCell(row, 1, "-", dataStyle);
                createCell(row, 2, "- (no data added/available)", dataStyle);
                createCell(row, 3, "-", dataStyle);
                createCell(row, 4, "-", dataStyle);
                createCell(row, 5, "-", dataStyle);
                createCell(row, 6, "-", dataStyle);
                createCell(row, 7, "-", dataStyle);
                createCell(row, 8, "-", dataStyle);
                createCell(row, 9, "-", dataStyle);
                createNumericCell(row, 10, activeRate, percentStyle);
                createNumericCell(row, 11, empInt, currencyStyle);
                createNumericCell(row, 12, emprInt, currencyStyle);
            }
        }

        // Summary Rows - matching frontend colors exactly
        CellStyle contribStyle = createContribStyle(workbook);
        CellStyle contribCurrencyStyle = createContribCurrencyStyle(workbook, contribStyle);

        CellStyle interestLabelStyle = createInterestLabelStyle(workbook);
        CellStyle interestCurrencyStyle = createInterestCurrencyStyle(workbook, interestLabelStyle);

        CellStyle tdsStyle = createTdsStyle(workbook);
        CellStyle tdsCurrencyStyle = createTdsCurrencyStyle(workbook, tdsStyle);

        CellStyle closingStyle = createClosingStyle(workbook);
        CellStyle closingCurrencyStyle = createClosingCurrencyStyle(workbook, closingStyle);

        CellStyle epfBalLabelStyle = createEpfBalLabelStyle(workbook);
        CellStyle epfBalValueStyle = createEpfBalValueStyle(workbook, epfBalLabelStyle);

        Row r1 = sheet.createRow(rowIdx++);
        Row r2 = sheet.createRow(rowIdx++);
        Row r3 = sheet.createRow(rowIdx++);
        Row r4 = sheet.createRow(rowIdx++);
        Row r5 = sheet.createRow(rowIdx++);
        r5.setHeightInPoints(30);

        for (int j = 0; j < headers.length; j++) {
            createCell(r1, j, "", contribStyle);
            createCell(r2, j, "-", interestLabelStyle);
            createCell(r3, j, "", tdsStyle);
            createCell(r4, j, "", closingStyle);
            createCell(r5, j, "", epfBalLabelStyle);
        }

        r1.getCell(0).setCellValue("Total Contributions (FY)");
        r2.getCell(0).setCellValue("Interest Credited (FY)");
        r3.getCell(0).setCellValue("TDS");
        r4.getCell(0).setCellValue("Closing Balance");
        r5.getCell(0).setCellValue("EPF Balance");

        sheet.addMergedRegion(new CellRangeAddress(r1.getRowNum(), r1.getRowNum(), 0, 3));
        sheet.addMergedRegion(new CellRangeAddress(r2.getRowNum(), r2.getRowNum(), 0, 3));
        sheet.addMergedRegion(new CellRangeAddress(r3.getRowNum(), r3.getRowNum(), 0, 3));
        sheet.addMergedRegion(new CellRangeAddress(r4.getRowNum(), r4.getRowNum(), 0, 3));
        sheet.addMergedRegion(new CellRangeAddress(r5.getRowNum(), r5.getRowNum(), 0, 7));

        createNumericCell(r1, 4, sumEmpContrib, contribCurrencyStyle);
        createNumericCell(r1, 5, sumEmprContrib, contribCurrencyStyle);
        createNumericCell(r1, 6, sumEpsContrib, contribCurrencyStyle);
        createNumericCell(r1, 7, sumVpfContrib, contribCurrencyStyle);
        createCell(r1, 8, "-", contribStyle);
        createCell(r1, 9, "-", contribStyle);
        createCell(r1, 10, "-", contribStyle);
        createCell(r1, 11, "-", contribStyle);
        createCell(r1, 12, "-", contribStyle);

        double totalInterestCredited = Math.round((totalEmpInt + totalEmprInt) * 100.0) / 100.0;
        createCell(r2, 4, "-", interestLabelStyle);
        createCell(r2, 5, "-", interestLabelStyle);
        createCell(r2, 6, "-", interestLabelStyle);
        createCell(r2, 7, "-", interestLabelStyle);
        createNumericCell(r2, 8, totalInterestCredited, interestCurrencyStyle);
        createCell(r2, 9, "-", interestLabelStyle);
        createCell(r2, 10, "-", interestLabelStyle);
        createNumericCell(r2, 11, totalEmpInt, interestCurrencyStyle);
        createNumericCell(r2, 12, totalEmprInt, interestCurrencyStyle);

        createNumericCell(r3, 4, 0.0, tdsCurrencyStyle);
        createNumericCell(r3, 5, 0.0, tdsCurrencyStyle);
        createCell(r3, 6, "-", tdsStyle);
        createCell(r3, 7, "-", tdsStyle);
        createNumericCell(r3, 8, 0.0, tdsCurrencyStyle);
        createCell(r3, 9, "-", tdsStyle);
        createCell(r3, 10, "-", tdsStyle);
        createNumericCell(r3, 11, 0.0, tdsCurrencyStyle);
        createNumericCell(r3, 12, 0.0, tdsCurrencyStyle);

        double closingEmp = Math.round((totalEmpShare + totalEmpInt) * 100.0) / 100.0;
        double closingEmpr = Math.round((totalEmprShare + totalEmprInt) * 100.0) / 100.0;
        double closingTotal = Math.round((closingEmp + closingEmpr) * 100.0) / 100.0;

        createNumericCell(r4, 4, closingEmp, closingCurrencyStyle);
        createNumericCell(r4, 5, closingEmpr, closingCurrencyStyle);
        createCell(r4, 6, "-", closingStyle);
        createCell(r4, 7, "-", closingStyle);
        createNumericCell(r4, 8, closingTotal, closingCurrencyStyle);
        createCell(r4, 9, "-", closingStyle);
        createCell(r4, 10, "-", closingStyle);
        createCell(r4, 11, "-", closingStyle);
        createCell(r4, 12, "-", closingStyle);

        createNumericCell(r5, 8, closingTotal, epfBalValueStyle);
        for (int j = 9; j < headers.length; j++)
            createCell(r5, j, "", epfBalLabelStyle);

        // Auto column sizing
        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
    }

    private static void createSheet(Workbook workbook, String sheetName, List<EpfTransactionResponseDTO> data,
            EpfSummaryDTO summary,
            CellStyle headerStyle, CellStyle dataStyle, CellStyle rightAlignStyle, CellStyle boldStyle,
            CellStyle currencyStyle, CellStyle percentStyle) {
        Sheet sheet = workbook.createSheet(sheetName);

        String[] headers = {
                "Transaction No", "Date", "Mode", "Basic + DA",
                "Employee EPF", "Employer EPF", "Employer EPS",
                "VPF", "Withdrawal", "EPF Balance", "EPS Balance", "Remarks"
        };

        // Summary header is rendered on the "All Transactions" sheet
        int startRow = renderSummaryHeader(sheet, workbook, summary, headers.length);

        Row headerRow = sheet.createRow(startRow);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (int i = 0; i < data.size(); i++) {
            EpfTransactionResponseDTO dto = data.get(i);
            Row row = sheet.createRow(startRow + 1 + i);
            row.setHeightInPoints(22);

            createCell(row, 0, String.valueOf(i + 1), boldStyle);
            createCell(row, 1, dto.getTransactionDate() != null ? dto.getTransactionDate().toString() : "", dataStyle);

            String modeStr = dto.getMode() != null ? dto.getMode().name() : "";
            if ("AUTO_SALARY".equals(modeStr))
                modeStr = "Auto Salary";
            else if ("MANUAL_OVERRIDE".equals(modeStr))
                modeStr = "Manual Entry";
            else if ("INTEREST".equals(modeStr))
                modeStr = "Interest";
            createCell(row, 2, modeStr, dataStyle);

            createNumericCell(row, 3, dto.getBasicDA() != null ? dto.getBasicDA().doubleValue() : null, currencyStyle);
            createNumericCell(row, 4,
                    dto.getEmployeeContribution() != null ? dto.getEmployeeContribution().doubleValue() : null,
                    currencyStyle);
            createNumericCell(row, 5,
                    dto.getEmployerEpfContribution() != null ? dto.getEmployerEpfContribution().doubleValue() : null,
                    currencyStyle);
            createNumericCell(row, 6,
                    dto.getEmployerEpsContribution() != null ? dto.getEmployerEpsContribution().doubleValue() : null,
                    currencyStyle);
            createNumericCell(row, 7, dto.getVpfAmount() != null ? dto.getVpfAmount().doubleValue() : null,
                    currencyStyle);
            createNumericCell(row, 8,
                    dto.getWithdrawalAmount() != null ? dto.getWithdrawalAmount().doubleValue() : null, currencyStyle);
            createNumericCell(row, 9, dto.getEpfBalance() != null ? dto.getEpfBalance().doubleValue() : null,
                    currencyStyle);
            createNumericCell(row, 10, dto.getEpsBalance() != null ? dto.getEpsBalance().doubleValue() : null,
                    currencyStyle);
            createCell(row, 11, dto.getRemarks(), dataStyle);
        }

        if (!"All Transactions".equals(sheetName) && !data.isEmpty()) {
            int r = startRow + data.size() + 1;

            CellStyle contribStyle = createContribStyle(workbook);
            CellStyle contribCurrencyStyle = createContribCurrencyStyle(workbook, contribStyle);

            CellStyle interestLabelStyle = createInterestLabelStyle(workbook);
            CellStyle interestCurrencyStyle = createInterestCurrencyStyle(workbook, interestLabelStyle);

            CellStyle tdsStyle = createTdsStyle(workbook);
            CellStyle tdsCurrencyStyle = createTdsCurrencyStyle(workbook, tdsStyle);

            CellStyle closingStyle = createClosingStyle(workbook);
            CellStyle closingCurrencyStyle = createClosingCurrencyStyle(workbook, closingStyle);

            CellStyle epfBalLabelStyle = createEpfBalLabelStyle(workbook);
            CellStyle epfBalValueStyle = createEpfBalValueStyle(workbook, epfBalLabelStyle);

            Row r1 = sheet.createRow(r++);
            Row r2 = sheet.createRow(r++);
            Row r3 = sheet.createRow(r++);
            Row r4 = sheet.createRow(r++);
            Row r5 = sheet.createRow(r++);
            r5.setHeightInPoints(30);

            for (int j = 0; j < headers.length; j++) {
                createCell(r1, j, "", contribStyle);
                createCell(r2, j, "", interestLabelStyle);
                createCell(r3, j, "", tdsStyle);
                createCell(r4, j, "", closingStyle);
                createCell(r5, j, "", epfBalLabelStyle);
            }

            r1.getCell(0).setCellValue("Total Contributions (FY)");
            r2.getCell(0).setCellValue("Interest Credited (FY)");
            r3.getCell(0).setCellValue("TDS");
            r4.getCell(0).setCellValue("Closing Balance");
            r5.getCell(0).setCellValue("EPF Balance");

            // Merge cells
            sheet.addMergedRegion(new CellRangeAddress(r1.getRowNum(), r1.getRowNum(), 0, 3));
            sheet.addMergedRegion(new CellRangeAddress(r2.getRowNum(), r2.getRowNum(), 0, 3));
            sheet.addMergedRegion(new CellRangeAddress(r3.getRowNum(), r3.getRowNum(), 0, 3));
            sheet.addMergedRegion(new CellRangeAddress(r4.getRowNum(), r4.getRowNum(), 0, 3));
            sheet.addMergedRegion(new CellRangeAddress(r5.getRowNum(), r5.getRowNum(), 0, 8));

            // Add sums
            double sumEmp = data.stream()
                    .mapToDouble(
                            d -> d.getEmployeeContribution() != null ? d.getEmployeeContribution().doubleValue() : 0)
                    .sum();
            double sumEmpr = data.stream().mapToDouble(
                    d -> d.getEmployerEpfContribution() != null ? d.getEmployerEpfContribution().doubleValue() : 0)
                    .sum();
            double sumEps = data.stream().mapToDouble(
                    d -> d.getEmployerEpsContribution() != null ? d.getEmployerEpsContribution().doubleValue() : 0)
                    .sum();
            double sumVpf = data.stream()
                    .mapToDouble(d -> d.getVpfAmount() != null ? d.getVpfAmount().doubleValue() : 0).sum();

            createNumericCell(r1, 4, sumEmp, contribCurrencyStyle);
            createNumericCell(r1, 5, sumEmpr, contribCurrencyStyle);
            createNumericCell(r1, 6, sumEps, contribCurrencyStyle);
            createNumericCell(r1, 7, sumVpf, contribCurrencyStyle);

            // Final balance
            EpfTransactionResponseDTO last = data.get(data.size() - 1);
            createNumericCell(r4, 9, last.getEpfBalance() != null ? last.getEpfBalance().doubleValue() : 0,
                    closingCurrencyStyle);
            createNumericCell(r5, 9, last.getEpfBalance() != null ? last.getEpfBalance().doubleValue() : 0,
                    epfBalValueStyle);
        }

        // Auto column sizing
        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
    }

    private static String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null)
            return "-";
        return "₹" + String.format("%,.2f", amount);
    }

    private static void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private static void createNumericCell(Row row, int column, Double value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null && value != 0.0) {
            cell.setCellValue(value);
        } else if (value != null && value == 0.0) {
            cell.setCellValue(0.0);
        } else {
            // Nulls remain empty
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

    private static CellStyle createContribStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        setCellBackground(workbook, style, "#e2f2e9");
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createContribCurrencyStyle(Workbook workbook, CellStyle base) {
        CellStyle style = workbook.createCellStyle();
        style.cloneStyleFrom(base);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
        return style;
    }

    private static CellStyle createInterestLabelStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        setCellBackground(workbook, style, "#fef3c7");
        style.setFont(createCustomFont(workbook, "#78350f", true, (short) 0));
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createInterestCurrencyStyle(Workbook workbook, CellStyle base) {
        CellStyle style = workbook.createCellStyle();
        style.cloneStyleFrom(base);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
        return style;
    }

    private static CellStyle createTdsStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createTdsCurrencyStyle(Workbook workbook, CellStyle base) {
        CellStyle style = workbook.createCellStyle();
        style.cloneStyleFrom(base);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
        return style;
    }

    private static CellStyle createClosingStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        setCellBackground(workbook, style, "#dbeafe");
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createClosingCurrencyStyle(Workbook workbook, CellStyle base) {
        CellStyle style = workbook.createCellStyle();
        style.cloneStyleFrom(base);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
        return style;
    }

    private static CellStyle createEpfBalLabelStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        setCellBackground(workbook, style, "#c0d8f0");
        style.setFont(createCustomFont(workbook, "#1e293b", true, (short) 13));
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }

    private static CellStyle createEpfBalValueStyle(Workbook workbook, CellStyle base) {
        CellStyle style = workbook.createCellStyle();
        style.cloneStyleFrom(base);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
        return style;
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
        style.setDataFormat(format.getFormat("0.00\"%\""));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }
}