package com.urva.myfinance.coinTrack.common.response;

import java.time.Instant;

import org.slf4j.MDC;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standardized error response for API errors.
 * Used by GlobalExceptionHandler for consistent error formatting.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private Instant timestamp;
    private int status;
    private String errorCode;
    private String message;
    private String path;
    private String requestId;

    public ApiErrorResponse() {
        this.timestamp = Instant.now();
        this.requestId = MDC.get("requestId");
    }

    public ApiErrorResponse(int status, String errorCode, String message) {
        this();
        this.status = status;
        this.errorCode = errorCode;
        this.message = message;
    }

    public ApiErrorResponse(int status, String errorCode, String message, String path) {
        this(status, errorCode, message);
        this.path = path;
    }

    // Getters and setters
    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }
}
