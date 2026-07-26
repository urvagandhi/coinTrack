package com.urva.myfinance.coinTrack.fixeddeposit.util;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.urva.myfinance.coinTrack.common.util.ExcelExportUtil;
import com.urva.myfinance.coinTrack.fixeddeposit.dto.response.FixedDepositResponseDTO;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;

public class FixedDepositExcelExporter {

    private FixedDepositExcelExporter() {
    }

    public static ResponseEntity<byte[]> export(List<FixedDepositResponseDTO> allFds) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle rightAlignStyle = createRightAlignStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);

            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);

            // Tab 1: All Fixed Deposits
            createSheet(workbook, "Fixed Deposit", allFds, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle);

            // Tab 2: Active
            List<FixedDepositResponseDTO> active = allFds.stream().filter(f -> f.getStatus() == FdStatus.ACTIVE).collect(Collectors.toList());
            if (!active.isEmpty()) createSheet(workbook, "Active", active, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle);

            // Tab 3: Due
            List<FixedDepositResponseDTO> due = allFds.stream().filter(f -> f.getStatus() == FdStatus.DUE).collect(Collectors.toList());
            if (!due.isEmpty()) createSheet(workbook, "Due", due, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle);

            // Tab 4: Matured
            List<FixedDepositResponseDTO> matured = allFds.stream().filter(f -> f.getStatus() == FdStatus.MATURED).collect(Collectors.toList());
            if (!matured.isEmpty()) createSheet(workbook, "Matured", matured, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle);

            // Tab 5: Closed
            List<FixedDepositResponseDTO> closed = allFds.stream().filter(f -> f.getStatus() == FdStatus.CLOSED).collect(Collectors.toList());
            if (!closed.isEmpty()) createSheet(workbook, "Closed", closed, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle);

            workbook.write(out);
            byte[] bytes = out.toByteArray();

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"fixed_deposits.xlsx\"");

            return ResponseEntity.ok()
                    .headers(httpHeaders)
                    .body(bytes);

        } catch (Exception e) {
            throw new RuntimeException("Error generating Fixed Deposit Excel", e);
        }
    }

    private static void createSheet(Workbook workbook, String sheetName, List<FixedDepositResponseDTO> data,
                                    CellStyle headerStyle, CellStyle dataStyle, CellStyle rightAlignStyle, CellStyle boldStyle,
                                    CellStyle currencyStyle, CellStyle percentStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        
        String[] headers = {
                "FD No", "Place", "Holder Name", "Nominee", "Account Number",
                "Interest Rate", "Investment Period", "Issue Date", "Maturity Date",
                "Issue Amount", "Maturity Amount", "Status", "Days To Maturity", "Remarks"
        };

        Row headerRow = sheet.createRow(0);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (int i = 0; i < data.size(); i++) {
            FixedDepositResponseDTO dto = data.get(i);
            Row row = sheet.createRow(i + 1);
            row.setHeightInPoints(22);

            createCell(row, 0, String.valueOf(i + 1), boldStyle);
            createCell(row, 1, dto.getPlace(), dataStyle);
            createCell(row, 2, dto.getHolderName(), dataStyle);
            createCell(row, 3, dto.getNominee(), dataStyle);
            createCell(row, 4, dto.getAccountNumber(), dataStyle);
            createNumericCell(row, 5, dto.getInterestRate() != null ? dto.getInterestRate().doubleValue() : null, percentStyle);
            createCell(row, 6, dto.getInvestmentPeriod(), dataStyle);
            createCell(row, 7, dto.getIssueDate() != null ? dto.getIssueDate().toString() : "", dataStyle);
            createCell(row, 8, dto.getMaturityDate() != null ? dto.getMaturityDate().toString() : "", dataStyle);
            createNumericCell(row, 9, dto.getIssueAmount() != null ? dto.getIssueAmount().doubleValue() : null, currencyStyle);
            createNumericCell(row, 10, dto.getMaturityAmount() != null ? dto.getMaturityAmount().doubleValue() : null, currencyStyle);
            createCell(row, 11, dto.getStatus() != null ? dto.getStatus().name() : "", dataStyle);
            
            String days = (dto.getDaysToMaturity() <= 0 || dto.getStatus() == FdStatus.MATURED
                    || dto.getStatus() == FdStatus.CLOSED || dto.getStatus() == FdStatus.DUE) ? "-"
                            : String.valueOf(dto.getDaysToMaturity());
            createCell(row, 12, days, dataStyle);
            createCell(row, 13, dto.getRemarks(), dataStyle);
        }

        if (!data.isEmpty()) {
            int totalRowIdx = data.size() + 1;
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
            
            double totalIssueAmount = data.stream()
                    .mapToDouble(d -> d.getIssueAmount() != null ? d.getIssueAmount().doubleValue() : 0.0)
                    .sum();
            double totalMaturityAmount = data.stream()
                    .mapToDouble(d -> d.getMaturityAmount() != null ? d.getMaturityAmount().doubleValue() : 0.0)
                    .sum();
            
            Cell cellIssue = totalRow.getCell(9);
            cellIssue.setCellValue(totalIssueAmount);
            cellIssue.setCellStyle(totalCurrencyStyle);
            
            Cell cellMaturity = totalRow.getCell(10);
            cellMaturity.setCellValue(totalMaturityAmount);
            cellMaturity.setCellStyle(totalCurrencyStyle);
        }

        // Auto column sizing
        ExcelExportUtil.autoSizeColumns(sheet, headers.length);
    }

    private static void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private static void createNumericCell(Row row, int column, Double value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value);
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
