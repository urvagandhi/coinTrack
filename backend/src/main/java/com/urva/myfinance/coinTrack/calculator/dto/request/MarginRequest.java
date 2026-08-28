package com.urva.myfinance.coinTrack.calculator.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/** Request DTO for Margin Calculator. */
public record MarginRequest(
    @NotNull(message = "Segment type is required") String segmentType,
    @NotNull(message = "Trade value is required") @DecimalMin(value = "0.01") BigDecimal tradeValue,
    BigDecimal leverage) {}
