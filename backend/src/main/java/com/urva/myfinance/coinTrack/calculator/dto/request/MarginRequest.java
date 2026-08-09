package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Margin Calculator.
 */
public record MarginRequest(
        @NotNull(message = "Segment type is required") String segmentType, 

        @NotNull(message = "Trade value is required") @DecimalMin(value = "0.01") BigDecimal tradeValue,

        BigDecimal leverage) {
}
