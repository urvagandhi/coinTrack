package com.urva.myfinance.coinTrack.common.exception;

/**
 * Exception thrown when Fixed Deposit maturityDate is not strictly after issueDate.
 * Maps to HTTP 400 Bad Request.
 */
public class InvalidFdDateRangeException extends DomainException {

    public InvalidFdDateRangeException(String message) {
        super(message, "INVALID_FD_DATE_RANGE", 400);
    }
}
