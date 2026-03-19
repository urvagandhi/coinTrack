package com.urva.myfinance.coinTrack.broker.core.canonical;

/**
 * Canonical exchange enum — normalizes the various exchange name formats
 * across Zerodha ("NSE"), Angel One ("NSE"), and Upstox ("NSE_EQ", "NSE_FO").
 */
public enum Exchange {
    NSE,
    BSE,
    NFO,
    MCX,
    UNKNOWN
}
