package com.urva.myfinance.coinTrack.common.exception;

/**
 * Exception thrown when external service calls fail (broker APIs, etc.).
 * Maps to HTTP 502 Bad Gateway or 503 Service Unavailable.
 */
public class ExternalServiceException extends DomainException {

    private final String serviceName;

    public ExternalServiceException(String serviceName, String message) {
        super(message, "EXTERNAL_SERVICE_FAILED", 502);
        this.serviceName = serviceName;
    }

    public ExternalServiceException(String serviceName, String message, Throwable cause) {
        super(message, "EXTERNAL_SERVICE_FAILED", 502, cause);
        this.serviceName = serviceName;
    }

    public String getServiceName() {
        return serviceName;
    }
}
