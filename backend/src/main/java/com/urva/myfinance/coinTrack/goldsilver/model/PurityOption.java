package com.urva.myfinance.coinTrack.goldsilver.model;

import java.math.BigDecimal;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurityOption {
    private String id;
    
    private MetalType metalType;        // GOLD, SILVER
    
    private String label;                 // "24K (999)", "22K (916)", "925 Silver"
    
    private BigDecimal purityFactor;       // 0.999, 0.916, 0.750, 0.925 — fraction of pure metal
    
    private boolean isSystemDefault;        // true for standard options, false for user-added custom purities
}
