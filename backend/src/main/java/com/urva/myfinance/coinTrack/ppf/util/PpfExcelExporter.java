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

import com.urva.myfinance.coinTrack.common.util.ExcelExportUtil;
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

                CellStyle borderTopStyle = workbook.createCellStyle();
                setCellBackground(workbook, borderTopStyle, "#e2e8f0");
                applyGridBorders(workbook, borderTopStyle);
                borderTopStyle.setBorderBottom(BorderStyle.THIN);

                CellStyle totalLabelStyle = workbook.createCellStyle();
                totalLabelStyle.cloneStyleFrom(borderTopStyle);
                totalLabelStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
                totalLabelStyle.setVerticalAlignment(VerticalAlignment.CENTER);

                CellStyle totalCurrencyStyle = workbook.createCellStyle();
                totalCurrencyStyle.cloneStyleFrom(borderTopStyle);
                totalCurrencyStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
                totalCurrencyStyle.setDataFormat(workbook.createDataFormat().getFormat("[$₹-en-IN]#,##0.00"));
                totalCurrencyStyle.setAlignment(HorizontalAlignment.RIGHT);
                totalCurrencyStyle.setVerticalAlignment(VerticalAlignment.CENTER);

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

            // Auto-size columns with min 12, max 45 width
            ExcelExportUtil.autoSizeColumns(sheet, headers.length);

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
        titleStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 14));
        setCellBackground(workbook, titleStyle, "#dbeafe");
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, titleStyle);

        // Fill all cells in title row for correct styling of merged cells
        for (int col = 0; col < colCount; col++) {
            Cell c = titleRow.createCell(col);
            c.setCellStyle(titleStyle);
        }
        titleRow.getCell(0).setCellValue("Public Provident Fund (PPF) Ledger");
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, colCount - 1));

        if (settings == null) {
            return 2;
        }

        // Style for metadata label
        CellStyle labelStyle = workbook.createCellStyle();
        setCellBackground(workbook, labelStyle, "#e2e8f0");
        labelStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
        labelStyle.setAlignment(HorizontalAlignment.LEFT);
        labelStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, labelStyle);

        // Style for metadata value
        CellStyle valueStyle = workbook.createCellStyle();
        valueStyle.setAlignment(HorizontalAlignment.LEFT);
        valueStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, valueStyle);

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

        // Apply styles/borders for all cells in these rows (including merged region cells)
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

    private static void applyGridBorders(Workbook workbook, CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        if (style instanceof org.apache.poi.xssf.usermodel.XSSFCellStyle) {
            org.apache.poi.xssf.usermodel.XSSFCellStyle xssfStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) style;
            byte[] borderRgb = new byte[]{(byte) 203, (byte) 213, (byte) 225}; // #cbd5e1
            org.apache.poi.xssf.usermodel.XSSFColor borderColor = new org.apache.poi.xssf.usermodel.XSSFColor(borderRgb, new org.apache.poi.xssf.usermodel.DefaultIndexedColorMap());
            xssfStyle.setTopBorderColor(borderColor);
            xssfStyle.setBottomBorderColor(borderColor);
            xssfStyle.setLeftBorderColor(borderColor);
            xssfStyle.setRightBorderColor(borderColor);
        }
    }

    private static void setCellBackground(Workbook workbook, CellStyle style, String hexColor) {
        if (style instanceof org.apache.poi.xssf.usermodel.XSSFCellStyle && workbook instanceof org.apache.poi.xssf.usermodel.XSSFWorkbook) {
            org.apache.poi.xssf.usermodel.XSSFCellStyle xssfStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) style;
            int r = Integer.parseInt(hexColor.substring(1, 3), 16);
            int g = Integer.parseInt(hexColor.substring(3, 5), 16);
            int b = Integer.parseInt(hexColor.substring(5, 7), 16);
            byte[] rgb = new byte[]{(byte) r, (byte) g, (byte) b};
            org.apache.poi.xssf.usermodel.XSSFColor color = new org.apache.poi.xssf.usermodel.XSSFColor(rgb, new org.apache.poi.xssf.usermodel.DefaultIndexedColorMap());
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
        if (font instanceof org.apache.poi.xssf.usermodel.XSSFFont && workbook instanceof org.apache.poi.xssf.usermodel.XSSFWorkbook) {
            org.apache.poi.xssf.usermodel.XSSFFont xssfFont = (org.apache.poi.xssf.usermodel.XSSFFont) font;
            int r = Integer.parseInt(hexColor.substring(1, 3), 16);
            int g = Integer.parseInt(hexColor.substring(3, 5), 16);
            int b = Integer.parseInt(hexColor.substring(5, 7), 16);
            byte[] rgb = new byte[]{(byte) r, (byte) g, (byte) b};
            org.apache.poi.xssf.usermodel.XSSFColor color = new org.apache.poi.xssf.usermodel.XSSFColor(rgb, new org.apache.poi.xssf.usermodel.DefaultIndexedColorMap());
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
}
