package com.urva.myfinance.coinTrack.common.util;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.common.config.EncryptionConfig;

/**
 * AES-256-GCM encryption utility.
 *
 * Encrypted format: [IV (12 bytes)] [Ciphertext] [Auth Tag (16 bytes)]
 *
 * Security guarantees:
 * - 12-byte (96-bit) IV — the recommended length for GCM
 * - Random IV generated per encryption via {@link SecureRandom}
 * - 128-bit authentication tag — prevents tampering
 * - Key must be exactly 32 bytes (validated by {@link EncryptionConfig} at startup)
 * - No plaintext or key material is ever logged
 */
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;   // 96 bits — GCM recommended
    private static final int GCM_TAG_LENGTH = 128;  // 128-bit auth tag

    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    public EncryptionUtil(EncryptionConfig encryptionConfig) {
        byte[] keyBytes = encryptionConfig.getSecretKey().getBytes(StandardCharsets.UTF_8);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        this.secureRandom = new SecureRandom();
    }

    /**
     * Encrypt plaintext using the application-wide key.
     *
     * @param plaintext the text to encrypt (must not be null or empty)
     * @return Base64-encoded string: [IV][ciphertext][auth-tag]
     */
    public String encrypt(String plaintext) {
        return doEncrypt(plaintext, this.secretKey);
    }

    /**
     * Encrypt plaintext using a caller-supplied key.
     * Useful for per-tenant or per-entity encryption where the key differs
     * from the application-wide default.
     *
     * @param plaintext   the text to encrypt
     * @param keyOverride a 32-character (256-bit) key
     * @return Base64-encoded string: [IV][ciphertext][auth-tag]
     */
    public static String encrypt(String plaintext, String keyOverride) {
        validateKeyOverride(keyOverride);
        SecretKey key = new SecretKeySpec(keyOverride.getBytes(StandardCharsets.UTF_8), "AES");
        return doEncryptStatic(plaintext, key);
    }

    /**
     * Decrypt Base64-encoded ciphertext using the application-wide key.
     *
     * @param encryptedData Base64 string produced by {@link #encrypt(String)}
     * @return the original plaintext
     */
    public String decrypt(String encryptedData) {
        return doDecrypt(encryptedData, this.secretKey);
    }

    /**
     * Decrypt Base64-encoded ciphertext using a caller-supplied key.
     *
     * @param encryptedData Base64 string produced by {@link #encrypt(String, String)}
     * @param keyOverride   the same 32-character key used during encryption
     * @return the original plaintext
     */
    public static String decrypt(String encryptedData, String keyOverride) {
        validateKeyOverride(keyOverride);
        SecretKey key = new SecretKeySpec(keyOverride.getBytes(StandardCharsets.UTF_8), "AES");
        return doDecryptStatic(encryptedData, key);
    }

    /**
     * Heuristic check: does the data look like it was produced by this utility?
     */
    public boolean isEncrypted(String data) {
        if (data == null || data.isEmpty()) {
            return false;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(data);
            // Must contain at least IV + 1 byte ciphertext + auth tag (16 bytes)
            return decoded.length >= (GCM_IV_LENGTH + 1 + GCM_TAG_LENGTH / 8);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    // ── instance helpers (use the injected SecureRandom) ──────────────────

    private String doEncrypt(String plaintext, SecretKey key) {
        if (plaintext == null || plaintext.isEmpty()) {
            throw new IllegalArgumentException("Plaintext cannot be null or empty");
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(buffer.array());

        } catch (InvalidAlgorithmParameterException | InvalidKeyException | NoSuchAlgorithmException
                | BadPaddingException | IllegalBlockSizeException | NoSuchPaddingException e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    private String doDecrypt(String encryptedData, SecretKey key) {
        if (encryptedData == null || encryptedData.isEmpty()) {
            throw new IllegalArgumentException("Encrypted data cannot be null or empty");
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedData);
            ByteBuffer buffer = ByteBuffer.wrap(decoded);

            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);

        } catch (InvalidAlgorithmParameterException | InvalidKeyException | NoSuchAlgorithmException
                | BadPaddingException | IllegalBlockSizeException | NoSuchPaddingException e) {
            throw new RuntimeException("Decryption failed (data may be tampered)", e);
        }
    }

    // ── static helpers (for key-override path — no injected SecureRandom) ─

    private static String doEncryptStatic(String plaintext, SecretKey key) {
        if (plaintext == null || plaintext.isEmpty()) {
            throw new IllegalArgumentException("Plaintext cannot be null or empty");
        }
        try {
            SecureRandom random = new SecureRandom();
            byte[] iv = new byte[GCM_IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(buffer.array());

        } catch (InvalidAlgorithmParameterException | InvalidKeyException | NoSuchAlgorithmException
                | BadPaddingException | IllegalBlockSizeException | NoSuchPaddingException e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    private static String doDecryptStatic(String encryptedData, SecretKey key) {
        if (encryptedData == null || encryptedData.isEmpty()) {
            throw new IllegalArgumentException("Encrypted data cannot be null or empty");
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedData);
            ByteBuffer buffer = ByteBuffer.wrap(decoded);

            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);

        } catch (InvalidAlgorithmParameterException | InvalidKeyException | NoSuchAlgorithmException
                | BadPaddingException | IllegalBlockSizeException | NoSuchPaddingException e) {
            throw new RuntimeException("Decryption failed (data may be tampered)", e);
        }
    }

    private static void validateKeyOverride(String keyOverride) {
        if (keyOverride == null || keyOverride.length() != 32) {
            throw new IllegalArgumentException("Key override must be exactly 32 characters (256 bits)");
        }
    }
}
