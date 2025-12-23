package com.urva.myfinance.coinTrack.broker.core.capability;

/**
 * Declares all possible broker capabilities.
 * Each BrokerAdapter declares its supported set via getCapabilities().
 * BrokerCapabilityChecker validates before any operation is attempted.
 *
 * Capability matrix:
 *   Capability            Zerodha  Angel One  Upstox
 *   EQUITY_HOLDINGS         Y         Y         Y
 *   INTRADAY_POSITIONS      Y         Y         Y
 *   FNO_POSITIONS           Y         Y         Y
 *   OVERNIGHT_POSITIONS     Y         Y         Y
 *   FUNDS                   Y         Y         Y
 *   MF_HOLDINGS             Y         N         N
 *   MF_ORDERS               Y         N         N
 *   MF_SIPS                 Y         N         N
 *   LIVE_QUOTES             Y         Y         Y
 *   ORDER_HISTORY           Y         Y         Y
 *   TRADE_HISTORY           Y         Y         Y
 */
public enum BrokerCapability {
    EQUITY_HOLDINGS,
    INTRADAY_POSITIONS,
    FNO_POSITIONS,
    OVERNIGHT_POSITIONS,
    FUNDS,
    MF_HOLDINGS,
    MF_ORDERS,
    MF_SIPS,
    LIVE_QUOTES,
    ORDER_HISTORY,
    TRADE_HISTORY
}
