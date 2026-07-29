package com.urva.myfinance.coinTrack.user.dto;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LoginResponseTest {

    @Test
    @DisplayName("1. Default constructor creates empty LoginResponse")
    void defaultConstructor_CreatesEmpty() {
        LoginResponse response = new LoginResponse();
        assertNull(response.getToken());
        assertNull(response.getUserId());
        assertNull(response.getUsername());
        assertNull(response.getEmail());
    }

    @Test
    @DisplayName("2. Constructor with essential fields")
    void constructorWithEssentialFields_SetsFields() {
        LoginResponse response = new LoginResponse("token-123", "user-1", "alice", "alice@test.com");

        assertEquals("token-123", response.getToken());
        assertEquals("user-1", response.getUserId());
        assertEquals("alice", response.getUsername());
        assertEquals("alice@test.com", response.getEmail());
    }

    @Test
    @DisplayName("3. Setters and getters work correctly")
    void settersAndGetters_Work() {
        LoginResponse response = new LoginResponse();
        response.setToken("jwt-token");
        response.setUserId("uid-123");
        response.setUsername("bob");
        response.setEmail("bob@test.com");
        response.setMobile("9876543210");
        response.setFirstName("Bob");
        response.setLastName("Builder");
        response.setRequireTotpSetup(true);
        response.setTempToken("temp-xyz");
        response.setMessage("TOTP required");
        response.setBio("Investor");
        response.setLocation("Mumbai");
        response.setRefreshToken("refresh-abc");
        response.setBackupCodes(List.of("AAAA-BBBB", "CCCC-DDDD"));
        response.setProfileComplete(true);

        assertEquals("jwt-token", response.getToken());
        assertEquals("uid-123", response.getUserId());
        assertEquals("bob", response.getUsername());
        assertEquals("bob@test.com", response.getEmail());
        assertEquals("9876543210", response.getMobile());
        assertEquals("Bob", response.getFirstName());
        assertEquals("Builder", response.getLastName());
        assertTrue(response.getRequireTotpSetup());
        assertEquals("temp-xyz", response.getTempToken());
        assertEquals("TOTP required", response.getMessage());
        assertEquals("Investor", response.getBio());
        assertEquals("Mumbai", response.getLocation());
        assertEquals("refresh-abc", response.getRefreshToken());
        assertEquals(List.of("AAAA-BBBB", "CCCC-DDDD"), response.getBackupCodes());
        assertTrue(response.getProfileComplete());
    }

    @Test
    @DisplayName("4. toString masks token value")
    void toString_MasksToken() {
        LoginResponse response = new LoginResponse("secret-token", "u1", "alice", "a@b.com");
        String str = response.toString();

        assertTrue(str.contains("[PROTECTED]"));
        assertFalse(str.contains("secret-token"));
        assertTrue(str.contains("alice"));
    }

    @Test
    @DisplayName("5. toString shows null token as 'null'")
    void toString_NullToken_ShowsNull() {
        LoginResponse response = new LoginResponse();
        String str = response.toString();

        assertTrue(str.contains("token='null'"));
    }

    @Test
    @DisplayName("6. All fields default to null")
    void allFieldsDefaultToNull() {
        LoginResponse response = new LoginResponse();
        assertNull(response.getMobile());
        assertNull(response.getFirstName());
        assertNull(response.getLastName());
        assertNull(response.getRequireTotpSetup());
        assertNull(response.getTempToken());
        assertNull(response.getMessage());
        assertNull(response.getBio());
        assertNull(response.getLocation());
        assertNull(response.getRefreshToken());
        assertNull(response.getBackupCodes());
        assertNull(response.getProfileComplete());
    }
}
