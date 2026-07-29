package com.urva.myfinance.coinTrack.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.LocalDateTime;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.urva.myfinance.coinTrack.common.exception.AuthenticationException;
import com.urva.myfinance.coinTrack.security.service.GoogleOAuthService;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;
import com.urva.myfinance.coinTrack.user.model.PendingRegistration;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("UserAuthenticationService - Comprehensive Tests")
class UserAuthenticationServiceComprehensiveTest {

    @Mock private UserRepository userRepository;
    @Mock private AuthenticationManager authManager;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JWTService jwtService;
    @Mock private TotpService totpService;
    @Mock private UserService userService;
    @Mock private GoogleOAuthService googleOAuthService;
    @Mock private NoteService noteService;

    @InjectMocks
    private UserAuthenticationService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id("u1").username("testuser").email("test@example.com")
                .phoneNumber("+919876543210").password("encoded")
                .totpEnabled(false).totpVerified(false)
                .passwordFailedAttempts(0)
                .passwordLockedUntil(null)
                .authProvider(AuthProvider.LOCAL)
                .build();
    }

    // ── authenticate: normal login ─────────────────────────────────

    @Test
    @DisplayName("authenticate: user not found → returns null with timing-safe BCrypt")
    void authenticate_userNotFound_returnsNull() {
        when(userRepository.findByUsername("unknown")).thenReturn(null);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("unknown", "Pass1!");

        assertNull(result);
        // Verify BCrypt still ran (timing-safe)
        verify(passwordEncoder).matches(eq("Pass1!"), contains("$2a$10$"));
    }

    @Test
    @DisplayName("authenticate: user not found via email → returns null")
    void authenticate_userNotFoundByEmail_returnsNull() {
        when(userRepository.findByUsername("email@test.com")).thenReturn(null);
        when(userRepository.findByEmail("email@test.com")).thenReturn(null);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("email@test.com", "Pass1!");

        assertNull(result);
    }

    @Test
    @DisplayName("authenticate: user not found via phone → returns null")
    void authenticate_userNotFoundByPhone_returnsNull() {
        when(userRepository.findByUsername("9876543210")).thenReturn(null);
        when(userRepository.findByEmail("9876543210")).thenReturn(null);
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(null);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("9876543210", "Pass1!");

        assertNull(result);
    }

    @Test
    @DisplayName("authenticate: null identifier → returns null")
    void authenticate_nullIdentifier_returnsNull() {
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate(null, "Pass1!");

        assertNull(result);
    }

    @Test
    @DisplayName("authenticate: blank identifier → returns null")
    void authenticate_blankIdentifier_returnsNull() {
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("  ", "Pass1!");

        assertNull(result);
    }

    @Test
    @DisplayName("authenticate: wrong password → returns null, increments failed attempts")
    void authenticate_wrongPassword_returnsNull() {
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad"));

        LoginResponse result = authService.authenticate("testuser", "WrongPass1!");

        assertNull(result);
        verify(userRepository).save(argThat(u -> u.getPasswordFailedAttempts() == 1));
    }

    @Test
    @DisplayName("authenticate: 5th failed attempt → 15min lockout")
    void authenticate_fifthAttempt_lockout15min() {
        sampleUser.setPasswordFailedAttempts(4);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad"));

        authService.authenticate("testuser", "WrongPass1!");

        verify(userRepository).save(argThat(u -> {
            assertEquals(5, u.getPasswordFailedAttempts());
            assertNotNull(u.getPasswordLockedUntil());
            return true;
        }));
    }

    @Test
    @DisplayName("authenticate: 10th failed attempt → 1hr lockout")
    void authenticate_tenthAttempt_lockout1hr() {
        sampleUser.setPasswordFailedAttempts(9);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad"));

        authService.authenticate("testuser", "WrongPass1!");

        verify(userRepository).save(argThat(u -> {
            assertEquals(10, u.getPasswordFailedAttempts());
            assertNotNull(u.getPasswordLockedUntil());
            return true;
        }));
    }

    @Test
    @DisplayName("authenticate: account locked → throws AuthenticationException")
    void authenticate_lockedAccount_throws() {
        sampleUser.setPasswordLockedUntil(Instant.now().plusSeconds(600));
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThrows(AuthenticationException.class,
                () -> authService.authenticate("testuser", "Pass1!"));
    }

    @Test
    @DisplayName("authenticate: expired lock → resets and proceeds")
    void authenticate_expiredLock_resets() {
        sampleUser.setPasswordLockedUntil(Instant.now().minusSeconds(10));
        sampleUser.setPasswordFailedAttempts(7);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("testuser", "Pass1!");

        assertNotNull(result);
        verify(userRepository).save(argThat(u -> u.getPasswordFailedAttempts() == 0 && u.getPasswordLockedUntil() == null));
    }

    @Test
    @DisplayName("authenticate: successful login without TOTP → returns requireTotpSetup=true")
    void authenticate_success_noTotp_returnsSetup() {
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtService.generateTempToken(any(User.class), eq("TOTP_SETUP"), eq(30))).thenReturn("setup-token");

        LoginResponse result = authService.authenticate("testuser", "Pass1!");

        assertNotNull(result);
        assertTrue(result.getRequireTotpSetup());
        assertNotNull(result.getTempToken());
        assertEquals("u1", result.getUserId());
        assertEquals("testuser", result.getUsername());
    }

    @Test
    @DisplayName("authenticate: successful login with TOTP enabled → returns tempToken for TOTP")
    void authenticate_success_withTotp_returnsTempToken() {
        sampleUser.setTotpEnabled(true);
        sampleUser.setTotpVerified(true);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtService.generateTempToken(any(User.class), eq("TOTP_LOGIN"), eq(10))).thenReturn("totp-login-token");

        LoginResponse result = authService.authenticate("testuser", "Pass1!");

        assertNotNull(result);
        assertFalse(result.getRequireTotpSetup());
        assertNotNull(result.getTempToken());
        assertEquals("Please verify TOTP to complete login.", result.getMessage());
    }

    @Test
    @DisplayName("authenticate: successful with existing failed attempts → resets counters")
    void authenticate_success_resetsFailedAttempts() {
        sampleUser.setPasswordFailedAttempts(3);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        authService.authenticate("testuser", "Pass1!");

        verify(userRepository).save(argThat(u -> u.getPasswordFailedAttempts() == 0 && u.getPasswordLockedUntil() == null));
    }

    // ── completeTotpLogin ──────────────────────────────────────────

    @Test
    @DisplayName("completeTotpLogin: valid token + valid code → returns tokens")
    void completeTotpLogin_success() {
        when(jwtService.isValidTempToken("tmp", "TOTP_LOGIN")).thenReturn(true);
        when(jwtService.extractUsername("tmp")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyLogin(sampleUser, "123456")).thenReturn(true);
        when(jwtService.generateToken(sampleUser)).thenReturn("access-token");
        when(jwtService.generateRefreshToken("u1", "device", "ip")).thenReturn("refresh-token");

        LoginResponse result = authService.completeTotpLogin("tmp", "123456", "device", "ip");

        assertNotNull(result);
        assertEquals("access-token", result.getToken());
        assertEquals("refresh-token", result.getRefreshToken());
    }

    @Test
    @DisplayName("completeTotpLogin: invalid tempToken → throws")
    void completeTotpLogin_invalidToken_throws() {
        when(jwtService.isValidTempToken("bad", "TOTP_LOGIN")).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> authService.completeTotpLogin("bad", "123456", "device", "ip"));
    }

    @Test
    @DisplayName("completeTotpLogin: user not found → throws")
    void completeTotpLogin_userNotFound_throws() {
        when(jwtService.isValidTempToken("tmp", "TOTP_LOGIN")).thenReturn(true);
        when(userRepository.findByUsername("testuser")).thenReturn(null);

        assertThrows(RuntimeException.class,
                () -> authService.completeTotpLogin("tmp", "123456", "device", "ip"));
    }

    @Test
    @DisplayName("completeTotpLogin: invalid TOTP code → throws")
    void completeTotpLogin_invalidCode_throws() {
        when(jwtService.isValidTempToken("tmp", "TOTP_LOGIN")).thenReturn(true);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyLogin(sampleUser, "000000")).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> authService.completeTotpLogin("tmp", "000000", "device", "ip"));
    }

    // ── completeRecoveryLogin ──────────────────────────────────────

    @Test
    @DisplayName("completeRecoveryLogin: valid backup code → returns tokens")
    void completeRecoveryLogin_success() {
        when(jwtService.isValidTempToken("tmp", "TOTP_LOGIN")).thenReturn(true);
        when(jwtService.extractUsername("tmp")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyBackupCode(sampleUser, "12345678")).thenReturn(true);
        when(jwtService.generateToken(sampleUser)).thenReturn("access");
        when(jwtService.generateRefreshToken("u1", "d", "i")).thenReturn("refresh");

        LoginResponse result = authService.completeRecoveryLogin("tmp", "12345678", "d", "i");

        assertNotNull(result);
        assertEquals("access", result.getToken());
    }

    @Test
    @DisplayName("completeRecoveryLogin: invalid tempToken → throws")
    void completeRecoveryLogin_invalidToken_throws() {
        when(jwtService.isValidTempToken("bad", "TOTP_LOGIN")).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> authService.completeRecoveryLogin("bad", "12345678", "d", "i"));
    }

    @Test
    @DisplayName("completeRecoveryLogin: invalid backup code → throws")
    void completeRecoveryLogin_invalidCode_throws() {
        when(jwtService.isValidTempToken("tmp", "TOTP_LOGIN")).thenReturn(true);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyBackupCode(sampleUser, "00000000")).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> authService.completeRecoveryLogin("tmp", "00000000", "d", "i"));
    }

    // ── completeRegistrationWithTotp ───────────────────────────────

    @Test
    @DisplayName("completeRegistrationWithTotp: success → returns tokens + backup codes")
    void completeRegistrationWithTotp_success() {
        when(jwtService.extractUsername("rtok")).thenReturn("newuser");
        User pendingUser = new User();
        pendingUser.setUsername("newuser");
        when(userService.getPendingRegistrationUser("newuser")).thenReturn(pendingUser);
        when(totpService.verifySetupForPendingUser(pendingUser, "123456"))
                .thenReturn(java.util.List.of("code1", "code2"));
        User savedUser = new User();
        savedUser.setId("u2");
        savedUser.setUsername("newuser");
        savedUser.setTotpSecretVersion(1);
        when(userService.completePendingRegistration(pendingUser)).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("jwt");
        when(jwtService.generateRefreshToken("u2", "d", "i")).thenReturn("rt");

        LoginResponse result = authService.completeRegistrationWithTotp("rtok", "123456", "d", "i");

        assertNotNull(result);
        assertEquals("jwt", result.getToken());
        assertEquals("u2", result.getUserId());
        assertEquals(java.util.List.of("code1", "code2"), result.getBackupCodes());
        verify(totpService).saveBackupCodes(savedUser, java.util.List.of("code1", "code2"), 1);
    }

    @Test
    @DisplayName("completeRegistrationWithTotp: expired pending → throws")
    void completeRegistrationWithTotp_expiredPending_throws() {
        when(jwtService.extractUsername("rtok")).thenReturn("expired");
        when(userService.getPendingRegistrationUser("expired")).thenReturn(null);

        assertThrows(RuntimeException.class,
                () -> authService.completeRegistrationWithTotp("rtok", "123456", "d", "i"));
    }

    // ── isTokenValid ───────────────────────────────────────────────

    @Test
    @DisplayName("isTokenValid: valid → true")
    void isTokenValid_valid_returnsTrue() {
        when(jwtService.extractUsername("tok")).thenReturn("user");
        when(jwtService.isTokenExpired("tok")).thenReturn(false);

        assertTrue(authService.isTokenValid("tok"));
    }

    @Test
    @DisplayName("isTokenValid: expired → false")
    void isTokenValid_expired_returnsFalse() {
        when(jwtService.extractUsername("tok")).thenReturn("user");
        when(jwtService.isTokenExpired("tok")).thenReturn(true);

        assertFalse(authService.isTokenValid("tok"));
    }

    @Test
    @DisplayName("isTokenValid: exception → false")
    void isTokenValid_exception_returnsFalse() {
        when(jwtService.extractUsername("bad")).thenThrow(new RuntimeException("bad jwt"));

        assertFalse(authService.isTokenValid("bad"));
    }

    // ── getUserByToken ─────────────────────────────────────────────

    @Test
    @DisplayName("getUserByToken: returns user for valid token")
    void getUserByToken_valid() {
        when(jwtService.extractUsername("tok")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);

        User result = authService.getUserByToken("tok");

        assertEquals("u1", result.getId());
    }

    // ── getUserEntityByUsername ────────────────────────────────────

    @Test
    @DisplayName("getUserEntityByUsername: exists → returns user")
    void getUserEntityByUsername_exists() {
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);

        User result = authService.getUserEntityByUsername("testuser");

        assertEquals("testuser", result.getUsername());
    }

    @Test
    @DisplayName("getUserEntityByUsername: not found → throws")
    void getUserEntityByUsername_notFound_throws() {
        when(userRepository.findByUsername("ghost")).thenReturn(null);

        assertThrows(RuntimeException.class,
                () -> authService.getUserEntityByUsername("ghost"));
    }

    // ── getPendingUser ─────────────────────────────────────────────

    @Test
    @DisplayName("getPendingUser: delegates to userService")
    void getPendingUser_delegates() {
        User pending = new User();
        pending.setUsername("pending1");
        when(userService.getPendingRegistrationUser("pending1")).thenReturn(pending);

        User result = authService.getPendingUser("pending1");

        assertEquals("pending1", result.getUsername());
    }

    // ── Phone normalization edge cases ─────────────────────────────

    @Test
    @DisplayName("authenticate: 10-digit phone normalized with +91 prefix")
    void authenticate_10digitPhone_normalized() {
        when(userRepository.findByUsername("9876543210")).thenReturn(null);
        when(userRepository.findByEmail("9876543210")).thenReturn(null);
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("9876543210", "Pass1!");

        assertNotNull(result);
        verify(userRepository).findByPhoneNumber("+919876543210");
    }

    @Test
    @DisplayName("authenticate: phone with +91 prefix → kept as-is")
    void authenticate_plusPrefixPhone_keptAsIs() {
        when(userRepository.findByUsername("+919876543210")).thenReturn(null);
        when(userRepository.findByEmail("+919876543210")).thenReturn(null);
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("+919876543210", "Pass1!");

        assertNotNull(result);
        verify(userRepository).findByPhoneNumber("+919876543210");
    }

    @Test
    @DisplayName("authenticate: non-10-digit phone → normalized without +91")
    void authenticate_nonDigitPhone_normalized() {
        when(userRepository.findByUsername("12345")).thenReturn(null);
        when(userRepository.findByEmail("12345")).thenReturn(null);
        when(userRepository.findByPhoneNumber("12345")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse result = authService.authenticate("12345", "Pass1!");

        assertNotNull(result);
        verify(userRepository).findByPhoneNumber("12345");
    }
}
