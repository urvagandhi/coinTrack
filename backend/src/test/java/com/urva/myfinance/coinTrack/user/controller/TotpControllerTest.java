package com.urva.myfinance.coinTrack.user.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.security.service.JWTService;
import com.urva.myfinance.coinTrack.user.dto.LoginResponse;
import com.urva.myfinance.coinTrack.user.dto.TotpSetupResponse;
import com.urva.myfinance.coinTrack.user.dto.TotpVerifyRequest;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.service.TotpService;
import com.urva.myfinance.coinTrack.user.service.UserAuthenticationService;

import jakarta.servlet.http.HttpServletRequest;

@ExtendWith(MockitoExtension.class)
@DisplayName("TotpController - Comprehensive Tests")
class TotpControllerTest {

    @Mock private TotpService totpService;
    @Mock private UserAuthenticationService userAuthService;
    @Mock private JWTService jwtService;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private TotpController totpController;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id("u1").username("testuser").email("test@example.com")
                .totpEnabled(false).totpVerified(false).totpSecretVersion(1)
                .build();
    }

    @Test
    @DisplayName("setupTotp: no auth header → 401")
    void setupTotp_noAuth_returns401() {
        ResponseEntity<?> response = totpController.setupTotp(null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("setupTotp: valid Bearer token → 200 with setup response")
    void setupTotp_validToken_returns200() {
        TotpSetupResponse setupResponse = TotpSetupResponse.builder()
                .secret("ABC123").qrCodeUri("otpauth://totp/").qrCodeBase64("base64data")
                .build();
        when(jwtService.isValidTempToken("token", "TOTP_SETUP")).thenReturn(true);
        when(userAuthService.getUserByToken("token")).thenReturn(sampleUser);
        when(totpService.generateSetup(sampleUser)).thenReturn(setupResponse);

        ResponseEntity<?> response = totpController.setupTotp("Bearer token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("verifySetup: valid code → 200 with backup codes")
    void verifySetup_validCode_returns200() {
        when(jwtService.isValidTempToken("token", "TOTP_SETUP")).thenReturn(true);
        when(userAuthService.getUserByToken("token")).thenReturn(sampleUser);
        when(totpService.verifySetup(sampleUser, "123456")).thenReturn(List.of("12345678", "87654321"));

        TotpVerifyRequest request = new TotpVerifyRequest();
        request.setCode("123456");

        ResponseEntity<?> response = totpController.verifySetup("Bearer token", request, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("verifySetup: invalid code → 400")
    void verifySetup_invalidCode_returns400() {
        when(jwtService.isValidTempToken("token", "TOTP_SETUP")).thenReturn(true);
        when(userAuthService.getUserByToken("token")).thenReturn(sampleUser);
        when(totpService.verifySetup(sampleUser, "000000")).thenThrow(new RuntimeException("Invalid TOTP code"));

        TotpVerifyRequest request = new TotpVerifyRequest();
        request.setCode("000000");

        ResponseEntity<?> response = totpController.verifySetup("Bearer token", request, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("completeLoginTotp: missing fields → 400")
    void completeLoginTotp_missingFields_returns400() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", "tok");
        body.put("code", null);

        ResponseEntity<?> response = totpController.completeLoginTotp(body, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("completeLoginTotp: valid → 200")
    void completeLoginTotp_valid_returns200() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", "tok");
        body.put("code", "123456");
        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken("jwt");
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(userAuthService.completeTotpLogin(eq("tok"), eq("123456"), any(), any())).thenReturn(loginResponse);

        ResponseEntity<?> response = totpController.completeLoginTotp(body, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("completeLoginTotp: invalid code → 401")
    void completeLoginTotp_invalidCode_returns401() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", "tok");
        body.put("code", "000000");
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(userAuthService.completeTotpLogin(eq("tok"), eq("000000"), any(), any()))
                .thenThrow(new RuntimeException("Invalid Authenticator code."));

        ResponseEntity<?> response = totpController.completeLoginTotp(body, httpRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("completeLoginRecovery: missing fields → 400")
    void completeLoginRecovery_missingFields_returns400() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", null);
        body.put("code", "12345678");

        ResponseEntity<?> response = totpController.completeLoginRecovery(body, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("completeLoginRecovery: valid → 200")
    void completeLoginRecovery_valid_returns200() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", "tok");
        body.put("code", "12345678");
        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken("jwt");
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(userAuthService.completeRecoveryLogin(eq("tok"), eq("12345678"), any(), any())).thenReturn(loginResponse);

        ResponseEntity<?> response = totpController.completeLoginRecovery(body, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("resetTotp: no auth → 401")
    void resetTotp_noAuth_returns401() {
        ResponseEntity<?> response = totpController.resetTotp(null, new HashMap<>());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("getTotpStatus: no auth → 401")
    void getTotpStatus_noAuth_returns401() {
        ResponseEntity<?> response = totpController.getTotpStatus(null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("setupRegistrationTotp: missing tempToken → 400")
    void setupRegistrationTotp_missingToken_returns400() {
        Map<String, String> body = new HashMap<>();
        ResponseEntity<?> response = totpController.setupRegistrationTotp(body);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("setupRegistrationTotp: invalid tempToken → 401")
    void setupRegistrationTotp_invalidToken_returns401() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", "bad-tok");
        when(jwtService.isValidTempToken("bad-tok", "TOTP_REGISTRATION")).thenReturn(false);

        ResponseEntity<?> response = totpController.setupRegistrationTotp(body);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("verifyRegistrationTotp: missing fields → 400")
    void verifyRegistrationTotp_missingFields_returns400() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", "tok");
        body.put("code", null);

        ResponseEntity<?> response = totpController.verifyRegistrationTotp(body, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("verifyRegistrationTotp: invalid tempToken → 401")
    void verifyRegistrationTotp_invalidToken_returns401() {
        Map<String, String> body = new HashMap<>();
        body.put("tempToken", "bad-tok");
        body.put("code", "123456");
        when(jwtService.isValidTempToken("bad-tok", "TOTP_REGISTRATION")).thenReturn(false);

        ResponseEntity<?> response = totpController.verifyRegistrationTotp(body, httpRequest);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}
