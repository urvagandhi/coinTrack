package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.math.BigDecimal;
import java.util.Map;

import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ZerodhaMfTimelineEvent {
    private String eventId; // UUID
    private MfEventType eventType;
    private String eventDate; // ISO date (YYYY-MM-DD or ISO8601)
    private String eventTimestamp; // Precise time if available

    private String fund;
    private String tradingSymbol;

    private BigDecimal quantity;
    private BigDecimal amount;
    private BigDecimal nav;

    private String sipId;
    private String orderId;
    private String settlementId;

    private String source; // "SIP" | "ORDER" | "HOLDING"
    private String confidence; // "CONFIRMED" | "INFERRED"

    private String context; // Description/Note e.g. "Current State: PAUSED"
    private Map<String, Object> raw; // The source object raw data
}
