package com.urva.myfinance.coinTrack.fixeddeposit.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrematureWithdrawalResponseDTO {

  private String fdId;
  private Long fdNo;
  private LocalDate withdrawalDate;

  private BigDecimal contractedRate;
  private BigDecimal applicableRate;
  private BigDecimal penaltyRate;
  private BigDecimal effectiveRate;

  private BigDecimal contractedMaturityAmount;
  private BigDecimal realizedMaturityAmount;
  private BigDecimal penaltyAmount;

  private long actualTenorDays;
  private BigDecimal interestEarned;
}
