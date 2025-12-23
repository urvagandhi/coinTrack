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
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Canonical position — broker-agnostic representation for intraday, delivery, and F&O positions.
 *
 * Zerodha: buy_quantity, sell_quantity, net_quantity are separate fields.
 *   net_quantity < 0 → positionType = SHORT.
 * Angel One: netqty, buyavgprice, sellavgprice are all Strings — parsed via PriceNormalizer.
 * Upstox: day positions and overnight positions come from separate API calls — merged by mapper.
 *   sell quantity is negative integer (e.g. -5 for 5 shares sold).
 */
@Document(collection = "canonical_positions")
@CompoundIndexes({
    @CompoundIndex(name = "idx_position_unique", def = "{'userId': 1, 'brokerAccountId': 1, 'symbol': 1, 'instrumentType': 1}", unique = true)
})
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CanonicalPosition {

    @Id
    private String id;

    private String userId;

    private String brokerAccountId;

    private Broker brokerType;

    /** Canonical format: "EXCHANGE:SYMBOL" */
    private String symbol;

    private Exchange exchange;

    private InstrumentType instrumentType;

    private PositionType positionType;

    /** Current net quantity. */
    private BigDecimal quantity;

    /** Overnight quantity — Upstox provides separately. Default 0 for others. */
    @Builder.Default
    private BigDecimal overnightQty = BigDecimal.ZERO;

    private BigDecimal avgBuyPrice;

    /** Nullable — not all brokers provide sell average. */
    private BigDecimal avgSellPrice;

    private BigDecimal lastPrice;

    private BigDecimal realizedPnL;

    private BigDecimal unrealizedPnL;

    /** realizedPnL + unrealizedPnL */
    private BigDecimal totalPnL;

    /** Lot size for F&O, 1 for equity. */
    @Builder.Default
    private int multiplier = 1;

    /** Previous day close price. */
    private BigDecimal closePrice;

    private Instant lastSyncedAt;

    private DataSource dataSource;
}
