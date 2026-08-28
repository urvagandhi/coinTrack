package com.urva.myfinance.coinTrack.common.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("HolderName - canonical holder-name normalization")
class HolderNameTest {

    @Test
    @DisplayName("null preserved")
    void null_preserved() {
        assertNull(HolderName.normalize(null));
    }

    @Test
    @DisplayName("blank preserved (caller decides fallback)")
    void blank_preserved() {
        assertEquals("", HolderName.normalize("   "));
    }

    @Test
    @DisplayName("single token: trim + title-case")
    void singleToken_titleCased() {
        assertEquals("Rahul", HolderName.normalize("  rahul "));
        assertEquals("Rahul", HolderName.normalize("RAHUL"));
    }

    @Test
    @DisplayName("multi token: collapse whitespace + title-case each token")
    void multiToken_titleCasedEach() {
        assertEquals("Rahul Das", HolderName.normalize("  rahul   das "));
        assertEquals("Rahul Das", HolderName.normalize("RAHUL DAS"));
        assertEquals("Rahul Das", HolderName.normalize("Rahul DAS"));
    }

    @Test
    @DisplayName("punctuation within a token (hyphen, apostrophe) left intact and deterministic")
    void punctuationPreservedInsideToken() {
        assertEquals("Kumar-das", HolderName.normalize("kumar-das"));
        assertEquals("O'brien", HolderName.normalize("O'BRIEN"));
    }

    @Test
    @DisplayName("symmetric token set: variants collapse to one canonical form")
    void variantsCollapseToCanonical() {
        String expected = "Rahul Das";
        assertEquals(expected, HolderName.normalize("RAHUL DAS"));
        assertEquals(expected, HolderName.normalize("Rahul Das"));
        assertEquals(expected, HolderName.normalize("  rahul   das"));
        assertEquals(expected, HolderName.normalize("rahul DAS"));
    }
}
