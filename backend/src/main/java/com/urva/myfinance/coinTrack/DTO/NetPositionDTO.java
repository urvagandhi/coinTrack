package com.urva.myfinance.coinTrack.DTO;

import java.math.BigDecimal;
import java.util.Map;

import com.urva.myfinance.coinTrack.Model.Broker;

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
}
