package com.urva.myfinance.coinTrack.portfolio.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSummaryResponse {

    // Aggregate Totals
    private BigDecimal totalCurrentValue;
    private BigDecimal totalInvestedValue;
    private BigDecimal totalUnrealizedPL;

    private BigDecimal totalDayGain;
    private BigDecimal totalDayGainPercent;

    // Sync Timestamps
    private LocalDateTime lastHoldingsSync;
    private LocalDateTime lastPositionsSync;
    private LocalDateTime lastAnySync;

    // Detailed List
    private List<SummaryHoldingDTO> holdingsList;
    private List<SummaryPositionDTO> positionsList;

    // Metadata
    private String type;
    private List<String> source;

    // Guardrail Metadata
    private boolean containsDerivatives;
    private Boolean dayGainPercentApplicable; // Nullable if not computed
}
