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

            SummaryHoldingDTO dto = convertPosition(p); // No price map needed for strict mode
            detailedList.add(dto);
            totalCurrentValue = totalCurrentValue.add(dto.getCurrentValue());
            totalInvestedValue = totalInvestedValue.add(dto.getInvestedValue());
            totalDayGain = totalDayGain.add(dto.getDayGain());
        }

        // 5. Final Aggregations
        BigDecimal totalUnrealizedPL = totalCurrentValue.subtract(totalInvestedValue);
        BigDecimal totalDayGainPercent = null;
        boolean dayGainPercentApplicable = !containsDerivatives;

        // Guardrail: Disable Day Gain % if F&O exists
        if (dayGainPercentApplicable) {
            BigDecimal totalPrevValue = totalCurrentValue.subtract(totalDayGain);
            if (totalPrevValue.compareTo(BigDecimal.ZERO) != 0) {
                totalDayGainPercent = totalDayGain.divide(totalPrevValue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
            } else {
                totalDayGainPercent = BigDecimal.ZERO;
            }
        }

        // 6. Sync Timestamps (Use SUCCESS logs only)
        LocalDateTime latestSync = getLatestSyncTime(userId);

        // 7. Sorting: Current Value DESC
        detailedList.sort((a, b) -> b.getCurrentValue().compareTo(a.getCurrentValue()));

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

        BigDecimal cmp = (price != null && price.getCurrentPrice() != null) ? price.getCurrentPrice() : BigDecimal.ZERO;
        BigDecimal prevClose = (price != null && price.getPreviousClose() != null) ? price.getPreviousClose()
                : BigDecimal.ZERO;

        BigDecimal currentValue = qty.multiply(cmp);
        BigDecimal investedValue = qty.multiply(avgPrice);
        BigDecimal unrealizedPL = currentValue.subtract(investedValue);

        BigDecimal dayGain = BigDecimal.ZERO;
        BigDecimal dayGainPercent = BigDecimal.ZERO;

        if (price != null && prevClose.compareTo(BigDecimal.ZERO) != 0) {
            dayGain = (cmp.subtract(prevClose)).multiply(qty);
            dayGainPercent = (cmp.subtract(prevClose)).divide(prevClose, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return SummaryHoldingDTO.builder()
                .symbol(h.getSymbol())
                .exchange(h.getExchange())
                .broker(h.getBroker() != null ? h.getBroker().name() : "UNKNOWN")
                .type("HOLDING")
                .quantity(qty.intValue()) // Cast to int for DTO
                .averageBuyPrice(avgPrice.setScale(2, RoundingMode.HALF_UP))
                .currentPrice(cmp.setScale(2, RoundingMode.HALF_UP))
                .previousClose(prevClose.setScale(2, RoundingMode.HALF_UP))
                .currentValue(currentValue.setScale(2, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                .unrealizedPL(unrealizedPL.setScale(2, RoundingMode.HALF_UP))
                .dayGain(dayGain.setScale(2, RoundingMode.HALF_UP))
                .dayGainPercent(dayGainPercent.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private SummaryHoldingDTO convertPosition(CachedPosition p) {
        BigDecimal qty = p.getQuantity(); // Already BigDecimal
        BigDecimal buyPrice = p.getBuyPrice(); // Already BigDecimal

        // GUARDRAIL: Use stored Zerodha fields (pnl, mtm) directly
        // Do NOT recompute from market price
        BigDecimal mtm = p.getMtm() != null ? p.getMtm() : BigDecimal.ZERO; // Day Gain
        BigDecimal pnl = p.getPnl() != null ? p.getPnl() : BigDecimal.ZERO; // Unrealized

        // Invested Value = Quantity * BuyPrice
        BigDecimal investedValue = qty.multiply(buyPrice);

        // Current Value = Invested + PnL (Total Unrealized)
        // Guardrail: Never use qty * lastPrice for F&O
        BigDecimal currentValue = investedValue.add(pnl);

        return SummaryHoldingDTO.builder()
                .symbol(p.getSymbol())
                .broker(p.getBroker() != null ? p.getBroker().name() : "UNKNOWN")
                .type("POSITION")
                .quantity(qty.intValue())
                .averageBuyPrice(buyPrice.setScale(2, RoundingMode.HALF_UP))
                .currentPrice(BigDecimal.ZERO) // Explicitly ZERO/Null as per "Don't compute" if not needed, or better
                                               // left empty
                .previousClose(BigDecimal.ZERO)
                .currentValue(currentValue.setScale(2, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                .unrealizedPL(pnl.setScale(2, RoundingMode.HALF_UP))
                .dayGain(mtm.setScale(2, RoundingMode.HALF_UP))
                .dayGainPercent(BigDecimal.ZERO) // MTM % could be computed from m2m/invested but usually not reliable
                                                 // for F&O
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
