package com.urva.myfinance.coinTrack.portfolio.aggregation;

import com.urva.myfinance.coinTrack.broker.model.Broker;

/**
 * Records a per-broker sync failure for user-facing error reporting.
 */
public record BrokerSyncError(
    Broker brokerType,
    String accountId,
    SyncErrorType errorType,
    String humanMessage,
    boolean retryable
) {
    public enum SyncErrorType {
        AUTH_EXPIRED,
        RATE_LIMITED,
        API_DOWN,
        UNKNOWN
    }
}
