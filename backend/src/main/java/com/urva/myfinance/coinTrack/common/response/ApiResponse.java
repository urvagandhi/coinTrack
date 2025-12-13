package com.urva.myfinance.coinTrack.common.response;

import java.time.Instant;

import org.slf4j.MDC;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standard API response wrapper for all endpoints.
 * Provides consistent structure for both success and error responses.
 *
 * Frontend can always expect:
 * - success: boolean indicating operation result
 * - data: payload (null on error)
 * - message: human-readable message
 * - timestamp: when response was generated
 * - requestId: correlation ID for debugging/support
 *
 * @param <T> Type of the data payload
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private Instant timestamp;
    private String requestId;

    private ApiResponse() {
        this.timestamp = Instant.now();
        this.requestId = MDC.get("requestId");
    }

    /**
     * Creates a successful response with data.
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        return response;
    }

    /**
     * Creates a successful response with data and message.
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = message;
        return response;
    }

    /**
     * Creates a successful response with message only.
     */
    public static <T> ApiResponse<T> success(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.message = message;
        return response;
    }

    /**
     * Creates an error response with message.
     */
    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        return response;
    }

    // Getters
    public boolean isSuccess() {
        return success;
    }

    public T getData() {
        return data;
    }

    public String getMessage() {
        return message;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getRequestId() {
        return requestId;
    }
}
