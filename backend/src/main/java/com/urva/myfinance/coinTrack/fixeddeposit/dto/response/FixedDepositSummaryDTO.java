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
  private BigDecimal
      totalReturns; // All returns (active + due + matured + pre_matured if applicable)

  private BigDecimal totalActiveInvestment;
  private BigDecimal totalEstimatedReturns;

  private BigDecimal totalDueInvestment;
  private BigDecimal totalDueReturns;

  private BigDecimal totalMaturedInvestment;
  private BigDecimal totalMaturedReturns;

  private long activeCount;
  private long dueAndMaturedCount;

  // [DEPRECATED-TDS] TDS totals are DISABLED. The getSummary() service no longer computes or
  // populates these fields (see FixedDepositServiceImpl.getSummary). Kept commented for reference.
  // Re-enabling TDS requires restoring these fields AND the bank-level TDS accumulation block in
  // FixedDepositServiceImpl.getSummary().
  // private BigDecimal totalTdsDeducted;
  // private BigDecimal totalNetReturns;
}
