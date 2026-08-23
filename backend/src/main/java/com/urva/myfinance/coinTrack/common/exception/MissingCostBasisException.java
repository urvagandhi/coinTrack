package com.urva.myfinance.coinTrack.common.exception;

/**
 * Exception thrown when a synthesized lot or manual units are consumed without a valid cost basis.
 * Maps to HTTP 400 Bad Request.
 */
public class MissingCostBasisException extends DomainException {

    public MissingCostBasisException(String message) {
        super(message, "MISSING_COST_BASIS", 400);
    }
}
