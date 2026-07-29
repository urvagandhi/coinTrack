package com.urva.myfinance.coinTrack.user.dto;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CompleteProfileRequestTest {

    @Test
    @DisplayName("1. Default constructor creates empty CompleteProfileRequest")
    void defaultConstructor_CreatesEmpty() {
        CompleteProfileRequest request = new CompleteProfileRequest();
        assertNull(request.getTempToken());
        assertNull(request.getUsername());
        assertNull(request.getName());
        assertNull(request.getDateOfBirth());
    }

    @Test
    @DisplayName("2. Constructor with fields")
    void constructorWithFields_SetsFields() {
        CompleteProfileRequest request = new CompleteProfileRequest(
                "temp-token", "alice", "Alice Smith", LocalDate.of(1995, 5, 15));

        assertEquals("temp-token", request.getTempToken());
        assertEquals("alice", request.getUsername());
        assertEquals("Alice Smith", request.getName());
        assertEquals(LocalDate.of(1995, 5, 15), request.getDateOfBirth());
    }

    @Test
    @DisplayName("3. Setters and getters work")
    void settersAndGetters_Work() {
        CompleteProfileRequest request = new CompleteProfileRequest();
        request.setTempToken("token-123");
        request.setUsername("bob");
        request.setName("Bob Builder");
        request.setDateOfBirth(LocalDate.of(1990, 1, 1));
        request.setPhoneNumber("+919876543210");
        request.setPassword("Secure@123");
        request.setConfirmPassword("Secure@123");

        assertEquals("token-123", request.getTempToken());
        assertEquals("bob", request.getUsername());
        assertEquals("Bob Builder", request.getName());
        assertEquals(LocalDate.of(1990, 1, 1), request.getDateOfBirth());
        assertEquals("+919876543210", request.getPhoneNumber());
        assertEquals("Secure@123", request.getPassword());
        assertEquals("Secure@123", request.getConfirmPassword());
    }
}
