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

import com.urva.myfinance.coinTrack.security.util.TotpEncryptionUtil;
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

@Service
public class TotpService {

    private final UserRepository userRepository;
    private final BackupCodeRepository backupCodeRepository;
    private final TotpEncryptionUtil encryptionUtil;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${totp.issuer}")
    private String issuer;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();

    public TotpService(UserRepository userRepository, BackupCodeRepository backupCodeRepository,
            TotpEncryptionUtil encryptionUtil) {
        this.userRepository = userRepository;
        this.backupCodeRepository = backupCodeRepository;
        this.encryptionUtil = encryptionUtil;
    }

    /**
     * Generates a new TOTP secret for setup/reset.
     * Stores secret in 'pending' state until verified.
     */
    @Transactional
    public TotpSetupResponse generateSetup(User user) {
        String secret = secretGenerator.generate();
        String encryptedSecret = encryptionUtil.encrypt(secret);

        // Store as pending secret only
        user.setTotpSecretPending(encryptedSecret);
        userRepository.save(user);

        // Generate QR Code
        QrData qrData = new QrData.Builder()
                .label(user.getEmail())
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

    /**
     * Verifies the pending secret and promotes it to active.
     * Generates backup codes immediately upon success.
     */
    @Transactional
    public List<String> verifySetup(User user, String code) {
        if (user.getTotpSecretPending() == null) {
            throw new RuntimeException("No setup pending");
        }

        String secret = encryptionUtil.decrypt(user.getTotpSecretPending());

        if (!codeVerifier.isValidCode(secret, code)) {
            throw new RuntimeException("Invalid TOTP code");
        }

        // Promote pending secret to active
        user.setTotpSecretEncrypted(user.getTotpSecretPending());
        user.setTotpSecretPending(null);
        user.setTotpEnabled(true);
        user.setTotpVerified(true);
        user.setTotpSetupAt(LocalDateTime.now());
        user.setTotpFailedAttempts(0);
        user.setTotpLockedUntil(null);

        // Versioning: Increment version for new setup (or initial setup)
        // If it's a reset, this invalidates old backup codes
        int newVersion = user.getTotpSecretVersion() + 1;
        user.setTotpSecretVersion(newVersion);

        userRepository.save(user);

        // Generate and Return Backup Codes
        return generateBackupCodes(user, newVersion);
    }

    /**
     * Verify active TOTP code for login.
     * Handles lockout logic.
     */
    @Transactional
    public boolean verifyLogin(User user, String code) {
        if (isLocked(user)) {
            throw new RuntimeException("Account is locked due to too many failed attempts. Try again later.");
        }

        if (!user.isTotpEnabled() || !user.isTotpVerified() || user.getTotpSecretEncrypted() == null) {
            throw new RuntimeException("TOTP not set up");
        }

        String secret = encryptionUtil.decrypt(user.getTotpSecretEncrypted());

        if (codeVerifier.isValidCode(secret, code)) {
            // Success
            user.setTotpFailedAttempts(0);
            user.setTotpLockedUntil(null);
            user.setTotpLastUsedAt(LocalDateTime.now());
            userRepository.save(user);
            return true;
        } else {
            // Failure
            handleFailedAttempt(user);
            return false;
        }
    }

    /**
     * Verify backup code for recovery login.
     */
    @Transactional
    public boolean verifyBackupCode(User user, String code) {
        if (isLocked(user)) {
            throw new RuntimeException("Account is locked due to too many failed attempts");
        }

        List<BackupCode> codes = backupCodeRepository.findByUserIdAndUsedFalse(user.getId());

        for (BackupCode backupCode : codes) {
            // CRITICAL: Check generation version matches user's current version
            if (backupCode.getGeneration() != user.getTotpSecretVersion()) {
                continue; // Skip old generation codes
            }

            if (passwordEncoder.matches(code, backupCode.getCodeHash())) {
                backupCode.setUsed(true);
                backupCode.setUsedAt(LocalDateTime.now());
                backupCodeRepository.save(backupCode);

                // Reset lockout on success
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

    /**
     * Initiates reset flow.
     * User must prove identity first (via current TOTP or Backup Code).
     */
    @Transactional
    public TotpSetupResponse initiateReset(User user) {
        // Reset wipes verified status for consistency during flow,
        // but 'totpEnabled' stays true to prevent bypass.
        // Pending secret is set in generateSetup called below.

        // Note: Caller must have already verified current auth (TOTP/Backup)
        // or this endpoint should be protected by a fresh Re-Auth.

        return generateSetup(user);
    }

    private List<String> generateBackupCodes(User user, int version) {
        // Revoke old codes by generation mismatch (implicitly done by version
        // increment)
        // But we can also explicitly mark them as used or delete them if we want to
        // cleanup DB
        // For strictness, we just generate new ones with new version.

        List<String> plainCodes = new ArrayList<>();
        List<BackupCode> hashedCodes = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            String code = Utils.getDataUriForImage(new byte[0], "image/png").substring(0, 0)
                    + String.format("%08d", new SecureRandom().nextInt(99999999));
            // Simple random 8-digit codes
            code = String.format("%08d", new SecureRandom().nextInt(100000000));

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
                // Lock expired
                user.setTotpLockedUntil(null);
                user.setTotpFailedAttempts(0);
                userRepository.save(user);
                return false;
            }
        }
        return false;
    }
}
