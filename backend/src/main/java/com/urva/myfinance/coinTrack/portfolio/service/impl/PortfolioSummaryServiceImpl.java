package com.urva.myfinance.coinTrack.portfolio.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.portfolio.dto.PortfolioSummaryResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.SummaryHoldingDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfInstrumentDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.model.CachedHolding;
import com.urva.myfinance.coinTrack.portfolio.model.CachedPosition;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;
import com.urva.myfinance.coinTrack.portfolio.model.SyncStatus;
import com.urva.myfinance.coinTrack.portfolio.repository.CachedHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CachedPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.portfolio.service.PortfolioSummaryService;

@Service
public class PortfolioSummaryServiceImpl implements PortfolioSummaryService {

    private final CachedHoldingRepository holdingRepository;
    private final CachedPositionRepository positionRepository;
    private final SyncLogRepository syncLogRepository;
    private final MarketDataService marketDataService;
    private final com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository brokerAccountRepository;
    private final com.urva.myfinance.coinTrack.broker.service.impl.ZerodhaBrokerService zerodhaBrokerService;
    private final com.urva.myfinance.coinTrack.portfolio.repository.CachedFundsRepository cachedFundsRepository;
    private final com.urva.myfinance.coinTrack.portfolio.repository.CachedMfOrderRepository cachedMfOrderRepository;

    // Defined for future timezone usage if needed explicitly

    @Autowired
    public PortfolioSummaryServiceImpl(CachedHoldingRepository holdingRepository,
            CachedPositionRepository positionRepository,
            SyncLogRepository syncLogRepository,
            MarketDataService marketDataService,
            com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository brokerAccountRepository,
            com.urva.myfinance.coinTrack.broker.service.impl.ZerodhaBrokerService zerodhaBrokerService,
            com.urva.myfinance.coinTrack.portfolio.repository.CachedFundsRepository cachedFundsRepository,
            com.urva.myfinance.coinTrack.portfolio.repository.CachedMfOrderRepository cachedMfOrderRepository) {
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.syncLogRepository = syncLogRepository;
        this.marketDataService = marketDataService;
        this.brokerAccountRepository = brokerAccountRepository;
        this.zerodhaBrokerService = zerodhaBrokerService;
        this.cachedFundsRepository = cachedFundsRepository;
        this.cachedMfOrderRepository = cachedMfOrderRepository;
    }

    @Override
    public PortfolioSummaryResponse getPortfolioSummary(String userId) {
        // 1. Fetch ALL Holdings & Positions (Multi-Broker)
        List<CachedHolding> holdings = holdingRepository.findByUserId(userId);
        List<CachedPosition> positions = positionRepository.findByUserId(userId);

        // 2. Identify Unique Symbols for Batch Fetch (Only for holdings now, positions
        // use stored fields)
        Set<String> allSymbols = new HashSet<>();
        holdings.forEach(h -> allSymbols.add(h.getSymbol()));
        // positions.forEach(p -> allSymbols.add(p.getSymbol())); // Not strictly needed
        // for aggregation if using stored fields, but good for display

        // 3. Batch Fetch Market Prices (Optional for positions if strictly following
        // "Don't recompute")
        // But we still fetch for holdings day gain calculation
        Map<String, MarketPrice> priceMap = marketDataService.getPrices(new ArrayList<>(allSymbols));

        // 4. Process List & Totals
        List<SummaryHoldingDTO> detailedList = new ArrayList<>();
        List<com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO> positionsList = new ArrayList<>();

        BigDecimal totalCurrentValue = BigDecimal.ZERO;
        BigDecimal totalInvestedValue = BigDecimal.ZERO;
        BigDecimal totalDayGain = BigDecimal.ZERO;

        boolean containsDerivatives = false;

        // Process Holdings
        for (CachedHolding h : holdings) {
            SummaryHoldingDTO dto = convertHolding(h, priceMap.get(h.getSymbol()));
            detailedList.add(dto);
            totalCurrentValue = totalCurrentValue.add(dto.getCurrentValue());
            totalInvestedValue = totalInvestedValue.add(dto.getInvestedValue());
            totalDayGain = totalDayGain.add(dto.getDayGain());
        }

        // Process Positions
        for (CachedPosition p : positions) {
            // Guardrail: Detect F&O
            if (p.getPositionType() == com.urva.myfinance.coinTrack.portfolio.model.PositionType.FNO) {
                containsDerivatives = true;
            }

            com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO dto = convertPosition(p);
            positionsList.add(dto);
            totalCurrentValue = totalCurrentValue.add(dto.getCurrentValue());
            totalInvestedValue = totalInvestedValue.add(dto.getInvestedValue());
            totalDayGain = totalDayGain.add(dto.getDayGain());
        }

        // 5. Final Aggregations
        // 5. Final Aggregations
        BigDecimal totalUnrealizedPL = totalCurrentValue.subtract(totalInvestedValue);
        BigDecimal totalDayGainPercent = null;

        // Revised Logic: Always compute if sensible (invested value basis exists)
        // Guardrail: Ensure mathematical safety (non-zero divisor)
        BigDecimal totalPrevValue = totalCurrentValue.subtract(totalDayGain);
        if (totalPrevValue.compareTo(BigDecimal.ZERO) != 0) {
            totalDayGainPercent = totalDayGain.divide(totalPrevValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        } else {
            // If basis is 0 (e.g. pure F&O margin play with no underlying value or just
            // closed),
            // 0% is the safest representation of "no return on invalid base"
            totalDayGainPercent = BigDecimal.ZERO;
        }

        boolean dayGainPercentApplicable = true; // Always applicable now if verified safe

        // 6. Sync Timestamps (Use SUCCESS logs only)
        LocalDateTime latestSync = getLatestSyncTime(userId);

        // 7. Sorting: Current Value DESC
        detailedList.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));
        positionsList.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));

        return PortfolioSummaryResponse.builder()
                .totalCurrentValue(totalCurrentValue.setScale(4, RoundingMode.HALF_UP))
                .totalInvestedValue(totalInvestedValue.setScale(4, RoundingMode.HALF_UP))
                .totalUnrealizedPL(totalUnrealizedPL.setScale(4, RoundingMode.HALF_UP))
                .totalDayGain(totalDayGain.setScale(4, RoundingMode.HALF_UP))
                .totalDayGainPercent(totalDayGainPercent) // Can be null
                .lastHoldingsSync(latestSync)
                .lastPositionsSync(latestSync)
                .lastAnySync(latestSync)
                .holdingsList(detailedList)
                .positionsList(positionsList)
                .type("CUSTOM_AGGREGATE")
                .source(java.util.Collections.singletonList("ZERODHA"))
                // Metadata Flags
                .containsDerivatives(containsDerivatives)
                .dayGainPercentApplicable(dayGainPercentApplicable)
                .build();
    }

    private SummaryHoldingDTO convertHolding(CachedHolding h, MarketPrice price) {
        BigDecimal qty = h.getQuantity(); // Already BigDecimal
        BigDecimal avgPrice = h.getAverageBuyPrice(); // Already BigDecimal

        // 1. Try to use Zerodha values FIRST if available
        BigDecimal lastPrice = h.getLastPrice();
        BigDecimal closePrice = h.getClosePrice();
        BigDecimal pnl = h.getPnl();
        BigDecimal dayChange = h.getDayChange();
        BigDecimal dayChangePercent = h.getDayChangePercentage();

        // 2. Fallback to MarketPrice if Zerodha values are missing
        if (lastPrice == null) {
            lastPrice = (price != null && price.getCurrentPrice() != null) ? price.getCurrentPrice() : BigDecimal.ZERO;
        }

        if (closePrice == null) {
            closePrice = (price != null && price.getPreviousClose() != null) ? price.getPreviousClose()
                    : BigDecimal.ZERO;
        }

        // Computed safe fields as per requirement
        BigDecimal currentValue = qty.multiply(lastPrice);
        BigDecimal investedValue = qty.multiply(avgPrice);

        // Fill missing P&L if needed (fallback logic)
        // We do NOT store this fallback in DB, only return in response.
        if (pnl == null) {
            if (lastPrice.compareTo(BigDecimal.ZERO) <= 0) {
                // New listing or missing data -> Treat as no P&L yet (avoid showing -100% loss)
                pnl = BigDecimal.ZERO;
            } else {
                // Fallback: (last_price - average_price) * quantity
                pnl = currentValue.subtract(investedValue);
            }
        }

        if (dayChange == null) {
            if (lastPrice.compareTo(BigDecimal.ZERO) > 0 && closePrice.compareTo(BigDecimal.ZERO) != 0) {
                dayChange = (lastPrice.subtract(closePrice)).multiply(qty);
            } else {
                dayChange = BigDecimal.ZERO;
            }
        }

        if (dayChangePercent == null) {
            if (lastPrice.compareTo(BigDecimal.ZERO) > 0 && closePrice.compareTo(BigDecimal.ZERO) != 0) {
                dayChangePercent = (lastPrice.subtract(closePrice)).divide(closePrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            } else {
                dayChangePercent = BigDecimal.ZERO;
            }
        }

        return SummaryHoldingDTO.builder()
                .symbol(h.getSymbol())
                .exchange(h.getExchange())
                .broker(h.getBroker() != null ? h.getBroker().name() : "UNKNOWN")
                .type("HOLDING")
                .quantity(qty) // BigDecimal
                .averageBuyPrice(avgPrice.setScale(4, RoundingMode.HALF_UP))
                .currentPrice(lastPrice.setScale(4, RoundingMode.HALF_UP))
                .previousClose(closePrice.setScale(4, RoundingMode.HALF_UP))
                .currentValue(currentValue.setScale(4, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(4, RoundingMode.HALF_UP))
                .unrealizedPL(pnl.setScale(4, RoundingMode.HALF_UP))
                .dayGain(dayChange.setScale(4, RoundingMode.HALF_UP))
                .dayGainPercent(dayChangePercent.setScale(2, RoundingMode.HALF_UP))
                .raw(Map.of(
                        "instrument_token", h.getInstrumentToken() != null ? h.getInstrumentToken() : 0,
                        "product", h.getProduct() != null ? h.getProduct() : "",
                        "used_quantity", h.getUsedQuantity() != null ? h.getUsedQuantity() : BigDecimal.ZERO,
                        "t1_quantity", h.getT1Quantity() != null ? h.getT1Quantity() : BigDecimal.ZERO,
                        "realised_quantity",
                        h.getRealisedQuantity() != null ? h.getRealisedQuantity() : BigDecimal.ZERO,
                        "authorised_quantity",
                        h.getAuthorisedQuantity() != null ? h.getAuthorisedQuantity() : BigDecimal.ZERO,
                        "authorised_date", h.getAuthorisedDate() != null ? h.getAuthorisedDate() : "",
                        "close_price", h.getClosePrice() != null ? h.getClosePrice() : BigDecimal.ZERO))
                .build();
    }

    private com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO convertPosition(CachedPosition p) {
        BigDecimal qty = p.getQuantity(); // Already BigDecimal
        BigDecimal buyPrice = p.getBuyPrice(); // Already BigDecimal

        // GUARDRAIL: Use stored Zerodha fields (pnl, mtm) directly
        // Do NOT recompute from market price if available
        BigDecimal mtm = p.getMtm() != null ? p.getMtm() : BigDecimal.ZERO; // Day Gain
        BigDecimal pnl = p.getPnl() != null ? p.getPnl() : BigDecimal.ZERO; // Unrealized

        // Derive Current Price safely
        // Priority: Raw value/qty > Raw last price > 0
        BigDecimal currentPrice = BigDecimal.ZERO;
        if (p.getValue() != null && qty.compareTo(BigDecimal.ZERO) != 0) {
            currentPrice = p.getValue().divide(qty, 2, RoundingMode.HALF_UP).abs();
        } else if (p.getLastPrice() != null) {
            currentPrice = p.getLastPrice();
        }

        // Fallback Logic for P&L if missing (Section 4 of prompt)
        if (p.getPnl() == null) {
            if (currentPrice.compareTo(BigDecimal.ZERO) <= 0) {
                pnl = BigDecimal.ZERO;
            } else {
                pnl = (currentPrice.subtract(buyPrice)).multiply(qty);
            }
        }

        // Invested Value = Quantity * BuyPrice
        BigDecimal investedValue = qty.multiply(buyPrice);

        // Current Value
        // Use Zerodha provided value strictly if available
        BigDecimal currentValue = p.getValue();
        if (currentValue == null) {
            // Fallback: quantity * last_price (or derived currentPrice)
            currentValue = qty.multiply(currentPrice);
        }

        // Derivatives Check
        // Rule 4: derived strictly from instrument_type presence
        boolean isDerivative = p.getInstrumentType() != null;

        // Calculate percentages safely
        // Improved Logic: (MTM / Invested Value) * 100
        BigDecimal dayGainPercent = BigDecimal.ZERO;
        // Rule 3: Only default to zero if investedValue <= 0
        if (investedValue.compareTo(BigDecimal.ZERO) > 0) {
            dayGainPercent = mtm.divide(investedValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        // Populate Raw Map
        // Policy: Strict Pass-Through of original broker response
        // If rawData is stored, use it directly. Otherwise (fallback), construct
        // strictly from known fields.
        Map<String, Object> rawMap;
        if (p.getRawData() != null) {
            rawMap = new java.util.HashMap<>(p.getRawData());
        } else {
            // Fallback for positions synced before this update
            rawMap = new java.util.HashMap<>();
            rawMap.put("product", p.getPositionType().name());
            if (p.getMtm() != null)
                rawMap.put("m2m", p.getMtm());
            if (p.getPnl() != null)
                rawMap.put("pnl", p.getPnl());
            if (p.getValue() != null)
                rawMap.put("value", p.getValue());
            if (p.getBuyQuantity() != null)
                rawMap.put("buy_quantity", p.getBuyQuantity());
            if (p.getSellQuantity() != null)
                rawMap.put("sell_quantity", p.getSellQuantity());
            if (p.getDayBuyQuantity() != null)
                rawMap.put("day_buy_quantity", p.getDayBuyQuantity());
            if (p.getDaySellQuantity() != null)
                rawMap.put("day_sell_quantity", p.getDaySellQuantity());
            if (p.getNetQuantity() != null)
                rawMap.put("net_quantity", p.getNetQuantity());
            if (p.getOvernightQuantity() != null)
                rawMap.put("overnight_quantity", p.getOvernightQuantity());
            if (p.getInstrumentType() != null)
                rawMap.put("instrument_type", p.getInstrumentType());
            // ... other fields derived as needed for legacy support, but new code uses
            // rawData
        }

        return com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO.builder()
                .symbol(p.getSymbol())
                .brokerQuantityMap(java.util.Collections.singletonMap(
                        p.getBroker() != null ? p.getBroker().name() : "UNKNOWN",
                        qty))
                .totalQuantity(qty) // Map total_quantity as well
                .averageBuyPrice(buyPrice.setScale(4, RoundingMode.HALF_UP))
                .currentPrice(currentPrice.setScale(4, RoundingMode.HALF_UP))
                .previousClose(p.getClosePrice() != null ? p.getClosePrice().setScale(4, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO)
                .currentValue(currentValue.setScale(4, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(4, RoundingMode.HALF_UP))
                .unrealizedPl(pnl.setScale(4, RoundingMode.HALF_UP))
                .dayGain(mtm.setScale(4, RoundingMode.HALF_UP))
                .dayGainPercent(dayGainPercent)
                .positionType("NET") // Defaulting strictly to NET as per prompt
                .derivative(isDerivative)
                .instrumentType(p.getInstrumentType())
                .strikePrice(p.getStrikePrice())
                .optionType(p.getOptionType())
                .expiryDate(p.getExpiryDate())
                .raw(rawMap)
                .build();
    }

    private LocalDateTime getLatestSyncTime(String userId) {
        Optional<SyncLog> lastLog = syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(userId,
                SyncStatus.SUCCESS);
        return lastLog.map(SyncLog::getTimestamp).orElse(null);
    }

    // ============================================================================================
    // NEW METHODS FOR ORDERS, FUNDS, MF, PROFILE
    // Aggregation logic: Currently we assume primary broker (Zerodha).
    // In multi-broker future, we would merge lists.
    // ============================================================================================

    @Override
    public com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> getOrders(
            String userId) {
        List<com.urva.myfinance.coinTrack.broker.model.BrokerAccount> accounts = brokerAccountRepository
                .findByUserId(userId);
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> allOrders = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now(); // Using current time as sync for live fetch

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allOrders.addAll(zerodhaBrokerService.fetchOrders(account));
                } catch (Exception e) {
                    // Log but continue
                }
            }
        }

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(allOrders);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE"); // Currently always fetching live
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
                    allTrades.addAll(zerodhaBrokerService.fetchTrades(account));
                } catch (Exception e) {
                    // Log
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

        // Simply return the first available active Zerodha funds. Merging funds is
        // complex.
        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO funds = zerodhaBrokerService
                            .fetchFunds(account);
                    // Add metadata manually if DTO allows or if we wrap it differently.
                    // FundsDTO extends KiteResponseMetadata now.
                    if (funds != null) {
                        funds.setLastSyncedAt(LocalDateTime.now());
                        funds.setSource("LIVE");

                        // PERSIST RAW DATA
                        try {
                            com.urva.myfinance.coinTrack.portfolio.model.CachedFunds cached = com.urva.myfinance.coinTrack.portfolio.model.CachedFunds
                                    .builder()
                                    .userId(userId)
                                    .broker(account.getBroker())
                                    .equityRaw(funds.getEquity() != null ? funds.getEquity().getRaw() : null)
                                    .commodityRaw(funds.getCommodity() != null ? funds.getCommodity().getRaw() : null)
                                    .lastUpdated(LocalDateTime.now())
                                    .build();

                            // Handle update logic (find existing or save new)
                            // Since we have a unique index on userId + broker, we should find and update or
                            // save
                            // But for simplicity with MongoRepository.save() usually handles upsert if ID
                            // is same.
                            // Here ID is not set manually.
                            // Better: findByUserIdAndBroker -> update -> save
                            Optional<com.urva.myfinance.coinTrack.portfolio.model.CachedFunds> existing = cachedFundsRepository
                                    .findByUserIdAndBroker(userId, account.getBroker());
                            if (existing.isPresent()) {
                                cached.setId(existing.get().getId());
                            }
                            @SuppressWarnings({ "null", "unused" })
                            com.urva.myfinance.coinTrack.portfolio.model.CachedFunds saved = cachedFundsRepository
                                    .save(cached);
                        } catch (Exception persistenceEx) {
                            // Log warning but don't fail the request
                            System.err.println("Failed to persist cached funds: " + persistenceEx.getMessage());
                        }
                    }
                    return funds;
                } catch (Exception e) {
                    // Log
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
                    allMf.addAll(zerodhaBrokerService.fetchMfHoldings(account));
                } catch (Exception e) {
                    // Log
                }
            }
        }

        // Trust Broker: Do not recompute P&L or Current Value locally.
        // We rely on 'raw.pnl' and 'raw.current_value' mapped correctly to DTO.

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
                    List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> orders = zerodhaBrokerService
                            .fetchMfOrders(account);
                    for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO order : orders) {
                        // Persist Raw Order
                        try {
                            com.urva.myfinance.coinTrack.portfolio.model.CachedMfOrder cached = com.urva.myfinance.coinTrack.portfolio.model.CachedMfOrder
                                    .builder()
                                    .userId(userId)
                                    .orderId(order.getOrderId())
                                    .broker(account.getBroker())
                                    .raw(order.getRaw())
                                    .lastUpdated(java.time.LocalDateTime.now())
                                    .build();

                            Optional<com.urva.myfinance.coinTrack.portfolio.model.CachedMfOrder> existing = cachedMfOrderRepository
                                    .findByUserIdAndOrderIdAndBroker(userId, order.getOrderId(), account.getBroker());

                            if (existing.isPresent()) {
                                cached.setId(existing.get().getId());
                            }
                            @SuppressWarnings({ "null", "unused" })
                            com.urva.myfinance.coinTrack.portfolio.model.CachedMfOrder saved = cachedMfOrderRepository
                                    .save(cached);
                        } catch (Exception persistenceEx) {
                            System.err.println("Failed to persist cached MF order: " + persistenceEx.getMessage());
                        }
                        allOrders.add(order);
                    }
                } catch (Exception e) {
                    // Log error but continue
                    System.err.println("Failed to fetch MF orders: " + e.getMessage());
                }
            }
        }

        // 4. SORTING RULE: Sort by executionDate (exchange_timestamp) DESC, then
        // orderTimestamp DESC
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

        // Return first available profile
        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    return zerodhaBrokerService.fetchProfile(account);
                } catch (Exception e) {
                    // Log
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
                    allSips.addAll(zerodhaBrokerService.fetchMfSips(account));
                    allOrders.addAll(zerodhaBrokerService.fetchMfOrders(account));
                } catch (Exception e) {
                    System.err
                            .println("Failed to fetch MF data for account " + account.getId() + ": " + e.getMessage());
                }
            }
        }

        // --- LINKING LOGIC ---
        // Group Orders by instruction_id (SIP ID)
        // Rule: order.isSip == true AND order.raw.instruction_id != null
        Map<String, List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO>> ordersBySipId = allOrders
                .stream()
                .filter(o -> o.getIsSip() &&
                        o.getRaw() != null &&
                        o.getRaw().get("instruction_id") != null)
                .collect(java.util.stream.Collectors.groupingBy(o -> o.getRaw().get("instruction_id").toString()));

        // Link & Sort
        Set<String> linkedSipIds = new HashSet<>();
        for (MfSipDTO sip : allSips) {
            List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> executions = ordersBySipId
                    .getOrDefault(sip.getSipId(), new ArrayList<>());

            // Sort by executionDate (exchange_timestamp) ASC, fallback to orderTimestamp
            executions.sort((o1, o2) -> {
                String t1 = o1.getExecutionDate() != null ? o1.getExecutionDate() : o1.getOrderTimestamp();
                String t2 = o2.getExecutionDate() != null ? o2.getExecutionDate() : o2.getOrderTimestamp();
                if (t1 == null)
                    return -1;
                if (t2 == null)
                    return 1;
                return t1.compareTo(t2);
            });

            sip.setExecutions(executions);
            if (!executions.isEmpty()) {
                linkedSipIds.add(sip.getSipId());
            }
        }

        // Identify Unlinked SIP Orders
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> unlinkedOrders = new ArrayList<>();
        ordersBySipId.forEach((sipId, orders) -> {
            boolean sipExists = allSips.stream().anyMatch(s -> s.getSipId().equals(sipId));
            if (!sipExists) {
                unlinkedOrders.addAll(orders);
            }
        });

        // Sort unlinked orders too
        unlinkedOrders.sort((o1, o2) -> {
            String t1 = o1.getExecutionDate() != null ? o1.getExecutionDate() : o1.getOrderTimestamp();
            String t2 = o2.getExecutionDate() != null ? o2.getExecutionDate() : o2.getOrderTimestamp();
            if (t1 == null)
                return -1;
            if (t2 == null)
                return 1;
            return t1.compareTo(t2);
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

        // Instruments might be common across users, but we use an account to fetch.
        // We just need one valid account.
        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allInstruments.addAll(zerodhaBrokerService.fetchMfInstruments(account));
                    // Break after first successful fetch to avoid duplicates if user has multiple
                    // accounts
                    // (though redundant for instruments which are global usually)
                    if (!allInstruments.isEmpty()) {
                        break;
                    }
                } catch (Exception e) {
                    // Log
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
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent> events = new ArrayList<>();
        LocalDateTime syncTime = LocalDateTime.now();

        // 1. Fetch ALL Data
        List<MfSipDTO> allSips = new ArrayList<>();
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO> allOrders = new ArrayList<>();
        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO> allHoldings = new ArrayList<>();

        for (com.urva.myfinance.coinTrack.broker.model.BrokerAccount account : accounts) {
            if (account.getBroker() == com.urva.myfinance.coinTrack.broker.model.Broker.ZERODHA
                    && account.hasValidToken()) {
                try {
                    allSips.addAll(zerodhaBrokerService.fetchMfSips(account));
                    allOrders.addAll(zerodhaBrokerService.fetchMfOrders(account));
                    allHoldings.addAll(zerodhaBrokerService.fetchMfHoldings(account));
                } catch (Exception e) {
                    // Log
                }
            }
        }

        // 2. Process ORDERS -> Events
        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO order : allOrders) {
            com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType type;
            if ("BUY".equalsIgnoreCase(order.getTransactionType())) {
                type = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.BUY_EXECUTED;
            } else if ("SELL".equalsIgnoreCase(order.getTransactionType())
                    || "REDEEM".equalsIgnoreCase(order.getTransactionType())) {
                type = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SELL_EXECUTED;
            } else {
                continue; // Skip unknown
            }

            // Determine strict linking
            String sipId = null;
            if (order.getIsSip() && order.getRaw() != null && order.getRaw().get("instruction_id") != null) {
                sipId = order.getRaw().get("instruction_id").toString();
            }

            // Date priority: exchange_timestamp (executionDate) > order_timestamp
            String date = order.getExecutionDate();
            String timestamp = order.getExecutionDate(); // Start with execution date
            if (date == null) {
                date = order.getOrderTimestamp();
                timestamp = order.getOrderTimestamp();
            }
            if (date != null && date.contains(" ")) {
                date = date.split(" ")[0]; // Extract YYYY-MM-DD
            }

            events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                    .eventId(order.getOrderId() != null ? order.getOrderId() : java.util.UUID.randomUUID().toString())
                    .eventType(type)
                    .eventDate(date)
                    .eventTimestamp(timestamp)
                    .fund(order.getFund())
                    .tradingSymbol(order.getTradingSymbol())
                    .quantity(order.getExecutedQuantity())
                    .amount(order.getAmount())
                    .nav(order.getExecutedNav())
                    .orderId(order.getOrderId())
                    .sipId(sipId)
                    .settlementId(order.getSettlementId())
                    .source("ORDER")
                    .confidence("CONFIRMED")
                    .raw(order.getRaw())
                    .build());
        }

        // 3. Process SIPS -> Events
        for (MfSipDTO sip : allSips) {
            // SIP_CREATED (from startDate)
            if (sip.getStartDate() != null) {
                String createdDate = sip.getStartDate();
                if (createdDate.contains(" "))
                    createdDate = createdDate.split(" ")[0];

                events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                        .eventId("sip-created-" + sip.getSipId())
                        .eventType(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_CREATED)
                        .eventDate(createdDate)
                        .eventTimestamp(sip.getStartDate())
                        .fund(sip.getFund())
                        .tradingSymbol(sip.getTradingSymbol())
                        .amount(sip.getInstalmentAmount() != null
                                ? java.math.BigDecimal.valueOf(sip.getInstalmentAmount())
                                : null)
                        .sipId(sip.getSipId())
                        .source("SIP")
                        .confidence("CONFIRMED")
                        .raw(sip.getRaw())
                        .build());
            }

            // SIP_STATUS_* Events (Snapshot using Created Date)
            // Rule: Emit specific status event based on current status
            String status = sip.getStatus() != null ? sip.getStatus().toUpperCase() : "ACTIVE";
            com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType stateType;
            if ("PAUSED".equals(status)) {
                stateType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_STATUS_PAUSED;
            } else if ("CANCELLED".equals(status)) {
                stateType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_STATUS_CANCELLED;
            } else {
                stateType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_STATUS_ACTIVE;
            }

            // Anchor to created date if available, else now (should have started date)
            String stateDate = sip.getCreated() != null ? sip.getCreated() : java.time.LocalDate.now().toString();
            if (stateDate.contains(" "))
                stateDate = stateDate.split(" ")[0];

            events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                    .eventId("sip-state-" + sip.getSipId())
                    .eventType(stateType)
                    .eventDate(stateDate) // Using Created Date as snapshot anchor
                    .eventTimestamp(sip.getCreated())
                    .fund(sip.getFund())
                    .tradingSymbol(sip.getTradingSymbol())
                    .sipId(sip.getSipId())
                    .source("SIP_STATE")
                    .confidence("CONFIRMED")
                    .context("Current State: " + status)
                    .raw(sip.getRaw())
                    .build());

            // SIP_EXECUTION_SCHEDULED (Only if future)
            if (sip.getNextInstalmentDate() != null) {
                try {
                    java.time.LocalDate next = java.time.LocalDate.parse(sip.getNextInstalmentDate().split(" ")[0]);
                    if (next.isAfter(java.time.LocalDate.now())) {
                        events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                                .eventId("sip-next-" + sip.getSipId())
                                .eventType(
                                        com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_EXECUTION_SCHEDULED)
                                .eventDate(sip.getNextInstalmentDate().split(" ")[0])
                                .eventTimestamp(sip.getNextInstalmentDate())
                                .fund(sip.getFund())
                                .tradingSymbol(sip.getTradingSymbol())
                                .amount(sip.getInstalmentAmount() != null
                                        ? java.math.BigDecimal.valueOf(sip.getInstalmentAmount())
                                        : null)
                                .sipId(sip.getSipId())
                                .source("SIP_SCHEDULE")
                                .confidence("CONFIRMED")
                                .context("Next Instalment")
                                .raw(sip.getRaw())
                                .build());
                    }
                } catch (Exception e) {
                    // Ignore parse error
                }
            }
        }

        // 4. Process HOLDINGS -> Events (Inference Logic)
        // Group orders by tradingsymbol to calculate net quantity
        Map<String, java.math.BigDecimal> netOrderQtyMap = new java.util.HashMap<>();

        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO order : allOrders) {
            String ts = order.getTradingSymbol();
            java.math.BigDecimal qty = order.getExecutedQuantity();
            if (qty == null)
                continue;

            if ("BUY".equalsIgnoreCase(order.getTransactionType())
                    || "PURCHASE".equalsIgnoreCase(order.getTransactionType())) {
                netOrderQtyMap.merge(ts, qty, java.math.BigDecimal::add);
            } else if ("SELL".equalsIgnoreCase(order.getTransactionType())
                    || "REDEEM".equalsIgnoreCase(order.getTransactionType())) {
                netOrderQtyMap.merge(ts, qty.negate(), java.math.BigDecimal::add);
            }
        }

        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO holding : allHoldings) {
            java.math.BigDecimal holdingQty = holding.getQuantity();
            String ts = holding.getTradingSymbol();
            java.math.BigDecimal netOrderQty = netOrderQtyMap.getOrDefault(ts, java.math.BigDecimal.ZERO);

            // Compare Holding Qty vs Net Order Qty using strict logic
            // Threshold for float comparison safety
            java.math.BigDecimal diff = holdingQty.subtract(netOrderQty);
            java.math.BigDecimal threshold = new java.math.BigDecimal("0.001");

            com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType type = null;
            String context = null;

            if (diff.abs().compareTo(threshold) > 0) {
                if (diff.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    // Holding > Net Orders
                    if (netOrderQty.compareTo(java.math.BigDecimal.ZERO) == 0) {
                        type = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_APPEARED;
                        context = "Holding present without orders";
                    } else {
                        type = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_INCREASED;
                        context = "Quantity increased (Bonus/Transfer/Import)";
                    }
                } else {
                    // Holding < Net Orders (e.g. external redemption or error)
                    type = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_REDUCED;
                    context = "Quantity reduced (External Redemption)";
                }

                // Emit Inference Event
                // Date: Use last_price_date or today as this is state knowledge
                String date = holding.getLastPriceDate();
                if (date == null)
                    date = java.time.LocalDate.now().toString();
                if (date.contains(" "))
                    date = date.split(" ")[0];

                events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                        .eventId("holding-inf-" + holding.getFolio() + "-" + ts) // Unique-ish
                        .eventType(type)
                        .eventDate(date)
                        .eventTimestamp(date)
                        .fund(holding.getFund())
                        .tradingSymbol(ts)
                        .quantity(diff.abs()) // The unexplained difference
                        .source("HOLDING")
                        .confidence("INFERRED")
                        .context(context)
                        .raw(holding.getRaw())
                        .build());
            }
        }

        // 5. Sort Events (Date DESC)
        events.sort((e1, e2) -> {
            String d1 = e1.getEventDate();
            String d2 = e2.getEventDate();
            if (d1 == null)
                return 1;
            if (d2 == null)
                return -1;
            return d2.compareTo(d1); // DESC
        });

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(events);
        response.setLastSyncedAt(syncTime);
        response.setSource("LIVE");
        return response;
    }
}
