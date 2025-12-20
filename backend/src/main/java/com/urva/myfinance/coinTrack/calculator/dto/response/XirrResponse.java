package com.urva.myfinance.coinTrack.calculator.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for XIRR Calculator.
 */
public record XirrResponse(
        BigDecimal xirr, // As percentage
        boolean success,
        String errorCode,
        String errorMessage,
        BigDecimal totalInvested,
        BigDecimal totalReceived,
        BigDecimal absoluteReturn) {
    public static XirrResponse success(BigDecimal xirr, BigDecimal invested, BigDecimal received) {
        return new XirrResponse(xirr, true, null, null, invested, received,
                received.subtract(invested));
    }

    public static XirrResponse failure(String errorCode, String errorMessage) {
        return new XirrResponse(null, false, errorCode, errorMessage, null, null, null);
    }
}
