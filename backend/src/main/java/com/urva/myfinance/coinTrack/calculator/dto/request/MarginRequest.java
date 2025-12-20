package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Margin Calculator.
 */
public record MarginRequest(
        @NotNull(message = "Transaction type is required") String transactionType, // DELIVERY, INTRADAY, FUTURES,
                                                                                   // OPTIONS

        @NotNull(message = "Price is required") @DecimalMin(value = "0.01") BigDecimal price,

        @NotNull(message = "Quantity is required") @DecimalMin(value = "1") BigDecimal quantity,

        BigDecimal leverage) {
}
