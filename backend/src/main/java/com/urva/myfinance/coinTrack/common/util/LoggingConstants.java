package com.urva.myfinance.coinTrack.common.util;

/**
 * Centralized logging message patterns for consistency across the application.
 * Use these constants to maintain uniform log formatting.
 *
 * Pattern: [Context] Action - details
 *
 * All logs automatically include requestId via MDC.
 */
public final class LoggingConstants {

    private LoggingConstants() {
        // Utility class - no instantiation
    }

    // ============ Authentication ============
    public static final String AUTH_LOGIN_STARTED = "[Auth] Login attempt for user: {}";
    public static final String AUTH_LOGIN_SUCCESS = "[Auth] Login successful for user: {}";
    public static final String AUTH_LOGIN_FAILED = "[Auth] Login failed for user: {} - reason: {}";
    public static final String AUTH_TOKEN_VALIDATED = "[Auth] Token validated for user: {}";
    public static final String AUTH_TOKEN_INVALID = "[Auth] Invalid token: {}";
    public static final String AUTH_OTP_SENT = "[Auth] OTP sent to user: {} via: {}";
    public static final String AUTH_OTP_VERIFIED = "[Auth] OTP verified for user: {}";
    public static final String AUTH_OTP_FAILED = "[Auth] OTP verification failed for user: {}";

    // ============ User Operations ============
    public static final String USER_CREATED = "[User] Created user: {}";
    public static final String USER_UPDATED = "[User] Updated user: {}";
    public static final String USER_DELETED = "[User] Deleted user: {}";
    public static final String USER_NOT_FOUND = "[User] User not found: {}";
    public static final String USER_REGISTRATION_STARTED = "[User] Registration started for: {}";
    public static final String USER_REGISTRATION_COMPLETED = "[User] Registration completed for: {}";
    public static final String USER_PROFILE_UPDATED = "[User] Profile updated for user: {}";

    // ============ Broker Operations ============
    public static final String BROKER_CONNECT_STARTED = "[Broker] Connection initiated for {} - user: {}";
    public static final String BROKER_CONNECT_SUCCESS = "[Broker] Connected successfully to {} - user: {}";
    public static final String BROKER_CONNECT_FAILED = "[Broker] Connection failed for {} - user: {} - error: {}";
    public static final String BROKER_TOKEN_EXCHANGED = "[Broker] Token exchanged for {} - user: {}";
    public static final String BROKER_TOKEN_EXPIRED = "[Broker] Token expired for {} - user: {}";
    public static final String BROKER_CREDENTIALS_SAVED = "[Broker] Credentials saved for {} - user: {}";
    public static final String BROKER_API_CALL_STARTED = "[Broker] API call to {} - endpoint: {}";
    public static final String BROKER_API_CALL_SUCCESS = "[Broker] API call successful to {} - endpoint: {}";
    public static final String BROKER_API_CALL_FAILED = "[Broker] API call failed to {} - endpoint: {} - error: {}";

    // ============ Portfolio Sync ============
    public static final String SYNC_STARTED = "[Sync] Portfolio sync started for user: {}";
    public static final String SYNC_COMPLETED = "[Sync] Portfolio sync completed for user: {} - holdings: {}, positions: {}";
    public static final String SYNC_FAILED = "[Sync] Portfolio sync failed for user: {} - error: {}";
    public static final String SYNC_SKIPPED_LOCK = "[Sync] Sync skipped for user: {} - reason: lock already held";
    public static final String SYNC_SKIPPED_STALE = "[Sync] Sync skipped - data is not stale (last sync: {})";
    public static final String SYNC_MARKET_HOURS = "[Sync] Market hours sync triggered";
    public static final String SYNC_OFF_HOURS = "[Sync] Off-hours sync triggered";

    // ============ Market Data ============
    public static final String MARKET_PRICE_FETCHED = "[Market] Price fetched for symbol: {}";
    public static final String MARKET_DATA_UNAVAILABLE = "[Market] Price unavailable for symbol: {}";

    // ============ Request Lifecycle ============
    public static final String REQUEST_STARTED = "[Request] {} {} started";
    public static final String REQUEST_COMPLETED = "[Request] {} {} completed in {}ms";

    // ============ MDC Keys ============
    public static final String MDC_REQUEST_ID = "requestId";
    public static final String MDC_USER_ID = "userId";
    public static final String MDC_BROKER = "broker";
}
