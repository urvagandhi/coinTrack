package com.urva.myfinance.coinTrack.Util;

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

import com.urva.myfinance.coinTrack.Config.EncryptionConfig;

/**
 * Utility class for encrypting and decrypting sensitive data using AES-256-GCM.
 * 
 * AES-GCM provides both confidentiality and authenticity, preventing tampering.
 * Each encryption uses a unique random IV (Initialization Vector).
 * 
 * Encrypted format: [IV (12 bytes)][Encrypted Data][Auth Tag (16 bytes)]
 * 
 * @author coinTrack Team
 * @version 1.0
 * @since 2025-01-06
 */
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits recommended for GCM
    private static final int GCM_TAG_LENGTH = 128; // 128 bits authentication tag

    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    public EncryptionUtil(EncryptionConfig encryptionConfig) {
        String keyString = encryptionConfig.getSecretKey();
        byte[] keyBytes = keyString.getBytes(StandardCharsets.UTF_8);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        this.secureRandom = new SecureRandom();
    }

    /**
     * Encrypt plaintext using AES-256-GCM.
     * 
     * @param plaintext The text to encrypt
     * @return Base64-encoded encrypted data with IV prepended
     * @throws RuntimeException if encryption fails
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            throw new IllegalArgumentException("Plaintext cannot be null or empty");
        }

        try {
            // Generate random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            // Encrypt the plaintext
            byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);
            byte[] ciphertext = cipher.doFinal(plaintextBytes);

            // Combine IV + ciphertext (which includes auth tag)
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            // Return Base64-encoded result
            return Base64.getEncoder().encodeToString(byteBuffer.array());

        } catch (InvalidAlgorithmParameterException | InvalidKeyException | NoSuchAlgorithmException
                | BadPaddingException | IllegalBlockSizeException | NoSuchPaddingException e) {
            throw new RuntimeException("Encryption failed: " + e.getMessage(), e);
        }
    }

    /**
     * Decrypt Base64-encoded ciphertext using AES-256-GCM.
     * 
     * @param encryptedData Base64-encoded encrypted data with IV prepended
     * @return Decrypted plaintext
     * @throws RuntimeException if decryption fails or data is tampered
     */
    public String decrypt(String encryptedData) {
        if (encryptedData == null || encryptedData.isEmpty()) {
            throw new IllegalArgumentException("Encrypted data cannot be null or empty");
        }

        try {
            // Decode Base64
            byte[] decoded = Base64.getDecoder().decode(encryptedData);

            // Extract IV and ciphertext
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            // Initialize cipher for decryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            // Decrypt and verify authentication
            byte[] plaintextBytes = cipher.doFinal(ciphertext);

            return new String(plaintextBytes, StandardCharsets.UTF_8);

        } catch (InvalidAlgorithmParameterException | InvalidKeyException | NoSuchAlgorithmException
                | BadPaddingException | IllegalBlockSizeException | NoSuchPaddingException e) {
            throw new RuntimeException("Decryption failed (data may be tampered): " + e.getMessage(), e);
        }
    }

    /**
     * Check if a string appears to be encrypted (Base64 format with sufficient
     * length).
     * 
     * @param data The data to check
     * @return true if data appears to be encrypted
     */
    public boolean isEncrypted(String data) {
        if (data == null || data.isEmpty()) {
            return false;
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(data);
            // Encrypted data should have at least IV + some ciphertext + auth tag
            return decoded.length >= (GCM_IV_LENGTH + 1 + GCM_TAG_LENGTH / 8);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
