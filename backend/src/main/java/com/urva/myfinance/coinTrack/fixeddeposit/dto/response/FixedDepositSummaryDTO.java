package com.urva.myfinance.coinTrack.fixeddeposit.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedDepositSummaryDTO {

    private BigDecimal totalInvestment;
    private BigDecimal totalActiveInvestment;
    private BigDecimal totalExpectedMaturity;
    private BigDecimal totalEstimatedReturns;
    private long activeCount;
    private long dueAndMaturedCount;
}
