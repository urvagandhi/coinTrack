package com.urva.myfinance.coinTrack.portfolio.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.urva.myfinance.coinTrack.broker.model.Broker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "cached_positions")
@CompoundIndex(name = "user_symbol_idx", def = "{'userId': 1, 'symbol': 1}")
public class CachedPosition {
    @Id
    private String id;

    private String userId;

    private Broker broker;

    private String symbol;

    private BigDecimal quantity;

    private BigDecimal buyPrice;

    private PositionType positionType;

    // Zerodha P&L Fields
    private BigDecimal mtm; // Day M2M
    private BigDecimal pnl; // Unrealized P&L
    private BigDecimal realized; // Realized P&L

    private LocalDateTime lastUpdated;

    private String checksumHash;
}
