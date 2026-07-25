package com.urva.myfinance.coinTrack.ppf.util;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.urva.myfinance.coinTrack.ppf.dto.response.PpfTransactionResponseDTO;
import com.urva.myfinance.coinTrack.ppf.dto.response.PpfSettingsResponseDTO;

public class PpfExcelExporter {

    private PpfExcelExporter() {
    }

    public static ResponseEntity<byte[]> export(List<PpfTransactionResponseDTO> transactions, String userName,
            PpfSettingsResponseDTO settings) {
        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle rightAlignStyle = createRightAlignStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            Sheet sheet = workbook.createSheet("PPF Ledger");

            String[] headers = {
                    "Transaction No", "Transaction Date", "Particulars", "Type",
                    "Debit Amount", "Credit Amount", "Balance", "Remarks"
            };

            // Render summary header first
            int startRow = renderHeaderMetadata(sheet, workbook, userName, settings, headers.length);

            Row headerRow = sheet.createRow(startRow);
            headerRow.setHeightInPoints(25);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            for (int i = 0; i < transactions.size(); i++) {
                PpfTransactionResponseDTO dto = transactions.get(i);
                Row row = sheet.createRow(startRow + 1 + i);
                row.setHeightInPoints(22);

                createCell(row, 0, String.valueOf(i + 1), boldStyle);
                createCell(row, 1, dto.getTransactionDate() != null ? dto.getTransactionDate().toString() : "",
                        dataStyle);
                createCell(row, 2, dto.getParticulars() != null ? dto.getParticulars() : "", dataStyle);
                createCell(row, 3, dto.getParticularType() != null ? dto.getParticularType().name() : "", dataStyle);
                createNumericCell(row, 4, dto.getDebitAmount() != null ? dto.getDebitAmount().doubleValue() : null,
                        currencyStyle);
                createNumericCell(row, 5, dto.getCreditAmount() != null ? dto.getCreditAmount().doubleValue() : null,
                        currencyStyle);
                createNumericCell(row, 6, dto.getBalance() != null ? dto.getBalance().doubleValue() : null,
                        currencyStyle);
                createCell(row, 7, dto.getRemarks(), dataStyle);
            }

            if (!transactions.isEmpty()) {
                int totalRowIdx = startRow + 1 + transactions.size();
                Row totalRow = sheet.createRow(totalRowIdx);
                totalRow.setHeightInPoints(22);

                Font boldFont = workbook.createFont();
                boldFont.setBold(true);

                CellStyle totalLabelStyle = workbook.createCellStyle();
                totalLabelStyle.setFont(boldFont);
                totalLabelStyle.setBorderTop(BorderStyle.THIN);
                totalLabelStyle.setBorderBottom(BorderStyle.DOUBLE);
                totalLabelStyle.setVerticalAlignment(VerticalAlignment.CENTER);

                CellStyle totalCurrencyStyle = workbook.createCellStyle();
                totalCurrencyStyle.cloneStyleFrom(currencyStyle);
                totalCurrencyStyle.setFont(boldFont);
                totalCurrencyStyle.setBorderTop(BorderStyle.THIN);
                totalCurrencyStyle.setBorderBottom(BorderStyle.DOUBLE);

                CellStyle borderTopStyle = workbook.createCellStyle();
                borderTopStyle.setBorderTop(BorderStyle.THIN);
                borderTopStyle.setBorderBottom(BorderStyle.DOUBLE);

                for (int col = 0; col < headers.length; col++) {
                    Cell cell = totalRow.createCell(col);
                    cell.setCellStyle(borderTopStyle);
                }

                totalRow.getCell(0).setCellValue("Total");
                totalRow.getCell(0).setCellStyle(totalLabelStyle);

                double totalDebit = transactions.stream()
                        .mapToDouble(d -> d.getDebitAmount() != null ? d.getDebitAmount().doubleValue() : 0.0)
                        .sum();
                double totalCredit = transactions.stream()
                        .mapToDouble(d -> d.getCreditAmount() != null ? d.getCreditAmount().doubleValue() : 0.0)
                        .sum();

                Cell cellDebit = totalRow.getCell(4);
                cellDebit.setCellValue(totalDebit);
                cellDebit.setCellStyle(totalCurrencyStyle);

                Cell cellCredit = totalRow.getCell(5);
                cellCredit.setCellValue(totalCredit);
                cellCredit.setCellStyle(totalCurrencyStyle);
            }

            // Auto-size columns with min 14, max 45 width
            for (int i = 0; i < headers.length; i++) {
                int maxLen = headers[i].length();
                for (PpfTransactionResponseDTO txn : transactions) {
                    Object val = getCellValueForLength(txn, i);
                    if (val != null) {
                        maxLen = Math.max(maxLen, val.toString().length());
                    }
                }
                int colWidth = Math.min(Math.max(maxLen + 6, 14), 45) * 256;
                sheet.setColumnWidth(i, colWidth);
            }

            workbook.write(out);
            byte[] bytes = out.toByteArray();

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ppf_transactions.xlsx\"");

            return ResponseEntity.ok()
                    .headers(httpHeaders)
                    .body(bytes);

        } catch (Exception e) {
            throw new RuntimeException("Error generating PPF Excel", e);
        }
    }

    private static int renderHeaderMetadata(Sheet sheet, Workbook workbook, String userName,
            PpfSettingsResponseDTO settings, int colCount) {
        // Row 0: Public Provident Fund
        Row titleRow = sheet.createRow(0);
        titleRow.setHeightInPoints(28);
        CellStyle titleStyle = workbook.createCellStyle();
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);
        titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
        titleStyle.setFont(titleFont);
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Public Provident Fund (PPF) Ledger");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, colCount - 1));

        // Row 1: Empty spacer
        // Row spacerRow = sheet.createRow(1);
        // spacerRow.setHeightInPoints(10);

        if (settings == null) {
            return 2;
        }

        // Style for metadata label
        CellStyle labelStyle = workbook.createCellStyle();
        labelStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        labelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font labelFont = workbook.createFont();
        labelFont.setBold(true);
        labelStyle.setFont(labelFont);
        labelStyle.setAlignment(HorizontalAlignment.LEFT);
        labelStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        labelStyle.setBorderTop(BorderStyle.THIN);
        labelStyle.setBorderBottom(BorderStyle.THIN);
        labelStyle.setBorderLeft(BorderStyle.THIN);
        labelStyle.setBorderRight(BorderStyle.THIN);

        // Style for metadata value
        CellStyle valueStyle = workbook.createCellStyle();
        valueStyle.setAlignment(HorizontalAlignment.LEFT);
        valueStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        valueStyle.setBorderTop(BorderStyle.THIN);
        valueStyle.setBorderBottom(BorderStyle.THIN);
        valueStyle.setBorderLeft(BorderStyle.THIN);
        valueStyle.setBorderRight(BorderStyle.THIN);

        // Row 2: Account Number & Date of Issue
        Row row2 = sheet.createRow(2);
        row2.setHeightInPoints(20);

        Cell cell2_0 = row2.createCell(0);
        cell2_0.setCellValue("Account No.");
        cell2_0.setCellStyle(labelStyle);

        Cell cell2_1 = row2.createCell(1);
        cell2_1.setCellValue(settings.getAccountNumber() != null ? settings.getAccountNumber() : "-");
        cell2_1.setCellStyle(valueStyle);
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 1, 3));

        Cell cell2_4 = row2.createCell(4);
        cell2_4.setCellValue("Date of Issue");
        cell2_4.setCellStyle(labelStyle);

        Cell cell2_5 = row2.createCell(5);
        if (settings.getDateOfIssue() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            cell2_5.setCellValue(settings.getDateOfIssue().format(formatter));
        } else {
            cell2_5.setCellValue("-");
        }
        cell2_5.setCellStyle(valueStyle);
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 5, 7));

        // Row 3: Account Holder
        Row row3 = sheet.createRow(3);
        row3.setHeightInPoints(20);

        Cell cell3_0 = row3.createCell(0);
        cell3_0.setCellValue("Account Holder");
        cell3_0.setCellStyle(labelStyle);

        Cell cell3_1 = row3.createCell(1);
        cell3_1.setCellValue(userName);
        cell3_1.setCellStyle(valueStyle);
        sheet.addMergedRegion(new CellRangeAddress(3, 3, 1, 7));

        // Apply styles/borders for all cells in these rows (including merged region
        // cells) to look correct
        for (int col = 0; col < colCount; col++) {
            Cell c2 = row2.getCell(col);
            if (c2 == null) {
                c2 = row2.createCell(col);
                c2.setCellStyle(valueStyle);
            }
            Cell c3 = row3.getCell(col);
            if (c3 == null) {
                c3 = row3.createCell(col);
                c3.setCellStyle(valueStyle);
            }
        }

        // Row 4: Empty spacer
        Row spacerRow2 = sheet.createRow(4);
        spacerRow2.setHeightInPoints(15);

        return 5;
    }

    private static Object getCellValueForLength(PpfTransactionResponseDTO dto, int column) {
        switch (column) {
            case 0:
                return dto.getTransactionNo();
            case 1:
                return dto.getTransactionDate();
            case 2:
                return dto.getParticulars();
            case 3:
                return dto.getParticularType();
            case 4:
                return dto.getDebitAmount();
            case 5:
                return dto.getCreditAmount();
            case 6:
                return dto.getBalance();
            case 7:
                return dto.getRemarks();
            default:
                return null;
        }
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

    private static CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.BLACK.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);

        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);

        return style;
    }

    private static CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private static CellStyle createRightAlignStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private static CellStyle createBoldStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private static CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("[$₹-en-IN]#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
}
