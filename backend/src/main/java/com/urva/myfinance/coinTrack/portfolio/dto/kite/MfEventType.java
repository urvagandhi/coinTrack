package com.urva.myfinance.coinTrack.portfolio.dto.kite;

public enum MfEventType {
    // ORDER FACTS (timestamped)
    BUY_EXECUTED,
    SELL_EXECUTED,
    NAV_APPLIED,
    UNITS_ALLOTTED,
    REDEMPTION_COMPLETED,

    // SIP FACTS (timestamped)
    SIP_CREATED,
    SIP_EXECUTION_SCHEDULED, // Only if future

    // SIP STATE SNAPSHOT (not historical)
    SIP_STATUS_ACTIVE,
    SIP_STATUS_PAUSED,
    SIP_STATUS_CANCELLED,

    // HOLDING FACTS (inferred)
    HOLDING_APPEARED,
    HOLDING_INCREASED,
    HOLDING_REDUCED
}
