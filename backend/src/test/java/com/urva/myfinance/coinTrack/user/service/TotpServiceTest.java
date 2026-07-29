package com.urva.myfinance.coinTrack.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import dev.samstevens.totp.code.DefaultCodeGenerator;

import com.urva.myfinance.coinTrack.user.dto.TotpSetupResponse;
import com.urva.myfinance.coinTrack.user.model.BackupCode;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.BackupCodeRepository;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("TotpService - Comprehensive Tests")
class TotpServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private BackupCodeRepository backupCodeRepository;

    @InjectMocks private TotpService totpService;

    private User sampleUser;
    private final DefaultCodeGenerator codeGenerator = new DefaultCodeGenerator();

    private String generateValidCode(String secret) throws Exception {
        return codeGenerator.generate(secret, System.currentTimeMillis() / 1000 / 30);
    }

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(totpService, "issuer", "CoinTrack");
        ReflectionTestUtils.setField(totpService, "totpEncryptionKey", "12345678901234567890123456789012");

        sampleUser = User.builder()
                .id("u1")
                .username("testuser")
                .email("test@example.com")
                .totpEnabled(false)
                .totpVerified(false)
                .totpSecretVersion(1)
                .totpFailedAttempts(0)
                .build();
    }

    // ── generateSetup ──────────────────────────────────────────────

    @Test
    @DisplayName("generateSetup: sets pending secret and returns QR data")
    void generateSetup_setsPendingAndReturns() {
        TotpSetupResponse response = totpService.generateSetup(sampleUser);

        assertNotNull(response);
        assertNotNull(response.getSecret());
        assertNotNull(response.getQrCodeUri());
        assertNotNull(response.getQrCodeBase64());
        assertTrue(response.getQrCodeUri().contains("otpauth://totp/"));
        assertTrue(response.getQrCodeUri().contains("CoinTrack"));
        assertNotNull(sampleUser.getTotpSecretPending());
        verify(userRepository).save(sampleUser);
    }

    // ── verifySetup ────────────────────────────────────────────────

    @Test
    @DisplayName("verifySetup: no pending → throws RuntimeException")
    void verifySetup_noPending_throws() {
        sampleUser.setTotpSecretPending(null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> totpService.verifySetup(sampleUser, "123456"));
        assertEquals("No setup pending", ex.getMessage());
    }

    @Test
    @DisplayName("verifySetup: invalid code → throws RuntimeException")
    void verifySetup_invalidCode_throws() {
        TotpSetupResponse setup = totpService.generateSetup(sampleUser);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> totpService.verifySetup(sampleUser, "000000"));
        assertEquals("Invalid TOTP code", ex.getMessage());
    }

    @Test
    @DisplayName("verifySetup: promotes pending to active and generates backup codes")
    void verifySetup_validCode_promotesAndGeneratesBackupCodes() throws Exception {
        TotpSetupResponse setup = totpService.generateSetup(sampleUser);
        String validCode = generateValidCode(setup.getSecret());

        List<String> codes = totpService.verifySetup(sampleUser, validCode);

        assertNotNull(codes);
        assertEquals(10, codes.size());
        assertTrue(sampleUser.isTotpEnabled());
        assertTrue(sampleUser.isTotpVerified());
        assertNull(sampleUser.getTotpSecretPending());
        assertNotNull(sampleUser.getTotpSecretEncrypted());
        assertEquals(2, sampleUser.getTotpSecretVersion());
        assertNotNull(sampleUser.getTotpSetupAt());
        assertEquals(0, sampleUser.getTotpFailedAttempts());
        assertNull(sampleUser.getTotpLockedUntil());
        verify(backupCodeRepository).saveAll(anyList());
    }

    // ── verifyLogin ────────────────────────────────────────────────

    @Test
    @DisplayName("verifyLogin: locked account → throws RuntimeException")
    void verifyLogin_lockedAccount_throws() {
        sampleUser.setTotpLockedUntil(LocalDateTime.now().plusHours(1));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> totpService.verifyLogin(sampleUser, "123456"));
        assertTrue(ex.getMessage().contains("locked"));
    }

    @Test
    @DisplayName("verifyLogin: TOTP not set up → throws RuntimeException")
    void verifyLogin_notSetup_throws() {
        sampleUser.setTotpEnabled(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> totpService.verifyLogin(sampleUser, "123456"));
        assertEquals("TOTP not set up", ex.getMessage());
    }

    @Test
    @DisplayName("verifyLogin: invalid code → false + increments failed attempts")
    void verifyLogin_invalidCode_false() throws Exception {
        TotpSetupResponse setup = totpService.generateSetup(sampleUser);
        String validCode = generateValidCode(setup.getSecret());
        totpService.verifySetup(sampleUser, validCode);

        boolean result = totpService.verifyLogin(sampleUser, "000000");

        assertFalse(result);
        assertEquals(1, sampleUser.getTotpFailedAttempts());
        verify(userRepository, atLeast(2)).save(sampleUser);
    }

    @Test
    @DisplayName("verifyLogin: valid code → true + resets failed + sets lastUsedAt")
    void verifyLogin_validCode_true() throws Exception {
        TotpSetupResponse setup = totpService.generateSetup(sampleUser);
        String validCode = generateValidCode(setup.getSecret());
        totpService.verifySetup(sampleUser, validCode);

        sampleUser.setTotpFailedAttempts(3);
        boolean result = totpService.verifyLogin(sampleUser, validCode);

        assertTrue(result);
        assertEquals(0, sampleUser.getTotpFailedAttempts());
        assertNull(sampleUser.getTotpLockedUntil());
        assertNotNull(sampleUser.getTotpLastUsedAt());
    }

    @Test
    @DisplayName("verifyLogin: 5th failed attempt → locks for 10 minutes")
    void verifyLogin_5thAttempt_locks10Min() throws Exception {
        TotpSetupResponse setup = totpService.generateSetup(sampleUser);
        String validCode = generateValidCode(setup.getSecret());
        totpService.verifySetup(sampleUser, validCode);

        sampleUser.setTotpFailedAttempts(4);
        totpService.verifyLogin(sampleUser, "000000");

        assertNotNull(sampleUser.getTotpLockedUntil());
        LocalDateTime expectedMin = LocalDateTime.now().plusMinutes(9);
        LocalDateTime expectedMax = LocalDateTime.now().plusMinutes(11);
        assertTrue(sampleUser.getTotpLockedUntil().isAfter(expectedMin));
        assertTrue(sampleUser.getTotpLockedUntil().isBefore(expectedMax));
    }

    @Test
    @DisplayName("verifyLogin: 10th failed attempt → locks for 24 hours")
    void verifyLogin_10thAttempt_locks24hr() throws Exception {
        TotpSetupResponse setup = totpService.generateSetup(sampleUser);
        String validCode = generateValidCode(setup.getSecret());
        totpService.verifySetup(sampleUser, validCode);

        sampleUser.setTotpFailedAttempts(9);
        totpService.verifyLogin(sampleUser, "000000");

        assertNotNull(sampleUser.getTotpLockedUntil());
        LocalDateTime expectedMin = LocalDateTime.now().plusHours(23);
        LocalDateTime expectedMax = LocalDateTime.now().plusHours(25);
        assertTrue(sampleUser.getTotpLockedUntil().isAfter(expectedMin));
        assertTrue(sampleUser.getTotpLockedUntil().isBefore(expectedMax));
    }

    // ── verifyBackupCode ───────────────────────────────────────────

    @Test
    @DisplayName("verifyBackupCode: locked → throws")
    void verifyBackupCode_locked_throws() {
        sampleUser.setTotpLockedUntil(LocalDateTime.now().plusHours(1));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> totpService.verifyBackupCode(sampleUser, "12345678"));
        assertTrue(ex.getMessage().contains("locked"));
    }

    @Test
    @DisplayName("verifyBackupCode: no codes → false")
    void verifyBackupCode_noCodes_false() {
        when(backupCodeRepository.findByUserIdAndUsedFalse("u1")).thenReturn(List.of());

        boolean result = totpService.verifyBackupCode(sampleUser, "12345678");

        assertFalse(result);
    }

    @Test
    @DisplayName("verifyBackupCode: wrong generation → false")
    void verifyBackupCode_wrongGeneration_false() {
        BackupCode bc = BackupCode.builder()
                .userId("u1")
                .codeHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("12345678"))
                .generation(99)
                .used(false)
                .build();
        when(backupCodeRepository.findByUserIdAndUsedFalse("u1")).thenReturn(List.of(bc));

        boolean result = totpService.verifyBackupCode(sampleUser, "12345678");

        assertFalse(result);
    }

    // ── disable2FA ─────────────────────────────────────────────────

    @Test
    @DisplayName("disable2FA: clears all TOTP state and deletes backup codes")
    void disable2FA_clearsAll() {
        sampleUser.setTotpEnabled(true);
        sampleUser.setTotpVerified(true);
        sampleUser.setTotpSecretEncrypted("encrypted");
        sampleUser.setTotpSecretPending("pending");

        totpService.disable2FA(sampleUser);

        assertFalse(sampleUser.isTotpEnabled());
        assertFalse(sampleUser.isTotpVerified());
        assertNull(sampleUser.getTotpSecretEncrypted());
        assertNull(sampleUser.getTotpSecretPending());
        assertNull(sampleUser.getTotpSetupAt());
        assertNull(sampleUser.getTotpLastUsedAt());
        assertEquals(0, sampleUser.getTotpFailedAttempts());
        assertNull(sampleUser.getTotpLockedUntil());
        verify(userRepository).save(sampleUser);
        verify(backupCodeRepository).deleteByUserId("u1");
    }

    // ── saveBackupCodes ────────────────────────────────────────────

    @Test
    @DisplayName("saveBackupCodes: hashes and saves all codes")
    void saveBackupCodes_hashesAndSaves() {
        List<String> codes = List.of("11111111", "22222222");

        totpService.saveBackupCodes(sampleUser, codes, 1);

        ArgumentCaptor<List<BackupCode>> captor = ArgumentCaptor.forClass(List.class);
        verify(backupCodeRepository).saveAll(captor.capture());
        List<BackupCode> saved = captor.getValue();
        assertEquals(2, saved.size());
        assertEquals("u1", saved.get(0).getUserId());
        assertEquals(1, saved.get(0).getGeneration());
        assertFalse(saved.get(0).isUsed());
    }

    // ── initiateReset ──────────────────────────────────────────────

    @Test
    @DisplayName("initiateReset: delegates to generateSetup")
    void initiateReset_delegates() {
        TotpSetupResponse response = totpService.initiateReset(sampleUser);

        assertNotNull(response);
        assertNotNull(response.getSecret());
        verify(userRepository).save(sampleUser);
    }

    // ── Locked account with expired lock ───────────────────────────

    @Test
    @DisplayName("verifyLogin: expired lock → clears lock and proceeds")
    void verifyLogin_expiredLock_clearsAndProceeds() throws Exception {
        TotpSetupResponse setup = totpService.generateSetup(sampleUser);
        String validCode = generateValidCode(setup.getSecret());
        totpService.verifySetup(sampleUser, validCode);

        sampleUser.setTotpLockedUntil(LocalDateTime.now().minusMinutes(1));
        sampleUser.setTotpFailedAttempts(5);

        boolean result = totpService.verifyLogin(sampleUser, validCode);

        assertTrue(result);
        assertNull(sampleUser.getTotpLockedUntil());
        assertEquals(0, sampleUser.getTotpFailedAttempts());
    }
}
