package com.urva.myfinance.coinTrack.common.exception;

/**
 * Exception thrown when an EPF transaction recalculation results in a negative balance.
 * Maps to HTTP 400 Bad Request.
 */
public class InsufficientEpfBalanceException extends DomainException {

    public InsufficientEpfBalanceException(String message) {
        super(message, "INSUFFICIENT_EPF_BALANCE", 400);
    }
}
