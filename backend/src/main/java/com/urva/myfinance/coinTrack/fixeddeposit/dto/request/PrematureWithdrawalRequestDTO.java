package com.urva.myfinance.coinTrack.fixeddeposit.dto.request;

import jakarta.validation.constraints.NotNull;
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
public class PrematureWithdrawalRequestDTO {

  @NotNull(message = "Withdrawal date is required")
  private LocalDate withdrawalDate;

  private BigDecimal penaltyRateOverride;

  private String bankName;
}
