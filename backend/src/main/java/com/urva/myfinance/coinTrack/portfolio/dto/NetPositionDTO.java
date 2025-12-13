package com.urva.myfinance.coinTrack.portfolio.dto;

import java.math.BigDecimal;
import java.util.Map;

import com.urva.myfinance.coinTrack.broker.model.Broker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetPositionDTO {
    private String symbol;
    private Map<Broker, Integer> brokerQuantityMap;
    private int totalQuantity;
    private BigDecimal averageBuyPrice;
    private BigDecimal currentPrice;
    private BigDecimal previousClose;
    private BigDecimal investedValue;
    private BigDecimal currentValue;
    private BigDecimal unrealizedPL;
    private BigDecimal dayGain;
    private BigDecimal dayGainPercent;

    // Derivative Fields (Job 11)
    private boolean isDerivative;
    private String instrumentType; // FUTURES, OPTIONS
    private BigDecimal strikePrice;
    private String optionType; // CE, PE
    private java.time.LocalDate expiryDate;
    private BigDecimal mtmPL;
    private Integer lotSize;
    private Integer netLots;
    private BigDecimal fnoDayGain;
    private BigDecimal fnoDayGainPercent;
}
