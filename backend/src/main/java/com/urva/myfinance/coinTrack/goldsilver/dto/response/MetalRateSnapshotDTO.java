package com.urva.myfinance.coinTrack.goldsilver.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetalRateSnapshotDTO {
    private String id;
    private MetalType metalType;
    private BigDecimal baseRatePerGram;
    private BigDecimal localPremiumPercent;
    private BigDecimal effectiveBaseRate;
    private String source;
    private Instant fetchedAt;
    private boolean isStale;
}
