package com.urva.myfinance.coinTrack.common.exception;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.response.ApiErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

/**
 * Global exception handler for consistent error responses across all controllers.
 *
 * Rules:
 * - 4xx errors: logged at WARN level (message only, no stack trace)
 * - 5xx errors: logged at ERROR level (full stack trace)
 * - Stack traces are NEVER exposed in any response
 * - All responses use {@link ApiErrorResponse} for consistency
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── Domain exception hierarchy ──────────────────────────────────────

    /**
     * Handles authentication failures (401).
     * More specific than DomainException, so Spring resolves it first.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        logger.warn("Authentication failed: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNAUTHORIZED, "AUTH_FAILED", ex.getMessage(), request);
    }

    /**
     * Handles authorization failures (403).
     */
    @ExceptionHandler(AuthorizationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthorizationException(
            AuthorizationException ex, HttpServletRequest request) {
        logger.warn("Authorization denied: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "ACCESS_DENIED", ex.getMessage(), request);
    }

    /**
     * Handles external service failures (broker APIs, etc.) (502).
     */
    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ApiErrorResponse> handleExternalServiceException(
            ExternalServiceException ex, HttpServletRequest request) {
        logger.error("External service failure [{}]: {}", ex.getServiceName(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.BAD_GATEWAY, "EXTERNAL_SERVICE_FAILED",
                "External service temporarily unavailable: " + ex.getServiceName(), request);
    }

    /**
     * Catches any other DomainException subclass not handled above.
     */
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiErrorResponse> handleDomainException(
            DomainException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getHttpStatus());
        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }

        if (status.is5xxServerError()) {
            logger.error("Domain exception: {} - {}", ex.getErrorCode(), ex.getMessage(), ex);
        } else {
            logger.warn("Domain exception: {} - {}", ex.getErrorCode(), ex.getMessage());
        }

        return buildResponse(status, ex.getErrorCode(), ex.getMessage(), request);
    }

    // ── Broker exceptions ───────────────────────────────────────────────

    @ExceptionHandler(BrokerException.class)
    public ResponseEntity<ApiErrorResponse> handleBrokerException(
            BrokerException ex, HttpServletRequest request) {
        logger.error("Broker exception [{}]: {}", ex.getBroker(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE, "BROKER_ERROR",
                "Broker operation failed: " + ex.getMessage(), request);
    }

    // ── Validation / bad-request family ─────────────────────────────────

    /**
     * Bean Validation errors from {@code @Valid} on request bodies.
     * Returns field-level error details so the frontend can highlight individual fields.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        logger.warn("Validation failed: {} field error(s)", ex.getBindingResult().getErrorCount());

        List<ApiErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiErrorResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_FAILED",
                "Request validation failed",
                request.getRequestURI());
        error.setFieldErrors(fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Jakarta {@code @Constraint} violations on path/query params or service-layer validation.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        logger.warn("Constraint violation: {}", ex.getMessage());

        List<ApiErrorResponse.FieldError> fieldErrors = ex.getConstraintViolations().stream()
                .map(cv -> {
                    String path = cv.getPropertyPath().toString();
                    String field = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
                    return new ApiErrorResponse.FieldError(field, cv.getMessage());
                })
                .toList();

        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_FAILED",
                "Constraint validation failed",
                request.getRequestURI());
        error.setFieldErrors(fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Malformed JSON body — client sent unparseable content.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        logger.warn("Malformed request body: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST",
                "Request body is missing or malformed", request);
    }

    // ── 404 ─────────────────────────────────────────────────────────────

    /**
     * No handler matched the request path.
     * Requires {@code spring.mvc.throw-exception-if-no-handler-found=true}
     * and {@code spring.web.resources.add-mappings=false} in application.properties.
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoHandlerFound(
            NoHandlerFoundException ex, HttpServletRequest request) {
        logger.warn("No handler found: {} {}", ex.getHttpMethod(), ex.getRequestURL());
        return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND",
                "The requested resource was not found", request);
    }

    // ── Catch-all ───────────────────────────────────────────────────────

    /**
     * Final safety net. Returns a generic 500 — NEVER exposes the real message.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAllUncaught(
            Exception ex, HttpServletRequest request) {
        logger.error("Unhandled exception on {} {}: {}", request.getMethod(),
                request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred", request);
    }

    // ── Helper ──────────────────────────────────────────────────────────

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status, String errorCode, String message, HttpServletRequest request) {
        ApiErrorResponse error = new ApiErrorResponse(status.value(), errorCode, message, request.getRequestURI());
        return ResponseEntity.status(status).body(error);
    }
}
