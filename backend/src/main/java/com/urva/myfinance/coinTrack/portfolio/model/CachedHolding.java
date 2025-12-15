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
@Document(collection = "cached_holdings")
@CompoundIndex(name = "user_symbol_idx", def = "{'userId': 1, 'symbol': 1}")
public class CachedHolding {
    @Id
    private String id;

    private String userId;

    private Broker broker;

    private String symbol;

    private String exchange;

    private BigDecimal quantity;

    private BigDecimal averageBuyPrice;

    // Zerodha specific fields
    private Long instrumentToken;
    private String product;
    private BigDecimal lastPrice;
    private BigDecimal closePrice;
    private BigDecimal pnl;
    private BigDecimal dayChange;
    private BigDecimal dayChangePercentage;
    private BigDecimal usedQuantity;
    private BigDecimal t1Quantity;
    private BigDecimal realisedQuantity;
    private BigDecimal openingQuantity;
    private BigDecimal shortQuantity;
    private BigDecimal collateralQuantity;
    private BigDecimal authorisedQuantity;
    private String authorisedDate;

    private String apiVersion;

    private LocalDateTime lastUpdated;

    private String checksumHash;
}
