package com.urva.myfinance.coinTrack.goldsilver.util;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.urva.myfinance.coinTrack.common.util.ExcelExportUtil;
import com.urva.myfinance.coinTrack.goldsilver.dto.response.GoldSilverResponseDTO;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

public class GoldSilverExcelExporter {

    private GoldSilverExcelExporter() {
    }

    public static ResponseEntity<byte[]> export(List<GoldSilverResponseDTO> allInvestments) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle rightAlignStyle = createRightAlignStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);

            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);
            CellStyle weightStyle = createWeightStyle(workbook);

            // Tab 1: All Investments
            createSheet(workbook, "All Investments", allInvestments, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle, weightStyle);

            // Tab 2: Gold
            List<GoldSilverResponseDTO> gold = allInvestments.stream().filter(f -> f.getMetalType() == MetalType.GOLD).collect(Collectors.toList());
            if (!gold.isEmpty()) createSheet(workbook, "Gold", gold, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle, weightStyle);

            // Tab 3: Silver
            List<GoldSilverResponseDTO> silver = allInvestments.stream().filter(f -> f.getMetalType() == MetalType.SILVER).collect(Collectors.toList());
            if (!silver.isEmpty()) createSheet(workbook, "Silver", silver, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle, weightStyle);

            // Tab 4: Active
            List<GoldSilverResponseDTO> active = allInvestments.stream().filter(f -> f.getStatus() == GsStatus.ACTIVE).collect(Collectors.toList());
            if (!active.isEmpty()) createSheet(workbook, "Active", active, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle, weightStyle);

            // Tab 5: Due
            List<GoldSilverResponseDTO> due = allInvestments.stream().filter(f -> f.getStatus() == GsStatus.DUE).collect(Collectors.toList());
            if (!due.isEmpty()) createSheet(workbook, "Due", due, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle, weightStyle);

            // Tab 6: Matured
            List<GoldSilverResponseDTO> matured = allInvestments.stream().filter(f -> f.getStatus() == GsStatus.MATURED).collect(Collectors.toList());
            if (!matured.isEmpty()) createSheet(workbook, "Matured", matured, headerStyle, dataStyle, rightAlignStyle, boldStyle, currencyStyle, percentStyle, weightStyle);

            workbook.write(out);
            byte[] bytes = out.toByteArray();

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"gold_silver_investments.xlsx\"");

            return ResponseEntity.ok()
                    .headers(httpHeaders)
                    .body(bytes);

        } catch (Exception e) {
            throw new RuntimeException("Error generating Gold & Silver Excel", e);
        }
    }

    private static void createSheet(Workbook workbook, String sheetName, List<GoldSilverResponseDTO> data,
                                    CellStyle headerStyle, CellStyle dataStyle, CellStyle rightAlignStyle, CellStyle boldStyle,
                                    CellStyle currencyStyle, CellStyle percentStyle, CellStyle weightStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        
        String[] headers = {
            "Item No", "Purchase Date", "Purchased From", "Item Description", "Metal Type", "Purity", "Rate Mode",
            "Weight (g)", "Rate/g", "Metal Amt", "Making Chg (%)", "Making Chg (₹)", "Other Chg (₹)", "Total Amt",
            "GST (%)", "GST Amt (₹)", "Net Amt", "Market Rate", "Current Val", "P/L", "Return %", "Status", "Maturity Date", "Remarks"
        };

        Row headerRow = sheet.createRow(0);
        headerRow.setHeightInPoints(25);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        for (int i = 0; i < data.size(); i++) {
            GoldSilverResponseDTO dto = data.get(i);
            Row row = sheet.createRow(i + 1);
            row.setHeightInPoints(22);

            createNumericCell(row, 0, dto.getItemNo() != null ? dto.getItemNo().doubleValue() : null, rightAlignStyle);
            createCell(row, 1, dto.getPurchaseDate() != null ? dto.getPurchaseDate().toString() : "", dataStyle);
            createCell(row, 2, dto.getPurchasedFrom(), dataStyle);
            createCell(row, 3, dto.getPurchaseItem(), dataStyle);
            createCell(row, 4, dto.getMetalType() != null ? dto.getMetalType().name() : "", dataStyle);
            createCell(row, 5, dto.getPurity(), dataStyle);
            createCell(row, 6, dto.getRateSource() != null ? dto.getRateSource().name() : "LIVE", dataStyle);
            createNumericCell(row, 7, dto.getNetWeight() != null ? dto.getNetWeight().doubleValue() : null, weightStyle);
            createNumericCell(row, 8, dto.getRatePerGram() != null ? dto.getRatePerGram().doubleValue() : null, currencyStyle);
            createNumericCell(row, 9, dto.getMetalAmount() != null ? dto.getMetalAmount().doubleValue() : null, currencyStyle);
            createNumericCell(row, 10, dto.getMakingChargePercent() != null ? dto.getMakingChargePercent().doubleValue() / 100.0 : null, percentStyle);
            createNumericCell(row, 11, dto.getMakingChargeAmount() != null ? dto.getMakingChargeAmount().doubleValue() : null, currencyStyle);
            createNumericCell(row, 12, dto.getStoneOtherCharges() != null ? dto.getStoneOtherCharges().doubleValue() : null, currencyStyle);
            createNumericCell(row, 13, dto.getTotalAmount() != null ? dto.getTotalAmount().doubleValue() : null, currencyStyle);
            createNumericCell(row, 14, dto.getGstPercent() != null ? dto.getGstPercent().doubleValue() / 100.0 : null, percentStyle);
            createNumericCell(row, 15, dto.getGstAmount() != null ? dto.getGstAmount().doubleValue() : null, currencyStyle);
            createNumericCell(row, 16, dto.getNetAmount() != null ? dto.getNetAmount().doubleValue() : null, currencyStyle);
            createNumericCell(row, 17, dto.getCurrentMarketRate() != null ? dto.getCurrentMarketRate().doubleValue() : null, currencyStyle);
            createNumericCell(row, 18, dto.getCurrentValue() != null ? dto.getCurrentValue().doubleValue() : null, currencyStyle);
            createNumericCell(row, 19, dto.getProfitLoss() != null ? dto.getProfitLoss().doubleValue() : null, currencyStyle);
            createNumericCell(row, 20, dto.getReturnPercent() != null ? dto.getReturnPercent().doubleValue() / 100.0 : null, percentStyle);
            createCell(row, 21, dto.getStatus() != null ? dto.getStatus().name() : "", dataStyle);
            createCell(row, 22, dto.getMaturityDate() != null ? dto.getMaturityDate().toString() : "-", dataStyle);
            createCell(row, 23, dto.getRemarks() != null ? dto.getRemarks() : "", dataStyle);
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

            CellStyle totalWeightStyle = workbook.createCellStyle();
            totalWeightStyle.cloneStyleFrom(borderTopStyle);
            totalWeightStyle.setFont(createCustomFont(workbook, "#1e293b", true, (short) 0));
            totalWeightStyle.setDataFormat(workbook.createDataFormat().getFormat("0.000\"g\""));
            totalWeightStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalWeightStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            for (int col = 0; col < headers.length; col++) {
                Cell cell = totalRow.createCell(col);
                cell.setCellStyle(borderTopStyle);
            }

            totalRow.getCell(0).setCellValue("Total");
            totalRow.getCell(0).setCellStyle(totalLabelStyle);

            double totalWeight = data.stream().mapToDouble(d -> d.getNetWeight() != null ? d.getNetWeight().doubleValue() : 0.0).sum();
            double totalMetalAmt = data.stream().mapToDouble(d -> d.getMetalAmount() != null ? d.getMetalAmount().doubleValue() : 0.0).sum();
            double totalMakingAmt = data.stream().mapToDouble(d -> d.getMakingChargeAmount() != null ? d.getMakingChargeAmount().doubleValue() : 0.0).sum();
            double totalOtherAmt = data.stream().mapToDouble(d -> d.getStoneOtherCharges() != null ? d.getStoneOtherCharges().doubleValue() : 0.0).sum();
            double totalAmt = data.stream().mapToDouble(d -> d.getTotalAmount() != null ? d.getTotalAmount().doubleValue() : 0.0).sum();
            double totalGstAmt = data.stream().mapToDouble(d -> d.getGstAmount() != null ? d.getGstAmount().doubleValue() : 0.0).sum();
            double totalNetAmt = data.stream().mapToDouble(d -> d.getNetAmount() != null ? d.getNetAmount().doubleValue() : 0.0).sum();
            double totalCurrentVal = data.stream().mapToDouble(d -> d.getCurrentValue() != null ? d.getCurrentValue().doubleValue() : 0.0).sum();
            double totalPl = data.stream().mapToDouble(d -> d.getProfitLoss() != null ? d.getProfitLoss().doubleValue() : 0.0).sum();

            Cell cellWeight = totalRow.getCell(7);
            cellWeight.setCellValue(totalWeight);
            cellWeight.setCellStyle(totalWeightStyle);

            Cell cellMetal = totalRow.getCell(9);
            cellMetal.setCellValue(totalMetalAmt);
            cellMetal.setCellStyle(totalCurrencyStyle);

            Cell cellMaking = totalRow.getCell(11);
            cellMaking.setCellValue(totalMakingAmt);
            cellMaking.setCellStyle(totalCurrencyStyle);

            Cell cellOther = totalRow.getCell(12);
            cellOther.setCellValue(totalOtherAmt);
            cellOther.setCellStyle(totalCurrencyStyle);

            Cell cellTotal = totalRow.getCell(13);
            cellTotal.setCellValue(totalAmt);
            cellTotal.setCellStyle(totalCurrencyStyle);

            Cell cellGst = totalRow.getCell(15);
            cellGst.setCellValue(totalGstAmt);
            cellGst.setCellStyle(totalCurrencyStyle);

            Cell cellNet = totalRow.getCell(16);
            cellNet.setCellValue(totalNetAmt);
            cellNet.setCellStyle(totalCurrencyStyle);

            Cell cellCurrentVal = totalRow.getCell(18);
            cellCurrentVal.setCellValue(totalCurrentVal);
            cellCurrentVal.setCellStyle(totalCurrencyStyle);

            Cell cellPl = totalRow.getCell(19);
            cellPl.setCellValue(totalPl);
            cellPl.setCellStyle(totalCurrencyStyle);
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
        style.setDataFormat(format.getFormat("0.00%"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }
    
    private static CellStyle createWeightStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("0.000\"g\""));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyGridBorders(workbook, style);
        return style;
    }
}
