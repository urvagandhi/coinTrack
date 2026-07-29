package com.urva.myfinance.coinTrack.common.exception;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DomainExceptionTest {

    @Test
    @DisplayName("1. Single-arg constructor sets defaults")
    void singleArgConstructor_SetsDefaults() {
        DomainException ex = new DomainException("Something went wrong");
        assertEquals("Something went wrong", ex.getMessage());
        assertEquals("DOMAIN_ERROR", ex.getErrorCode());
        assertEquals(400, ex.getHttpStatus());
    }

    @Test
    @DisplayName("2. Three-arg constructor sets all fields")
    void threeArgConstructor_SetsAllFields() {
        DomainException ex = new DomainException("Not found", "NOT_FOUND", 404);
        assertEquals("Not found", ex.getMessage());
        assertEquals("NOT_FOUND", ex.getErrorCode());
        assertEquals(404, ex.getHttpStatus());
    }

    @Test
    @DisplayName("3. Four-arg constructor with cause")
    void fourArgConstructor_WithCause() {
        RuntimeException cause = new RuntimeException("root cause");
        DomainException ex = new DomainException("Error", "ERROR", 500, cause);
        assertEquals("Error", ex.getMessage());
        assertEquals("ERROR", ex.getErrorCode());
        assertEquals(500, ex.getHttpStatus());
        assertEquals(cause, ex.getCause());
    }

    @Test
    @DisplayName("4. AuthenticationException maps to 401")
    void authenticationException_MapsTo401() {
        AuthenticationException ex = new AuthenticationException("Invalid credentials");
        assertEquals("Invalid credentials", ex.getMessage());
        assertEquals("AUTH_FAILED", ex.getErrorCode());
        assertEquals(401, ex.getHttpStatus());
    }

    @Test
    @DisplayName("5. AuthenticationException with cause")
    void authenticationException_WithCause() {
        RuntimeException cause = new RuntimeException("JWT expired");
        AuthenticationException ex = new AuthenticationException("Auth failed", cause);
        assertEquals(cause, ex.getCause());
        assertEquals(401, ex.getHttpStatus());
    }

    @Test
    @DisplayName("6. AuthorizationException maps to 403")
    void authorizationException_MapsTo403() {
        AuthorizationException ex = new AuthorizationException("Access denied");
        assertEquals("Access denied", ex.getMessage());
        assertEquals("ACCESS_DENIED", ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("7. AuthorizationException with cause")
    void authorizationException_WithCause() {
        RuntimeException cause = new RuntimeException("no role");
        AuthorizationException ex = new AuthorizationException("Forbidden", cause);
        assertEquals(cause, ex.getCause());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("8. Exception is a RuntimeException")
    void isRuntimeException() {
        assertTrue(new DomainException("test") instanceof RuntimeException);
    }
}
