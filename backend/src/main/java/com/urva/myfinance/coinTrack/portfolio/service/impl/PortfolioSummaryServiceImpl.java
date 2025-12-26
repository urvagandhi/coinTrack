package com.urva.myfinance.coinTrack.portfolio.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.portfolio.dto.PortfolioSummaryResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.SummaryHoldingDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfInstrumentDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;
import com.urva.myfinance.coinTrack.portfolio.model.SyncStatus;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.portfolio.service.PortfolioSummaryService;

/**
 * Orchestrator — delegates to HoldingEnricher, PositionEnricher, PortfolioTotalsCalculator.
 * Reduced from 953 lines to ~120 lines of orchestration + MF pass-through methods.
 *
 * Changed: Extracted P&L computation into HoldingEnricher, PositionEnricher, PortfolioTotalsCalculator.
 * Added hasStalePrices flag to response.
 */
@Service
public class PortfolioSummaryServiceImpl implements PortfolioSummaryService {

    private static final Logger log = LoggerFactory.getLogger(PortfolioSummaryServiceImpl.class);

    private final CanonicalHoldingRepository holdingRepository;
    private final CanonicalPositionRepository positionRepository;
    private final SyncLogRepository syncLogRepository;
    private final MarketDataService marketDataService;
    private final HoldingEnricher holdingEnricher;
    private final PositionEnricher positionEnricher;
    private final PortfolioTotalsCalculator totalsCalculator;
    private final com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository brokerAccountRepository;
    private final com.urva.myfinance.coinTrack.broker.service.ZerodhaLiveDataService zerodhaLiveDataService;
    private final com.urva.myfinance.coinTrack.portfolio.repository.CanonicalFundsRepository canonicalFundsRepository;
    private final com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfOrderRepository canonicalMfOrderRepository;

    @Autowired
    public PortfolioSummaryServiceImpl(CanonicalHoldingRepository holdingRepository,
            CanonicalPositionRepository positionRepository,
            SyncLogRepository syncLogRepository,
            MarketDataService marketDataService,
            HoldingEnricher holdingEnricher,
            PositionEnricher positionEnricher,
            PortfolioTotalsCalculator totalsCalculator,
            com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository brokerAccountRepository,
            com.urva.myfinance.coinTrack.broker.service.ZerodhaLiveDataService zerodhaLiveDataService,
            com.urva.myfinance.coinTrack.portfolio.repository.CanonicalFundsRepository canonicalFundsRepository,
            com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfOrderRepository canonicalMfOrderRepository) {
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.syncLogRepository = syncLogRepository;
        this.marketDataService = marketDataService;
        this.holdingEnricher = holdingEnricher;
        this.positionEnricher = positionEnricher;
        this.totalsCalculator = totalsCalculator;
        this.brokerAccountRepository = brokerAccountRepository;
        this.zerodhaLiveDataService = zerodhaLiveDataService;
        this.canonicalFundsRepository = canonicalFundsRepository;
        this.canonicalMfOrderRepository = canonicalMfOrderRepository;
    }

    @Override
    public PortfolioSummaryResponse getPortfolioSummary(String userId) {
        // 1. Load from MongoDB
        List<CanonicalHolding> holdings = holdingRepository.findByUserId(userId);
        List<CanonicalPosition> positions = positionRepository.findByUserId(userId);

        // 2. Collect symbols for batch market data
        Set<String> allSymbols = new HashSet<>();
        holdings.forEach(h -> allSymbols.add(h.getSymbol()));

        // 3. Batch fetch market prices (real Zerodha LTP now, not stub)
        Map<String, MarketPrice> priceMap = marketDataService.getPrices(new ArrayList<>(allSymbols));

        // 4. Detect stale prices
        boolean hasStalePrices = priceMap.values().stream()
                .anyMatch(mp -> mp.getUpdatedAt() != null
                        && java.time.Duration.between(mp.getUpdatedAt(), LocalDateTime.now()).getSeconds() > 60);

        // 5. Enrich holdings + compute totals
        List<SummaryHoldingDTO> enrichedHoldings = holdingEnricher.enrich(holdings, priceMap);
        PortfolioTotalsCalculator.PortfolioTotals totals = totalsCalculator.calculate(enrichedHoldings);

        // 6. Enrich positions (separate from totals)
        List<SummaryPositionDTO> enrichedPositions = positionEnricher.enrich(positions);
        boolean containsDerivatives = positionEnricher.containsDerivatives(positions);

        // 7. Sort by value DESC
        enrichedHoldings.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));
        enrichedPositions.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));

        // 8. Sync timestamp
        LocalDateTime latestSync = getLatestSyncTime(userId);

        return PortfolioSummaryResponse.builder()
                .totalCurrentValue(totals.totalCurrentValue())
                .totalInvestedValue(totals.totalInvestedValue())
                .totalUnrealizedPL(totals.totalUnrealizedPL())
                .totalUnrealizedPLPercent(totals.totalUnrealizedPLPercent())
                .totalDayGain(totals.totalDayGain())
                .totalDayGainPercent(totals.totalDayGainPercent())
                .previousDayTotalValue(totals.previousDayTotal())
                .lastHoldingsSync(latestSync)
                .lastPositionsSync(latestSync)
                .lastAnySync(latestSync)
                .holdingsList(enrichedHoldings)
                .positionsList(enrichedPositions)
                .type("CUSTOM_AGGREGATE")
                .source(Collections.singletonList("ZERODHA"))
                .containsDerivatives(containsDerivatives)
                .dayGainPercentApplicable(true)
                .hasStalePrices(hasStalePrices)
                .build();
    }

    private LocalDateTime getLatestSyncTime(String userId) {
        Optional<SyncLog> lastLog = syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(userId,
                SyncStatus.SUCCESS);
        return lastLog.map(SyncLog::getTimestamp).orElse(null);
    }

    // ════════════════════════════════════════════════════════════════
    // KITE PASS-THROUGH METHODS (Zerodha-only, live fetch)
    // These stay here — they use ZerodhaLiveDataService directly
    // ════════════════════════════════════════════════════════════════

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> getOrders(
            String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> allOrders = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allOrders.addAll(zerodhaLiveDataService.fetchOrders(account));
                } catch (Exception e) {
                    log.warn("Failed to fetch orders: {}", e.getMessage());
                }
            }
        }

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(allOrders);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE");
        return response;
    }

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO> getTrades(
            String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO> allTrades = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allTrades.addAll(zerodhaLiveDataService.fetchTrades(account));
                } catch (Exception e) {
                    log.warn("Failed to fetch trades: {}", e.getMessage());
                }
            }
        }

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(allTrades);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE");
        return response;
    }

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO getFunds(String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO funds = zerodhaLiveDataService
                            .fetchFunds(account);
                    if (funds != null) {
                        funds.setLastSyncedAt(LocalDateTime.now());
                        funds.setSource("LIVE");

                        // Persist as CanonicalFunds
                        try {
                            var canonicalFunds = com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds.builder()
                                    .userId(userId)
                                    .brokerAccountId(account.getId())
                                    .brokerType(account.getBroker())
                                    .availableCash(funds.getEquity() != null && funds.getEquity().getAvailable() != null
                                            ? funds.getEquity().getAvailable().getCash() : BigDecimal.ZERO)
                                    .usedMargin(funds.getEquity() != null && funds.getEquity().getUtilised() != null
                                            ? funds.getEquity().getUtilised().getDebits() : BigDecimal.ZERO)
                                    .totalMargin(funds.getEquity() != null ? funds.getEquity().getNet() : BigDecimal.ZERO)
                                    .collateral(funds.getEquity() != null && funds.getEquity().getAvailable() != null
                                            ? funds.getEquity().getAvailable().getCollateral() : null)
                                    .openingBalance(funds.getEquity() != null && funds.getEquity().getAvailable() != null
                                            ? funds.getEquity().getAvailable().getOpeningBalance() : null)
                                    .lastSyncedAt(java.time.Instant.now())
                                    .build();

                            canonicalFundsRepository.findByUserIdAndBrokerType(userId, account.getBroker())
                                    .ifPresent(existing -> canonicalFunds.setId(existing.getId()));
                            canonicalFundsRepository.save(canonicalFunds);
                        } catch (Exception persistenceEx) {
                            log.warn("Failed to persist canonical funds: {}", persistenceEx.getMessage());
                        }
                    }
                    return funds;
                } catch (Exception e) {
                    log.warn("Failed to fetch funds: {}", e.getMessage());
                }
            }
        }
        return null;
    }

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO> getMutualFunds(
            String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO> allMf = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allMf.addAll(zerodhaLiveDataService.fetchMfHoldings(account));
                } catch (Exception e) {
                    log.warn("Failed to fetch MF holdings: {}", e.getMessage());
                }
            }
        }

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(allMf);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE");
        return response;
    }

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> getMfOrders(
            String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> allOrders = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> orders = zerodhaLiveDataService
                            .fetchMfOrders(account);
                    for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO order : orders) {
                        try {
                            var canonicalOrder = com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfOrder.builder()
                                    .userId(userId)
                                    .brokerAccountId(account.getId())
                                    .brokerType(account.getBroker())
                                    .orderId(order.getOrderId())
                                    .fund(order.getFund())
                                    .tradingSymbol(order.getTradingSymbol())
                                    .transactionType(order.getTransactionType())
                                    .amount(order.getAmount())
                                    .status(order.getStatus())
                                    .executedQuantity(order.getExecutedQuantity())
                                    .executedNav(order.getExecutedNav())
                                    .folio(order.getFolio())
                                    .lastSyncedAt(java.time.Instant.now())
                                    .build();

                            canonicalMfOrderRepository.findByUserIdAndBrokerAccountIdAndOrderId(
                                    userId, account.getId(), order.getOrderId())
                                    .ifPresent(existing -> canonicalOrder.setId(existing.getId()));
                            canonicalMfOrderRepository.save(canonicalOrder);
                        } catch (Exception persistenceEx) {
                            log.warn("Failed to persist canonical MF order: {}", persistenceEx.getMessage());
                        }
                        allOrders.add(order);
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch MF orders: {}", e.getMessage());
                }
            }
        }

        allOrders.sort(java.util.Comparator.comparing(
                com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO::getExecutionDate,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()))
                .thenComparing(
                        com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO::getOrderTimestamp,
                        java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(allOrders);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE");
        return response;
    }

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.UserProfileDTO getProfile(String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    var profile = zerodhaLiveDataService.fetchProfile(account);
                    if (profile != null) {
                        profile.setLastSynced(LocalDateTime.now().toString());
                    }
                    return profile;
                } catch (Exception e) {
                    log.warn("Failed to fetch profile: {}", e.getMessage());
                }
            }
        }
        return null;
    }

    @Override
    public KiteListResponse<MfSipDTO> getMfSips(String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<MfSipDTO> allSips = new ArrayList<>();
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> allOrders = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allSips.addAll(zerodhaLiveDataService.fetchMfSips(account));
                    allOrders.addAll(zerodhaLiveDataService.fetchMfOrders(account));
                } catch (Exception e) {
                    log.warn("Failed to fetch MF SIPs: {}", e.getMessage());
                }
            }
        }

        // Link orders to SIPs by instruction_id
        Map<String, List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO>> ordersBySipId = allOrders
                .stream()
                .filter(o -> o.getIsSip() && o.getRaw() != null && o.getRaw().get("instruction_id") != null)
                .collect(java.util.stream.Collectors.groupingBy(o -> o.getRaw().get("instruction_id").toString()));

        Set<String> linkedSipIds = new HashSet<>();
        for (MfSipDTO sip : allSips) {
            List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> executions = ordersBySipId
                    .getOrDefault(sip.getSipId(), new ArrayList<>());
            executions.sort((o1, o2) -> {
                String t1 = o1.getExecutionDate() != null ? o1.getExecutionDate() : o1.getOrderTimestamp();
                String t2 = o2.getExecutionDate() != null ? o2.getExecutionDate() : o2.getOrderTimestamp();
                if (t1 == null) return -1;
                if (t2 == null) return 1;
                return t1.compareTo(t2);
            });
            sip.setExecutions(executions);
            if (!executions.isEmpty()) linkedSipIds.add(sip.getSipId());
        }

        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> unlinkedOrders = new ArrayList<>();
        ordersBySipId.forEach((sipId, orders) -> {
            if (allSips.stream().noneMatch(s -> s.getSipId().equals(sipId))) {
                unlinkedOrders.addAll(orders);
            }
        });

        KiteListResponse<MfSipDTO> response = new KiteListResponse<>();
        response.setData(allSips);
        response.setUnlinkedSipOrders(unlinkedOrders);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE");
        return response;
    }

    @Override
    public KiteListResponse<MfInstrumentDTO> getMfInstruments(String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<MfInstrumentDTO> allInstruments = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allInstruments.addAll(zerodhaLiveDataService.fetchMfInstruments(account));
                    if (!allInstruments.isEmpty()) break;
                } catch (Exception e) {
                    log.warn("Failed to fetch MF instruments: {}", e.getMessage());
                }
            }
        }

        KiteListResponse<MfInstrumentDTO> response = new KiteListResponse<>();
        response.setData(allInstruments);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE");
        return response;
    }

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent> getMfTimeline(
            String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> allOrders = new ArrayList<>();
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO> allSips = new ArrayList<>();
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO> allHoldings = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allOrders.addAll(zerodhaLiveDataService.fetchMfOrders(account));
                    allSips.addAll(zerodhaLiveDataService.fetchMfSips(account));
                    allHoldings.addAll(zerodhaLiveDataService.fetchMfHoldings(account));
                } catch (Exception e) {
                    log.warn("Error fetching timeline data: {}", e.getMessage());
                }
            }
        }

        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent> events = new ArrayList<>();
        Map<String, com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO> sipMap = allSips.stream()
                .collect(java.util.stream.Collectors.toMap(
                        com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO::getSipId, s -> s, (s1, s2) -> s1));

        Map<String, BigDecimal> netOrderQtyMap = new java.util.HashMap<>();
        Map<String, BigDecimal> totalBuyQtyMap = new java.util.HashMap<>();

        // Process orders → events
        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO order : allOrders) {
            String ts = order.getTradingSymbol();
            BigDecimal qty = order.getExecutedQuantity() != null ? order.getExecutedQuantity() : BigDecimal.ZERO;

            if (qty.compareTo(BigDecimal.ZERO) > 0) {
                boolean isBuy = "BUY".equalsIgnoreCase(order.getTransactionType())
                        || "PURCHASE".equalsIgnoreCase(order.getTransactionType());
                boolean isSell = "SELL".equalsIgnoreCase(order.getTransactionType())
                        || "REDEEM".equalsIgnoreCase(order.getTransactionType());

                if (isBuy) {
                    netOrderQtyMap.merge(ts, qty, BigDecimal::add);
                    totalBuyQtyMap.merge(ts, qty, BigDecimal::add);
                } else if (isSell) {
                    netOrderQtyMap.merge(ts, qty.negate(), BigDecimal::add);
                }

                com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType eventType = null;
                if (isBuy && "COMPLETE".equalsIgnoreCase(order.getStatus())) {
                    eventType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.BUY_EXECUTED;
                } else if (isSell && "COMPLETE".equalsIgnoreCase(order.getStatus())) {
                    eventType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SELL_EXECUTED;
                }

                if (eventType != null) {
                    String eventDate = null;
                    if (order.getRaw() != null && order.getRaw().get("exchange_timestamp") != null) {
                        eventDate = order.getRaw().get("exchange_timestamp").toString();
                    } else if (order.getOrderTimestamp() != null) {
                        eventDate = order.getOrderTimestamp();
                    }

                    String sortDate = eventDate;
                    if (sortDate != null && sortDate.contains("T")) sortDate = sortDate.split("T")[0];
                    if (sortDate != null && sortDate.contains(" ")) sortDate = sortDate.split(" ")[0];

                    String linkedSipId = null;
                    if (order.getRaw() != null) {
                        if (order.getRaw().get("instruction_id") != null) {
                            linkedSipId = order.getRaw().get("instruction_id").toString();
                        } else if (order.getRaw().get("tag") != null) {
                            String tag = order.getRaw().get("tag").toString();
                            if (sipMap.containsKey(tag)) linkedSipId = tag;
                        }
                    }

                    events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                            .eventId("ord-" + order.getOrderId())
                            .eventType(eventType)
                            .eventDate(sortDate)
                            .eventTimestamp(eventDate)
                            .fund(order.getFund())
                            .tradingSymbol(ts)
                            .quantity(qty)
                            .amount(order.getAmount())
                            .nav(order.getExecutedNav())
                            .orderId(order.getOrderId())
                            .sipId(linkedSipId)
                            .source("ORDER")
                            .confidence("CONFIRMED")
                            .raw(order.getRaw())
                            .build());
                }
            }
        }

        // Process SIPs → events
        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO sip : allSips) {
            String ts = sip.getTradingSymbol();
            if (sip.getCreated() != null) {
                String date = sip.getCreated();
                String dateIso = (date.contains(" ")) ? date.split(" ")[0] : date;
                String status = sip.getStatus() != null ? sip.getStatus().toUpperCase() : "ACTIVE";

                events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                        .eventId("sip-create-" + sip.getSipId())
                        .eventType(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_CREATED)
                        .eventDate(dateIso)
                        .eventTimestamp(sip.getCreated())
                        .fund(sip.getFund())
                        .tradingSymbol(ts)
                        .amount(sip.getInstalmentAmount() != null ? BigDecimal.valueOf(sip.getInstalmentAmount()) : null)
                        .sipId(sip.getSipId())
                        .source("SIP_SETUP")
                        .confidence("CONFIRMED")
                        .context("Frequency: " + sip.getFrequency() + " • Status: " + status)
                        .raw(sip.getRaw())
                        .build());

                if (!"ACTIVE".equals(status)) {
                    com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType stateType = "PAUSED".equals(status)
                            ? com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_STATUS_PAUSED
                            : "CANCELLED".equals(status)
                                    ? com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_STATUS_CANCELLED
                                    : null;
                    if (stateType != null) {
                        events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                                .eventId("sip-state-" + sip.getSipId())
                                .eventType(stateType)
                                .eventDate(dateIso)
                                .fund(sip.getFund())
                                .tradingSymbol(ts)
                                .sipId(sip.getSipId())
                                .source("SIP_STATE")
                                .confidence("CONFIRMED")
                                .context("Current Status: " + status)
                                .raw(sip.getRaw())
                                .build());
                    }
                }
            }

            String nextDateRaw = sip.getNextInstalmentDate();
            if (nextDateRaw != null) {
                try {
                    String nextIso = nextDateRaw.contains(" ") ? nextDateRaw.split(" ")[0] : nextDateRaw;
                    java.time.LocalDate next = java.time.LocalDate.parse(nextIso);
                    if (next.isAfter(java.time.LocalDate.now())) {
                        events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                                .eventId("sip-sched-" + sip.getSipId())
                                .eventType(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_EXECUTION_SCHEDULED)
                                .eventDate(nextIso)
                                .fund(sip.getFund())
                                .tradingSymbol(ts)
                                .sipId(sip.getSipId())
                                .amount(sip.getInstalmentAmount() != null ? BigDecimal.valueOf(sip.getInstalmentAmount()) : null)
                                .source("SIP")
                                .confidence("CONFIRMED")
                                .context("Upcoming Instalment")
                                .raw(sip.getRaw())
                                .build());
                    }
                } catch (Exception ignored) {}
            }
        }

        // Process holdings → inferred events
        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO holding : allHoldings) {
            String ts = holding.getTradingSymbol();
            BigDecimal holdingQty = holding.getQuantity();
            BigDecimal netOrderQty = netOrderQtyMap.getOrDefault(ts, BigDecimal.ZERO);
            BigDecimal totalBuyQty = totalBuyQtyMap.getOrDefault(ts, BigDecimal.ZERO);
            BigDecimal diff = holdingQty.subtract(netOrderQty);
            BigDecimal threshold = new BigDecimal("0.001");

            if (diff.abs().compareTo(threshold) > 0) {
                com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType infType;
                String context;
                if (diff.compareTo(BigDecimal.ZERO) > 0) {
                    if (totalBuyQty.compareTo(BigDecimal.ZERO) == 0) {
                        infType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_APPEARED;
                        context = "Holding imported or pre-existing";
                    } else {
                        infType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_INCREASED;
                        context = "Unexplained quantity increase (Bonus/Dividend/Reinvestment)";
                    }
                } else {
                    infType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_REDUCED;
                    context = "Unexplained quantity reduction (External Sell)";
                }

                String authDate = null;
                if (holding.getRaw() != null && holding.getRaw().get("authorised_date") != null) {
                    String d = holding.getRaw().get("authorised_date").toString();
                    if (!d.isEmpty()) authDate = d;
                }
                if (authDate != null && authDate.contains(" ")) authDate = authDate.split(" ")[0];

                events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                        .eventId("inf-" + holding.getFolio() + "-" + ts)
                        .eventType(infType)
                        .eventDate(authDate)
                        .fund(holding.getFund())
                        .tradingSymbol(ts)
                        .quantity(diff.abs())
                        .source("HOLDING")
                        .confidence("INFERRED")
                        .context(context)
                        .raw(holding.getRaw())
                        .build());
            }
        }

        // Sort DESC by date
        events.sort((e1, e2) -> {
            String d1 = e1.getEventDate();
            String d2 = e2.getEventDate();
            if (d1 == null && d2 == null) return 0;
            if (d1 == null) return 1;
            if (d2 == null) return -1;
            return d2.compareTo(d1);
        });

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(events);
        response.setLastSyncedAt(syncTime);
        response.setSource("ZERODHA");
        return response;
    }
}
