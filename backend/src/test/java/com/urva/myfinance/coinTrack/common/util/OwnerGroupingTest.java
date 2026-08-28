package com.urva.myfinance.coinTrack.common.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("OwnerGrouping - canonical owner-group key")
class OwnerGroupingTest {

    @Test
    @DisplayName("normalizes holder into the key")
    void normalizesHolder() {
        assertEquals("hdfc|Rahul Das", OwnerGrouping.groupKey("hdfc", "  RAHUL   DAS "));
        assertEquals("HDFC|Rahul Das", OwnerGrouping.groupKey("HDFC", "Rahul Das"));
    }

    @Test
    @DisplayName("blank place and holder fall back to Unknown")
    void blankFallsBackToUnknown() {
        assertEquals("Unknown|Unknown", OwnerGrouping.groupKey("  ", "   "));
        assertEquals("Unknown|Unknown", OwnerGrouping.groupKey(null, null));
        assertEquals("HDFC|Unknown", OwnerGrouping.groupKey("HDFC", null));
        assertEquals("Unknown|Rahul", OwnerGrouping.groupKey(null, "RAHUL"));
    }

    @Test
    @DisplayName("consistent key for same holder across modules (export == screen shape)")
    void consistentAcrossModules() {
        // Place/platform case is preserved; holder is canonicalized.
        assertEquals("Groww|Rahul Das", OwnerGrouping.groupKey("Groww", "rahul das"));
        assertEquals("Groww|Rahul Das", OwnerGrouping.groupKey("Groww", "RAHUL DAS"));
    }
}
