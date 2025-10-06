package com.urva.myfinance.coinTrack.Service;

import java.security.InvalidKeyException;
import java.security.Key;
import java.time.Instant;

import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for generating Time-based One-Time Passwords (TOTP) from
 * Base32-encoded secrets.
 * 
 * Uses the com.eatthepath:java-otp library for RFC 6238 compliant TOTP
 * generation.
 * Default configuration:
 * - Time step: 30 seconds
 * - Password length: 6 digits
 * - Algorithm: HmacSHA1
 * 
 * @author coinTrack Team
 * @version 1.0
 * @since 2025-01-06
 */
@Slf4j
@Service
public class TotpService {

    private static final int TOTP_PASSWORD_LENGTH = 6;
    private final TimeBasedOneTimePasswordGenerator totpGenerator;

    public TotpService() {
        try {
            // Initialize TOTP generator with 6-digit passwords and 30-second time step
            this.totpGenerator = new TimeBasedOneTimePasswordGenerator();
            log.info("TOTP Service initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize TOTP generator", e);
            throw new RuntimeException("TOTP Service initialization failed", e);
        }
    }

    /**
     * Generate a TOTP code from a Base32-encoded secret.
     * 
     * @param base32Secret The Base32-encoded TOTP secret (e.g., from Google
     *                     Authenticator)
     * @return 6-digit TOTP code as a String (zero-padded if necessary)
     * @throws IllegalArgumentException if secret is invalid or null
     */
    public String generateTotp(String base32Secret) {
        if (base32Secret == null || base32Secret.trim().isEmpty()) {
            throw new IllegalArgumentException("TOTP secret cannot be null or empty");
        }

        try {
            // Remove any whitespace or formatting from the secret
            String cleanSecret = base32Secret.replaceAll("\\s+", "").toUpperCase();

            // Decode Base32 secret to bytes
            Base32 base32 = new Base32();
            byte[] secretBytes = base32.decode(cleanSecret);

            // Create HMAC-SHA1 key from secret bytes
            Key key = new SecretKeySpec(secretBytes, "HmacSHA1");

            // Generate TOTP for current time
            Instant now = Instant.now();
            int otp = totpGenerator.generateOneTimePassword(key, now);

            // Format as 6-digit string with leading zeros
            return String.format("%0" + TOTP_PASSWORD_LENGTH + "d", otp);

        } catch (IllegalArgumentException e) {
            log.error("Invalid Base32 secret format: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid TOTP secret format. Must be valid Base32 encoding.", e);
        } catch (InvalidKeyException e) {
            log.error("Invalid key for TOTP generation: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid TOTP secret key", e);
        } catch (Exception e) {
            log.error("Unexpected error generating TOTP: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate TOTP code", e);
        }
    }

    /**
     * Validate if a provided TOTP code matches the expected code for the given
     * secret.
     * Checks current time window and adjacent windows (±1) for clock skew
     * tolerance.
     * 
     * @param base32Secret The Base32-encoded TOTP secret
     * @param providedCode The TOTP code to validate
     * @return true if the code is valid, false otherwise
     */
    public boolean validateTotp(String base32Secret, String providedCode) {
        if (providedCode == null || providedCode.trim().isEmpty()) {
            return false;
        }

        try {
            // Generate TOTP for current time
            String currentTotp = generateTotp(base32Secret);

            // Direct match with current time window
            if (currentTotp.equals(providedCode.trim())) {
                log.debug("TOTP validated successfully (current window)");
                return true;
            }

            // Check previous and next time windows for clock skew tolerance
            // This is important for real-world scenarios where clocks may drift
            String cleanSecret = base32Secret.replaceAll("\\s+", "").toUpperCase();
            Base32 base32 = new Base32();
            byte[] secretBytes = base32.decode(cleanSecret);
            Key key = new SecretKeySpec(secretBytes, "HmacSHA1");

            // Check previous window (-30 seconds)
            Instant previousWindow = Instant.now().minusSeconds(30);
            int previousOtp = totpGenerator.generateOneTimePassword(key, previousWindow);
            String previousTotp = String.format("%0" + TOTP_PASSWORD_LENGTH + "d", previousOtp);

            if (previousTotp.equals(providedCode.trim())) {
                log.debug("TOTP validated successfully (previous window)");
                return true;
            }

            // Check next window (+30 seconds)
            Instant nextWindow = Instant.now().plusSeconds(30);
            int nextOtp = totpGenerator.generateOneTimePassword(key, nextWindow);
            String nextTotp = String.format("%0" + TOTP_PASSWORD_LENGTH + "d", nextOtp);

            if (nextTotp.equals(providedCode.trim())) {
                log.debug("TOTP validated successfully (next window)");
                return true;
            }

            log.debug("TOTP validation failed - code does not match any valid window");
            return false;

        } catch (InvalidKeyException e) {
            log.error("Error validating TOTP: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get the time remaining (in seconds) until the current TOTP code expires.
     * 
     * @return seconds until next time window (0-30)
     */
    public int getTimeRemaining() {
        long currentTimeSeconds = Instant.now().getEpochSecond();
        long timeStepSeconds = 30;
        return (int) (timeStepSeconds - (currentTimeSeconds % timeStepSeconds));
    }
}
