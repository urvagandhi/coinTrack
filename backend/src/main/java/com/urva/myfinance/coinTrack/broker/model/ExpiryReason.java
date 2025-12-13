package com.urva.myfinance.coinTrack.broker.model;

/**
 * Reasons why a broker token has expired or become invalid.
 * Used for token lifecycle management and determining required user action.
 */
public enum ExpiryReason {
    NONE, // Token is valid
    ACCESS_TOKEN_EXPIRED, // Token past expiry time (e.g., 6 AM IST for Zerodha)
    TOKEN_INVALID, // Token rejected by broker API as invalid
    BROKER_SESSION_INVALID, // Broker session terminated
    USER_REVOKED, // User revoked access
    API_FAILURE // Unable to validate due to API error
}
