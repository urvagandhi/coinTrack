package com.urva.myfinance.coinTrack.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.urva.myfinance.coinTrack.common.exception.AuthenticationException;
import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;
import com.urva.myfinance.coinTrack.user.model.PendingRegistration;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.PendingRegistrationRepository;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService - Comprehensive Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PendingRegistrationRepository pendingRegistrationRepository;
    @Mock private MongoTemplate mongoTemplate;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JWTService jwtService;
    @Mock private NoteService noteService;
    @Mock private EmailService emailService;
    @Mock private EmailTokenService emailTokenService;
    @Mock private EmailConfigProperties emailConfig;

    @InjectMocks private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        userService.setEmailService(emailService);
        userService.setEmailTokenService(emailTokenService);
        userService.setEmailConfig(emailConfig);

        sampleUser = User.builder()
                .id("u1").username("testuser").email("test@example.com")
                .password("encoded").name("Test User").build();
    }

    // ── registerUser ───────────────────────────────────────────────

    @Test
    @DisplayName("registerUser: missing username → throws")
    void registerUser_missingUsername_throws() {
        User user = User.builder().password("pass").build();
        assertThrows(RuntimeException.class, () -> userService.registerUser(user));
    }

    @Test
    @DisplayName("registerUser: missing password → throws")
    void registerUser_missingPassword_throws() {
        User user = User.builder().username("u").build();
        assertThrows(RuntimeException.class, () -> userService.registerUser(user));
    }

    @Test
    @DisplayName("registerUser: username exists in users → throws")
    void registerUser_usernameExists_throws() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);
        assertThrows(RuntimeException.class, () -> userService.registerUser(sampleUser));
    }

    @Test
    @DisplayName("registerUser: username exists in pending → throws")
    void registerUser_usernamePending_throws() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(pendingRegistrationRepository.existsByUsername("testuser")).thenReturn(true);
        assertThrows(RuntimeException.class, () -> userService.registerUser(sampleUser));
    }

    @Test
    @DisplayName("registerUser: email exists in users → throws")
    void registerUser_emailExists_throws() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(pendingRegistrationRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
        assertThrows(RuntimeException.class, () -> userService.registerUser(sampleUser));
    }

    @Test
    @DisplayName("registerUser: email exists in pending → throws")
    void registerUser_emailPending_throws() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(pendingRegistrationRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(pendingRegistrationRepository.existsByEmail("test@example.com")).thenReturn(true);
        assertThrows(RuntimeException.class, () -> userService.registerUser(sampleUser));
    }

    @Test
    @DisplayName("registerUser: phone exists → throws")
    void registerUser_phoneExists_throws() {
        sampleUser.setPhoneNumber("9876543210");
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(pendingRegistrationRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(pendingRegistrationRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("+919876543210")).thenReturn(true);
        assertThrows(RuntimeException.class, () -> userService.registerUser(sampleUser));
    }

    @Test
    @DisplayName("registerUser: success → returns LoginResponse with tempToken")
    void registerUser_success() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(pendingRegistrationRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(pendingRegistrationRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(jwtService.generateTempToken("testuser", "TOTP_REGISTRATION")).thenReturn("temp-token");

        LoginResponse response = userService.registerUser(sampleUser);

        assertTrue(response.getRequireTotpSetup());
        assertEquals("temp-token", response.getTempToken());
        assertEquals("testuser", response.getUsername());
        verify(pendingRegistrationRepository).save(any(PendingRegistration.class));
    }

    @Test
    @DisplayName("registerUser: phone normalization with +91 prefix")
    void registerUser_phoneNormalization() {
        sampleUser.setPhoneNumber("9876543210");
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(pendingRegistrationRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(pendingRegistrationRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("+919876543210")).thenReturn(false);
        when(jwtService.generateTempToken("testuser", "TOTP_REGISTRATION")).thenReturn("temp-token");

        userService.registerUser(sampleUser);

        verify(pendingRegistrationRepository).save(argThat(p -> "+919876543210".equals(p.getPhoneNumber())));
    }

    // ── getPendingRegistrationUser ──────────────────────────────────

    @Test
    @DisplayName("getPendingRegistrationUser: not found → null")
    void getPendingRegistrationUser_notFound_null() {
        when(pendingRegistrationRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        assertNull(userService.getPendingRegistrationUser("unknown"));
    }

    @Test
    @DisplayName("getPendingRegistrationUser: found → transient User")
    void getPendingRegistrationUser_found() {
        PendingRegistration pending = PendingRegistration.builder()
                .username("testuser").email("test@example.com").passwordHash("hash").build();
        when(pendingRegistrationRepository.findByUsername("testuser")).thenReturn(Optional.of(pending));

        User result = userService.getPendingRegistrationUser("testuser");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("hash", result.getPassword());
        assertFalse(result.isTotpEnabled());
    }

    @Test
    @DisplayName("getPendingRegistrationUser: Google provider → emailVerified=true")
    void getPendingRegistrationUser_googleProvider() {
        PendingRegistration pending = PendingRegistration.builder()
                .username("testuser").email("test@example.com").passwordHash("hash")
                .authProvider(AuthProvider.GOOGLE).googleId("g123").build();
        when(pendingRegistrationRepository.findByUsername("testuser")).thenReturn(Optional.of(pending));

        User result = userService.getPendingRegistrationUser("testuser");

        assertTrue(result.isEmailVerified());
        assertEquals("g123", result.getGoogleId());
        assertEquals(AuthProvider.GOOGLE, result.getAuthProvider());
    }

    // ── completePendingRegistration ─────────────────────────────────

    @Test
    @DisplayName("completePendingRegistration: pending not found → throws AuthenticationException")
    void completePendingRegistration_notFound_throws() {
        when(pendingRegistrationRepository.findByUsername("testuser")).thenReturn(Optional.empty());
        assertThrows(AuthenticationException.class, () -> userService.completePendingRegistration(sampleUser));
    }

    @Test
    @DisplayName("completePendingRegistration: success → saves user + deletes pending + seeds notes")
    void completePendingRegistration_success() {
        when(pendingRegistrationRepository.findByUsername("testuser")).thenReturn(Optional.of(new PendingRegistration()));
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        User result = userService.completePendingRegistration(sampleUser);

        assertEquals("u1", result.getId());
        verify(userRepository).save(sampleUser);
        verify(pendingRegistrationRepository).deleteByUsername("testuser");
        verify(noteService).createDefaultNotesIfNoneExist("u1");
    }

    // ── getAllUsers ─────────────────────────────────────────────────

    @Test
    @DisplayName("getAllUsers: delegates to repository")
    void getAllUsers_delegates() {
        when(userRepository.findAll()).thenReturn(List.of(sampleUser));
        assertEquals(1, userService.getAllUsers().size());
    }

    // ── getUserById ────────────────────────────────────────────────

    @Test
    @DisplayName("getUserById: found → returns user")
    void getUserById_found() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        assertEquals("u1", userService.getUserById("u1").getId());
    }

    @Test
    @DisplayName("getUserById: not found → null")
    void getUserById_notFound() {
        when(userRepository.findById("x")).thenReturn(Optional.empty());
        assertNull(userService.getUserById("x"));
    }

    // ── findUserByUsername ──────────────────────────────────────────

    @Test
    @DisplayName("findUserByUsername: null → null")
    void findUserByUsername_null_null() {
        assertNull(userService.findUserByUsername(null));
    }

    @Test
    @DisplayName("findUserByUsername: blank → null")
    void findUserByUsername_blank_null() {
        assertNull(userService.findUserByUsername("  "));
    }

    @Test
    @DisplayName("findUserByUsername: found → user")
    void findUserByUsername_found() {
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        assertEquals("u1", userService.findUserByUsername("testuser").getId());
    }

    // ── isUsernameAvailable ─────────────────────────────────────────

    @Test
    @DisplayName("isUsernameAvailable: true when not exists")
    void isUsernameAvailable_true() {
        when(userRepository.existsByUsername("new")).thenReturn(false);
        assertTrue(userService.isUsernameAvailable("new"));
    }

    @Test
    @DisplayName("isUsernameAvailable: false when exists")
    void isUsernameAvailable_false() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);
        assertFalse(userService.isUsernameAvailable("testuser"));
    }

    // ── updateUser ─────────────────────────────────────────────────

    @Test
    @DisplayName("updateUser: not found → null")
    void updateUser_notFound_null() {
        when(userRepository.findById("x")).thenReturn(Optional.empty());
        assertNull(userService.updateUser("x", new User()));
    }

    @Test
    @DisplayName("updateUser: blank username → throws")
    void updateUser_blankUsername_throws() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        User updates = new User();
        updates.setUsername(" ");
        assertThrows(IllegalArgumentException.class, () -> userService.updateUser("u1", updates));
    }

    @Test
    @DisplayName("updateUser: taken username → throws")
    void updateUser_takenUsername_throws() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        User updates = new User();
        updates.setUsername("taken");
        when(userRepository.findByUsername("taken")).thenReturn(User.builder().build());
        assertThrows(IllegalArgumentException.class, () -> userService.updateUser("u1", updates));
    }

    @Test
    @DisplayName("updateUser: same username → no conflict")
    void updateUser_sameUsername_noConflict() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        User updates = new User();
        updates.setName("Updated Name");
        when(userRepository.save(any())).thenReturn(sampleUser);

        User result = userService.updateUser("u1", updates);
        assertNotNull(result);
        verify(userRepository).save(any());
    }

    @Test
    @DisplayName("updateUser: blank email → throws")
    void updateUser_blankEmail_throws() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        User updates = new User();
        updates.setEmail(" ");
        assertThrows(IllegalArgumentException.class, () -> userService.updateUser("u1", updates));
    }

    @Test
    @DisplayName("updateUser: taken email → throws")
    void updateUser_takenEmail_throws() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        User updates = new User();
        updates.setEmail("taken@example.com");
        when(userRepository.findByEmail("taken@example.com")).thenReturn(User.builder().build());
        assertThrows(IllegalArgumentException.class, () -> userService.updateUser("u1", updates));
    }

    @Test
    @DisplayName("updateUser: taken phone → throws")
    void updateUser_takenPhone_throws() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        User updates = new User();
        updates.setPhoneNumber("9999999999");
        when(userRepository.findByPhoneNumber("+919999999999")).thenReturn(User.builder().build());
        assertThrows(IllegalArgumentException.class, () -> userService.updateUser("u1", updates));
    }

    // ── changePassword ─────────────────────────────────────────────

    @Test
    @DisplayName("changePassword: user not found → throws")
    void changePassword_notFound_throws() {
        when(userRepository.findById("x")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> userService.changePassword("x", "old", "new"));
    }

    @Test
    @DisplayName("changePassword: wrong current → throws")
    void changePassword_wrongCurrent_throws() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);
        assertThrows(RuntimeException.class, () -> userService.changePassword("u1", "wrong", "NewPass1!"));
    }

    @Test
    @DisplayName("changePassword: success → encodes and saves")
    void changePassword_success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("old", "encoded")).thenReturn(true);
        when(passwordEncoder.encode("new")).thenReturn("newEncoded");

        userService.changePassword("u1", "old", "new");

        verify(userRepository).save(argThat(u -> "newEncoded".equals(u.getPassword())));
    }

    // ── deleteUser ─────────────────────────────────────────────────

    @Test
    @DisplayName("deleteUser: exists → true")
    void deleteUser_exists_true() {
        when(userRepository.existsById("u1")).thenReturn(true);
        assertTrue(userService.deleteUser("u1"));
        verify(userRepository).deleteById("u1");
    }

    @Test
    @DisplayName("deleteUser: not exists → false")
    void deleteUser_notExists_false() {
        when(userRepository.existsById("x")).thenReturn(false);
        assertFalse(userService.deleteUser("x"));
    }

    // ── isTokenValid ───────────────────────────────────────────────

    @Test
    @DisplayName("isTokenValid: valid → true")
    void isTokenValid_valid_true() {
        when(jwtService.extractUsername("tok")).thenReturn("testuser");
        when(jwtService.isTokenExpired("tok")).thenReturn(false);
        assertTrue(userService.isTokenValid("tok"));
    }

    @Test
    @DisplayName("isTokenValid: expired → false")
    void isTokenValid_expired_false() {
        when(jwtService.extractUsername("tok")).thenReturn("testuser");
        when(jwtService.isTokenExpired("tok")).thenReturn(true);
        assertFalse(userService.isTokenValid("tok"));
    }

    @Test
    @DisplayName("isTokenValid: exception → false")
    void isTokenValid_exception_false() {
        when(jwtService.extractUsername("tok")).thenThrow(new RuntimeException("bad"));
        assertFalse(userService.isTokenValid("tok"));
    }

    // ── getUserByToken ─────────────────────────────────────────────

    @Test
    @DisplayName("getUserByToken: extracts username and finds user")
    void getUserByToken_found() {
        when(jwtService.extractUsername("tok")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        assertEquals("u1", userService.getUserByToken("tok").getId());
    }

    @Test
    @DisplayName("getUserByToken: user not found → null")
    void getUserByToken_notFound() {
        when(jwtService.extractUsername("tok")).thenReturn("unknown");
        when(userRepository.findByUsername("unknown")).thenReturn(null);
        assertNull(userService.getUserByToken("tok"));
    }

    // ── updatePendingTotpSecret ────────────────────────────────────

    @Test
    @DisplayName("updatePendingTotpSecret: found → updates secret")
    void updatePendingTotpSecret_found() {
        PendingRegistration pending = PendingRegistration.builder().username("testuser").build();
        when(pendingRegistrationRepository.findByUsername("testuser")).thenReturn(Optional.of(pending));

        userService.updatePendingTotpSecret("testuser", "encrypted-secret");

        assertEquals("encrypted-secret", pending.getTotpSecretEncrypted());
        verify(pendingRegistrationRepository).save(pending);
    }

    @Test
    @DisplayName("updatePendingTotpSecret: not found → no-op")
    void updatePendingTotpSecret_notFound() {
        when(pendingRegistrationRepository.findByUsername("x")).thenReturn(Optional.empty());
        userService.updatePendingTotpSecret("x", "secret");
        verify(pendingRegistrationRepository, never()).save(any());
    }

    // ── getPendingRegistrationByGoogleId ───────────────────────────

    @Test
    @DisplayName("getPendingRegistrationByGoogleId: found → returns")
    void getPendingRegistrationByGoogleId_found() {
        PendingRegistration pending = PendingRegistration.builder().googleId("g1").build();
        when(pendingRegistrationRepository.findByGoogleId("g1")).thenReturn(Optional.of(pending));
        assertEquals("g1", userService.getPendingRegistrationByGoogleId("g1").getGoogleId());
    }

    @Test
    @DisplayName("getPendingRegistrationByGoogleId: not found → null")
    void getPendingRegistrationByGoogleId_notFound() {
        when(pendingRegistrationRepository.findByGoogleId("x")).thenReturn(Optional.empty());
        assertNull(userService.getPendingRegistrationByGoogleId("x"));
    }

    // ── savePendingRegistration ────────────────────────────────────

    @Test
    @DisplayName("savePendingRegistration: saves to repository")
    void savePendingRegistration_saves() {
        PendingRegistration pending = PendingRegistration.builder().username("u").build();
        userService.savePendingRegistration(pending);
        verify(pendingRegistrationRepository).save(pending);
    }
}
