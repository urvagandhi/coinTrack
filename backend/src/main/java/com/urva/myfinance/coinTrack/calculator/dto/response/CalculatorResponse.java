package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Base response wrapper for all calculator responses.
 * Provides consistent structure with metadata and optional debug info.
 */
public record CalculatorResponse<T>(
        boolean success,
        CalculatorMetadata metadata,
        T result,
        List<YearlyBreakdown> breakdown,
        DebugInfo debug,
        ErrorInfo error) {
    /**
     * Create a successful response with result.
     */
    public static <T> CalculatorResponse<T> success(
            CalculatorMetadata metadata,
            T result,
            List<YearlyBreakdown> breakdown) {
        return new CalculatorResponse<>(true, metadata, result, breakdown, null, null);
    }

    /**
     * Create a successful response with debug info.
     */
    public static <T> CalculatorResponse<T> successWithDebug(
            CalculatorMetadata metadata,
            T result,
            List<YearlyBreakdown> breakdown,
            DebugInfo debug) {
        return new CalculatorResponse<>(true, metadata, result, breakdown, debug, null);
    }

    /**
     * Create an error response.
     */
    public static <T> CalculatorResponse<T> error(String code, String message, String field) {
        return new CalculatorResponse<>(false, null, null, null, null,
                new ErrorInfo(code, message, field));
    }

    /**
     * Create an error response without field.
     */
    public static <T> CalculatorResponse<T> error(String code, String message) {
        return error(code, message, null);
    }

    /**
     * Calculator metadata for versioning and audit.
     */
    public record CalculatorMetadata(
            String calculatorId,
            String category,
            String version,
            String lastUpdated,
            List<String> assumptions) {
        public static CalculatorMetadata of(String calculatorId, String category) {
            return new CalculatorMetadata(
                    calculatorId,
                    category,
                    "1.0",
                    java.time.LocalDate.now().toString(),
                    List.of());
        }

        public static CalculatorMetadata of(String calculatorId, String category, List<String> assumptions) {
            return new CalculatorMetadata(
                    calculatorId,
                    category,
                    "1.0",
                    java.time.LocalDate.now().toString(),
                    assumptions);
        }
    }

    /**
     * Year-by-year breakdown for detailed view.
     */
    public record YearlyBreakdown(
            int year,
            BigDecimal investment,
            BigDecimal interest,
            BigDecimal balance) {
    }

    /**
     * Debug information for troubleshooting.
     */
    public record DebugInfo(
            BigDecimal monthlyRate,
            int totalMonths,
            String formulaUsed,
            java.util.Map<String, Object> additionalInfo) {
        public static DebugInfo of(BigDecimal monthlyRate, int totalMonths, String formula) {
            return new DebugInfo(monthlyRate, totalMonths, formula, null);
        }

        public static DebugInfo withInfo(BigDecimal monthlyRate, int totalMonths,
                String formula, java.util.Map<String, Object> info) {
            return new DebugInfo(monthlyRate, totalMonths, formula, info);
        }
    }

    /**
     * Error information for validation failures.
     */
    public record ErrorInfo(
            String code,
            String message,
            String field) {
    }
}
