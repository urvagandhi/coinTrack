package com.urva.myfinance.coinTrack.common.exception;

/**
 * Base exception for all domain-specific errors in CoinTrack.
 * Provides structured error handling with error codes and HTTP status mapping.
 *
 * Exception Hierarchy:
 * DomainException (base)
 * ├── AuthenticationException (401)
 * ├── AuthorizationException (403)
 * ├── ValidationException (400)
 * └── ExternalServiceException (502/503)
 */
public class DomainException extends RuntimeException {

    private final String errorCode;
    private final int httpStatus;

    public DomainException(String message) {
        this(message, "DOMAIN_ERROR", 400);
    }

    public DomainException(String message, String errorCode, int httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public DomainException(String message, String errorCode, int httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}
