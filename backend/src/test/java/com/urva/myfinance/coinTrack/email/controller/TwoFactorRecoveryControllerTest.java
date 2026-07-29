package com.urva.myfinance.coinTrack.email.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Map;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService.InvalidEmailTokenException;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import com.urva.myfinance.coinTrack.user.service.TotpService;

import jakarta.servlet.http.HttpServletRequest;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("TwoFactorRecoveryController - Comprehensive Tests")
class TwoFactorRecoveryControllerTest {

    @Mock private EmailTokenService emailTokenService;
    @Mock private EmailService emailService;
    @Mock private EmailConfigProperties emailConfig;
    @Mock private UserRepository userRepository;
    @Mock private TotpService totpService;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks private TwoFactorRecoveryController controller;

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
    }

    // ── request2FARecovery ─────────────────────────────────────────

    @Test
    @DisplayName("request2FARecovery: null identifier → 400")
    void request2FARecovery_nullId_400() {
        ResponseEntity<?> resp = controller.request2FARecovery(Map.of(), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("request2FARecovery: blank identifier → 400")
    void request2FARecovery_blankId_400() {
        ResponseEntity<?> resp = controller.request2FARecovery(Map.of("identifier", "  "), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("request2FARecovery: user not found → 200 (no enumeration)")
    void request2FARecovery_notFound_200() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        ResponseEntity<?> resp = controller.request2FARecovery(Map.of("identifier", "unknown"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    @DisplayName("request2FARecovery: user found but 2FA not enabled → 200 (no enumeration)")
    void request2FARecovery_no2FA_200() {
        User user = User.builder().id("u1").totpEnabled(false).build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(user);

        ResponseEntity<?> resp = controller.request2FARecovery(Map.of("identifier", "test@example.com"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    @DisplayName("request2FARecovery: user found, 2FA enabled, email not verified → 400")
    void request2FARecovery_emailNotVerified_400() {
        User user = User.builder().id("u1").totpEnabled(true).emailVerified(false).build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(user);
        when(userRepository.findByUsername("test@example.com")).thenReturn(null);
        when(userRepository.findByPhoneNumber("test@example.com")).thenReturn(null);

        ResponseEntity<?> resp = controller.request2FARecovery(Map.of("identifier", "test@example.com"), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("request2FARecovery: user found, 2FA enabled, email verified → sends email + 200")
    void request2FARecovery_valid_200() {
        User user = User.builder().id("u1").totpEnabled(true).emailVerified(true).build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(user);
        when(emailTokenService.createToken(any(), eq(EmailToken.PURPOSE_2FA_RECOVERY), any())).thenReturn("token");
        when(emailConfig.get2FARecoveryUrl("token")).thenReturn("https://recovery.link");

        ResponseEntity<?> resp = controller.request2FARecovery(Map.of("identifier", "test@example.com"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    @DisplayName("request2FARecovery: email sending fails → still 200")
    void request2FARecovery_emailFails_200() {
        User user = User.builder().id("u1").totpEnabled(true).emailVerified(true).build();
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        when(emailTokenService.createToken(any(), anyString(), any())).thenReturn("token");
        when(emailConfig.get2FARecoveryUrl(anyString())).thenReturn("https://link");
        doThrow(new RuntimeException("email down")).when(emailService).send2FARecoveryLink(any(), anyString());

        ResponseEntity<?> resp = controller.request2FARecovery(Map.of("identifier", "test@example.com"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    // ── verify2FARecovery ──────────────────────────────────────────

    @Test
    @DisplayName("verify2FARecovery: null token → 400")
    void verify2FARecovery_nullToken_400() {
        ResponseEntity<?> resp = controller.verify2FARecovery(Map.of());
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verify2FARecovery: blank token → 400")
    void verify2FARecovery_blankToken_400() {
        ResponseEntity<?> resp = controller.verify2FARecovery(Map.of("token", "  "));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verify2FARecovery: invalid token → 400")
    void verify2FARecovery_invalidToken_400() {
        when(emailTokenService.validateToken("bad", EmailToken.PURPOSE_2FA_RECOVERY))
                .thenThrow(new InvalidEmailTokenException("Token expired"));
        ResponseEntity<?> resp = controller.verify2FARecovery(Map.of("token", "bad"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verify2FARecovery: user not found → 400")
    void verify2FARecovery_userNotFound_400() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_2FA_RECOVERY).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_2FA_RECOVERY)).thenReturn(dbToken);
        when(userRepository.findById("u1")).thenReturn(Optional.empty());

        ResponseEntity<?> resp = controller.verify2FARecovery(Map.of("token", "tok"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verify2FARecovery: valid → 200 + disables 2FA")
    void verify2FARecovery_valid_200() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_2FA_RECOVERY).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_2FA_RECOVERY)).thenReturn(dbToken);
        User user = User.builder().id("u1").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ResponseEntity<?> resp = controller.verify2FARecovery(Map.of("token", "tok"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(totpService).disable2FA(user);
        verify(emailTokenService).markUsed("t1");
        verify(emailTokenService).invalidateAllForUser("u1");
    }

    @Test
    @DisplayName("verify2FARecovery: security alert fails → still 200")
    void verify2FARecovery_alertFails_200() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_2FA_RECOVERY).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_2FA_RECOVERY)).thenReturn(dbToken);
        User user = User.builder().id("u1").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        doThrow(new RuntimeException("email down")).when(emailService).sendSecurityAlert(any(), anyString());

        ResponseEntity<?> resp = controller.verify2FARecovery(Map.of("token", "tok"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }
}
