package com.urva.myfinance.coinTrack.goldsilver.dto.request;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketRateUpdateRequestDTO {

  @NotNull(message = "Metal type is required")
  private MetalType metalType;

  @NotNull(message = "New rate is required")
  @DecimalMin(value = "0.0", inclusive = false, message = "New rate must be greater than 0")
  private BigDecimal newRate;

  private boolean includeMatured;
}
