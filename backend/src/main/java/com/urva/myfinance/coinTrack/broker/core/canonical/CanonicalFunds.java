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
 * Canonical funds / margin snapshot — broker-agnostic.
 *
 * Zerodha: equity segment → available.cash, utilised.debits. Commodity segment may be null.
 * Angel One: net (String), availablecash (String), utilisedamount (String). All strings.
 * Upstox: used_margin, available_margin inside fund.equity sub-object.
 */
@Document(collection = "canonical_funds")
@CompoundIndexes({
    @CompoundIndex(name = "idx_funds_unique", def = "{'userId': 1, 'brokerAccountId': 1}", unique = true)
})
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CanonicalFunds {

    @Id
    private String id;

    private String userId;

    private String brokerAccountId;

    private Broker brokerType;

    /** Cash available for trading. */
    private BigDecimal availableCash;

    /** Margin currently utilised. */
    private BigDecimal usedMargin;

    /** Total margin limit. */
    private BigDecimal totalMargin;

    /** Pledged collateral — nullable, not all brokers provide. */
    private BigDecimal collateral;

    /** Opening balance — nullable. */
    private BigDecimal openingBalance;

    private Instant lastSyncedAt;
}
