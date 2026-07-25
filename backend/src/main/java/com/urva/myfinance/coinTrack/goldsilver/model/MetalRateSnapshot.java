package com.urva.myfinance.coinTrack.goldsilver.model;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "metal_rate_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetalRateSnapshot {
    @Id
    private String id;
    
    private MetalType metalType;
    
    private BigDecimal baseRatePerGram;    // 24K gold / 999 silver spot, converted to INR, BEFORE local premium
    
    private BigDecimal localPremiumPercent; // applied on top
    
    private BigDecimal effectiveBaseRate;    // baseRatePerGram * (1 + localPremiumPercent/100)
    
    private String source;                    // "GoldAPI.io" etc.
    
    private Instant fetchedAt;
    
    private boolean isStale;                    // true if fetch failed and this is a carried-forward cached value
}
