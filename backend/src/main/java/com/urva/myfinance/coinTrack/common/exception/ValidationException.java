package com.urva.myfinance.coinTrack.common.exception;

/**
 * Exception thrown when request validation fails.
 * Maps to HTTP 400 Bad Request.
 */
public class ValidationException extends DomainException {

    private final String field;

    public ValidationException(String message) {
        super(message, "VALIDATION_FAILED", 400);
        this.field = null;
    }

    public ValidationException(String field, String message) {
        super(message, "VALIDATION_FAILED", 400);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
