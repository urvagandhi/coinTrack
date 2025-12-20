package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for Brokerage Calculator.
 */
public record BrokerageRequest(
        @NotNull(message = "Transaction type is required") String transactionType, // DELIVERY, INTRADAY, FUTURES,
                                                                                   // OPTIONS

        @NotNull(message = "Buy price is required") @DecimalMin(value = "0.01", message = "Buy price must be positive") BigDecimal buyPrice,

        @NotNull(message = "Sell price is required") @DecimalMin(value = "0.01", message = "Sell price must be positive") BigDecimal sellPrice,

        @NotNull(message = "Quantity is required") @DecimalMin(value = "1", message = "Minimum quantity is 1") @DecimalMax(value = "10000000", message = "Maximum quantity is 1 crore") BigDecimal quantity,

        String exchange, // NSE, BSE

        String broker // ZERODHA, GROWW, etc. (affects brokerage rates)
) {
    public BrokerageRequest {
        if (exchange == null)
            exchange = "NSE";
        if (broker == null)
            broker = "ZERODHA";
    }
}
