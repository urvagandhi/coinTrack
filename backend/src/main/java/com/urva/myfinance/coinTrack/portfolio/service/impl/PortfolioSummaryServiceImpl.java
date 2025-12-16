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

        // Create explicit aggregates for consistency
        // Aggregates start at ZERO
        BigDecimal totalCurrentValue = BigDecimal.ZERO;
        BigDecimal previousDayTotalValue = BigDecimal.ZERO;
        BigDecimal totalInvestedValue = BigDecimal.ZERO;

        // Note: totalDayGain is DERIVED from (totalCurrentValue -
        // previousDayTotalValue)
        // Note: totalUnrealizedPL is DERIVED from (totalCurrentValue -
        // totalInvestedValue)

        boolean containsDerivatives = false;

        // Process Holdings
        for (CachedHolding h : holdings) {
            SummaryHoldingDTO dto = convertHolding(h, priceMap.get(h.getSymbol()));
            detailedList.add(dto);

            // ACCUMULATE HOLDINGS INTO TOTALS
            totalCurrentValue = totalCurrentValue.add(dto.getCurrentValue());
            totalInvestedValue = totalInvestedValue.add(dto.getInvestedValue());

            // Compute Previous Day Value Explicitly for Holdings
            BigDecimal closePrice = h.getClosePrice();
            if (closePrice == null) {
                // If close price is missing, do we treat it as zero?
                // A missing close price usually means new listing or data error.
                // Treating as zero implies "Day Gain" = "Current Value" (infinity return).
                // Safest to treat as ZERO for the sum, but metrics might be skewed.
                closePrice = BigDecimal.ZERO;
            }
            // previousValue = quantity * closePrice
            BigDecimal previousValue = h.getQuantity().multiply(closePrice);
            previousDayTotalValue = previousDayTotalValue.add(previousValue);
        }

        // Process Positions
        // NOTE: Positions do NOT contribute to the "Portfolio Summary" aggregates
        // (PrevDay, DayGain)
        // to maintain mathematical consistency with the "Previous Day" logic which is
        // unique to Holdings.
        for (CachedPosition p : positions) {
            // Guardrail: Detect F&O
            if (p.getPositionType() == com.urva.myfinance.coinTrack.portfolio.model.PositionType.FNO) {
                containsDerivatives = true;
            }

            com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO dto = convertPosition(p);
            positionsList.add(dto);

            // Do NOT add positions to totalCurrentValue, totalInvestedValue, or
            // previousDayTotalValue
            // based on strict requirement to exclude positions from previousDayTotalValue
            // and
            // maintain the equation: DayGain = Current - Prev.
            // If we added PositionCurrent to TotalCurrent, but not to TotalPrev,
            // the DayGain would be artificially inflated by the full value of the
            // positions.
        }

        // 5. Final Aggregations
        // Strict derivations per Core Financial Model
        BigDecimal totalUnrealizedPL = totalCurrentValue.subtract(totalInvestedValue);
        BigDecimal totalDayGain = totalCurrentValue.subtract(previousDayTotalValue);
        BigDecimal totalDayGainPercent = BigDecimal.ZERO;

        // Guardrail: Ensure mathematical safety (non-zero divisor)
        // Logic: (totalDayGain / previousDayTotalValue) * 100
        if (previousDayTotalValue.compareTo(BigDecimal.ZERO) != 0) {
            totalDayGainPercent = totalDayGain
                    .divide(previousDayTotalValue, 8, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            // Avoid Division by Zero
            totalDayGainPercent = BigDecimal.ZERO;
        }

        // NEW: Overall Unrealized P&L Percentage
        // Formula: (Unrealized P&L / Invested Value) * 100
        BigDecimal totalUnrealizedPLPercent = BigDecimal.ZERO;
        if (totalInvestedValue.compareTo(BigDecimal.ZERO) != 0) {
            totalUnrealizedPLPercent = totalUnrealizedPL
                    .divide(totalInvestedValue, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
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
                .totalUnrealizedPLPercent(totalUnrealizedPLPercent)
                .totalDayGain(totalDayGain.setScale(4, RoundingMode.HALF_UP))
                .totalDayGainPercent(totalDayGainPercent)
                .previousDayTotalValue(previousDayTotalValue.setScale(4, RoundingMode.HALF_UP))
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
                    com.urva.myfinance.coinTrack.portfolio.dto.kite.UserProfileDTO profile = zerodhaBrokerService
                            .fetchProfile(account);
                    if (profile != null) {
                        profile.setLastSynced(java.time.LocalDateTime.now());
                    }
                    return profile;
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
        // 1. Fetch RAW Data (Single Source of Truth)
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
                    allOrders.addAll(zerodhaBrokerService.fetchMfOrders(account));
                    allSips.addAll(zerodhaBrokerService.fetchMfSips(account));
                    allHoldings.addAll(zerodhaBrokerService.fetchMfHoldings(account));
                } catch (Exception e) {
                    // Log error but continue
                    System.err.println("Error fetching timeline data: " + e.getMessage());
                }
            }
        }

        List<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent> events = new ArrayList<>();

        // Prep: Map SIPs for Linking
        Map<String, com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO> sipMap = allSips.stream()
                .collect(java.util.stream.Collectors.toMap(
                        com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO::getSipId, s -> s, (s1, s2) -> s1));

        // 2. PROCESS ORDERS (Confirmed Events)
        // Group orders by tradingSymbol for Inference Step later
        Map<String, java.math.BigDecimal> netOrderQtyMap = new java.util.HashMap<>(); // Net Qty per fund
        Map<String, java.math.BigDecimal> totalBuyQtyMap = new java.util.HashMap<>(); // Total Buy Qty per fund

        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO order : allOrders) {
            String ts = order.getTradingSymbol(); // Canonical Identity
            java.math.BigDecimal qty = order.getExecutedQuantity() != null ? order.getExecutedQuantity()
                    : java.math.BigDecimal.ZERO;

            if (qty.compareTo(java.math.BigDecimal.ZERO) > 0) {
                // Determine Transaction Type
                boolean isBuy = "BUY".equalsIgnoreCase(order.getTransactionType())
                        || "PURCHASE".equalsIgnoreCase(order.getTransactionType());
                boolean isSell = "SELL".equalsIgnoreCase(order.getTransactionType())
                        || "REDEEM".equalsIgnoreCase(order.getTransactionType());

                // Update Aggregates for Inference
                if (isBuy) {
                    netOrderQtyMap.merge(ts, qty, java.math.BigDecimal::add);
                    totalBuyQtyMap.merge(ts, qty, java.math.BigDecimal::add);
                } else if (isSell) {
                    netOrderQtyMap.merge(ts, qty.negate(), java.math.BigDecimal::add);
                }

                // Determine Event Type
                com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType eventType = null;
                if (isBuy && "COMPLETE".equalsIgnoreCase(order.getStatus())) {
                    eventType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.BUY_EXECUTED;
                } else if (isSell && "COMPLETE".equalsIgnoreCase(order.getStatus())) {
                    eventType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SELL_EXECUTED;
                }

                if (eventType != null) {
                    // Determine Date Priority: exchange_timestamp (execution) > order_timestamp
                    // (placement)
                    String eventDate = null;
                    if (order.getRaw() != null && order.getRaw().get("exchange_timestamp") != null) {
                        eventDate = order.getRaw().get("exchange_timestamp").toString();
                    } else if (order.getOrderTimestamp() != null) {
                        eventDate = order.getOrderTimestamp();
                    }

                    // Normalize to YYYY-MM-DD for sorting/display grouping
                    String sortDate = eventDate;
                    if (sortDate != null && sortDate.contains("T"))
                        sortDate = sortDate.split("T")[0];
                    if (sortDate != null && sortDate.contains(" "))
                        sortDate = sortDate.split(" ")[0];

                    // Determine SIP Linkage
                    String linkedSipId = null;
                    if (order.getRaw() != null) {
                        // Priority 1: instruction_id (Canonical SIP ID)
                        if (order.getRaw().get("instruction_id") != null) {
                            linkedSipId = order.getRaw().get("instruction_id").toString();
                        }
                        // Priority 2: tag (Legacy/User-defined) - Only if it matches a known SIP
                        else if (order.getRaw().get("tag") != null) {
                            String tag = order.getRaw().get("tag").toString();
                            if (sipMap.containsKey(tag)) {
                                linkedSipId = tag;
                            }
                        }
                    }

                    events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                            .eventId("ord-" + order.getOrderId())
                            .eventType(eventType)
                            .eventDate(sortDate)
                            .eventTimestamp(eventDate)
                            .fund(order.getFund()) // Display Name
                            .tradingSymbol(ts) // Canonical Identity
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

        // 3. PROCESS SIPs (Snapshots)
        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO sip : allSips) {
            String ts = sip.getTradingSymbol();

            // Event 1: SIP_CREATED (Merged with Status)
            if (sip.getCreated() != null) {
                String date = sip.getCreated();
                String dateIso = (date != null && date.contains(" ")) ? date.split(" ")[0] : date;

                String status = sip.getStatus() != null ? sip.getStatus().toUpperCase() : "ACTIVE";
                String context = "Frequency: " + sip.getFrequency();
                if ("ACTIVE".equals(status)) {
                    context += " • Status: ACTIVE";
                }

                events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                        .eventId("sip-create-" + sip.getSipId())
                        .eventType(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_CREATED)
                        .eventDate(dateIso)
                        .eventTimestamp(sip.getCreated())
                        .fund(sip.getFund())
                        .tradingSymbol(ts)
                        .amount(sip.getInstalmentAmount() != null
                                ? java.math.BigDecimal.valueOf(sip.getInstalmentAmount())
                                : null)
                        .sipId(sip.getSipId())
                        .source("SIP_SETUP")
                        .confidence("CONFIRMED")
                        .context(context)
                        .raw(sip.getRaw())
                        .build());

                // Event 2: State Deviation (PAUSED / CANCELLED)
                // Only emit if status is NOT active.
                if (!"ACTIVE".equals(status)) {
                    com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType stateType = null;
                    if ("PAUSED".equals(status)) {
                        stateType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_STATUS_PAUSED;
                    } else if ("CANCELLED".equals(status)) {
                        stateType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_STATUS_CANCELLED;
                    }

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

            // Event 2: SIP_EXECUTION_SCHEDULED (Future Only)
            String nextDateRaw = sip.getNextInstalmentDate();
            if (nextDateRaw != null) {
                try {
                    String nextIso = nextDateRaw.contains(" ") ? nextDateRaw.split(" ")[0] : nextDateRaw;
                    java.time.LocalDate next = java.time.LocalDate.parse(nextIso);
                    if (next.isAfter(java.time.LocalDate.now())) {
                        events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                                .eventId("sip-sched-" + sip.getSipId())
                                .eventType(
                                        com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.SIP_EXECUTION_SCHEDULED)
                                .eventDate(nextIso)
                                .fund(sip.getFund())
                                .tradingSymbol(ts)
                                .sipId(sip.getSipId())
                                .amount(sip.getInstalmentAmount() != null
                                        ? java.math.BigDecimal.valueOf(sip.getInstalmentAmount())
                                        : null)
                                .source("SIP")
                                .confidence("CONFIRMED") // It is confirmed schedule
                                .context("Upcoming Instalment")
                                .raw(sip.getRaw())
                                .build());
                    }
                } catch (Exception e) {
                }
            }
        }

        // 4. PROCESS HOLDINGS (Inference Rules)
        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO holding : allHoldings) {
            String ts = holding.getTradingSymbol();
            java.math.BigDecimal holdingQty = holding.getQuantity();
            java.math.BigDecimal netOrderQty = netOrderQtyMap.getOrDefault(ts, java.math.BigDecimal.ZERO);
            java.math.BigDecimal totalBuyQty = totalBuyQtyMap.getOrDefault(ts, java.math.BigDecimal.ZERO);

            java.math.BigDecimal diff = holdingQty.subtract(netOrderQty);
            java.math.BigDecimal threshold = new java.math.BigDecimal("0.001"); // Floating point tolerance

            com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType infType = null;
            String context = null;

            if (diff.abs().compareTo(threshold) > 0) {
                // Difference detected
                if (diff.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    // Holding > Net Orders
                    if (totalBuyQty.compareTo(java.math.BigDecimal.ZERO) == 0) {
                        // Case: No BUY orders at all, but holding exists
                        infType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_APPEARED;
                        context = "Holding imported or pre-existing";
                    } else {
                        // Case: BUY orders exist, but holding is even larger
                        infType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_INCREASED;
                        context = "Unexplained quantity increase (Bonus/Divider/Reinvestment)";
                    }
                } else {
                    // Holding < Net Orders
                    infType = com.urva.myfinance.coinTrack.portfolio.dto.kite.MfEventType.HOLDING_REDUCED;
                    context = "Unexplained quantity reduction (External Sell)";
                }

                // Date Logic: "Use authorised_date if present Else NULL"
                String authDate = null;
                if (holding.getRaw() != null && holding.getRaw().get("authorised_date") != null) {
                    String d = holding.getRaw().get("authorised_date").toString();
                    if (!d.isEmpty())
                        authDate = d;
                }
                // If authDate is "null" string or empty, keep it null.
                if (authDate != null && authDate.contains(" "))
                    authDate = authDate.split(" ")[0];

                events.add(com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent.builder()
                        .eventId("inf-" + holding.getFolio() + "-" + ts)
                        .eventType(infType)
                        .eventDate(authDate) // Can be null
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

        // 5. Sort Events (Date DESC, Nulls Last)
        events.sort((e1, e2) -> {
            String d1 = e1.getEventDate();
            String d2 = e2.getEventDate();
            if (d1 == null && d2 == null)
                return 0;
            if (d1 == null)
                return 1; // Null last
            if (d2 == null)
                return -1;
            return d2.compareTo(d1); // DESC
        });

        com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<com.urva.myfinance.coinTrack.portfolio.dto.kite.MfTimelineEvent> response = new com.urva.myfinance.coinTrack.portfolio.dto.kite.KiteListResponse<>();
        response.setData(events);
        response.setLastSyncedAt(syncTime);
        response.setSource("ZERODHA");
        return response;
    }
}
