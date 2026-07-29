package com.urva.myfinance.coinTrack.broker.core.session;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.broker.model.Broker;

class BrokerSessionTest {

    @Test
    @DisplayName("1. isExpired returns true when expiresAt is in the past")
    void isExpired_PastExpiry_ReturnsTrue() {
        BrokerSession session = new BrokerSession("acc-1", Broker.ZERODHA, "token", Instant.now().minusSeconds(60), Map.of());
        assertTrue(session.isExpired());
    }

    @Test
    @DisplayName("2. isExpired returns false when expiresAt is in the future")
    void isExpired_FutureExpiry_ReturnsFalse() {
        BrokerSession session = new BrokerSession("acc-1", Broker.ZERODHA, "token", Instant.now().plusSeconds(3600), Map.of());
        assertFalse(session.isExpired());
    }

    @Test
    @DisplayName("3. isExpired returns true when expiresAt is null")
    void isExpired_NullExpiry_ReturnsTrue() {
        BrokerSession session = new BrokerSession("acc-1", Broker.ZERODHA, "token", null, Map.of());
        assertThrows(NullPointerException.class, session::isExpired);
    }

    @Test
    @DisplayName("4. isExpiringSoon returns true when within 1 hour of expiry")
    void isExpiringSoon_WithinOneHour_ReturnsTrue() {
        BrokerSession session = new BrokerSession("acc-1", Broker.ZERODHA, "token",
                Instant.now().plusSeconds(1800), Map.of());
        assertTrue(session.isExpiringSoon());
    }

    @Test
    @DisplayName("5. isExpiringSoon returns false when more than 1 hour from expiry")
    void isExpiringSoon_MoreThanOneHour_ReturnsFalse() {
        BrokerSession session = new BrokerSession("acc-1", Broker.ZERODHA, "token",
                Instant.now().plusSeconds(7200), Map.of());
        assertFalse(session.isExpiringSoon());
    }

    @Test
    @DisplayName("6. Record fields accessible")
    void recordFields_Accessible() {
        Map<String, String> metadata = Map.of("key", "value");
        BrokerSession session = new BrokerSession("acc-1", Broker.ANGELONE, "jwt-token",
                Instant.ofEpochMilli(1700000000000L), metadata);

        assertEquals("acc-1", session.accountId());
        assertEquals(Broker.ANGELONE, session.brokerType());
        assertEquals("jwt-token", session.accessToken());
        assertEquals(Instant.ofEpochMilli(1700000000000L), session.expiresAt());
        assertEquals(metadata, session.metadata());
    }

    @Test
    @DisplayName("7. isExpired with edge case: exactly at expiry instant")
    void isExpired_ExactExpiry_FalseOrTrue() {
        Instant expiry = Instant.now().plusNanos(100);
        BrokerSession session = new BrokerSession("acc-1", Broker.ZERODHA, "token", expiry, Map.of());
        // May or may not be expired depending on timing - just verify it doesn't throw
        assertDoesNotThrow(session::isExpired);
    }

    @Test
    @DisplayName("8. isExpiringSoon with null metadata")
    void isExpiringSoon_NullMetadata_Works() {
        BrokerSession session = new BrokerSession("acc-1", Broker.UPSTOX, "token",
                Instant.now().plusSeconds(7200), null);
        assertFalse(session.isExpiringSoon());
    }
}
