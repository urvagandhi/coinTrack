package com.urva.myfinance.coinTrack.portfolio.dto;

import java.math.BigDecimal;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryHoldingDTO {
    private String symbol;
    private String exchange;
    private String broker; // Zerodha, Upstox, etc.
    private String type; // HOLDING or POSITION

    private BigDecimal quantity;

    // Average Buy Price (Cached)
    private BigDecimal averageBuyPrice;

    // Live Market Data
    private BigDecimal currentPrice;
    private BigDecimal previousClose;

    // Computed Values
    private BigDecimal currentValue;
    private BigDecimal investedValue;
    private BigDecimal unrealizedPL;

    private BigDecimal dayGain;
    private BigDecimal dayGainPercent;

    // Raw/Broker specific metadata
    private Map<String, Object> raw;
}
