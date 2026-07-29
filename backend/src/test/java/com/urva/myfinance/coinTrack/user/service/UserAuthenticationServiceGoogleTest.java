package com.urva.myfinance.coinTrack.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.urva.myfinance.coinTrack.notes.service.NoteService;
import com.urva.myfinance.coinTrack.security.service.GoogleOAuthService;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.CompleteProfileRequest;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.model.AuthProvider;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class UserAuthenticationServiceGoogleTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthenticationManager authManager;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JWTService jwtService;
    @Mock
    private TotpService totpService;
    @Mock
    private UserService userService;
    @Mock
    private GoogleOAuthService googleOAuthService;
    @Mock
    private NoteService noteService;

    @InjectMocks
    private UserAuthenticationService authService;

    private User googleUser;
    private Map<String, Object> tokenPayload;

    @BeforeEach
    public void setUp() {
        googleUser = User.builder()
                .id("user123")
                .authProvider(AuthProvider.GOOGLE)
                .googleId("google-sub-123")
                .email("test@gmail.com")
                .emailVerified(true)
                .name("Google User")
                .build();

        tokenPayload = new HashMap<>();
        tokenPayload.put("email", "test@gmail.com");
        tokenPayload.put("email_verified", true);
        tokenPayload.put("sub", "google-sub-123");
        tokenPayload.put("name", "Google User");
    }

    @Test
    public void testAuthenticateGoogle_NewUser() {
        when(googleOAuthService.exchangeCodeForIdToken("auth-code", "redirect-uri")).thenReturn("id-token");
        when(googleOAuthService.verifyIdToken("id-token")).thenReturn(tokenPayload);
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@gmail.com")).thenReturn(null);

        com.urva.myfinance.coinTrack.user.model.PendingRegistration pending = new com.urva.myfinance.coinTrack.user.model.PendingRegistration();
        pending.setTempToken("temp-token-xyz");

        when(userService.upsertPendingGoogleRegistration("google-sub-123", "test@gmail.com", "Google User"))
                .thenReturn(pending);

        LoginResponse response = authService.authenticateGoogle("auth-code", "redirect-uri", "device", "ip");

        assertNotNull(response);
        assertFalse(response.getProfileComplete());
        assertEquals("temp-token-xyz", response.getTempToken());
        assertEquals("test@gmail.com", response.getEmail());
    }

    @Test
    public void testCompleteGoogleProfile_Success() {
        when(jwtService.isValidTempToken("temp-token-xyz", "PROFILE_COMPLETION")).thenReturn(true);
        when(jwtService.extractUsername("temp-token-xyz")).thenReturn("google-sub-123");

        com.urva.myfinance.coinTrack.user.model.PendingRegistration pending = new com.urva.myfinance.coinTrack.user.model.PendingRegistration();
        pending.setGoogleId("google-sub-123");
        when(userService.getPendingRegistrationByGoogleId("google-sub-123")).thenReturn(pending);

        when(userRepository.existsByUsername("new_username")).thenReturn(false);
        when(userService.getPendingRegistrationUser("new_username")).thenReturn(null);
        when(userRepository.existsByPhoneNumber(anyString())).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed-pwd");

        when(jwtService.generateTempToken("new_username", "TOTP_REGISTRATION")).thenReturn("totp-token-123");

        CompleteProfileRequest request = new CompleteProfileRequest("temp-token-xyz", "new_username", "New Name",
                LocalDate.of(1995, 5, 5));
        request.setPassword("Password123!");
        request.setConfirmPassword("Password123!");
        request.setPhoneNumber("9876543210");

        LoginResponse response = authService.completeGoogleProfile(request, "device", "ip");

        assertNotNull(response);
        assertFalse(response.getProfileComplete());
        assertTrue(response.getRequireTotpSetup());
        assertEquals("totp-token-123", response.getTempToken());

        verify(userService, times(1)).savePendingRegistration(pending);
        assertEquals("new_username", pending.getUsername());
        assertEquals("New Name", pending.getName());
        assertEquals("+919876543210", pending.getPhoneNumber());
        assertEquals("hashed-pwd", pending.getPasswordHash());
    }

    @Test
    public void testCompleteRegistrationWithTotp_PersistsBackupCodes() {
        // Arrange
        String tempToken = "valid-totp-reg-token";
        String totpCode = "123456";
        String username = "new_username";

        when(jwtService.extractUsername(tempToken)).thenReturn(username);

        User pendingUser = new User();
        pendingUser.setUsername(username);
        when(userService.getPendingRegistrationUser(username)).thenReturn(pendingUser);

        List<String> backupCodes = Arrays.asList("AAAA-BBBB", "CCCC-DDDD");
        when(totpService.verifySetupForPendingUser(pendingUser, totpCode)).thenReturn(backupCodes);

        User savedUser = new User();
        savedUser.setId("real-user-id");
        savedUser.setUsername(username);
        savedUser.setTotpSecretVersion(1);
        when(userService.completePendingRegistration(pendingUser)).thenReturn(savedUser);

        when(jwtService.generateToken(savedUser)).thenReturn("final-access-token");
        when(jwtService.generateRefreshToken(eq("real-user-id"), any(), any())).thenReturn("final-refresh-token");

        // Act
        LoginResponse response = authService.completeRegistrationWithTotp(tempToken, totpCode, "device", "ip");

        // Assert
        assertNotNull(response);
        assertEquals("real-user-id", response.getUserId());
        assertEquals("final-access-token", response.getToken());
        assertEquals(backupCodes, response.getBackupCodes());

        // This is the CRITICAL VERIFICATION: Backup codes must be saved against the
        // newly promoted savedUser!
        verify(totpService, times(1)).saveBackupCodes(savedUser, backupCodes, 1);
    }

    @Test
    public void testAuthenticateGoogle_ExistingLocalAccountLinking_Success() {
        User localUser = User.builder()
                .id("local123")
                .authProvider(AuthProvider.LOCAL)
                .email("test@gmail.com")
                .emailVerified(true)
                .username("existing_user")
                .totpEnabled(false)
                .build();

        when(googleOAuthService.exchangeCodeForIdToken("auth-code", "redirect-uri")).thenReturn("id-token");
        when(googleOAuthService.verifyIdToken("id-token")).thenReturn(tokenPayload);
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@gmail.com")).thenReturn(localUser);
        when(userRepository.save(any(User.class))).thenReturn(localUser);
        when(jwtService.generateToken(any(User.class))).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(eq("local123"), any(), any())).thenReturn("refresh-token-123");

        LoginResponse response = authService.authenticateGoogle("auth-code", "redirect-uri", "device", "ip");

        assertNotNull(response);
        assertEquals(AuthProvider.GOOGLE, localUser.getAuthProvider());
        assertEquals("google-sub-123", localUser.getGoogleId());
        assertEquals("access-token-123", response.getToken());
    }

    @Test
    public void testAuthenticateGoogle_ExistingLocalAccountLinking_UnverifiedEmail_ThrowsException() {
        tokenPayload.put("email_verified", false); // Unverified Google email

        User localUser = User.builder()
                .id("local123")
                .authProvider(AuthProvider.LOCAL)
                .email("test@gmail.com")
                .emailVerified(true)
                .username("existing_user")
                .build();

        when(googleOAuthService.exchangeCodeForIdToken("auth-code", "redirect-uri")).thenReturn("id-token");
        when(googleOAuthService.verifyIdToken("id-token")).thenReturn(tokenPayload);
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@gmail.com")).thenReturn(localUser);

        com.urva.myfinance.coinTrack.common.exception.AuthenticationException exception = assertThrows(
                com.urva.myfinance.coinTrack.common.exception.AuthenticationException.class,
                () -> authService.authenticateGoogle("auth-code", "redirect-uri", "device", "ip"));

        assertTrue(exception.getMessage().contains("already exists"));
    }

    @Test
    public void testAuthenticateGoogle_TotpBypass_Success() {
        User googleExisting = User.builder()
                .id("user123")
                .authProvider(AuthProvider.GOOGLE)
                .googleId("google-sub-123")
                .totpEnabled(false) // TOTP disabled
                .build();

        when(googleOAuthService.exchangeCodeForIdToken("auth-code", "redirect-uri")).thenReturn("id-token");
        when(googleOAuthService.verifyIdToken("id-token")).thenReturn(tokenPayload);
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.of(googleExisting));
        when(jwtService.generateToken(any(User.class))).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(eq("user123"), any(), any())).thenReturn("refresh-token-123");

        LoginResponse response = authService.authenticateGoogle("auth-code", "redirect-uri", "device", "ip");

        assertNotNull(response);
        assertEquals("access-token-123", response.getToken());
        assertNull(response.getTempToken());
    }

    @Test
    public void testAuthenticateGoogle_WithTotpEnabled_BypassesTotp() {
        User googleExisting = User.builder()
                .id("user123")
                .authProvider(AuthProvider.GOOGLE)
                .googleId("google-sub-123")
                .totpEnabled(true)
                .totpVerified(true)
                .build();

        when(googleOAuthService.exchangeCodeForIdToken("auth-code", "redirect-uri")).thenReturn("id-token");
        when(googleOAuthService.verifyIdToken("id-token")).thenReturn(tokenPayload);
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.of(googleExisting));
        when(jwtService.generateToken(googleExisting)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(eq("user123"), any(), any())).thenReturn("refresh-token");

        LoginResponse response = authService.authenticateGoogle("auth-code", "redirect-uri", "device", "ip");

        assertNotNull(response);
        assertEquals("access-token", response.getToken());
        assertNull(response.getTempToken());
    }

}
