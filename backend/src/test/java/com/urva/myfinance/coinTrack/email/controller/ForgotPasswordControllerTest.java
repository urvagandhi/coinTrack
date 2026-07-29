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
import org.springframework.security.crypto.password.PasswordEncoder;

import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService.InvalidEmailTokenException;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("ForgotPasswordController - Comprehensive Tests")
class ForgotPasswordControllerTest {

    @Mock private EmailTokenService emailTokenService;
    @Mock private EmailService emailService;
    @Mock private EmailConfigProperties emailConfig;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks private ForgotPasswordController controller;

    private static final String SECRET = "a]very-Long!Secret@Key1234567890ab";

    @BeforeEach
    void setUp() {
        when(emailConfig.getMagicLinkSecret()).thenReturn(SECRET);
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
    }

    // ── requestPasswordReset ───────────────────────────────────────

    @Test
    @DisplayName("requestPasswordReset: null identifier → 400")
    void requestPasswordReset_nullId_400() {
        ResponseEntity<?> resp = controller.requestPasswordReset(Map.of(), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("requestPasswordReset: blank identifier → 400")
    void requestPasswordReset_blankId_400() {
        ResponseEntity<?> resp = controller.requestPasswordReset(Map.of("identifier", "  "), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("requestPasswordReset: user not found → still 200 (no enumeration)")
    void requestPasswordReset_notFound_200() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        ResponseEntity<?> resp = controller.requestPasswordReset(Map.of("identifier", "unknown"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(emailTokenService, never()).createToken(any(), anyString(), any());
    }

    @Test
    @DisplayName("requestPasswordReset: user found → sends email + 200")
    void requestPasswordReset_found_200() {
        User user = User.builder().id("u1").email("test@example.com").build();
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        when(emailTokenService.createToken(any(), eq(EmailToken.PURPOSE_PASSWORD_RESET), any())).thenReturn("token123");
        when(emailConfig.getPasswordResetUrl("token123")).thenReturn("https://reset.link");

        ResponseEntity<?> resp = controller.requestPasswordReset(Map.of("identifier", "test@example.com"), httpRequest);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    @DisplayName("requestPasswordReset: email failure → still 200 (non-blocking)")
    void requestPasswordReset_emailFails_200() {
        User user = User.builder().id("u1").email("test@example.com").build();
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
        when(emailTokenService.createToken(any(), anyString(), any())).thenReturn("token123");
        when(emailConfig.getPasswordResetUrl(anyString())).thenReturn("https://link");
        doThrow(new RuntimeException("email down")).when(emailService).sendPasswordResetLink(any(), anyString());

        ResponseEntity<?> resp = controller.requestPasswordReset(Map.of("identifier", "test@example.com"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    // ── verifyResetToken ───────────────────────────────────────────

    @Test
    @DisplayName("verifyResetToken: null token → 400")
    void verifyResetToken_null_400() {
        ResponseEntity<?> resp = controller.verifyResetToken(Map.of());
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyResetToken: invalid token → 400")
    void verifyResetToken_invalid_400() {
        when(emailTokenService.validateToken("bad", EmailToken.PURPOSE_PASSWORD_RESET))
                .thenThrow(new InvalidEmailTokenException("Token expired"));

        ResponseEntity<?> resp = controller.verifyResetToken(Map.of("token", "bad"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyResetToken: user not found → 400")
    void verifyResetToken_userNotFound_400() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_PASSWORD_RESET).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_PASSWORD_RESET)).thenReturn(dbToken);
        when(userRepository.findById("u1")).thenReturn(Optional.empty());

        ResponseEntity<?> resp = controller.verifyResetToken(Map.of("token", "tok"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyResetToken: valid → 200 + tempToken")
    void verifyResetToken_valid_200() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_PASSWORD_RESET).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_PASSWORD_RESET)).thenReturn(dbToken);
        User user = User.builder().id("u1").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ResponseEntity<?> resp = controller.verifyResetToken(Map.of("token", "tok"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(emailTokenService).markUsed("t1");
    }

    // ── resetPassword ──────────────────────────────────────────────

    @Test
    @DisplayName("resetPassword: null newPassword → 400")
    void resetPassword_nullPass_400() {
        ResponseEntity<?> resp = controller.resetPassword(null, Map.of(), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("resetPassword: weak password → 400")
    void resetPassword_weakPass_400() {
        ResponseEntity<?> resp = controller.resetPassword(null, Map.of("newPassword", "weak"), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("resetPassword: no auth header → 401")
    void resetPassword_noAuth_401() {
        ResponseEntity<?> resp = controller.resetPassword(null, Map.of("newPassword", "Strong1!@#"), httpRequest);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
    }

    @Test
    @DisplayName("resetPassword: invalid JWT → 401")
    void resetPassword_invalidJwt_401() {
        ResponseEntity<?> resp = controller.resetPassword(
                "Bearer invalid-jwt", Map.of("newPassword", "Strong1!@#"), httpRequest);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
    }

    @Test
    @DisplayName("resetPassword: valid flow → 200")
    void resetPassword_valid_200() {
        String tempJwt = Jwts.builder()
                .subject("u1")
                .claim("purpose", "PASSWORD_RESET_TEMP")
                .issuedAt(new java.util.Date())
                .expiration(new java.util.Date(System.currentTimeMillis() + 5 * 60 * 1000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .compact();

        User user = User.builder().id("u1").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("Strong1!@#")).thenReturn("encoded");

        ResponseEntity<?> resp = controller.resetPassword(
                "Bearer " + tempJwt, Map.of("newPassword", "Strong1!@#"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(userRepository).save(user);
        verify(emailTokenService).invalidateAllForUser("u1");
    }
}
