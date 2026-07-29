package com.urva.myfinance.coinTrack.user.dto;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RegisterUserDTOTest {

    @Test
    @DisplayName("1. Default constructor creates empty RegisterUserDTO")
    void defaultConstructor_CreatesEmpty() {
        RegisterUserDTO dto = new RegisterUserDTO();
        assertNull(dto.getUsername());
        assertNull(dto.getEmail());
        assertNull(dto.getMobile());
        assertNull(dto.getPassword());
    }

    @Test
    @DisplayName("2. Constructor with required fields")
    void constructorWithRequiredFields_SetsFields() {
        RegisterUserDTO dto = new RegisterUserDTO("alice", "alice@test.com", "9876543210", "Pass@1234");

        assertEquals("alice", dto.getUsername());
        assertEquals("alice@test.com", dto.getEmail());
        assertEquals("9876543210", dto.getMobile());
        assertEquals("Pass@1234", dto.getPassword());
    }

    @Test
    @DisplayName("3. Setters and getters work correctly")
    void settersAndGetters_Work() {
        RegisterUserDTO dto = new RegisterUserDTO();
        dto.setUsername("bob");
        dto.setEmail("bob@test.com");
        dto.setMobile("9876543210");
        dto.setPassword("Secure@123");
        dto.setFirstName("Bob");
        dto.setLastName("Builder");

        assertEquals("bob", dto.getUsername());
        assertEquals("bob@test.com", dto.getEmail());
        assertEquals("9876543210", dto.getMobile());
        assertEquals("Secure@123", dto.getPassword());
        assertEquals("Bob", dto.getFirstName());
        assertEquals("Builder", dto.getLastName());
    }

    @Test
    @DisplayName("4. toString masks password")
    void toString_MasksPassword() {
        RegisterUserDTO dto = new RegisterUserDTO("alice", "a@b.com", "9876543210", "secretPass@1");
        String str = dto.toString();

        assertTrue(str.contains("[PROTECTED]"));
        assertFalse(str.contains("secretPass@1"));
        assertTrue(str.contains("alice"));
    }

    @Test
    @DisplayName("5. Optional fields default to null")
    void optionalFieldsDefaultToNull() {
        RegisterUserDTO dto = new RegisterUserDTO();
        assertNull(dto.getFirstName());
        assertNull(dto.getLastName());
    }
}
