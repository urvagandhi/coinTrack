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
import org.springframework.security.core.userdetails.UserDetails;

import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.service.EmailService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService.InvalidEmailTokenException;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("EmailVerificationController - Comprehensive Tests")
class EmailVerificationControllerTest {

    @Mock private EmailTokenService emailTokenService;
    @Mock private EmailService emailService;
    @Mock private EmailConfigProperties emailConfig;
    @Mock private UserRepository userRepository;
    @Mock private HttpServletRequest httpRequest;
    @Mock private UserDetails userDetails;

    @InjectMocks private EmailVerificationController controller;

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test");
    }

    // ── verifyEmail ────────────────────────────────────────────────

    @Test
    @DisplayName("verifyEmail: null token → 400")
    void verifyEmail_nullToken_400() {
        ResponseEntity<?> resp = controller.verifyEmail(Map.of(), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyEmail: blank token → 400")
    void verifyEmail_blankToken_400() {
        ResponseEntity<?> resp = controller.verifyEmail(Map.of("token", "  "), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyEmail: invalid token → 400")
    void verifyEmail_invalidToken_400() {
        when(emailTokenService.validateToken("bad", EmailToken.PURPOSE_EMAIL_VERIFY))
                .thenThrow(new InvalidEmailTokenException("Token expired"));
        ResponseEntity<?> resp = controller.verifyEmail(Map.of("token", "bad"), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyEmail: user not found → 400")
    void verifyEmail_userNotFound_400() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_EMAIL_VERIFY).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_EMAIL_VERIFY)).thenReturn(dbToken);
        when(userRepository.findById("u1")).thenReturn(Optional.empty());

        ResponseEntity<?> resp = controller.verifyEmail(Map.of("token", "tok"), httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyEmail: registration verify, already verified → 200 + alreadyVerified flag")
    void verifyEmail_alreadyVerified_200() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_EMAIL_VERIFY).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_EMAIL_VERIFY)).thenReturn(dbToken);
        User user = User.builder().id("u1").emailVerified(true).build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ResponseEntity<?> resp = controller.verifyEmail(Map.of("token", "tok"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    @DisplayName("verifyEmail: registration verify, new email → 200 + marks verified")
    void verifyEmail_newEmail_200() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1").purpose(EmailToken.PURPOSE_EMAIL_VERIFY).build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_EMAIL_VERIFY)).thenReturn(dbToken);
        User user = User.builder().id("u1").emailVerified(false).build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ResponseEntity<?> resp = controller.verifyEmail(Map.of("token", "tok"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(emailTokenService).markUsed("t1");
        verify(userRepository).save(user);
        assertTrue(user.isEmailVerified());
    }

    @Test
    @DisplayName("verifyEmail: email change verify → 200 + updates email")
    void verifyEmail_emailChange_200() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1")
                .purpose(EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY).newEmail("new@example.com").build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY)).thenReturn(dbToken);
        User user = User.builder().id("u1").email("old@example.com").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        ResponseEntity<?> resp = controller.verifyEmail(Map.of("token", "tok", "type", "change"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("new@example.com", user.getEmail());
        verify(emailTokenService).invalidateAllForUser("u1");
    }

    @Test
    @DisplayName("verifyEmail: email change, security alert fails → still 200")
    void verifyEmail_emailChange_alertFails_200() {
        EmailToken dbToken = EmailToken.builder().id("t1").userId("u1")
                .purpose(EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY).newEmail("new@example.com").build();
        when(emailTokenService.validateToken("tok", EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY)).thenReturn(dbToken);
        User user = User.builder().id("u1").username("testuser").name("Test").email("old@example.com").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        doThrow(new RuntimeException("email down")).when(emailService).sendSecurityAlert(any(), anyString(), anyMap());

        ResponseEntity<?> resp = controller.verifyEmail(Map.of("token", "tok", "type", "change"), httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    // ── resendVerification ─────────────────────────────────────────

    @Test
    @DisplayName("resendVerification: no authentication → 401")
    void resendVerification_noAuth_401() {
        ResponseEntity<?> resp = controller.resendVerification(null, httpRequest);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
    }

    @Test
    @DisplayName("resendVerification: user not found → 400")
    void resendVerification_userNotFound_400() {
        when(userDetails.getUsername()).thenReturn("unknown");
        when(userRepository.findByUsername("unknown")).thenReturn(null);

        ResponseEntity<?> resp = controller.resendVerification(userDetails, httpRequest);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @DisplayName("resendVerification: already verified → 200 + alreadyVerified")
    void resendVerification_alreadyVerified_200() {
        User user = User.builder().id("u1").emailVerified(true).build();
        when(userDetails.getUsername()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(user);

        ResponseEntity<?> resp = controller.resendVerification(userDetails, httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    @DisplayName("resendVerification: not verified → sends email + 200")
    void resendVerification_notVerified_200() {
        User user = User.builder().id("u1").emailVerified(false).build();
        when(userDetails.getUsername()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(emailTokenService.createToken(any(), eq(EmailToken.PURPOSE_EMAIL_VERIFY), any())).thenReturn("token");
        when(emailConfig.getEmailVerifyUrl("token")).thenReturn("https://verify.link");

        ResponseEntity<?> resp = controller.resendVerification(userDetails, httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    @Test
    @DisplayName("resendVerification: email send fails → still 200")
    void resendVerification_emailFails_200() {
        User user = User.builder().id("u1").emailVerified(false).build();
        when(userDetails.getUsername()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(emailTokenService.createToken(any(), anyString(), any())).thenReturn("token");
        when(emailConfig.getEmailVerifyUrl(anyString())).thenReturn("https://link");
        doThrow(new RuntimeException("email down")).when(emailService).sendEmailVerification(any(), anyString());

        ResponseEntity<?> resp = controller.resendVerification(userDetails, httpRequest);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }
}
