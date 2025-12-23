package com.urva.myfinance.coinTrack.common.response;

import java.time.Instant;

import org.slf4j.MDC;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standard API response wrapper for all endpoints.
 *
 * Frontend can always expect:
 * <ul>
 *   <li>{@code success} — boolean indicating operation result</li>
 *   <li>{@code data} — payload (null on error or void endpoints)</li>
 *   <li>{@code message} — human-readable message</li>
 *   <li>{@code timestamp} — ISO 8601 instant when response was generated</li>
 *   <li>{@code requestId} — correlation ID for debugging/support</li>
 * </ul>
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
     * Success with data (message defaults to "Success").
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = "Success";
        return response;
    }

    /**
     * Success with data and a custom message.
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = message;
        return response;
    }

    /**
     * Success with message only — for void endpoints (logout, delete, etc.).
     */
    public static ApiResponse<Void> success(String message) {
        ApiResponse<Void> response = new ApiResponse<>();
        response.success = true;
        response.message = message;
        return response;
    }

    /**
     * Error with message.
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
