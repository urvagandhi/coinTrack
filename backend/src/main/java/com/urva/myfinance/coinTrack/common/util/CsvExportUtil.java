package com.urva.myfinance.coinTrack.common.util;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.function.Function;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

public class CsvExportUtil {

    private CsvExportUtil() {
        // Utility class constructor
    }

    public static <T> ResponseEntity<byte[]> exportToCsv(
            String filename,
            String[] headers,
            List<T> data,
            List<Function<T, String>> extractors) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", headers)).append("\n");

        for (T item : data) {
            for (int i = 0; i < extractors.size(); i++) {
                String val = extractors.get(i).apply(item);
                if (val == null) {
                    val = "";
                }
                if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
                    val = "\"" + val.replace("\"", "\"\"") + "\"";
                }
                sb.append(val);
                if (i < extractors.size() - 1) {
                    sb.append(",");
                }
            }
            sb.append("\n");
        }

        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.parseMediaType("text/csv"));
        httpHeaders.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(httpHeaders)
                .body(bytes);
    }
}
