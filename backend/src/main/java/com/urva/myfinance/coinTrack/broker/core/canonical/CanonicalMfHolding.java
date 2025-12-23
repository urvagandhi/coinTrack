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
 * Canonical mutual fund holding — currently only Zerodha provides MF data.
 *
 * ISIN must start with "INF" for mutual funds — validated on ingest.
 * Upstox BrokerCapability set must NOT include MF_HOLDINGS.
 */
@Document(collection = "canonical_mf_holdings")
@CompoundIndexes({
    @CompoundIndex(name = "idx_mf_holding_unique", def = "{'userId': 1, 'brokerAccountId': 1, 'isin': 1}", unique = true)
})
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CanonicalMfHolding {

    @Id
    private String id;

    private String userId;

    private String brokerAccountId;

    private Broker brokerType;

    /** Must start with "INF" for mutual funds. */
    private String isin;

    private String fundName;

    /** Nullable — not all responses include AMC name. */
    private String amcName;

    private BigDecimal units;

    /** Average purchase NAV. */
    private BigDecimal avgNav;

    private BigDecimal currentNav;

    /** Computed: units * avgNav */
    private BigDecimal investedValue;

    /** Computed: units * currentNav */
    private BigDecimal currentValue;

    private BigDecimal unrealizedPnL;

    private BigDecimal unrealizedPnLPct;

    private Instant lastSyncedAt;
}
