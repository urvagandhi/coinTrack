package com.urva.myfinance.coinTrack.security.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import com.urva.myfinance.coinTrack.common.exception.AuthenticationException;
import com.urva.myfinance.coinTrack.user.model.RefreshToken;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.RefreshTokenRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("JWTService - Comprehensive Tests")
class JWTServiceTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;

    private JWTService jwtService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        jwtService = new JWTService("a]valid32charSecretKeyForJwtSigning1!", refreshTokenRepository);
        sampleUser = User.builder()
                .id("u1").username("testuser").email("test@example.com")
                .build();
    }

    @Test
    @DisplayName("generateToken: returns non-null JWT with correct subject")
    void generateToken_returnsJwt() {
        String token = jwtService.generateToken(sampleUser);
        assertNotNull(token);
        assertEquals("testuser", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("generateToken: contains userId and email claims")
    void generateToken_containsClaims() {
        String token = jwtService.generateToken(sampleUser);
        assertEquals("u1", jwtService.extractUserId(token));
        assertEquals("test@example.com", jwtService.extractEmail(token));
    }

    @Test
    @DisplayName("generateToken: not expired immediately")
    void generateToken_notExpired() {
        String token = jwtService.generateToken(sampleUser);
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    @DisplayName("extractExpiration: returns future date")
    void extractExpiration_futureDate() {
        String token = jwtService.generateToken(sampleUser);
        Date expiry = jwtService.extractExpiration(token);
        assertNotNull(expiry);
        assertTrue(expiry.after(new Date()));
    }

    @Test
    @DisplayName("validateToken: valid token + matching username → true")
    void validateToken_valid() {
        String token = jwtService.generateToken(sampleUser);
        assertTrue(jwtService.validateToken(token, "testuser"));
    }

    @Test
    @DisplayName("validateToken: valid token + wrong username → false")
    void validateToken_wrongUsername() {
        String token = jwtService.generateToken(sampleUser);
        assertFalse(jwtService.validateToken(token, "wronguser"));
    }

    @Test
    @DisplayName("validateToken: malformed token → false")
    void validateToken_malformed() {
        assertFalse(jwtService.validateToken("not-a-jwt", "testuser"));
    }

    @Test
    @DisplayName("validateToken: empty string → false")
    void validateToken_empty() {
        assertFalse(jwtService.validateToken("", "testuser"));
    }

    @Test
    @DisplayName("extractUsername: tampered token → throws RuntimeException")
    void extractUsername_tampered_throws() {
        String token = jwtService.generateToken(sampleUser);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThrows(RuntimeException.class, () -> jwtService.extractUsername(tampered));
    }

    @Test
    @DisplayName("isTokenExpired: garbage token → true")
    void isTokenExpired_garbage_true() {
        assertTrue(jwtService.isTokenExpired("garbage"));
    }

    @Test
    @DisplayName("parseToken: valid token → returns claims")
    void parseToken_valid() {
        String token = jwtService.generateToken(sampleUser);
        assertNotNull(jwtService.parseToken(token));
        assertEquals("testuser", jwtService.parseToken(token).getSubject());
    }

    // ── Refresh Token ──────────────────────────────────────────────

    @Test
    @DisplayName("generateRefreshToken: saves to repo and returns raw token")
    void generateRefreshToken_saves() {
        String raw = jwtService.generateRefreshToken("u1", "Chrome", "127.0.0.1");
        assertNotNull(raw);
        verify(refreshTokenRepository).save(argThat(rt ->
                "u1".equals(rt.getUserId()) && rt.getTokenHash() != null && !rt.isRevoked()));
    }

    @Test
    @DisplayName("generateRefreshToken: long deviceInfo is truncated")
    void generateRefreshToken_truncatesDevice() {
        String longDevice = "a".repeat(300);
        jwtService.generateRefreshToken("u1", longDevice, "ip");
        verify(refreshTokenRepository).save(argThat(rt ->
                rt.getDeviceInfo() != null && rt.getDeviceInfo().length() <= 200));
    }

    @Test
    @DisplayName("generateRefreshToken: null deviceInfo → no error")
    void generateRefreshToken_nullDevice() {
        String raw = jwtService.generateRefreshToken("u1", null, null);
        assertNotNull(raw);
        verify(refreshTokenRepository).save(any());
    }

    // ── validateAndRotateRefreshToken ──────────────────────────────

    @Test
    @DisplayName("validateAndRotateRefreshToken: valid → returns new pair")
    void validateAndRotate_valid() {
        String raw = jwtService.generateRefreshToken("u1", "d", "ip");
        String hash = com.urva.myfinance.coinTrack.common.util.HashUtil.sha256(raw);
        RefreshToken stored = RefreshToken.builder()
                .userId("u1").tokenHash(hash).revoked(false)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(stored));

        JWTService.TokenPair pair = jwtService.validateAndRotateRefreshToken(raw, sampleUser, "d", "ip");

        assertNotNull(pair.accessToken());
        assertNotNull(pair.refreshToken());
        assertTrue(stored.isRevoked());
        verify(refreshTokenRepository).save(stored);
    }

    @Test
    @DisplayName("validateAndRotateRefreshToken: revoked token → revokes all + throws")
    void validateAndRotate_revoked_throws() {
        String raw = jwtService.generateRefreshToken("u1", "d", "ip");
        String hash = com.urva.myfinance.coinTrack.common.util.HashUtil.sha256(raw);
        RefreshToken stored = RefreshToken.builder()
                .userId("u1").tokenHash(hash).revoked(true)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(stored));

        assertThrows(AuthenticationException.class,
                () -> jwtService.validateAndRotateRefreshToken(raw, sampleUser, "d", "ip"));
        verify(refreshTokenRepository).revokeAllByUserId("u1");
    }

    @Test
    @DisplayName("validateAndRotateRefreshToken: expired token → throws")
    void validateAndRotate_expired_throws() {
        String raw = jwtService.generateRefreshToken("u1", "d", "ip");
        String hash = com.urva.myfinance.coinTrack.common.util.HashUtil.sha256(raw);
        RefreshToken stored = RefreshToken.builder()
                .userId("u1").tokenHash(hash).revoked(false)
                .expiresAt(Instant.now().minusSeconds(100))
                .build();
        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(stored));

        assertThrows(AuthenticationException.class,
                () -> jwtService.validateAndRotateRefreshToken(raw, sampleUser, "d", "ip"));
    }

    @Test
    @DisplayName("validateAndRotateRefreshToken: unknown token → throws")
    void validateAndRotate_unknown_throws() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());
        assertThrows(AuthenticationException.class,
                () -> jwtService.validateAndRotateRefreshToken("unknown", sampleUser, "d", "ip"));
    }

    @Test
    @DisplayName("revokeAllRefreshTokens: delegates to repo")
    void revokeAllRefreshTokens_delegates() {
        jwtService.revokeAllRefreshTokens("u1");
        verify(refreshTokenRepository).revokeAllByUserId("u1");
    }

    // ── Temp Token ─────────────────────────────────────────────────

    @Test
    @DisplayName("generateTempToken(User): returns valid temp token with purpose")
    void generateTempToken_user() {
        String token = jwtService.generateTempToken(sampleUser, "TOTP_SETUP", 10);
        assertNotNull(token);
        assertEquals("TOTP_SETUP", jwtService.extractPurpose(token));
        assertEquals("testuser", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("generateTempToken(String): returns valid temp token for pending user")
    void generateTempToken_string() {
        String token = jwtService.generateTempToken("pendingUser", "TOTP_REGISTRATION");
        assertNotNull(token);
        assertEquals("TOTP_REGISTRATION", jwtService.extractPurpose(token));
        assertEquals("pendingUser", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("isValidTempToken: correct purpose + valid → true")
    void isValidTempToken_correctPurpose() {
        String token = jwtService.generateTempToken(sampleUser, "TOTP_LOGIN", 10);
        assertTrue(jwtService.isValidTempToken(token, "TOTP_LOGIN"));
    }

    @Test
    @DisplayName("isValidTempToken: wrong purpose → false")
    void isValidTempToken_wrongPurpose() {
        String token = jwtService.generateTempToken(sampleUser, "TOTP_LOGIN", 10);
        assertFalse(jwtService.isValidTempToken(token, "TOTP_SETUP"));
    }

    @Test
    @DisplayName("isValidTempToken: garbage token → false")
    void isValidTempToken_garbage() {
        assertFalse(jwtService.isValidTempToken("garbage", "TOTP_LOGIN"));
    }

    @Test
    @DisplayName("isValidTempToken: empty token → false")
    void isValidTempToken_empty() {
        assertFalse(jwtService.isValidTempToken("", "TOTP_LOGIN"));
    }

    @Test
    @DisplayName("extractPurpose: garbage → null")
    void extractPurpose_garbage_null() {
        assertNull(jwtService.extractPurpose("garbage"));
    }

    @Test
    @DisplayName("generateTempToken: User with null username uses email")
    void generateTempToken_nullUsername_usesEmail() {
        User noUsername = User.builder().id("u2").email("no-user@example.com").build();
        String token = jwtService.generateTempToken(noUsername, "TOTP_SETUP", 10);
        assertEquals("no-user@example.com", jwtService.extractUsername(token));
    }
}
