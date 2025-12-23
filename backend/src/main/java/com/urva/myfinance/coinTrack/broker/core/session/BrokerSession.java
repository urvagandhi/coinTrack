package com.urva.myfinance.coinTrack.broker.core.session;

import com.urva.myfinance.coinTrack.broker.model.Broker;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Immutable session record for a broker connection.
 *
 * Token lifecycles vary significantly across Indian brokers:
 * - Zerodha: expires ~6:00 AM IST daily, no refresh token
 * - Angel One: ~24 hours with refresh capability
 * - Upstox: end-of-trading-day, no refresh token (daily re-auth)
 *
 * isExpiringSoon() returns true at T-1 hour before expiry so the system
 * can proactively warn users via NotificationService.
 */
public record BrokerSession(
    String accountId,
    Broker brokerType,
    String accessToken,
    Instant expiresAt,
    Map<String, String> metadata
) {
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isExpiringSoon() {
        return Instant.now().isAfter(expiresAt.minus(Duration.ofHours(1)));
    }
}
