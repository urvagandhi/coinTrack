package com.urva.myfinance.coinTrack.broker.core.canonical;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Canonical equity holding — broker-agnostic representation persisted in MongoDB.
 *
 * Compound unique index on (userId, brokerAccountId, isin) ensures one entry
 * per stock per broker account. ISIN is the primary dedup key across brokers.
 *
 * Indian broker quirks handled by mappers before data reaches this model:
 * - Zerodha: average_price can be 0.0 for CDSL transfers → dataConfidence = LOW
 * - Angel One: all numeric fields arrive as Strings → parsed by PriceNormalizer
 * - Upstox: prices are floats → converted via Float.toString() to avoid precision loss
 */
@Document(collection = "canonical_holdings")
@CompoundIndexes({
    @CompoundIndex(name = "idx_holding_unique", def = "{'userId': 1, 'brokerAccountId': 1, 'isin': 1}", unique = true),
    @CompoundIndex(name = "idx_holding_user", def = "{'userId': 1}"),
    @CompoundIndex(name = "idx_holding_sync", def = "{'lastSyncedAt': -1}")
})
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CanonicalHolding {

    @Id
    private String id;

    private String userId;

    private String brokerAccountId;

    private Broker brokerType;

    /** Primary dedup key. Starts with "INE" for equity. If null, fallback to symbol + dataConfidence=LOW. */
    private String isin;

    /** Canonical format: "EXCHANGE:SYMBOL" e.g. "NSE:RELIANCE". Via SymbolNormalizer. */
    private String symbol;

    private Exchange exchange;

    /** Always BigDecimal — int quantities are converted by mappers. */
    private BigDecimal quantity;

    /** Unsettled shares (T+1). Default 0 if broker doesn't provide. */
    @Builder.Default
    private BigDecimal t1Quantity = BigDecimal.ZERO;

    /** Average buy price, scale=2. If 0.0 → dataConfidence=LOW (possible CDSL transfer). */
    private BigDecimal avgBuyPrice;

    /** Last traded price / current market price, scale=2. */
    private BigDecimal currentPrice;

    /** Computed: quantity * avgBuyPrice */
    private BigDecimal investedValue;

    /** Computed: quantity * currentPrice */
    private BigDecimal currentValue;

    /** Unrealized P&L. Note: Angel One's "profitandloss" is realized+unrealized combined. */
    private BigDecimal unrealizedPnL;

    /** (unrealizedPnL / investedValue) * 100. Null if investedValue == 0. */
    private BigDecimal unrealizedPnLPct;

    /** Nullable — Zerodha provides, Angel One and Upstox do not for holdings. */
    private BigDecimal dayChange;

    /** Nullable — same availability as dayChange. */
    private BigDecimal dayChangePct;

    private DataConfidence dataConfidence;

    @Indexed
    private Instant lastSyncedAt;

    private DataSource dataSource;
}
