package com.urva.myfinance.coinTrack.fixeddeposit.util;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

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

        // Fast column sizing
        int[] columnWidths = {
            10, // FD No
            15, // Place
            20, // Holder Name
            20, // Nominee
            18, // Account Number
            14, // Interest Rate
            18, // Investment Period
            15, // Issue Date
            15, // Maturity Date
            18, // Issue Amount
            18, // Maturity Amount
            12, // Status
            18, // Days to Maturity
            30  // Remarks
        };
        for (int i = 0; i < headers.length; i++) {
            sheet.setColumnWidth(i, columnWidths[i] * 256);
        }
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
        
        // Add border to headers
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

    private static CellStyle createPercentStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("0.00\"%\""));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
}
