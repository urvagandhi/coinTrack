package com.urva.myfinance.coinTrack.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.urva.myfinance.coinTrack.common.exception.AuthenticationException;
import com.urva.myfinance.coinTrack.security.service.GoogleOAuthService;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.user.dto.CompleteProfileRequest;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;
import com.urva.myfinance.coinTrack.user.model.PendingRegistration;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("UserAuthenticationService - Comprehensive Tests")
class UserAuthenticationServiceTest {

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
                .id("u1")
                .username("testuser")
                .email("test@example.com")
                .phoneNumber("+919876543210")
                .name("Test User")
                .password("encodedPass")
                .totpEnabled(false)
                .totpVerified(false)
                .passwordFailedAttempts(0)
                .totpSecretVersion(1)
                .authProvider(AuthProvider.LOCAL)
                .build();
    }

    // ── authenticate ───────────────────────────────────────────────

    @Test
    @DisplayName("authenticate: valid user without TOTP → returns requireTotpSetup=true")
    void authenticate_noTotp_returnsSetupRequired() {
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtService.generateTempToken(any(User.class), eq("TOTP_SETUP"), eq(30))).thenReturn("setup-token");

        LoginResponse response = authService.authenticate("testuser", "Pass123!");

        assertNotNull(response);
        assertTrue(response.getRequireTotpSetup());
        assertNotNull(response.getTempToken());
        assertEquals("u1", response.getUserId());
        verify(authManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("authenticate: valid user with TOTP enabled+verified → returns tempToken for TOTP login")
    void authenticate_withTotp_returnsTempTokenForLogin() {
        sampleUser.setTotpEnabled(true);
        sampleUser.setTotpVerified(true);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtService.generateTempToken(any(User.class), eq("TOTP_LOGIN"), eq(10))).thenReturn("totp-login-token");

        LoginResponse response = authService.authenticate("testuser", "Pass123!");

        assertNotNull(response);
        assertFalse(response.getRequireTotpSetup());
        assertNotNull(response.getTempToken());
        assertEquals("Please verify TOTP to complete login.", response.getMessage());
    }

    @Test
    @DisplayName("authenticate: user not found → returns null (timing-safe BCrypt runs)")
    void authenticate_userNotFound_returnsNull() {
        when(userRepository.findByUsername("unknown")).thenReturn(null);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse response = authService.authenticate("unknown", "Pass123!");

        assertNull(response);
        verify(passwordEncoder).matches(eq("Pass123!"), anyString());
    }

    @Test
    @DisplayName("authenticate: wrong password → returns null and increments failed attempts")
    void authenticate_wrongPassword_returnsNull() {
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        LoginResponse response = authService.authenticate("testuser", "WrongPass1!");

        assertNull(response);
        verify(userRepository).save(argThat(u -> u.getPasswordFailedAttempts() == 1));
    }

    @Test
    @DisplayName("authenticate: 5 failed attempts → 15-minute lockout")
    void authenticate_fiveFailures_locksFor15Min() {
        sampleUser.setPasswordFailedAttempts(4);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        authService.authenticate("testuser", "WrongPass1!");

        verify(userRepository).save(argThat(u -> {
            assertEquals(5, u.getPasswordFailedAttempts());
            assertNotNull(u.getPasswordLockedUntil());
            return true;
        }));
    }

    @Test
    @DisplayName("authenticate: 10 failed attempts → 1-hour lockout")
    void authenticate_tenFailures_locksFor1hr() {
        sampleUser.setPasswordFailedAttempts(9);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        authService.authenticate("testuser", "WrongPass1!");

        verify(userRepository).save(argThat(u -> {
            assertEquals(10, u.getPasswordFailedAttempts());
            assertNotNull(u.getPasswordLockedUntil());
            return true;
        }));
    }

    @Test
    @DisplayName("authenticate: locked account → throws AuthenticationException with time remaining")
    void authenticate_lockedAccount_throwsException() {
        sampleUser.setPasswordLockedUntil(Instant.now().plusSeconds(600));
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThrows(AuthenticationException.class, () ->
                authService.authenticate("testuser", "Pass123!"));
    }

    @Test
    @DisplayName("authenticate: expired lock → resets and allows login")
    void authenticate_expiredLock_resetsAndAllows() {
        sampleUser.setPasswordLockedUntil(Instant.now().minusSeconds(10));
        sampleUser.setPasswordFailedAttempts(7);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse response = authService.authenticate("testuser", "Pass123!");

        assertNotNull(response);
        verify(userRepository).save(argThat(u -> {
            assertEquals(0, u.getPasswordFailedAttempts());
            assertNull(u.getPasswordLockedUntil());
            return true;
        }));
    }

    @Test
    @DisplayName("authenticate: successful login resets failed attempts to 0")
    void authenticate_successResetsAttempts() {
        sampleUser.setPasswordFailedAttempts(3);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        authService.authenticate("testuser", "Pass123!");

        verify(userRepository).save(argThat(u -> {
            assertEquals(0, u.getPasswordFailedAttempts());
            assertNull(u.getPasswordLockedUntil());
            return true;
        }));
    }

    @Test
    @DisplayName("authenticate: lookup by email")
    void authenticate_lookupByEmail() {
        when(userRepository.findByUsername("test@example.com")).thenReturn(null);
        when(userRepository.findByEmail("test@example.com")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse response = authService.authenticate("test@example.com", "Pass123!");

        assertNotNull(response);
    }

    @Test
    @DisplayName("authenticate: lookup by phone (10-digit → +91 prefix)")
    void authenticate_lookupByPhone() {
        when(userRepository.findByUsername("9876543210")).thenReturn(null);
        when(userRepository.findByEmail("9876543210")).thenReturn(null);
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(sampleUser);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse response = authService.authenticate("9876543210", "Pass123!");

        assertNotNull(response);
        verify(userRepository).findByPhoneNumber("+919876543210");
    }

    @Test
    @DisplayName("authenticate: null/blank identifier → returns null")
    void authenticate_nullIdentifier_returnsNull() {
        assertNull(authService.authenticate(null, "Pass123!"));
        assertNull(authService.authenticate("  ", "Pass123!"));
    }

    // ── completeTotpLogin ──────────────────────────────────────────

    @Test
    @DisplayName("completeTotpLogin: valid tempToken + valid code → returns tokens")
    void completeTotpLogin_validCode_returnsTokens() {
        when(jwtService.isValidTempToken("tok", "TOTP_LOGIN")).thenReturn(true);
        when(jwtService.extractUsername("tok")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyLogin(sampleUser, "123456")).thenReturn(true);
        when(jwtService.generateToken(sampleUser)).thenReturn("jwt-access");
        when(jwtService.generateRefreshToken("u1", "device", "ip")).thenReturn("refresh-tok");

        LoginResponse response = authService.completeTotpLogin("tok", "123456", "device", "ip");

        assertNotNull(response);
        assertEquals("jwt-access", response.getToken());
        assertEquals("refresh-tok", response.getRefreshToken());
    }

    @Test
    @DisplayName("completeTotpLogin: invalid tempToken → throws RuntimeException")
    void completeTotpLogin_invalidToken_throws() {
        when(jwtService.isValidTempToken("bad", "TOTP_LOGIN")).thenReturn(false);

        assertThrows(RuntimeException.class, () ->
                authService.completeTotpLogin("bad", "123456", "device", "ip"));
    }

    @Test
    @DisplayName("completeTotpLogin: invalid TOTP code → throws RuntimeException")
    void completeTotpLogin_invalidCode_throws() {
        when(jwtService.isValidTempToken("tok", "TOTP_LOGIN")).thenReturn(true);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyLogin(sampleUser, "000000")).thenReturn(false);

        assertThrows(RuntimeException.class, () ->
                authService.completeTotpLogin("tok", "000000", "device", "ip"));
    }

    // ── completeRecoveryLogin ──────────────────────────────────────

    @Test
    @DisplayName("completeRecoveryLogin: valid backup code → returns tokens")
    void completeRecoveryLogin_validCode_returnsTokens() {
        when(jwtService.isValidTempToken("tok", "TOTP_LOGIN")).thenReturn(true);
        when(jwtService.extractUsername("tok")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyBackupCode(sampleUser, "12345678")).thenReturn(true);
        when(jwtService.generateToken(sampleUser)).thenReturn("jwt-access");
        when(jwtService.generateRefreshToken("u1", "device", "ip")).thenReturn("refresh-tok");

        LoginResponse response = authService.completeRecoveryLogin("tok", "12345678", "device", "ip");

        assertNotNull(response);
        assertEquals("jwt-access", response.getToken());
    }

    @Test
    @DisplayName("completeRecoveryLogin: invalid backup code → throws")
    void completeRecoveryLogin_invalidCode_throws() {
        when(jwtService.isValidTempToken("tok", "TOTP_LOGIN")).thenReturn(true);
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        when(totpService.verifyBackupCode(sampleUser, "00000000")).thenReturn(false);

        assertThrows(RuntimeException.class, () ->
                authService.completeRecoveryLogin("tok", "00000000", "device", "ip"));
    }

    // ── authenticateGoogle ─────────────────────────────────────────

    @Test
    @DisplayName("authenticateGoogle: existing Google user → returns tokens")
    void authenticateGoogle_existingGoogleUser_returnsTokens() {
        when(googleOAuthService.exchangeCodeForIdToken("code", "redirect")).thenReturn("idToken");
        Map<String, Object> googleUser = Map.of("email", "g@gmail.com", "sub", "google123", "email_verified", true, "name", "G User");
        when(googleOAuthService.verifyIdToken("idToken")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("google123")).thenReturn(Optional.of(sampleUser));
        when(jwtService.generateToken(sampleUser)).thenReturn("jwt");
        when(jwtService.generateRefreshToken("u1", "d", "ip")).thenReturn("rt");

        LoginResponse response = authService.authenticateGoogle("code", "redirect", "d", "ip");

        assertNotNull(response);
        assertEquals("jwt", response.getToken());
    }

    @Test
    @DisplayName("authenticateGoogle: new user → returns profileComplete=false with tempToken")
    void authenticateGoogle_newUser_returnsPendingProfile() {
        when(googleOAuthService.exchangeCodeForIdToken("code", "redirect")).thenReturn("idToken");
        Map<String, Object> googleUser = Map.of("email", "new@gmail.com", "sub", "goog456", "email_verified", true, "name", "New");
        when(googleOAuthService.verifyIdToken("idToken")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("goog456")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("new@gmail.com")).thenReturn(null);

        PendingRegistration pending = PendingRegistration.builder()
                .tempToken("pending-tok")
                .googleId("goog456")
                .email("new@gmail.com")
                .build();
        when(userService.upsertPendingGoogleRegistration("goog456", "new@gmail.com", "New")).thenReturn(pending);

        LoginResponse response = authService.authenticateGoogle("code", "redirect", "d", "ip");

        assertNotNull(response);
        assertFalse(response.getProfileComplete());
        assertEquals("pending-tok", response.getTempToken());
    }

    @Test
    @DisplayName("authenticateGoogle: email collision (verified) → links account")
    void authenticateGoogle_emailCollision_verifiedLinks() {
        when(googleOAuthService.exchangeCodeForIdToken("code", "redirect")).thenReturn("idToken");
        Map<String, Object> googleUser = Map.of("email", "test@example.com", "sub", "goog789", "email_verified", true, "name", "G");
        when(googleOAuthService.verifyIdToken("idToken")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("goog789")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(sampleUser);
        when(jwtService.generateToken(sampleUser)).thenReturn("jwt");
        when(jwtService.generateRefreshToken("u1", "d", "ip")).thenReturn("rt");

        LoginResponse response = authService.authenticateGoogle("code", "redirect", "d", "ip");

        assertNotNull(response);
        assertEquals("jwt", response.getToken());
        assertEquals(AuthProvider.GOOGLE, sampleUser.getAuthProvider());
        assertEquals("goog789", sampleUser.getGoogleId());
    }

    @Test
    @DisplayName("authenticateGoogle: email collision (unverified) → throws AuthenticationException")
    void authenticateGoogle_emailCollision_unverified_throws() {
        when(googleOAuthService.exchangeCodeForIdToken("code", "redirect")).thenReturn("idToken");
        Map<String, Object> googleUser = Map.of("email", "test@example.com", "sub", "goog999", "email_verified", false, "name", "G");
        when(googleOAuthService.verifyIdToken("idToken")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("goog999")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(sampleUser);

        assertThrows(AuthenticationException.class, () ->
                authService.authenticateGoogle("code", "redirect", "d", "ip"));
    }

    @Test
    @DisplayName("authenticateGoogle: invalid payload (null email) → throws RuntimeException")
    void authenticateGoogle_invalidPayload_throws() {
        when(googleOAuthService.exchangeCodeForIdToken("code", "redirect")).thenReturn("idToken");
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("email", null);
        payload.put("sub", null);
        when(googleOAuthService.verifyIdToken("idToken")).thenReturn(payload);

        assertThrows(RuntimeException.class, () ->
                authService.authenticateGoogle("code", "redirect", "d", "ip"));
    }

    // ── completeGoogleProfile ──────────────────────────────────────

    @Test
    @DisplayName("completeGoogleProfile: valid request → returns TOTP setup token")
    void completeGoogleProfile_valid_returnsSetupToken() {
        CompleteProfileRequest req = new CompleteProfileRequest();
        req.setTempToken("ptok");
        req.setUsername("newuser");
        req.setPassword("Pass123!");
        req.setConfirmPassword("Pass123!");
        req.setPhoneNumber("9876543211");
        req.setName("New User");

        when(jwtService.isValidTempToken("ptok", "PROFILE_COMPLETION")).thenReturn(true);
        when(jwtService.extractUsername("ptok")).thenReturn("google123");
        PendingRegistration pending = PendingRegistration.builder()
                .googleId("google123")
                .email("g@gmail.com")
                .build();
        when(userService.getPendingRegistrationByGoogleId("google123")).thenReturn(pending);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userService.getPendingRegistrationUser("newuser")).thenReturn(null);
        when(userRepository.existsByPhoneNumber("+919876543211")).thenReturn(false);
        when(passwordEncoder.encode("Pass123!")).thenReturn("encoded");
        when(jwtService.generateTempToken("newuser", "TOTP_REGISTRATION")).thenReturn("totp-tok");

        LoginResponse response = authService.completeGoogleProfile(req, "d", "ip");

        assertNotNull(response);
        assertTrue(response.getRequireTotpSetup());
        assertEquals("totp-tok", response.getTempToken());
    }

    @Test
    @DisplayName("completeGoogleProfile: passwords don't match → throws")
    void completeGoogleProfile_passwordMismatch_throws() {
        CompleteProfileRequest req = new CompleteProfileRequest();
        req.setTempToken("ptok");
        req.setUsername("newuser");
        req.setPassword("Pass123!");
        req.setConfirmPassword("Different1!");
        req.setPhoneNumber("9876543211");

        when(jwtService.isValidTempToken("ptok", "PROFILE_COMPLETION")).thenReturn(true);
        when(jwtService.extractUsername("ptok")).thenReturn("google123");
        PendingRegistration pending = PendingRegistration.builder().googleId("google123").build();
        when(userService.getPendingRegistrationByGoogleId("google123")).thenReturn(pending);

        assertThrows(RuntimeException.class, () ->
                authService.completeGoogleProfile(req, "d", "ip"));
    }

    @Test
    @DisplayName("completeGoogleProfile: duplicate username → throws")
    void completeGoogleProfile_duplicateUsername_throws() {
        CompleteProfileRequest req = new CompleteProfileRequest();
        req.setTempToken("ptok");
        req.setUsername("taken");
        req.setPassword("Pass123!");
        req.setConfirmPassword("Pass123!");
        req.setPhoneNumber("9876543211");

        when(jwtService.isValidTempToken("ptok", "PROFILE_COMPLETION")).thenReturn(true);
        when(jwtService.extractUsername("ptok")).thenReturn("google123");
        PendingRegistration pending = PendingRegistration.builder().googleId("google123").build();
        when(userService.getPendingRegistrationByGoogleId("google123")).thenReturn(pending);
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThrows(RuntimeException.class, () ->
                authService.completeGoogleProfile(req, "d", "ip"));
    }

    @Test
    @DisplayName("completeGoogleProfile: invalid tempToken → throws")
    void completeGoogleProfile_invalidToken_throws() {
        CompleteProfileRequest req = new CompleteProfileRequest();
        req.setTempToken("bad");
        when(jwtService.isValidTempToken("bad", "PROFILE_COMPLETION")).thenReturn(false);

        assertThrows(RuntimeException.class, () ->
                authService.completeGoogleProfile(req, "d", "ip"));
    }

    // ── completeRegistrationWithTotp ───────────────────────────────

    @Test
    @DisplayName("completeRegistrationWithTotp: valid → returns tokens and backup codes")
    void completeRegistrationWithTotp_valid_returnsTokens() {
        User pendingUser = User.builder().id("p1").username("newuser").totpSecretVersion(0).build();
        when(jwtService.extractUsername("rtok")).thenReturn("newuser");
        when(userService.getPendingRegistrationUser("newuser")).thenReturn(pendingUser);
        when(totpService.verifySetupForPendingUser(pendingUser, "123456")).thenReturn(List.of("code1", "code2"));
        User savedUser = User.builder().id("u2").username("newuser").totpSecretVersion(1).build();
        when(userService.completePendingRegistration(pendingUser)).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("jwt");
        when(jwtService.generateRefreshToken("u2", "d", "ip")).thenReturn("rt");

        LoginResponse response = authService.completeRegistrationWithTotp("rtok", "123456", "d", "ip");

        assertNotNull(response);
        assertEquals("jwt", response.getToken());
        assertEquals(List.of("code1", "code2"), response.getBackupCodes());
    }

    @Test
    @DisplayName("completeRegistrationWithTotp: expired registration → throws")
    void completeRegistrationWithTotp_expired_throws() {
        when(jwtService.extractUsername("rtok")).thenReturn("expired-user");
        when(userService.getPendingRegistrationUser("expired-user")).thenReturn(null);

        assertThrows(RuntimeException.class, () ->
                authService.completeRegistrationWithTotp("rtok", "123456", "d", "ip"));
    }

    // ── isTokenValid ───────────────────────────────────────────────

    @Test
    @DisplayName("isTokenValid: valid token → true")
    void isTokenValid_validToken_true() {
        when(jwtService.extractUsername("tok")).thenReturn("user");
        when(jwtService.isTokenExpired("tok")).thenReturn(false);
        assertTrue(authService.isTokenValid("tok"));
    }

    @Test
    @DisplayName("isTokenValid: expired token → false")
    void isTokenValid_expiredToken_false() {
        when(jwtService.extractUsername("tok")).thenReturn("user");
        when(jwtService.isTokenExpired("tok")).thenReturn(true);
        assertFalse(authService.isTokenValid("tok"));
    }

    @Test
    @DisplayName("isTokenValid: exception → false")
    void isTokenValid_exception_false() {
        when(jwtService.extractUsername("bad")).thenThrow(new RuntimeException("bad"));
        assertFalse(authService.isTokenValid("bad"));
    }

    // ── getUserByToken ─────────────────────────────────────────────

    @Test
    @DisplayName("getUserByToken: valid token → returns user")
    void getUserByToken_validToken_returnsUser() {
        when(jwtService.extractUsername("tok")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);

        User result = authService.getUserByToken("tok");

        assertEquals("u1", result.getId());
    }

    // ── getUserEntityByUsername ────────────────────────────────────

    @Test
    @DisplayName("getUserEntityByUsername: existing user → returns user")
    void getUserEntityByUsername_existing_returns() {
        when(userRepository.findByUsername("testuser")).thenReturn(sampleUser);
        assertEquals("u1", authService.getUserEntityByUsername("testuser").getId());
    }

    @Test
    @DisplayName("getUserEntityByUsername: not found → throws RuntimeException")
    void getUserEntityByUsername_notFound_throws() {
        when(userRepository.findByUsername("nope")).thenReturn(null);
        assertThrows(RuntimeException.class, () -> authService.getUserEntityByUsername("nope"));
    }
}
