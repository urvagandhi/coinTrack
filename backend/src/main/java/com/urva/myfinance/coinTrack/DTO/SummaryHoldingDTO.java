package com.urva.myfinance.coinTrack.DTO;

import java.math.BigDecimal;

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
    private String broker; // Zerodha, Upstox, etc.
    private String type; // HOLDING or POSITION

    private int quantity;

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
}
