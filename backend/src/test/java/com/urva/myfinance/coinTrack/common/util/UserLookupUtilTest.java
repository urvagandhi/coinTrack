package com.urva.myfinance.coinTrack.common.util;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserLookupUtilTest {

    @Mock
    private UserRepository userRepository;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id("user-123")
                .username("alice")
                .email("alice@example.com")
                .phoneNumber("+919876543210")
                .build();
    }

    @Test
    @DisplayName("1. Lookup by email finds user")
    void findByIdentifier_Email_FindsUser() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(sampleUser);

        Optional<User> result = UserLookupUtil.findByIdentifier(userRepository, "alice@example.com");

        assertTrue(result.isPresent());
        assertEquals("alice", result.get().getUsername());
    }

    @Test
    @DisplayName("2. Lookup by username finds user when email lookup fails")
    void findByIdentifier_Username_FindsUser() {
        when(userRepository.findByEmail("alice")).thenReturn(null);
        when(userRepository.findByUsername("alice")).thenReturn(sampleUser);

        Optional<User> result = UserLookupUtil.findByIdentifier(userRepository, "alice");

        assertTrue(result.isPresent());
        assertEquals("alice", result.get().getUsername());
    }

    @Test
    @DisplayName("3. Lookup by phone finds user when email and username fail")
    void findByIdentifier_Phone_FindsUser() {
        when(userRepository.findByEmail("+919876543210")).thenReturn(null);
        when(userRepository.findByUsername("+919876543210")).thenReturn(null);
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(sampleUser);

        Optional<User> result = UserLookupUtil.findByIdentifier(userRepository, "+919876543210");

        assertTrue(result.isPresent());
        assertEquals("+919876543210", result.get().getPhoneNumber());
    }

    @Test
    @DisplayName("4. No match found returns empty Optional")
    void findByIdentifier_NoMatch_ReturnsEmpty() {
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(null);
        when(userRepository.findByUsername("nobody@test.com")).thenReturn(null);
        when(userRepository.findByPhoneNumber("nobody@test.com")).thenReturn(null);

        Optional<User> result = UserLookupUtil.findByIdentifier(userRepository, "nobody@test.com");

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("5. Email takes priority over username when both match")
    void findByIdentifier_BothEmailAndUsernameMatch_ReturnsEmail() {
        User emailUser = User.builder().id("email-user").username("email_alice").build();

        when(userRepository.findByEmail("alice")).thenReturn(emailUser);

        Optional<User> result = UserLookupUtil.findByIdentifier(userRepository, "alice");

        assertTrue(result.isPresent());
        assertEquals("email-user", result.get().getId());
    }

    @Test
    @DisplayName("6. Utility class is final and cannot be subclassed")
    void classIsFinal() {
        assertTrue(java.lang.reflect.Modifier.isFinal(UserLookupUtil.class.getModifiers()));
    }

    @Test
    @DisplayName("7. All repositories called for unknown identifier")
    void findByIdentifier_Unknown_AllReposCalled() {
        when(userRepository.findByEmail("unknown")).thenReturn(null);
        when(userRepository.findByUsername("unknown")).thenReturn(null);
        when(userRepository.findByPhoneNumber("unknown")).thenReturn(null);

        UserLookupUtil.findByIdentifier(userRepository, "unknown");

        verify(userRepository).findByEmail("unknown");
        verify(userRepository).findByUsername("unknown");
        verify(userRepository).findByPhoneNumber("unknown");
    }
}
