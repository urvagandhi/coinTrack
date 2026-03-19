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
 * Canonical MF order — tracks mutual fund buy/sell order history.
 * Currently only Zerodha provides MF orders in this system.
 */
@Document(collection = "canonical_mf_orders")
@CompoundIndexes({
    @CompoundIndex(name = "idx_mf_order_unique", def = "{'userId': 1, 'brokerAccountId': 1, 'orderId': 1}", unique = true)
})
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CanonicalMfOrder {

    @Id
    private String id;

    private String userId;

    private String brokerAccountId;

    private Broker brokerType;

    private String orderId;

    private String fund;

    private String tradingSymbol;

    private String isin;

    private String transactionType;

    private BigDecimal amount;

    private String status;

    private BigDecimal executedQuantity;

    private BigDecimal executedNav;

    private String folio;

    private Instant orderTimestamp;

    private Instant executionDate;

    private Instant lastSyncedAt;
}
