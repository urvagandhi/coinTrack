package com.urva.myfinance.coinTrack.user.model;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PendingRegistrationTest {

    @Test
    @DisplayName("1. Builder creates pending registration with defaults")
    void builder_CreatesWithDefaults() {
        PendingRegistration pending = PendingRegistration.builder().build();
        assertNull(pending.getId());
        assertNull(pending.getUsername());
        assertNull(pending.getEmail());
        assertNull(pending.getAuthProvider());
    }

    @Test
    @DisplayName("2. Builder creates with all fields")
    void builder_AllFields() {
        Instant now = Instant.now();
        PendingRegistration pending = PendingRegistration.builder()
                .id("pending-1")
                .tempToken("token-abc")
                .username("alice")
                .email("alice@test.com")
                .phoneNumber("+919876543210")
                .name("Alice")
                .passwordHash("hashed-pwd")
                .totpSecretEncrypted("totp-enc")
                .googleId("google-sub-123")
                .authProvider(AuthProvider.GOOGLE)
                .createdAt(now)
                .expiresAt(now.plusSeconds(900))
                .build();

        assertEquals("pending-1", pending.getId());
        assertEquals("token-abc", pending.getTempToken());
        assertEquals("alice", pending.getUsername());
        assertEquals("alice@test.com", pending.getEmail());
        assertEquals("+919876543210", pending.getPhoneNumber());
        assertEquals("Alice", pending.getName());
        assertEquals("hashed-pwd", pending.getPasswordHash());
        assertEquals("totp-enc", pending.getTotpSecretEncrypted());
        assertEquals("google-sub-123", pending.getGoogleId());
        assertEquals(AuthProvider.GOOGLE, pending.getAuthProvider());
        assertEquals(now, pending.getCreatedAt());
    }

    @Test
    @DisplayName("3. Setters and getters work")
    void settersAndGetters_Work() {
        PendingRegistration pending = new PendingRegistration();
        pending.setTempToken("token");
        pending.setUsername("bob");
        pending.setAuthProvider(AuthProvider.LOCAL);

        assertEquals("token", pending.getTempToken());
        assertEquals("bob", pending.getUsername());
        assertEquals(AuthProvider.LOCAL, pending.getAuthProvider());
    }
}
