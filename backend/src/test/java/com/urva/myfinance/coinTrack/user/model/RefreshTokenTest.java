package com.urva.myfinance.coinTrack.user.model;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RefreshTokenTest {

    @Test
    @DisplayName("1. Builder creates refresh token with defaults")
    void builder_CreatesWithDefaults() {
        RefreshToken token = RefreshToken.builder().build();
        assertFalse(token.isRevoked());
    }

    @Test
    @DisplayName("2. Builder creates with all fields")
    void builder_AllFields() {
        Instant now = Instant.now();
        RefreshToken token = RefreshToken.builder()
                .id("token-1")
                .userId("user-123")
                .tokenHash("abc123hash")
                .deviceInfo("Chrome/Mac")
                .ipAddress("192.168.1.1")
                .createdAt(now)
                .expiresAt(now.plusSeconds(2592000))
                .lastUsedAt(now)
                .revoked(false)
                .build();

        assertEquals("token-1", token.getId());
        assertEquals("user-123", token.getUserId());
        assertEquals("abc123hash", token.getTokenHash());
        assertEquals("Chrome/Mac", token.getDeviceInfo());
        assertEquals("192.168.1.1", token.getIpAddress());
        assertFalse(token.isRevoked());
    }

    @Test
    @DisplayName("3. Setters and getters work")
    void settersAndGetters_Work() {
        RefreshToken token = new RefreshToken();
        token.setUserId("user-1");
        token.setTokenHash("hash");
        token.setRevoked(true);

        assertEquals("user-1", token.getUserId());
        assertEquals("hash", token.getTokenHash());
        assertTrue(token.isRevoked());
    }

    @Test
    @DisplayName("4. Default revoked is false")
    void defaultRevoked_IsFalse() {
        RefreshToken token = RefreshToken.builder().build();
        assertFalse(token.isRevoked());
    }
}
