package com.urva.myfinance.coinTrack.broker.core.canonical;

/**
 * Canonical position direction — derived from net quantity sign.
 * Zerodha: net_quantity < 0 → SHORT.
 * Angel One: netqty (String) parsed, then same logic.
 * Upstox: quantity can be negative for sells.
 */
public enum PositionType {
    LONG,
    SHORT
}
