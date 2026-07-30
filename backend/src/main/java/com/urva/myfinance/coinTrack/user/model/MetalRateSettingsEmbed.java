package com.urva.myfinance.coinTrack.user.model;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embedded Metal Rate settings stored directly inside the User document.
 * No separate MongoDB collection — eliminates the metal_rate_settings collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetalRateSettingsEmbed {

    private BigDecimal goldLocalPremiumPercent;
    private BigDecimal silverLocalPremiumPercent;

    private Instant updatedAt;
}
