package com.urva.myfinance.coinTrack.broker.core.port;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfOrder;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability;
import com.urva.myfinance.coinTrack.broker.core.exception.UnsupportedBrokerOperationException;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerCredentials;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerSession;
import com.urva.myfinance.coinTrack.broker.model.Broker;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

import static com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability.*;

/**
 * Port interface for broker integrations — replaces the old BrokerService.
 *
 * Design pattern: Hexagonal Architecture (Ports & Adapters).
 * The portfolio module depends only on this interface and canonical models.
 * Each broker provides an adapter implementation in broker/adapters/{name}/.
 *
 * All fetch methods return CompletableFuture for parallel execution
 * via Java 21 virtual threads in the aggregation layer.
 *
 * Default implementations throw UnsupportedBrokerOperationException,
 * so adapters only override capabilities they actually support.
 * BrokerCapabilityChecker validates before calling any method.
 */
public interface BrokerAdapter {

    Broker getBrokerType();

    Set<BrokerCapability> getCapabilities();

    // ── Auth ──────────────────────────────────────────────────────

    CompletableFuture<BrokerSession> authenticate(BrokerCredentials credentials);

    CompletableFuture<BrokerSession> refreshSession(BrokerSession session);

    boolean isSessionValid(BrokerSession session);

    // ── Holdings — capability: EQUITY_HOLDINGS ───────────────────

    default CompletableFuture<List<CanonicalHolding>> fetchHoldings(BrokerSession session) {
        throw new UnsupportedBrokerOperationException(getBrokerType(), EQUITY_HOLDINGS);
    }

    // ── Positions — capability: INTRADAY_POSITIONS + FNO_POSITIONS

    default CompletableFuture<List<CanonicalPosition>> fetchPositions(BrokerSession session) {
        throw new UnsupportedBrokerOperationException(getBrokerType(), INTRADAY_POSITIONS);
    }

    // ── Funds — capability: FUNDS ────────────────────────────────

    default CompletableFuture<CanonicalFunds> fetchFunds(BrokerSession session) {
        throw new UnsupportedBrokerOperationException(getBrokerType(), FUNDS);
    }

    // ── MF Holdings — capability: MF_HOLDINGS (Zerodha only) ────

    default CompletableFuture<List<CanonicalMfHolding>> fetchMfHoldings(BrokerSession session) {
        throw new UnsupportedBrokerOperationException(getBrokerType(), MF_HOLDINGS);
    }

    // ── MF Orders — capability: MF_ORDERS ────────────────────────

    default CompletableFuture<List<CanonicalMfOrder>> fetchMfOrders(BrokerSession session) {
        throw new UnsupportedBrokerOperationException(getBrokerType(), MF_ORDERS);
    }
}
