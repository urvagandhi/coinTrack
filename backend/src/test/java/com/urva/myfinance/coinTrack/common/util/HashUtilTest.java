package com.urva.myfinance.coinTrack.common.util;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class HashUtilTest {

    @Test
    @DisplayName("1. SHA-256 hash of known input returns expected hex")
    void sha256_KnownInput_ReturnsExpectedHex() {
        String hash = HashUtil.sha256("hello");
        assertNotNull(hash);
        assertEquals(64, hash.length());
        assertEquals("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", hash);
    }

    @Test
    @DisplayName("2. SHA-256 of empty string returns valid hash")
    void sha256_EmptyString_ReturnsValidHash() {
        String hash = HashUtil.sha256("");
        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    @DisplayName("3. SHA-256 of null returns null")
    void sha256_Null_ReturnsNull() {
        assertNull(HashUtil.sha256(null));
    }

    @Test
    @DisplayName("4. SHA-256 is deterministic — same input produces same hash")
    void sha256_Deterministic_SameInputSameHash() {
        String hash1 = HashUtil.sha256("coinTrack");
        String hash2 = HashUtil.sha256("coinTrack");
        assertEquals(hash1, hash2);
    }

    @Test
    @DisplayName("5. SHA-256 produces different hashes for different inputs")
    void sha256_DifferentInputs_DifferentHashes() {
        String hash1 = HashUtil.sha256("abc");
        String hash2 = HashUtil.sha256("def");
        assertNotEquals(hash1, hash2);
    }

    @Test
    @DisplayName("6. SHA-256 output contains only lowercase hex characters")
    void sha256_OutputOnlyHexCharacters() {
        String hash = HashUtil.sha256("test-input-12345");
        assertTrue(hash.matches("[0-9a-f]{64}"));
    }

    @Test
    @DisplayName("7. SHA-256 of long string works correctly")
    void sha256_LongString_HashesCorrectly() {
        String longInput = "A".repeat(10000);
        String hash = HashUtil.sha256(longInput);
        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    @DisplayName("8. SHA-256 of unicode characters hashes correctly")
    void sha256_Unicode_HashesCorrectly() {
        String hash = HashUtil.sha256("नमस्ते");
        assertNotNull(hash);
        assertEquals(64, hash.length());
        assertTrue(hash.matches("[0-9a-f]{64}"));
    }

    @Test
    @DisplayName("9. SHA-256 of special characters hashes correctly")
    void sha256_SpecialChars_HashesCorrectly() {
        String hash = HashUtil.sha256("!@#$%^&*()_+-={}[]|\\:\";<>?,./");
        assertNotNull(hash);
        assertEquals(64, hash.length());
    }
}
