package com.urva.myfinance.coinTrack.goldsilver.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldSilverSummaryDTO {
    private BigDecimal totalInvested;
    private BigDecimal currentValue;
    private BigDecimal overallProfitLoss;
    private BigDecimal overallReturnPercent;
    
    private BigDecimal totalGoldInvestment;
    private BigDecimal totalSilverInvestment;
    private BigDecimal totalGoldWeight;
    private BigDecimal totalSilverWeight;
    
    private long activeInvestmentsCount;
    private long dueMaturedCount;
}
