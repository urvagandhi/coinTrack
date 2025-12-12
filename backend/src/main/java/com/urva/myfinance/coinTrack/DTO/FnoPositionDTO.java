package com.urva.myfinance.coinTrack.DTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FnoPositionDTO {
    private String id; // CachedPosition.id
    private String userId;
    private String broker;
    private String symbol;
    private int quantity; // positive long, negative short
    private BigDecimal buyPrice;
    private FnoDetailsDTO fnoDetails;
    private LocalDateTime lastUpdated;
    private BigDecimal currentLtp;
    private BigDecimal currentNotional; // currentLtp * qty * contractMultiplier
    private BigDecimal investedNotional; // buyPrice * qty * contractMultiplier
    private BigDecimal mtm; // currentNotional - investedNotional
    private BigDecimal dayGain; // (currentLtp - prevClose) * qty * contractMultiplier
}
