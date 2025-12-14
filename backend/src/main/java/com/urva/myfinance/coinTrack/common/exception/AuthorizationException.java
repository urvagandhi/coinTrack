package com.urva.myfinance.coinTrack.common.exception;

/**
 * Exception thrown when user lacks permission for an operation.
 * Maps to HTTP 403 Forbidden.
 */
public class AuthorizationException extends DomainException {

    public AuthorizationException(String message) {
        super(message, "ACCESS_DENIED", 403);
    }

    public AuthorizationException(String message, Throwable cause) {
        super(message, "ACCESS_DENIED", 403, cause);
    }
}
