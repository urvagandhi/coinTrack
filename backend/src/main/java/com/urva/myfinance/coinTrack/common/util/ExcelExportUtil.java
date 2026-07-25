package com.urva.myfinance.coinTrack.common.util;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

public class ExcelExportUtil {

    private ExcelExportUtil() {
        // Utility class
    }

    public static <T> ResponseEntity<byte[]> exportToExcel(
            String filename,
            String sheetName,
            String[] headers,
            List<T> data,
            List<? extends Function<T, ?>> extractors,
            Set<Integer> rightAlignedIndices) {

        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet(sheetName != null ? sheetName : "Data");

            // ── Style Definitions ──────────

            // 1. Header Style: Bold, Soft Gray Fill, Left Aligned
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.BLACK.getIndex());
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setAlignment(HorizontalAlignment.LEFT);

            // 2. FD No (Column 0) Style: Bold Text, Right Aligned
            CellStyle fdNoStyle = workbook.createCellStyle();
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            fdNoStyle.setFont(boldFont);
            fdNoStyle.setAlignment(HorizontalAlignment.RIGHT);
            fdNoStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // 3. Right-Aligned Data Cell Style
            CellStyle dataStyleRight = workbook.createCellStyle();
            dataStyleRight.setAlignment(HorizontalAlignment.RIGHT);
            dataStyleRight.setVerticalAlignment(VerticalAlignment.CENTER);

            // 4. Left-Aligned Data Cell Style
            CellStyle dataStyleLeft = workbook.createCellStyle();
            dataStyleLeft.setAlignment(HorizontalAlignment.LEFT);
            dataStyleLeft.setVerticalAlignment(VerticalAlignment.CENTER);

            // ── Create Header Row ──────────────────────────────────────────
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(26);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ── Populate Data Rows ─────────────────────────────────────────
            for (int r = 0; r < data.size(); r++) {
                T item = data.get(r);
                Row row = sheet.createRow(r + 1);
                row.setHeightInPoints(22);

                for (int c = 0; c < extractors.size(); c++) {
                    Cell cell = row.createCell(c);
                    Object value = extractors.get(c).apply(item);

                    if (value == null) {
                        cell.setCellValue("");
                    } else if (value instanceof Number) {
                        cell.setCellValue(((Number) value).doubleValue());
                    } else {
                        cell.setCellValue(value.toString());
                    }

                    if (rightAlignedIndices != null && rightAlignedIndices.contains(c)) {
                        cell.setCellStyle(dataStyleRight);
                    } else if (c == 0) {
                        cell.setCellStyle(fdNoStyle);
                    } else {
                        cell.setCellStyle(dataStyleLeft);
                    }
                }
            }

            // ── Fast Column Width Calculation (Instant execution) ─────────
            for (int i = 0; i < headers.length; i++) {
                int maxLen = headers[i] != null ? headers[i].length() : 10;
                for (T item : data) {
                    if (i < extractors.size()) {
                        Object val = extractors.get(i).apply(item);
                        if (val != null) {
                            maxLen = Math.max(maxLen, val.toString().length());
                        }
                    }
                }
                // Convert char length to POI units + 6 padding chars (min 14, max 45)
                int colWidth = Math.min(Math.max(maxLen + 6, 14), 45) * 256;
                sheet.setColumnWidth(i, colWidth);
            }

            workbook.write(out);
            byte[] bytes = out.toByteArray();

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + (filename.endsWith(".xlsx") ? filename : filename + ".xlsx") + "\"");

            return ResponseEntity.ok()
                    .headers(httpHeaders)
                    .body(bytes);

        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(ExcelExportUtil.class).error("Error generating Excel export", e);
            throw new RuntimeException("Error generating Excel export: " + e.getMessage(), e);
        }
    }
}
