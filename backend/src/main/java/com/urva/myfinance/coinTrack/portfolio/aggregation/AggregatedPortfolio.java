package com.urva.myfinance.coinTrack.portfolio.aggregation;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.model.Broker;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Result of a multi-broker parallel fetch and aggregation.
 *
 * Holdings from the same ISIN across different brokers are kept as SEPARATE
 * entries (different cost bases). They are NOT summed.
 */
public record AggregatedPortfolio(
    List<CanonicalHolding> holdings,
    List<CanonicalPosition> positions,
    Map<Broker, CanonicalFunds> funds,
    List<CanonicalMfHolding> mfHoldings,
    List<BrokerSyncError> syncErrors,
    Instant syncedAt,
    Set<Broker> staleBrokers
) {}
