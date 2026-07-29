package com.urva.myfinance.coinTrack.user.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.urva.myfinance.coinTrack.common.exception.AuthenticationException;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.security.model.InvalidatedToken;
import com.urva.myfinance.coinTrack.security.repository.InvalidatedTokenRepository;
import com.urva.myfinance.coinTrack.user.dto.LoginRequest;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.dto.RegisterUserDTO;
import com.urva.myfinance.coinTrack.user.dto.GoogleLoginRequest;
import com.urva.myfinance.coinTrack.user.dto.CompleteProfileRequest;
import com.urva.myfinance.coinTrack.user.model.RefreshToken;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.RefreshTokenRepository;
import com.urva.myfinance.coinTrack.user.service.UserAuthenticationService;
import com.urva.myfinance.coinTrack.user.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController - Comprehensive Tests")
class AuthControllerTest {

    @Mock private UserService userService;
    @Mock private UserAuthenticationService authService;
    @Mock private JWTService jwtService;
    @Mock private InvalidatedTokenRepository invalidatedTokenRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private AuthController authController;

    private User sampleUser;
    private LoginResponse sampleLoginResponse;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id("u1").username("testuser").email("test@example.com")
                .name("Test User").password("encoded").build();
        sampleLoginResponse = new LoginResponse();
        sampleLoginResponse.setToken("jwt-token");
        sampleLoginResponse.setRefreshToken("refresh-token");
        sampleLoginResponse.setUserId("u1");
        sampleLoginResponse.setUsername("testuser");
    }

    @Test
    @DisplayName("login: valid credentials → 200 with login response")
    void login_validCredentials_returns200() {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmailOrMobile("testuser");
        request.setPassword("Pass123!");
        when(httpRequest.getHeader("Authorization")).thenReturn(null);

        when(authService.authenticate("testuser", "Pass123!")).thenReturn(sampleLoginResponse);

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertTrue(body.isSuccess());
    }

    @Test
    @DisplayName("login: invalid credentials → 401")
    void login_invalidCredentials_returns401() {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmailOrMobile("testuser");
        request.setPassword("WrongPass1!");
        when(authService.authenticate("testuser", "WrongPass1!")).thenReturn(null);

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("login: AuthenticationException → 401 with error message")
    void login_authException_returns401() {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmailOrMobile("testuser");
        request.setPassword("Pass123!");
        when(authService.authenticate("testuser", "Pass123!"))
                .thenThrow(new AuthenticationException("Too many failed attempts. Try again in 15 minute(s)."));

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("login: unexpected exception → 500")
    void login_unexpectedException_returns500() {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmailOrMobile("testuser");
        request.setPassword("Pass123!");
        when(authService.authenticate("testuser", "Pass123!")).thenThrow(new RuntimeException("db down"));

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    @DisplayName("register: valid DTO → 201 created")
    void register_validDTO_returns201() {
        RegisterUserDTO dto = new RegisterUserDTO();
        dto.setUsername("newuser");
        dto.setFirstName("New");
        dto.setLastName("User");
        dto.setEmail("new@example.com");
        dto.setPassword("Strong1!");
        when(userService.registerUser(any(User.class))).thenReturn(sampleLoginResponse);

        ResponseEntity<?> response = authController.register(dto);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    @DisplayName("register: duplicate username → 400 bad request")
    void register_duplicateUsername_returns400() {
        RegisterUserDTO dto = new RegisterUserDTO();
        dto.setUsername("taken");
        dto.setEmail("a@b.com");
        dto.setPassword("Strong1!");
        when(userService.registerUser(any())).thenThrow(new RuntimeException("Username already exists"));

        ResponseEntity<?> response = authController.register(dto);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("verifyToken: missing Authorization header → 401")
    void verifyToken_missingHeader_returns401() {
        when(httpRequest.getHeader("Authorization")).thenReturn(null);

        ResponseEntity<?> response = authController.verifyToken(httpRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("verifyToken: invalid token → 401")
    void verifyToken_invalidToken_returns401() {
        when(httpRequest.getHeader("Authorization")).thenReturn("Bearer invalid-token");
        when(userService.isTokenValid("invalid-token")).thenReturn(false);

        ResponseEntity<?> response = authController.verifyToken(httpRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("verifyToken: valid token → 200 with user")
    void verifyToken_validToken_returns200() {
        when(httpRequest.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(userService.isTokenValid("valid-token")).thenReturn(true);
        when(userService.getUserByToken("valid-token")).thenReturn(sampleUser);

        ResponseEntity<?> response = authController.verifyToken(httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("verifyToken: user not found → 404")
    void verifyToken_userNotFound_returns404() {
        when(httpRequest.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(userService.isTokenValid("valid-token")).thenReturn(true);
        when(userService.getUserByToken("valid-token")).thenReturn(null);

        ResponseEntity<?> response = authController.verifyToken(httpRequest);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("checkUsernameAvailability: available → returns true")
    void checkUsernameAvailability_available() {
        when(userService.isUsernameAvailable("freeuser")).thenReturn(true);

        ResponseEntity<?> response = authController.checkUsernameAvailability("freeuser");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) body.get("available"));
    }

    @Test
    @DisplayName("checkUsernameAvailability: taken → returns false")
    void checkUsernameAvailability_taken() {
        when(userService.isUsernameAvailable("taken")).thenReturn(false);

        ResponseEntity<?> response = authController.checkUsernameAvailability("taken");

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertFalse((Boolean) body.get("available"));
    }

    @Test
    @DisplayName("refresh: missing refreshToken → 400")
    void refresh_missingToken_returns400() {
        ResponseEntity<?> response = authController.refresh(new HashMap<>(), httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("refresh: blank refreshToken → 400")
    void refresh_blankToken_returns400() {
        Map<String, String> body = new HashMap<>();
        body.put("refreshToken", "  ");
        ResponseEntity<?> response = authController.refresh(body, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("refresh: invalid refresh token → 401")
    void refresh_invalidToken_returns401() {
        Map<String, String> body = new HashMap<>();
        body.put("refreshToken", "invalid-token");
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.refresh(body, httpRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("refresh: valid refresh token → 200 with new tokens")
    void refresh_validToken_returns200() {
        Map<String, String> body = new HashMap<>();
        body.put("refreshToken", "valid-refresh");

        RefreshToken storedToken = RefreshToken.builder()
                .userId("u1").tokenHash("hash").expiresAt(Instant.now().plusSeconds(3600))
                .revoked(false).build();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(storedToken));
        when(userService.getUserById("u1")).thenReturn(sampleUser);
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(jwtService.validateAndRotateRefreshToken(eq("valid-refresh"), eq(sampleUser), any(), any()))
                .thenReturn(new JWTService.TokenPair("new-access", "new-refresh"));

        ResponseEntity<?> response = authController.refresh(body, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("logout: valid token → 200 logged out")
    void logout_validToken_returns200() {
        Authentication auth = mock(Authentication.class);
        when(httpRequest.getHeader("Authorization")).thenReturn("Bearer my-token");
        when(jwtService.extractExpiration("my-token")).thenReturn(Date.from(Instant.now().plusSeconds(3600)));
        when(jwtService.extractUserId("my-token")).thenReturn("u1");

        ResponseEntity<?> response = authController.logout(auth, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(invalidatedTokenRepository).save(any(InvalidatedToken.class));
        verify(jwtService).revokeAllRefreshTokens("u1");
    }

    @Test
    @DisplayName("logout: missing Authorization header → 400")
    void logout_missingHeader_returns400() {
        Authentication auth = mock(Authentication.class);
        when(httpRequest.getHeader("Authorization")).thenReturn(null);

        ResponseEntity<?> response = authController.logout(auth, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("oauth2Google: successful SSO → 200")
    void oauth2Google_success_returns200() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost/callback");
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(authService.authenticateGoogle(eq("auth-code"), eq("http://localhost/callback"), any(), any()))
                .thenReturn(sampleLoginResponse);

        ResponseEntity<?> response = authController.oauth2Google(request, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("oauth2Google: authentication exception with 'already exists' → 409 conflict")
    void oauth2Google_accountExists_returns409() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost/callback");
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(authService.authenticateGoogle(any(), any(), any(), any()))
                .thenThrow(new AuthenticationException("An account with this email already exists"));

        ResponseEntity<?> response = authController.oauth2Google(request, httpRequest);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    }

    @Test
    @DisplayName("oauth2Google: authentication exception → 401")
    void oauth2Google_authFails_returns401() {
        GoogleLoginRequest request = new GoogleLoginRequest();
        request.setCode("bad-code");
        request.setRedirectUri("http://localhost/callback");
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(authService.authenticateGoogle(any(), any(), any(), any()))
                .thenThrow(new AuthenticationException("Invalid Google token"));

        ResponseEntity<?> response = authController.oauth2Google(request, httpRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("completeGoogleProfile: success → 200")
    void completeGoogleProfile_success_returns200() {
        CompleteProfileRequest request = new CompleteProfileRequest();
        request.setTempToken("ptok");
        request.setUsername("newuser");
        request.setPassword("Pass123!");
        request.setConfirmPassword("Pass123!");
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(authService.completeGoogleProfile(eq(request), any(), any())).thenReturn(sampleLoginResponse);

        ResponseEntity<?> response = authController.completeGoogleProfile(request, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("completeGoogleProfile: failure → 400")
    void completeGoogleProfile_failure_returns400() {
        CompleteProfileRequest request = new CompleteProfileRequest();
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(authService.completeGoogleProfile(eq(request), any(), any()))
                .thenThrow(new RuntimeException("Username taken"));

        ResponseEntity<?> response = authController.completeGoogleProfile(request, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}
