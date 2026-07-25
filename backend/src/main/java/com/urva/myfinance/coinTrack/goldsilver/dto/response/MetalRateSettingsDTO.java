package com.urva.myfinance.coinTrack.goldsilver.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetalRateSettingsDTO {
    private String id;
    private String userId;

    @DecimalMin(value = "0.0", message = "Gold local premium percent must be at least 0")
    private BigDecimal goldLocalPremiumPercent;

    @DecimalMin(value = "0.0", message = "Silver local premium percent must be at least 0")
    private BigDecimal silverLocalPremiumPercent;

    private Instant updatedAt;
}
