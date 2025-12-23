package com.urva.myfinance.coinTrack.broker.core.canonical;

/**
 * Indicates the freshness of a canonical model's data.
 */
public enum DataSource {
    /** Freshly fetched from broker API */
    LIVE,
    /** Loaded from MongoDB cache, still within acceptable TTL */
    CACHED,
    /** Cache data older than acceptable TTL — broker may be down or rate-limited */
    STALE
}
