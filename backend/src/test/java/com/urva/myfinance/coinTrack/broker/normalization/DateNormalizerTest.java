package com.urva.myfinance.coinTrack.broker.normalization;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.broker.model.Broker;

class DateNormalizerTest {

    @Test
    @DisplayName("1. Null value returns null")
    void toInstant_Null_ReturnsNull() {
        assertNull(DateNormalizer.toInstant(null, Broker.ZERODHA));
    }

    @Test
    @DisplayName("2. Instant passed through directly")
    void toInstant_Instant_PassedThrough() {
        Instant now = Instant.now();
        assertEquals(now, DateNormalizer.toInstant(now, Broker.ZERODHA));
    }

    @Test
    @DisplayName("3. Long epoch millis converted to Instant")
    void toInstant_LongEpochMillis_Converted() {
        long epochMs = 1700000000000L;
        Instant result = DateNormalizer.toInstant(epochMs, Broker.ZERODHA);
        assertEquals(Instant.ofEpochMilli(epochMs), result);
    }

    @Test
    @DisplayName("4. ZonedDateTime converted to Instant")
    void toInstant_ZonedDateTime_Converted() {
        ZonedDateTime zdt = ZonedDateTime.of(2026, 1, 15, 10, 30, 0, 0, ZoneId.of("Asia/Kolkata"));
        Instant result = DateNormalizer.toInstant(zdt, Broker.ZERODHA);
        assertEquals(zdt.toInstant(), result);
    }

    @Test
    @DisplayName("5. LocalDateTime converted to Instant via IST")
    void toInstant_LocalDateTime_ConvertedViaIst() {
        LocalDateTime ldt = LocalDateTime.of(2026, 6, 15, 14, 30);
        Instant result = DateNormalizer.toInstant(ldt, Broker.ZERODHA);
        Instant expected = ldt.atZone(ZoneId.of("Asia/Kolkata")).toInstant();
        assertEquals(expected, result);
    }

    @Test
    @DisplayName("6. Zerodha ISO offset date-time string parsed")
    void toInstant_ZerodhaIsoString_Parsed() {
        String isoDate = "2026-03-15T10:30:00+05:30";
        Instant result = DateNormalizer.toInstant(isoDate, Broker.ZERODHA);
        assertNotNull(result);
    }

    @Test
    @DisplayName("7. Angel One dd-MM-yyyy HH:mm format parsed")
    void toInstant_AngelOneFormat_Parsed() {
        String angelDate = "15-03-2026 14:30";
        Instant result = DateNormalizer.toInstant(angelDate, Broker.ANGELONE);
        assertNotNull(result);
    }

    @Test
    @DisplayName("8. Upstox epoch millis string parsed")
    void toInstant_UpstoxEpochString_Parsed() {
        long epochMs = 1700000000000L;
        Instant result = DateNormalizer.toInstant(String.valueOf(epochMs), Broker.UPSTOX);
        assertEquals(Instant.ofEpochMilli(epochMs), result);
    }

    @Test
    @DisplayName("9. Upstox ISO string parsed")
    void toInstant_UpstoxIsoString_Parsed() {
        String isoDate = "2026-03-15T10:30:00Z";
        Instant result = DateNormalizer.toInstant(isoDate, Broker.UPSTOX);
        assertNotNull(result);
    }

    @Test
    @DisplayName("10. Empty string returns null")
    void toInstant_EmptyString_ReturnsNull() {
        assertNull(DateNormalizer.toInstant("  ", Broker.ZERODHA));
    }

    @Test
    @DisplayName("11. Invalid string returns null")
    void toInstant_InvalidString_ReturnsNull() {
        assertNull(DateNormalizer.toInstant("not-a-date", Broker.ZERODHA));
    }

    @Test
    @DisplayName("12. AngelOne invalid date returns null")
    void toAngelOneInvalidDate_ReturnsNull() {
        assertNull(DateNormalizer.toInstant("invalid-angel", Broker.ANGELONE));
    }

    @Test
    @DisplayName("13. Upstox non-numeric non-ISO string returns null")
    void toInstant_UpstoxInvalid_ReturnsNull() {
        assertNull(DateNormalizer.toInstant("not-a-number", Broker.UPSTOX));
    }

    @Test
    @DisplayName("14. Unknown type returns null")
    void toInstant_UnknownType_ReturnsNull() {
        assertNull(DateNormalizer.toInstant(3.14, Broker.ZERODHA));
    }

    @Test
    @DisplayName("15. AngelOne ISO format fallback works")
    void toInstant_AngelOneIsoFallback_Parsed() {
        String isoDate = "2026-03-15T10:30:00Z";
        Instant result = DateNormalizer.toInstant(isoDate, Broker.ANGELONE);
        assertNotNull(result);
    }
}
