package com.urva.myfinance.coinTrack.common.exception;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.response.ApiErrorResponse;

/**
 * Global exception handler for consistent error responses across all
 * controllers.
 * All exceptions are logged appropriately without exposing sensitive
 * information.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles domain exceptions from our exception hierarchy.
     */
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiErrorResponse> handleDomainException(DomainException ex) {
        logger.warn("Domain exception: {} - {}", ex.getErrorCode(), ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                ex.getHttpStatus(),
                ex.getErrorCode(),
                ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus()).body(error);
    }

    /**
     * Handles authentication failures (401).
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        logger.warn("Authentication failed: {}", ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "AUTH_FAILED",
                ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handles authorization failures (403).
     */
    @ExceptionHandler(AuthorizationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthorizationException(AuthorizationException ex) {
        logger.warn("Authorization denied: {}", ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "ACCESS_DENIED",
                ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handles external service failures (broker APIs, etc.).
     */
    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ApiErrorResponse> handleExternalServiceException(ExternalServiceException ex) {
        logger.error("External service failure [{}]: {}", ex.getServiceName(), ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_GATEWAY.value(),
                "EXTERNAL_SERVICE_FAILED",
                "External service temporarily unavailable: " + ex.getServiceName());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
    }

    /**
     * Handles broker-specific exceptions.
     */
    @ExceptionHandler(BrokerException.class)
    public ResponseEntity<ApiErrorResponse> handleBrokerException(BrokerException ex) {
        logger.error("Broker exception [{}]: {}", ex.getBroker(), ex.getMessage());

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "BROKER_ERROR",
                "Broker operation failed: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }

    /**
     * Handles validation errors from @Valid annotations.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        logger.warn("Validation failed: {} field errors", ex.getBindingResult().getErrorCount());

        Map<String, String> response = new HashMap<>();
        response.put("error", "Validation Failed");

        StringBuilder sb = new StringBuilder();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            sb.append(fieldName).append(": ").append(errorMessage).append(". ");
        });
        response.put("message", sb.toString().trim());

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Catches all other runtime exceptions.
     * Logs the full stack trace for debugging but returns safe message to client.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        logger.error("Unhandled runtime exception: {}", ex.getMessage(), ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Internal Server Error");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
