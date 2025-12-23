package com.urva.myfinance.coinTrack.portfolio.aggregation;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability;
import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapabilityChecker;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerApiDownException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerAuthException;
import com.urva.myfinance.coinTrack.broker.core.exception.BrokerRateLimitException;
import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerSession;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.registry.BrokerAdapterRegistry;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * The ONLY class that directly uses BrokerAdapter. Portfolio service layer
 * calls only this class. portfolio/ never imports from broker/adapters/.
 *
 * Algorithm:
 * 1. Load all BrokerAccounts for userId
 * 2. Filter: active, not expired
 * 3. Build BrokerSession from each account
 * 4. Check BrokerCapabilityChecker before each call
 * 5. Launch ALL fetches IN PARALLEL using virtual threads
 * 6. Per-broker error handling with fallback to cached data
 * 7. Merge results (same ISIN in 2 brokers = SEPARATE entries)
 * 8. Return AggregatedPortfolio
 */
@Service
public class PortfolioAggregationService {

    private static final Logger log = LoggerFactory.getLogger(PortfolioAggregationService.class);
    private static final long TIMEOUT_SECONDS = 30;

    private final BrokerAdapterRegistry adapterRegistry;
    private final BrokerCapabilityChecker capabilityChecker;
    private final BrokerAccountRepository brokerAccountRepository;

    public PortfolioAggregationService(BrokerAdapterRegistry adapterRegistry,
                                       BrokerCapabilityChecker capabilityChecker,
                                       BrokerAccountRepository brokerAccountRepository) {
        this.adapterRegistry = adapterRegistry;
        this.capabilityChecker = capabilityChecker;
        this.brokerAccountRepository = brokerAccountRepository;
    }

    /**
     * Aggregates portfolio data from all connected broker accounts for a user.
     * Uses Java 21 virtual threads for parallel execution.
     */
    public AggregatedPortfolio aggregateForUser(String userId) {
        // 1. Load all broker accounts
        List<BrokerAccount> accounts = brokerAccountRepository.findByUserId(userId);

        // 2. Filter: active and not expired
        List<BrokerAccount> activeAccounts = accounts.stream()
            .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
            .filter(a -> a.hasCredentials())
            .filter(a -> !Boolean.TRUE.equals(a.isTokenExpired()))
            .toList();

        if (activeAccounts.isEmpty()) {
            log.info("No active broker accounts for user {}", userId);
            return new AggregatedPortfolio(
                Collections.emptyList(), Collections.emptyList(),
                Collections.emptyMap(), Collections.emptyList(),
                Collections.emptyList(), Instant.now(), Collections.emptySet()
            );
        }

        // Shared result containers (thread-safe via synchronized lists)
        List<CanonicalHolding> allHoldings = Collections.synchronizedList(new ArrayList<>());
        List<CanonicalPosition> allPositions = Collections.synchronizedList(new ArrayList<>());
        Map<Broker, CanonicalFunds> allFunds = Collections.synchronizedMap(new EnumMap<>(Broker.class));
        List<CanonicalMfHolding> allMfHoldings = Collections.synchronizedList(new ArrayList<>());
        List<BrokerSyncError> syncErrors = Collections.synchronizedList(new ArrayList<>());
        Set<Broker> staleBrokers = Collections.synchronizedSet(new HashSet<>());

        // 5. Launch ALL broker fetches IN PARALLEL using virtual threads
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<Void>> allFutures = new ArrayList<>();

            for (BrokerAccount account : activeAccounts) {
                Broker brokerType = account.getBroker();

                if (!adapterRegistry.hasAdapter(brokerType)) {
                    log.warn("No adapter for broker {}, skipping account {}", brokerType, account.getId());
                    continue;
                }

                BrokerAdapter adapter = adapterRegistry.getAdapter(brokerType);

                // 3. Build session from account
                BrokerSession session = buildSessionFromAccount(account);
                if (session == null || session.isExpired()) {
                    syncErrors.add(new BrokerSyncError(
                        brokerType, account.getId(),
                        BrokerSyncError.SyncErrorType.AUTH_EXPIRED,
                        "Session expired for " + brokerType, false));
                    continue;
                }

                // Holdings
                if (capabilityChecker.supports(adapter, BrokerCapability.EQUITY_HOLDINGS)) {
                    allFutures.add(
                        adapter.fetchHoldings(session)
                            .thenAccept(allHoldings::addAll)
                            .exceptionally(ex -> handleBrokerError(ex, brokerType, account.getId(),
                                "holdings", syncErrors, staleBrokers))
                    );
                }

                // Positions
                if (capabilityChecker.supports(adapter, BrokerCapability.INTRADAY_POSITIONS)) {
                    allFutures.add(
                        adapter.fetchPositions(session)
                            .thenAccept(allPositions::addAll)
                            .exceptionally(ex -> handleBrokerError(ex, brokerType, account.getId(),
                                "positions", syncErrors, staleBrokers))
                    );
                }

                // Funds
                if (capabilityChecker.supports(adapter, BrokerCapability.FUNDS)) {
                    allFutures.add(
                        adapter.fetchFunds(session)
                            .thenAccept(funds -> allFunds.put(brokerType, funds))
                            .exceptionally(ex -> handleBrokerError(ex, brokerType, account.getId(),
                                "funds", syncErrors, staleBrokers))
                    );
                }

                // MF Holdings (Zerodha only currently)
                if (capabilityChecker.supports(adapter, BrokerCapability.MF_HOLDINGS)) {
                    allFutures.add(
                        adapter.fetchMfHoldings(session)
                            .thenAccept(allMfHoldings::addAll)
                            .exceptionally(ex -> handleBrokerError(ex, brokerType, account.getId(),
                                "mfHoldings", syncErrors, staleBrokers))
                    );
                }
            }

            // Wait for all with timeout
            try {
                CompletableFuture.allOf(allFutures.toArray(new CompletableFuture[0]))
                    .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("Some broker fetches timed out or failed for user {}: {}", userId, e.getMessage());
            }
        }

        // 9. Return aggregated result
        return new AggregatedPortfolio(
            allHoldings, allPositions, allFunds, allMfHoldings,
            syncErrors, Instant.now(), staleBrokers
        );
    }

    /**
     * Builds a BrokerSession from existing BrokerAccount credentials.
     */
    private BrokerSession buildSessionFromAccount(BrokerAccount account) {
        try {
            Broker broker = account.getBroker();
            String accessToken;
            Instant expiresAt;

            switch (broker) {
                case ZERODHA -> {
                    String apiKey = account.getZerodhaApiKey();
                    accessToken = apiKey + ":" + account.getZerodhaAccessToken();
                    expiresAt = account.getZerodhaTokenExpiresAt() != null
                        ? account.getZerodhaTokenExpiresAt().atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant()
                        : Instant.now().plusSeconds(3600);
                }
                case ANGELONE, UPSTOX -> {
                    accessToken = account.getAccessToken();
                    expiresAt = account.getTokenExpiresAt() != null
                        ? account.getTokenExpiresAt().atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant()
                        : Instant.now().plusSeconds(3600);
                }
                default -> {
                    return null;
                }
            }

            if (accessToken == null) return null;

            return new BrokerSession(
                account.getId(),
                broker,
                accessToken,
                expiresAt,
                Map.of()
            );
        } catch (Exception e) {
            log.error("Failed to build session for account {}: {}", account.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * Per-broker error handling:
     * - BrokerAuthException → mark account EXPIRED, notify user
     * - BrokerRateLimitException → mark stale, use cached data
     * - BrokerApiDownException → mark stale
     * - Other → log ERROR, exclude broker
     */
    private Void handleBrokerError(Throwable ex, Broker brokerType, String accountId,
                                    String dataType, List<BrokerSyncError> syncErrors,
                                    Set<Broker> staleBrokers) {
        Throwable cause = ex.getCause() != null ? ex.getCause() : ex;

        if (cause instanceof BrokerAuthException) {
            log.warn("{} auth expired for account {}", brokerType, accountId);
            syncErrors.add(new BrokerSyncError(
                brokerType, accountId,
                BrokerSyncError.SyncErrorType.AUTH_EXPIRED,
                brokerType + " session expired. Please reconnect.",
                false
            ));
            // Mark account as expired
            brokerAccountRepository.findById(accountId).ifPresent(account -> {
                account.setIsActive(false);
                brokerAccountRepository.save(account);
            });
        } else if (cause instanceof BrokerRateLimitException) {
            log.warn("{} rate limited for account {} while fetching {}", brokerType, accountId, dataType);
            staleBrokers.add(brokerType);
            syncErrors.add(new BrokerSyncError(
                brokerType, accountId,
                BrokerSyncError.SyncErrorType.RATE_LIMITED,
                brokerType + " rate limited. Using cached data.",
                true
            ));

        } else if (cause instanceof BrokerApiDownException) {
            log.warn("{} API down for account {} while fetching {}", brokerType, accountId, dataType);
            staleBrokers.add(brokerType);
            syncErrors.add(new BrokerSyncError(
                brokerType, accountId,
                BrokerSyncError.SyncErrorType.API_DOWN,
                brokerType + " API is temporarily unavailable.",
                true
            ));

        } else {
            log.error("Unexpected error from {} for account {} fetching {}: {}",
                brokerType, accountId, dataType, cause.getMessage(), cause);
            syncErrors.add(new BrokerSyncError(
                brokerType, accountId,
                BrokerSyncError.SyncErrorType.UNKNOWN,
                "Unexpected error from " + brokerType + ": " + cause.getMessage(),
                false
            ));
        }

        return null;
    }
}
