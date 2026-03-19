package com.urva.myfinance.coinTrack.user.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.user.dto.TotpSetupResponse;
import com.urva.myfinance.coinTrack.user.model.BackupCode;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.BackupCodeRepository;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.util.Utils;

/**
 * TOTP 2FA service.
 *
 * Changed: Replaced TotpEncryptionUtil with EncryptionUtil.encrypt/decrypt(text, totpKey)
 * static overloads. Single encryption implementation, separate key for TOTP secrets.
 */
@Service
public class TotpService {

    private final UserRepository userRepository;
    private final BackupCodeRepository backupCodeRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${totp.issuer}")
    private String issuer;

    @Value("${totp.encryption-key}")
    private String totpEncryptionKey;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final SecureRandom secureRandom = new SecureRandom();

    public TotpService(UserRepository userRepository, BackupCodeRepository backupCodeRepository) {
        this.userRepository = userRepository;
        this.backupCodeRepository = backupCodeRepository;
    }

    // ── Encrypt / Decrypt helpers using shared EncryptionUtil ────────

    private String encrypt(String plaintext) {
        return EncryptionUtil.encrypt(plaintext, totpEncryptionKey);
    }

    private String decrypt(String ciphertext) {
        return EncryptionUtil.decrypt(ciphertext, totpEncryptionKey);
    }

    // ── Setup (authenticated users already in DB) ───────────────────

    @Transactional
    public TotpSetupResponse generateSetup(User user) {
        String secret = secretGenerator.generate();
        String encryptedSecret = encrypt(secret);

        user.setTotpSecretPending(encryptedSecret);
        userRepository.save(user);

        return buildQrResponse(user.getEmail(), secret);
    }

    @Transactional
    public List<String> verifySetup(User user, String code) {
        if (user.getTotpSecretPending() == null) {
            throw new RuntimeException("No setup pending");
        }

        String secret = decrypt(user.getTotpSecretPending());

        if (!codeVerifier.isValidCode(secret, code)) {
            throw new RuntimeException("Invalid TOTP code");
        }

        // Promote pending → active
        user.setTotpSecretEncrypted(user.getTotpSecretPending());
        user.setTotpSecretPending(null);
        user.setTotpEnabled(true);
        user.setTotpVerified(true);
        user.setTotpSetupAt(LocalDateTime.now());
        user.setTotpFailedAttempts(0);
        user.setTotpLockedUntil(null);

        int newVersion = user.getTotpSecretVersion() + 1;
        user.setTotpSecretVersion(newVersion);

        userRepository.save(user);

        return generateBackupCodes(user, newVersion);
    }

    // ── Login verification ──────────────────────────────────────────

    @Transactional
    public boolean verifyLogin(User user, String code) {
        if (isLocked(user)) {
            throw new RuntimeException("Account is locked due to too many failed attempts. Try again later.");
        }

        if (!user.isTotpEnabled() || !user.isTotpVerified() || user.getTotpSecretEncrypted() == null) {
            throw new RuntimeException("TOTP not set up");
        }

        String secret = decrypt(user.getTotpSecretEncrypted());

        if (codeVerifier.isValidCode(secret, code)) {
            user.setTotpFailedAttempts(0);
            user.setTotpLockedUntil(null);
            user.setTotpLastUsedAt(LocalDateTime.now());
            userRepository.save(user);
            return true;
        } else {
            handleFailedAttempt(user);
            return false;
        }
    }

    @Transactional
    public boolean verifyBackupCode(User user, String code) {
        if (isLocked(user)) {
            throw new RuntimeException("Account is locked due to too many failed attempts");
        }

        List<BackupCode> codes = backupCodeRepository.findByUserIdAndUsedFalse(user.getId());

        for (BackupCode backupCode : codes) {
            if (backupCode.getGeneration() != user.getTotpSecretVersion()) {
                continue;
            }

            if (passwordEncoder.matches(code, backupCode.getCodeHash())) {
                backupCode.setUsed(true);
                backupCode.setUsedAt(LocalDateTime.now());
                backupCodeRepository.save(backupCode);

                user.setTotpFailedAttempts(0);
                user.setTotpLockedUntil(null);
                user.setTotpLastUsedAt(LocalDateTime.now());
                userRepository.save(user);
                return true;
            }
        }

        handleFailedAttempt(user);
        return false;
    }

    // ── Pending-user setup (registration flow — not yet in DB) ──────

    public TotpSetupResponse generateSetupForPendingUser(User pendingUser) {
        String secret = secretGenerator.generate();
        String encryptedSecret = encrypt(secret);

        pendingUser.setTotpSecretPending(encryptedSecret);

        return buildQrResponse(pendingUser.getEmail(), secret);
    }

    public List<String> verifySetupForPendingUser(User pendingUser, String code) {
        if (pendingUser.getTotpSecretPending() == null) {
            throw new RuntimeException("No TOTP setup pending. Please scan QR code first.");
        }

        String secret = decrypt(pendingUser.getTotpSecretPending());

        if (!codeVerifier.isValidCode(secret, code)) {
            throw new RuntimeException("Invalid TOTP code");
        }

        pendingUser.setTotpSecretEncrypted(pendingUser.getTotpSecretPending());
        pendingUser.setTotpSecretPending(null);
        pendingUser.setTotpEnabled(true);
        pendingUser.setTotpVerified(true);
        pendingUser.setTotpSetupAt(LocalDateTime.now());
        pendingUser.setTotpFailedAttempts(0);
        pendingUser.setTotpLockedUntil(null);

        int newVersion = 1;
        pendingUser.setTotpSecretVersion(newVersion);

        return generatePlaintextBackupCodes();
    }

    // ── Reset ───────────────────────────────────────────────────────

    @Transactional
    public TotpSetupResponse initiateReset(User user) {
        return generateSetup(user);
    }

    @Transactional
    public void disable2FA(User user) {
        user.setTotpEnabled(false);
        user.setTotpVerified(false);
        user.setTotpSecretEncrypted(null);
        user.setTotpSecretPending(null);
        user.setTotpSetupAt(null);
        user.setTotpLastUsedAt(null);
        user.setTotpFailedAttempts(0);
        user.setTotpLockedUntil(null);

        userRepository.save(user);
        backupCodeRepository.deleteByUserId(user.getId());
    }

    // ── Internal helpers ────────────────────────────────────────────

    private TotpSetupResponse buildQrResponse(String email, String secret) {
        QrData qrData = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer(issuer)
                .build();

        try {
            byte[] qrBytes = qrGenerator.generate(qrData);
            String qrBase64 = Utils.getDataUriForImage(qrBytes, "image/png");

            return TotpSetupResponse.builder()
                    .secret(secret)
                    .qrCodeUri(qrData.getUri())
                    .qrCodeBase64(qrBase64)
                    .build();
        } catch (QrGenerationException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    private List<String> generateBackupCodes(User user, int version) {
        List<String> plainCodes = new ArrayList<>();
        List<BackupCode> hashedCodes = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            String code = String.format("%08d", secureRandom.nextInt(100000000));
            plainCodes.add(code);

            hashedCodes.add(BackupCode.builder()
                    .userId(user.getId())
                    .codeHash(passwordEncoder.encode(code))
                    .generation(version)
                    .createdAt(LocalDateTime.now())
                    .used(false)
                    .build());
        }

        backupCodeRepository.saveAll(hashedCodes);
        return plainCodes;
    }

    private List<String> generatePlaintextBackupCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            codes.add(String.format("%08d", secureRandom.nextInt(100000000)));
        }
        return codes;
    }

    private void handleFailedAttempt(User user) {
        int attempts = user.getTotpFailedAttempts() + 1;
        user.setTotpFailedAttempts(attempts);

        if (attempts >= 10) {
            user.setTotpLockedUntil(LocalDateTime.now().plusHours(24));
        } else if (attempts >= 5) {
            user.setTotpLockedUntil(LocalDateTime.now().plusMinutes(10));
        }

        userRepository.save(user);
    }

    private boolean isLocked(User user) {
        if (user.getTotpLockedUntil() != null) {
            if (LocalDateTime.now().isBefore(user.getTotpLockedUntil())) {
                return true;
            } else {
                user.setTotpLockedUntil(null);
                user.setTotpFailedAttempts(0);
                userRepository.save(user);
                return false;
            }
        }
        return false;
    }
}
