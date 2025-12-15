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

    // Defined for future timezone usage if needed explicitly

    @Autowired
    public PortfolioSummaryServiceImpl(CachedHoldingRepository holdingRepository,
            CachedPositionRepository positionRepository,
            SyncLogRepository syncLogRepository,
            MarketDataService marketDataService,
            com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository brokerAccountRepository,
            com.urva.myfinance.coinTrack.broker.service.impl.ZerodhaBrokerService zerodhaBrokerService) {
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.syncLogRepository = syncLogRepository;
        this.marketDataService = marketDataService;
        this.brokerAccountRepository = brokerAccountRepository;
        this.zerodhaBrokerService = zerodhaBrokerService;
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
                .totalCurrentValue(totalCurrentValue.setScale(2, RoundingMode.HALF_UP))
                .totalInvestedValue(totalInvestedValue.setScale(2, RoundingMode.HALF_UP))
                .totalUnrealizedPL(totalUnrealizedPL.setScale(2, RoundingMode.HALF_UP))
                .totalDayGain(totalDayGain.setScale(2, RoundingMode.HALF_UP))
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
                .averageBuyPrice(avgPrice.setScale(2, RoundingMode.HALF_UP))
                .currentPrice(lastPrice.setScale(2, RoundingMode.HALF_UP))
                .previousClose(closePrice.setScale(2, RoundingMode.HALF_UP))
                .currentValue(currentValue.setScale(2, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                .unrealizedPL(pnl.setScale(2, RoundingMode.HALF_UP))
                .dayGain(dayChange.setScale(2, RoundingMode.HALF_UP))
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
                .averageBuyPrice(buyPrice.setScale(2, RoundingMode.HALF_UP))
                .currentPrice(currentPrice.setScale(2, RoundingMode.HALF_UP))
                .previousClose(p.getClosePrice() != null ? p.getClosePrice().setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO)
                .currentValue(currentValue.setScale(2, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                .unrealizedPl(pnl.setScale(2, RoundingMode.HALF_UP))
                .dayGain(mtm.setScale(2, RoundingMode.HALF_UP))
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

        // Calculate missing values
        for (com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO mf : allMf) {
            if (mf.getCurrentValue() == null || mf.getCurrentValue().compareTo(BigDecimal.ZERO) == 0) {
                if (mf.getQuantity() != null && mf.getLastPrice() != null) {
                    mf.setCurrentValue(mf.getQuantity().multiply(mf.getLastPrice()).setScale(2, RoundingMode.HALF_UP));
                }
            }
            if (mf.getPnl() == null) {
                if (mf.getCurrentValue() != null && mf.getQuantity() != null && mf.getAveragePrice() != null) {
                    BigDecimal invested = mf.getQuantity().multiply(mf.getAveragePrice());
                    mf.setPnl(mf.getCurrentValue().subtract(invested).setScale(2, RoundingMode.HALF_UP));
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
                    allOrders.addAll(zerodhaBrokerService.fetchMfOrders(account));
                } catch (Exception e) {
                    // Log
                }
            }
        }

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
}
