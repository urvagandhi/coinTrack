package com.urva.myfinance.coinTrack.calculator.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for XIRR Calculator.
 */
public record XirrRequest(
        @NotNull(message = "Cash flows are required") List<CashFlowEntry> cashFlows) {
    /**
     * Individual cash flow entry.
     */
    public record CashFlowEntry(
            @NotNull(message = "Date is required") LocalDate date,

            @NotNull(message = "Amount is required") BigDecimal amount // Negative for outflow, positive for inflow
    ) {
    }
}
