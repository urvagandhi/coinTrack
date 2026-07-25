package com.urva.myfinance.coinTrack.goldsilver.dto.request;

import java.math.BigDecimal;

import com.urva.myfinance.coinTrack.goldsilver.model.RateSource;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateModeUpdateRequestDTO {

    @NotNull(message = "Rate source mode is required")
    private RateSource rateSource;

    // Optional manual rate if switching to MANUAL mode
    private BigDecimal manualRate;
}
