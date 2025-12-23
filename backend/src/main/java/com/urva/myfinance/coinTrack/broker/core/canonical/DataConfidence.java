package com.urva.myfinance.coinTrack.broker.core.canonical;

/**
 * Indicates trust level of the data in a canonical model.
 *
 * LOW when: ISIN is missing, avgBuyPrice == 0 (CDSL transfer),
 * broker signals corporate action pending, or ISIN format is invalid.
 */
public enum DataConfidence {
    HIGH,
    LOW
}
