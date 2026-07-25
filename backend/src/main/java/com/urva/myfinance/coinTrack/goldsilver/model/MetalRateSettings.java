package com.urva.myfinance.coinTrack.goldsilver.model;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "metal_rate_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetalRateSettings {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private BigDecimal goldLocalPremiumPercent;
    private BigDecimal silverLocalPremiumPercent;
    private Instant updatedAt;
}
