package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for Stock Average Calculator.
 */
public record StockAverageResponse(
        BigDecimal totalQuantity,
        BigDecimal averagePrice,
        BigDecimal totalInvestment) {
}
