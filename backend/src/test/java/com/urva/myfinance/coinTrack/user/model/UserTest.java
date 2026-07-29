package com.urva.myfinance.coinTrack.user.model;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class UserTest {

    @Test
    @DisplayName("1. Builder creates user with defaults")
    void builder_CreatesWithDefaults() {
        User user = User.builder().build();
        assertFalse(user.isTotpEnabled());
        assertFalse(user.isTotpVerified());
        assertEquals(1, user.getTotpSecretVersion());
        assertEquals(0, user.getTotpFailedAttempts());
        assertFalse(user.isEmailVerified());
        assertEquals(0, user.getPasswordFailedAttempts());
        assertEquals(AuthProvider.LOCAL, user.getAuthProvider());
    }

    @Test
    @DisplayName("2. Builder creates user with all fields")
    void builder_AllFields() {
        User user = User.builder()
                .id("user-123")
                .username("alice")
                .name("Alice Smith")
                .dateOfBirth(LocalDate.of(1995, 5, 15))
                .email("alice@test.com")
                .phoneNumber("+919876543210")
                .bio("Investor")
                .location("Mumbai")
                .password("hashed-pwd")
                .passwordFailedAttempts(3)
                .passwordLockedUntil(Instant.now().plusSeconds(300))
                .totpEnabled(true)
                .totpVerified(true)
                .totpSecretEncrypted("encrypted-secret")
                .totpSecretPending("pending-secret")
                .totpSecretVersion(2)
                .totpSetupAt(LocalDateTime.now())
                .totpLastUsedAt(LocalDateTime.now())
                .totpFailedAttempts(1)
                .totpLockedUntil(LocalDateTime.now().plusMinutes(5))
                .emailVerified(true)
                .emailVerifiedAt(LocalDateTime.now())
                .pendingEmail("new@test.com")
                .authProvider(AuthProvider.GOOGLE)
                .googleId("google-sub-123")
                .build();

        assertEquals("user-123", user.getId());
        assertEquals("alice", user.getUsername());
        assertEquals("Alice Smith", user.getName());
        assertEquals("alice@test.com", user.getEmail());
        assertEquals("+919876543210", user.getPhoneNumber());
        assertEquals("Investor", user.getBio());
        assertEquals("Mumbai", user.getLocation());
        assertEquals("hashed-pwd", user.getPassword());
        assertEquals(3, user.getPasswordFailedAttempts());
        assertTrue(user.isTotpEnabled());
        assertTrue(user.isTotpVerified());
        assertEquals("encrypted-secret", user.getTotpSecretEncrypted());
        assertEquals("pending-secret", user.getTotpSecretPending());
        assertEquals(2, user.getTotpSecretVersion());
        assertTrue(user.isEmailVerified());
        assertEquals("new@test.com", user.getPendingEmail());
        assertEquals(AuthProvider.GOOGLE, user.getAuthProvider());
        assertEquals("google-sub-123", user.getGoogleId());
    }

    @Test
    @DisplayName("3. Setters and getters work")
    void settersAndGetters_Work() {
        User user = new User();
        user.setId("id-1");
        user.setUsername("bob");
        user.setName("Bob Builder");
        user.setEmail("bob@test.com");
        user.setPhoneNumber("9876543210");
        user.setPassword("pwd");
        user.setAuthProvider(AuthProvider.GOOGLE);

        assertEquals("id-1", user.getId());
        assertEquals("bob", user.getUsername());
        assertEquals(AuthProvider.GOOGLE, user.getAuthProvider());
    }

    @Test
    @DisplayName("4. Default authProvider is LOCAL")
    void defaultAuthProvider_IsLocal() {
        User user = User.builder().build();
        assertEquals(AuthProvider.LOCAL, user.getAuthProvider());
    }

    @Test
    @DisplayName("5. Default totpEnabled is false")
    void defaultTotpEnabled_IsFalse() {
        User user = User.builder().build();
        assertFalse(user.isTotpEnabled());
    }

    @Test
    @DisplayName("6. Default emailVerified is false")
    void defaultEmailVerified_IsFalse() {
        User user = User.builder().build();
        assertFalse(user.isEmailVerified());
    }
}
