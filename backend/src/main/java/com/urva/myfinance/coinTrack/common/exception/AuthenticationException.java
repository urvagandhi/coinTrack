package com.urva.myfinance.coinTrack.common.exception;

/**
 * Exception thrown when user authentication fails.
 * Maps to HTTP 401 Unauthorized.
 */
public class AuthenticationException extends DomainException {

    public AuthenticationException(String message) {
        super(message, "AUTH_FAILED", 401);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, "AUTH_FAILED", 401, cause);
    }
}
