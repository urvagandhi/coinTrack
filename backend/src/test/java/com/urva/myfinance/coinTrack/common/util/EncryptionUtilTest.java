package com.urva.myfinance.coinTrack.common.util;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.common.config.EncryptionConfig;

class EncryptionUtilTest {

    private static final String TEST_KEY = "abcdefghijklmnopqrstuvwxyz012345";
    private static final String HEX_KEY = "6162636465666768696a6b6c6d6e6f707172737475767778797a303132333435";

    private EncryptionUtil encryptionUtil;

    @BeforeEach
    void setUp() {
        EncryptionConfig config = new EncryptionConfig() {
            @Override
            public String getSecretKey() {
                return TEST_KEY;
            }
        };
        encryptionUtil = new EncryptionUtil(config);
    }

    @Test
    @DisplayName("1. Encrypt then decrypt returns original plaintext")
    void encryptDecrypt_RoundTrip_ReturnsOriginal() {
        String plaintext = "Hello, coinTrack!";
        String encrypted = encryptionUtil.encrypt(plaintext);
        assertNotNull(encrypted);
        assertNotEquals(plaintext, encrypted);

        String decrypted = encryptionUtil.decrypt(encrypted);
        assertEquals(plaintext, decrypted);
    }

    @Test
    @DisplayName("2. Encrypt null throws IllegalArgumentException")
    void encrypt_Null_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> encryptionUtil.encrypt(null));
    }

    @Test
    @DisplayName("3. Encrypt empty string throws IllegalArgumentException")
    void encrypt_Empty_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> encryptionUtil.encrypt(""));
    }

    @Test
    @DisplayName("4. Decrypt null throws IllegalArgumentException")
    void decrypt_Null_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> encryptionUtil.decrypt(null));
    }

    @Test
    @DisplayName("5. Decrypt empty string throws IllegalArgumentException")
    void decrypt_Empty_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> encryptionUtil.decrypt(""));
    }

    @Test
    @DisplayName("6. Decrypt garbage data throws RuntimeException")
    void decrypt_GarbageData_ThrowsException() {
        assertThrows(RuntimeException.class, () -> encryptionUtil.decrypt("not-valid-base64!!"));
    }

    @Test
    @DisplayName("7. isEncrypted returns true for valid ciphertext")
    void isEncrypted_ValidCiphertext_ReturnsTrue() {
        String encrypted = encryptionUtil.encrypt("test");
        assertTrue(encryptionUtil.isEncrypted(encrypted));
    }

    @Test
    @DisplayName("8. isEncrypted returns false for plaintext")
    void isEncrypted_Plaintext_ReturnsFalse() {
        assertFalse(encryptionUtil.isEncrypted("just plain text"));
    }

    @Test
    @DisplayName("9. isEncrypted returns false for null")
    void isEncrypted_Null_ReturnsFalse() {
        assertFalse(encryptionUtil.isEncrypted(null));
    }

    @Test
    @DisplayName("10. isEncrypted returns false for empty string")
    void isEncrypted_Empty_ReturnsFalse() {
        assertFalse(encryptionUtil.isEncrypted(""));
    }

    @Test
    @DisplayName("11. isEncrypted returns false for invalid Base64")
    void isEncrypted_InvalidBase64_ReturnsFalse() {
        assertFalse(encryptionUtil.isEncrypted("!!!invalid-base64!!!"));
    }

    @Test
    @DisplayName("12. decryptSafe returns null for null input")
    void decryptSafe_Null_ReturnsNull() {
        assertNull(encryptionUtil.decryptSafe(null));
    }

    @Test
    @DisplayName("13. decryptSafe returns empty for empty input")
    void decryptSafe_Empty_ReturnsEmpty() {
        assertEquals("", encryptionUtil.decryptSafe(""));
    }

    @Test
    @DisplayName("14. decryptSafe returns plaintext if not encrypted")
    void decryptSafe_Plaintext_ReturnsPlaintext() {
        String plaintext = "my-secret-password";
        assertEquals(plaintext, encryptionUtil.decryptSafe(plaintext));
    }

    @Test
    @DisplayName("15. decryptSafe round-trip works")
    void decryptSafe_Encrypted_ReturnsOriginal() {
        String original = "sensitive-data-123";
        String encrypted = encryptionUtil.encrypt(original);
        assertEquals(original, encryptionUtil.decryptSafe(encrypted));
    }

    @Test
    @DisplayName("16. Static encrypt/decrypt with 32-char key override")
    void staticEncryptDecrypt_WithKeyOverride_RoundTrips() {
        String plaintext = "per-entity-secret";
        String encrypted = EncryptionUtil.encrypt(plaintext, TEST_KEY);
        String decrypted = EncryptionUtil.decrypt(encrypted, TEST_KEY);
        assertEquals(plaintext, decrypted);
    }

    @Test
    @DisplayName("17. Static encrypt with null key override throws")
    void staticEncrypt_NullKey_Throws() {
        assertThrows(IllegalArgumentException.class,
                () -> EncryptionUtil.encrypt("data", null));
    }

    @Test
    @DisplayName("18. Static encrypt with blank key override throws")
    void staticEncrypt_BlankKey_Throws() {
        assertThrows(IllegalArgumentException.class,
                () -> EncryptionUtil.encrypt("data", "   "));
    }

    @Test
    @DisplayName("19. Static encrypt with wrong-length key throws")
    void staticEncrypt_WrongLengthKey_Throws() {
        assertThrows(IllegalArgumentException.class,
                () -> EncryptionUtil.encrypt("data", "short"));
    }

    @Test
    @DisplayName("20. Static decrypt with hex key override round-trips")
    void staticEncryptDecrypt_WithHexKey_RoundTrips() {
        String plaintext = "hex-key-data";
        String encrypted = EncryptionUtil.encrypt(plaintext, HEX_KEY);
        String decrypted = EncryptionUtil.decrypt(encrypted, HEX_KEY);
        assertEquals(plaintext, decrypted);
    }

    @Test
    @DisplayName("21. Encrypt same plaintext twice produces different ciphertext (random IV)")
    void encrypt_SamePlaintext_DifferentCiphertext() {
        String plaintext = "same-content";
        String enc1 = encryptionUtil.encrypt(plaintext);
        String enc2 = encryptionUtil.encrypt(plaintext);
        assertNotEquals(enc1, enc2);
    }

    @Test
    @DisplayName("22. Encrypt/decrypt with unicode characters")
    void encryptDecrypt_Unicode_RoundTrips() {
        String plaintext = "Hello 123 test";
        String encrypted = encryptionUtil.encrypt(plaintext);
        assertEquals(plaintext, encryptionUtil.decrypt(encrypted));
    }

    @Test
    @DisplayName("23. Encrypt/decrypt with very long string")
    void encryptDecrypt_LongString_RoundTrips() {
        String plaintext = "A".repeat(10000);
        String encrypted = encryptionUtil.encrypt(plaintext);
        assertEquals(plaintext, encryptionUtil.decrypt(encrypted));
    }

    @Test
    @DisplayName("24. Static encrypt null plaintext throws")
    void staticEncrypt_NullPlaintext_Throws() {
        assertThrows(IllegalArgumentException.class,
                () -> EncryptionUtil.encrypt(null, TEST_KEY));
    }

    @Test
    @DisplayName("25. Static decrypt null ciphertext throws")
    void staticDecrypt_NullCiphertext_Throws() {
        assertThrows(IllegalArgumentException.class,
                () -> EncryptionUtil.decrypt(null, TEST_KEY));
    }

    @Test
    @DisplayName("26. Cross-key decryption fails")
    void crossKeyDecryption_Fails() {
        String otherKey = "ZYXWVUTSRQPONMLKJIHGFEDCBA987654";
        String encrypted = EncryptionUtil.encrypt("secret", TEST_KEY);
        assertThrows(RuntimeException.class,
                () -> EncryptionUtil.decrypt(encrypted, otherKey));
    }

    @Test
    @DisplayName("27. decryptSafe with garbled ciphertext returns original data gracefully")
    void decryptSafe_GarbledData_ReturnsOriginalData() {
        String garbled = "this-is-not-valid-base64-ciphertext!!";
        String result = encryptionUtil.decryptSafe(garbled);
        assertEquals(garbled, result);
    }
}
