package com.urva.myfinance.coinTrack.ppf.exception;

import com.urva.myfinance.coinTrack.common.exception.DomainException;

/**
 * Exception thrown when a PPF transaction recalculation results in a negative balance.
 * Maps to HTTP 400 Bad Request.
 */
public class InsufficientPpfBalanceException extends DomainException {

    public InsufficientPpfBalanceException(String message) {
        super(message, "INSUFFICIENT_PPF_BALANCE", 400);
    }
}
