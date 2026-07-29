package com.urva.myfinance.coinTrack.email.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.urva.myfinance.coinTrack.email.config.EmailConfigProperties;
import com.urva.myfinance.coinTrack.email.model.EmailToken;
import com.urva.myfinance.coinTrack.email.repository.EmailTokenRepository;
import com.urva.myfinance.coinTrack.email.service.EmailTokenService.InvalidEmailTokenException;
import com.urva.myfinance.coinTrack.user.model.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("EmailTokenService - Comprehensive Tests")
class EmailTokenServiceTest {

    @Mock private EmailTokenRepository repository;
    @Mock private EmailConfigProperties emailConfig;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks private EmailTokenService emailTokenService;

    private static final String SECRET = "a]very-Long!Secret@Key1234567890ab";
    private User sampleUser;

    @BeforeEach
    void setUp() {
        when(emailConfig.getMagicLinkSecret()).thenReturn(SECRET);
        when(emailConfig.getMagicLinkExpiryMinutes()).thenReturn(15);

        sampleUser = User.builder()
                .id("u1").username("testuser").email("test@example.com").name("Test").build();

        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("User-Agent")).thenReturn("test-agent");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    // ── createToken ────────────────────────────────────────────────

    @Test
    @DisplayName("createToken: creates JWT + saves DB record")
    void createToken_createsAndSaves() {
        String token = emailTokenService.createToken(sampleUser, EmailToken.PURPOSE_EMAIL_VERIFY, httpRequest);

        assertNotNull(token);
        verify(repository).save(any(EmailToken.class));

        var claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        assertEquals("u1", claims.getSubject());
        assertEquals(EmailToken.PURPOSE_EMAIL_VERIFY, claims.get("purpose", String.class));
    }

    @Test
    @DisplayName("createToken with newEmail: saves newEmail on record")
    void createToken_withNewEmail_savesNewEmail() {
        String token = emailTokenService.createToken(
                sampleUser, EmailToken.PURPOSE_EMAIL_CHANGE_VERIFY, "new@example.com", httpRequest);

        assertNotNull(token);
        verify(repository).save(argThat(t -> "new@example.com".equals(t.getNewEmail())));
    }

    // ── validateToken ──────────────────────────────────────────────

    @Test
    @DisplayName("validateToken: purpose mismatch → throws")
    void validateToken_purposeMismatch_throws() {
        EmailToken dbToken = EmailToken.builder()
                .id("tid").userId("u1").purpose(EmailToken.PURPOSE_EMAIL_VERIFY)
                .used(false).expiresAt(LocalDateTime.now().plusMinutes(10)).build();
        when(repository.findByIdAndUsedFalse(anyString())).thenReturn(Optional.of(dbToken));

        assertThrows(InvalidEmailTokenException.class,
                () -> emailTokenService.validateToken(createToken("tid", "u1", "WRONG_PURPOSE"),
                        EmailToken.PURPOSE_EMAIL_VERIFY));
    }

    @Test
    @DisplayName("validateToken: token not in DB → throws (replay protection)")
    void validateToken_notInDb_throws() {
        when(repository.findByIdAndUsedFalse(anyString())).thenReturn(Optional.empty());

        assertThrows(InvalidEmailTokenException.class,
                () -> emailTokenService.validateToken(createToken("tid", "u1", EmailToken.PURPOSE_EMAIL_VERIFY),
                        EmailToken.PURPOSE_EMAIL_VERIFY));
    }

    @Test
    @DisplayName("validateToken: expired DB record → throws")
    void validateToken_expiredDb_throws() {
        EmailToken dbToken = EmailToken.builder()
                .id("tid").userId("u1").purpose(EmailToken.PURPOSE_EMAIL_VERIFY)
                .used(false).expiresAt(LocalDateTime.now().minusMinutes(1)).build();
        when(repository.findByIdAndUsedFalse("tid")).thenReturn(Optional.of(dbToken));

        assertThrows(InvalidEmailTokenException.class,
                () -> emailTokenService.validateToken(createToken("tid", "u1", EmailToken.PURPOSE_EMAIL_VERIFY),
                        EmailToken.PURPOSE_EMAIL_VERIFY));
    }

    @Test
    @DisplayName("validateToken: already used → throws")
    void validateToken_alreadyUsed_throws() {
        EmailToken dbToken = EmailToken.builder()
                .id("tid").userId("u1").purpose(EmailToken.PURPOSE_EMAIL_VERIFY)
                .used(true).expiresAt(LocalDateTime.now().plusMinutes(10)).build();
        when(repository.findByIdAndUsedFalse("tid")).thenReturn(Optional.empty());

        assertThrows(InvalidEmailTokenException.class,
                () -> emailTokenService.validateToken(createToken("tid", "u1", EmailToken.PURPOSE_EMAIL_VERIFY),
                        EmailToken.PURPOSE_EMAIL_VERIFY));
    }

    @Test
    @DisplayName("validateToken: invalid JWT → throws")
    void validateToken_invalidJwt_throws() {
        assertThrows(InvalidEmailTokenException.class,
                () -> emailTokenService.validateToken("not-a-jwt", EmailToken.PURPOSE_EMAIL_VERIFY));
    }

    @Test
    @DisplayName("validateToken: valid token → returns EmailToken")
    void validateToken_valid_returnsEmailToken() {
        EmailToken dbToken = EmailToken.builder()
                .id("tid").userId("u1").purpose(EmailToken.PURPOSE_EMAIL_VERIFY)
                .used(false).expiresAt(LocalDateTime.now().plusMinutes(10)).build();
        when(repository.findByIdAndUsedFalse("tid")).thenReturn(Optional.of(dbToken));

        EmailToken result = emailTokenService.validateToken(
                createToken("tid", "u1", EmailToken.PURPOSE_EMAIL_VERIFY),
                EmailToken.PURPOSE_EMAIL_VERIFY);

        assertEquals("tid", result.getId());
        assertEquals("u1", result.getUserId());
    }

    // ── markUsed ───────────────────────────────────────────────────

    @Test
    @DisplayName("markUsed: found → sets used=true")
    void markUsed_found_setsUsed() {
        EmailToken token = EmailToken.builder().id("tid").used(false).build();
        when(repository.findById("tid")).thenReturn(Optional.of(token));

        emailTokenService.markUsed("tid");

        assertTrue(token.isUsed());
        verify(repository).save(token);
    }

    @Test
    @DisplayName("markUsed: not found → no-op")
    void markUsed_notFound_noop() {
        when(repository.findById("x")).thenReturn(Optional.empty());
        emailTokenService.markUsed("x");
        verify(repository, never()).save(any());
    }

    // ── invalidateAllForUser ───────────────────────────────────────

    @Test
    @DisplayName("invalidateAllForUser: deletes all tokens for user")
    void invalidateAllForUser_deletesAll() {
        emailTokenService.invalidateAllForUser("u1");
        verify(repository).deleteAllByUserId("u1");
    }

    // ── InvalidEmailTokenException ─────────────────────────────────

    @Test
    @DisplayName("InvalidEmailTokenException: carries message")
    void invalidEmailTokenException_message() {
        InvalidEmailTokenException ex = new InvalidEmailTokenException("test error");
        assertEquals("test error", ex.getMessage());
    }

    // ── Helper ─────────────────────────────────────────────────────

    private String createToken(String tokenId, String userId, String purpose) {
        var key = Keys.hmacShaKeyFor(SECRET.getBytes());
        return Jwts.builder()
                .id(tokenId)
                .subject(userId)
                .claim("purpose", purpose)
                .issuedAt(new java.util.Date())
                .expiration(new java.util.Date(System.currentTimeMillis() + 15 * 60 * 1000))
                .signWith(key)
                .compact();
    }
}
