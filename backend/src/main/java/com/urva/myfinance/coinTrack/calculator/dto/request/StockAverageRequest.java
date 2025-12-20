package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Stock Average Calculator.
 */
public record StockAverageRequest(
        @NotNull(message = "Existing quantity is required") @DecimalMin(value = "0", message = "Quantity cannot be negative") BigDecimal existingQuantity,

        @NotNull(message = "Existing price is required") @DecimalMin(value = "0", message = "Price cannot be negative") BigDecimal existingPrice,

        @NotNull(message = "New quantity is required") @DecimalMin(value = "0.0001", message = "New quantity must be positive") BigDecimal newQuantity,

        @NotNull(message = "New price is required") @DecimalMin(value = "0.01", message = "New price must be positive") BigDecimal newPrice) {
}
