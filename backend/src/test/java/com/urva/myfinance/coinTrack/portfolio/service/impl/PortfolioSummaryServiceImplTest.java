package com.urva.myfinance.coinTrack.portfolio.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.AngelOneBrokerAdapter;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.UpstoxBrokerAdapter;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.core.canonical.DataConfidence;
import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.core.canonical.InstrumentType;
import com.urva.myfinance.coinTrack.broker.core.canonical.PositionType;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.broker.service.ZerodhaLiveDataService;
import com.urva.myfinance.coinTrack.portfolio.dto.PortfolioSummaryResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.SummaryHoldingDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.SummaryPositionDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfInstrumentDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.UserProfileDTO;
import com.urva.myfinance.coinTrack.portfolio.market.MarketDataService;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;
import com.urva.myfinance.coinTrack.portfolio.model.SyncStatus;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalFundsRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfOrderRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("PortfolioSummaryServiceImpl - Comprehensive Tests")
class PortfolioSummaryServiceImplTest {

    @Mock private CanonicalHoldingRepository holdingRepository;
    @Mock private CanonicalPositionRepository positionRepository;
    @Mock private SyncLogRepository syncLogRepository;
    @Mock private MarketDataService marketDataService;
    @Mock private HoldingEnricher holdingEnricher;
    @Mock private PositionEnricher positionEnricher;
    @Mock private PortfolioTotalsCalculator totalsCalculator;
    @Mock private BrokerAccountRepository brokerAccountRepository;
    @Mock private ZerodhaLiveDataService zerodhaLiveDataService;
    @Mock private UpstoxBrokerAdapter upstoxBrokerAdapter;
    @Mock private AngelOneBrokerAdapter angelOneBrokerAdapter;
    @Mock private CanonicalFundsRepository canonicalFundsRepository;
    @Mock private CanonicalMfOrderRepository canonicalMfOrderRepository;

    private PortfolioSummaryServiceImpl service;

    private static final String USER_ID = "user1";
    private static final String ACCOUNT_ID = "acc1";

    @BeforeEach
    void setUp() {
        service = new PortfolioSummaryServiceImpl(
                holdingRepository, positionRepository, syncLogRepository,
                marketDataService, holdingEnricher, positionEnricher,
                totalsCalculator, brokerAccountRepository, zerodhaLiveDataService,
                upstoxBrokerAdapter, angelOneBrokerAdapter,
                canonicalFundsRepository, canonicalMfOrderRepository);
    }

    // ── Helper builders ──────────────────────────────────────────

    private BrokerAccount buildZerodhaAccount(boolean active, boolean tokenValid) {
        return BrokerAccount.builder()
                .id(ACCOUNT_ID)
                .userId(USER_ID)
                .broker(Broker.ZERODHA)
                .isActive(active)
                .zerodhaAccessToken(tokenValid ? "token123" : null)
                .zerodhaTokenExpiresAt(tokenValid ? LocalDateTime.now().plusHours(1) : LocalDateTime.now().minusHours(1))
                .build();
    }

    private CanonicalHolding buildHolding(String symbol, BigDecimal qty, BigDecimal price) {
        return CanonicalHolding.builder()
                .id("h1")
                .userId(USER_ID)
                .symbol(symbol)
                .exchange(Exchange.NSE)
                .brokerType(Broker.ZERODHA)
                .quantity(qty)
                .avgBuyPrice(price)
                .currentPrice(price)
                .dataConfidence(DataConfidence.HIGH)
                .build();
    }

    private CanonicalPosition buildPosition(String symbol, InstrumentType type) {
        return CanonicalPosition.builder()
                .id("p1")
                .userId(USER_ID)
                .symbol(symbol)
                .exchange(Exchange.NSE)
                .brokerType(Broker.ZERODHA)
                .instrumentType(type)
                .positionType(PositionType.LONG)
                .quantity(new BigDecimal("10"))
                .avgBuyPrice(new BigDecimal("100.00"))
                .lastPrice(new BigDecimal("110.00"))
                .unrealizedPnL(new BigDecimal("100.00"))
                .realizedPnL(new BigDecimal("50.00"))
                .totalPnL(new BigDecimal("150.00"))
                .multiplier(1)
                .build();
    }

    private SummaryHoldingDTO buildSummaryHolding(String symbol, BigDecimal currentValue) {
        return SummaryHoldingDTO.builder()
                .symbol(symbol)
                .currentValue(currentValue)
                .investedValue(new BigDecimal("1000.00"))
                .quantity(new BigDecimal("10"))
                .currentPrice(new BigDecimal("100.00"))
                .previousClose(new BigDecimal("95.00"))
                .averageBuyPrice(new BigDecimal("100.00"))
                .unrealizedPL(new BigDecimal("50.00"))
                .build();
    }

    private SummaryPositionDTO buildSummaryPosition(String symbol, BigDecimal currentValue) {
        return SummaryPositionDTO.builder()
                .symbol(symbol)
                .currentValue(currentValue)
                .build();
    }

    private PortfolioTotalsCalculator.PortfolioTotals buildTotals() {
        return new PortfolioTotalsCalculator.PortfolioTotals(
                new BigDecimal("10000.0000"),
                new BigDecimal("9000.0000"),
                new BigDecimal("1000.0000"),
                new BigDecimal("11.11"),
                new BigDecimal("200.0000"),
                new BigDecimal("2.04"),
                new BigDecimal("9800.0000")
        );
    }

    private OrderDTO buildOrder(String orderId) {
        OrderDTO order = new OrderDTO();
        order.setOrderId(orderId);
        return order;
    }

    private TradeDTO buildTrade(String tradeId) {
        TradeDTO trade = new TradeDTO();
        trade.setTradeId(tradeId);
        return trade;
    }

    private MutualFundOrderDTO buildMfOrder(String orderId, String fund) {
        MutualFundOrderDTO order = new MutualFundOrderDTO();
        order.setOrderId(orderId);
        order.setFund(fund);
        order.setTradingSymbol(fund);
        order.setTransactionType("BUY");
        order.setStatus("COMPLETE");
        order.setAmount(new BigDecimal("5000.00"));
        return order;
    }

    private MfSipDTO buildMfSip(String sipId, String fund) {
        MfSipDTO sip = new MfSipDTO();
        sip.setSipId(sipId);
        sip.setFund(fund);
        sip.setTradingSymbol(fund);
        sip.setInstalmentAmount(5000.0);
        sip.setFrequency("MONTHLY");
        sip.setStatus("ACTIVE");
        return sip;
    }

    // ── getPortfolioSummary ──────────────────────────────────────

    @Test
    @DisplayName("getPortfolioSummary: returns enriched summary with holdings and positions")
    void getPortfolioSummary_happyPath() {
        List<CanonicalHolding> holdings = List.of(buildHolding("NSE:RELIANCE", new BigDecimal("10"), new BigDecimal("2500.00")));
        List<CanonicalPosition> positions = List.of(buildPosition("NSE:INFY", InstrumentType.EQUITY));

        when(holdingRepository.findByUserId(USER_ID)).thenReturn(holdings);
        when(positionRepository.findByUserId(USER_ID)).thenReturn(positions);

        MarketPrice price = MarketPrice.builder()
                .symbol("NSE:RELIANCE")
                .currentPrice(new BigDecimal("2600.00"))
                .updatedAt(LocalDateTime.now().minusSeconds(5))
                .build();
        when(marketDataService.getPrices(anyList())).thenReturn(Map.of("NSE:RELIANCE", price));

        SummaryHoldingDTO holdingDTO = buildSummaryHolding("NSE:RELIANCE", new BigDecimal("26000.00"));
        SummaryPositionDTO positionDTO = buildSummaryPosition("NSE:INFY", new BigDecimal("1100.00"));

        when(holdingEnricher.enrich(eq(holdings), anyMap())).thenReturn(List.of(holdingDTO));
        when(positionEnricher.enrich(eq(positions))).thenReturn(List.of(positionDTO));
        when(positionEnricher.containsDerivatives(positions)).thenReturn(false);
        when(totalsCalculator.calculate(anyList())).thenReturn(buildTotals());

        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.of(SyncLog.builder().timestamp(LocalDateTime.now()).build()));

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertNotNull(response);
        assertEquals(new BigDecimal("10000.0000"), response.getTotalCurrentValue());
        assertEquals(new BigDecimal("9000.0000"), response.getTotalInvestedValue());
        assertEquals(1, response.getHoldingsList().size());
        assertEquals(1, response.getPositionsList().size());
        assertFalse(response.isContainsDerivatives());
        assertNotNull(response.getLastAnySync());
        assertEquals("CUSTOM_AGGREGATE", response.getType());
        assertTrue(response.getDayGainPercentApplicable());
    }

    @Test
    @DisplayName("getPortfolioSummary: no holdings and no positions returns empty summary")
    void getPortfolioSummary_emptyPortfolio() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(positionRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(marketDataService.getPrices(anyList())).thenReturn(Collections.emptyMap());
        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());
        when(positionEnricher.enrich(anyList())).thenReturn(Collections.emptyList());
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);

        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertNotNull(response);
        assertEquals(0, response.getHoldingsList().size());
        assertEquals(0, response.getPositionsList().size());
        assertNull(response.getLastAnySync());
    }

    @Test
    @DisplayName("getPortfolioSummary: positions with derivatives flagged")
    void getPortfolioSummary_derivativesDetected() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        CanonicalPosition futPosition = buildPosition("NFO:NIFTY23JUL17000CE", InstrumentType.OPTIONS);
        when(positionRepository.findByUserId(USER_ID)).thenReturn(List.of(futPosition));

        when(marketDataService.getPrices(anyList())).thenReturn(Collections.emptyMap());
        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());
        when(positionEnricher.enrich(anyList())).thenReturn(
                List.of(buildSummaryPosition("NFO:NIFTY23JUL17000CE", new BigDecimal("500.00"))));
        when(positionEnricher.containsDerivatives(List.of(futPosition))).thenReturn(true);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertTrue(response.isContainsDerivatives());
    }

    @Test
    @DisplayName("getPortfolioSummary: stale prices detected")
    void getPortfolioSummary_stalePrices() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(positionRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        MarketPrice stalePrice = MarketPrice.builder()
                .symbol("NSE:RELIANCE")
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(LocalDateTime.now().minusMinutes(5))
                .build();
        when(marketDataService.getPrices(anyList())).thenReturn(Map.of("NSE:RELIANCE", stalePrice));

        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());
        when(positionEnricher.enrich(anyList())).thenReturn(Collections.emptyList());
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertTrue(response.isHasStalePrices());
    }

    @Test
    @DisplayName("getPortfolioSummary: fresh prices not stale")
    void getPortfolioSummary_freshPrices_notStale() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(positionRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        MarketPrice freshPrice = MarketPrice.builder()
                .symbol("NSE:RELIANCE")
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(LocalDateTime.now().minusSeconds(10))
                .build();
        when(marketDataService.getPrices(anyList())).thenReturn(Map.of("NSE:RELIANCE", freshPrice));

        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());
        when(positionEnricher.enrich(anyList())).thenReturn(Collections.emptyList());
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertFalse(response.isHasStalePrices());
    }

    @Test
    @DisplayName("getPortfolioSummary: null price updatedAt is not stale")
    void getPortfolioSummary_nullUpdatedAt_notStale() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(positionRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        MarketPrice priceNoTimestamp = MarketPrice.builder()
                .symbol("NSE:RELIANCE")
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(null)
                .build();
        when(marketDataService.getPrices(anyList())).thenReturn(Map.of("NSE:RELIANCE", priceNoTimestamp));

        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());
        when(positionEnricher.enrich(anyList())).thenReturn(Collections.emptyList());
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertFalse(response.isHasStalePrices());
    }

    @Test
    @DisplayName("getPortfolioSummary: holdings sorted by value descending")
    void getPortfolioSummary_holdingsSortedDescending() {
        CanonicalHolding h1 = buildHolding("NSE:A", new BigDecimal("10"), new BigDecimal("100.00"));
        CanonicalHolding h2 = buildHolding("NSE:B", new BigDecimal("10"), new BigDecimal("500.00"));
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(List.of(h1, h2));
        when(positionRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        when(marketDataService.getPrices(anyList())).thenReturn(Collections.emptyMap());

        SummaryHoldingDTO dto1 = buildSummaryHolding("NSE:A", new BigDecimal("1000.00"));
        SummaryHoldingDTO dto2 = buildSummaryHolding("NSE:B", new BigDecimal("5000.00"));

        when(holdingEnricher.enrich(eq(List.of(h1, h2)), anyMap())).thenReturn(new ArrayList<>(List.of(dto1, dto2)));
        when(positionEnricher.enrich(anyList())).thenReturn(Collections.emptyList());
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals totals = new PortfolioTotalsCalculator.PortfolioTotals(
                new BigDecimal("6000.0000"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(totals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertEquals("NSE:B", response.getHoldingsList().get(0).getSymbol());
        assertEquals("NSE:A", response.getHoldingsList().get(1).getSymbol());
    }

    @Test
    @DisplayName("getPortfolioSummary: positions sorted by value descending")
    void getPortfolioSummary_positionsSortedDescending() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        CanonicalPosition p1 = buildPosition("NSE:X", InstrumentType.EQUITY);
        CanonicalPosition p2 = buildPosition("NSE:Y", InstrumentType.EQUITY);
        when(positionRepository.findByUserId(USER_ID)).thenReturn(List.of(p1, p2));

        when(marketDataService.getPrices(anyList())).thenReturn(Collections.emptyMap());
        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());

        SummaryPositionDTO posDto1 = buildSummaryPosition("NSE:X", new BigDecimal("500.00"));
        SummaryPositionDTO posDto2 = buildSummaryPosition("NSE:Y", new BigDecimal("2000.00"));

        when(positionEnricher.enrich(eq(List.of(p1, p2)))).thenReturn(new ArrayList<>(List.of(posDto1, posDto2)));
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertEquals("NSE:Y", response.getPositionsList().get(0).getSymbol());
        assertEquals("NSE:X", response.getPositionsList().get(1).getSymbol());
    }

    @Test
    @DisplayName("getPortfolioSummary: source set to ZERODHA")
    void getPortfolioSummary_sourceZerodha() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(positionRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(marketDataService.getPrices(anyList())).thenReturn(Collections.emptyMap());
        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());
        when(positionEnricher.enrich(anyList())).thenReturn(Collections.emptyList());
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertEquals(Collections.singletonList("ZERODHA"), response.getSource());
    }

    @Test
    @DisplayName("getPortfolioSummary: sync log with no SUCCESS entry returns null sync time")
    void getPortfolioSummary_noSyncLog_returnsNullSync() {
        when(holdingRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(positionRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());
        when(marketDataService.getPrices(anyList())).thenReturn(Collections.emptyMap());
        when(holdingEnricher.enrich(anyList(), anyMap())).thenReturn(Collections.emptyList());
        when(positionEnricher.enrich(anyList())).thenReturn(Collections.emptyList());
        when(positionEnricher.containsDerivatives(anyList())).thenReturn(false);

        PortfolioTotalsCalculator.PortfolioTotals emptyTotals = new PortfolioTotalsCalculator.PortfolioTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        when(totalsCalculator.calculate(anyList())).thenReturn(emptyTotals);
        when(syncLogRepository.findFirstByUserIdAndStatusOrderByTimestampDesc(USER_ID, SyncStatus.SUCCESS))
                .thenReturn(Optional.empty());

        PortfolioSummaryResponse response = service.getPortfolioSummary(USER_ID);

        assertNull(response.getLastAnySync());
        assertNull(response.getLastHoldingsSync());
        assertNull(response.getLastPositionsSync());
    }

    // ── getOrders ────────────────────────────────────────────────

    @Test
    @DisplayName("getOrders: aggregates orders from all valid Zerodha accounts")
    void getOrders_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        List<OrderDTO> mockOrders = List.of(buildOrder("O1"));
        when(zerodhaLiveDataService.fetchOrders(account)).thenReturn(new ArrayList<>(mockOrders));

        var response = service.getOrders(USER_ID);

        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals("LIVE", response.getSource());
    }

    @Test
    @DisplayName("getOrders: skips accounts without valid token")
    void getOrders_skipsInvalidToken() {
        BrokerAccount expired = buildZerodhaAccount(true, false);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(expired));

        var response = service.getOrders(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
        verify(zerodhaLiveDataService, never()).fetchOrders(any());
    }

    @Test
    @DisplayName("getOrders: exception during fetch is handled gracefully")
    void getOrders_exceptionHandled() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchOrders(account)).thenThrow(new RuntimeException("API error"));

        var response = service.getOrders(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    @Test
    @DisplayName("getOrders: no accounts returns empty list")
    void getOrders_noAccounts() {
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        var response = service.getOrders(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    // ── getTrades ────────────────────────────────────────────────

    @Test
    @DisplayName("getTrades: aggregates trades from valid Zerodha accounts")
    void getTrades_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        List<TradeDTO> mockTrades = List.of(buildTrade("T1"));
        when(zerodhaLiveDataService.fetchTrades(account)).thenReturn(new ArrayList<>(mockTrades));

        var response = service.getTrades(USER_ID);

        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals("LIVE", response.getSource());
    }

    @Test
    @DisplayName("getTrades: exception during fetch is handled gracefully")
    void getTrades_exceptionHandled() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchTrades(account)).thenThrow(new RuntimeException("API error"));

        var response = service.getTrades(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    // ── getFunds ─────────────────────────────────────────────────

    @Test
    @DisplayName("getFunds: returns funds from first valid Zerodha account")
    void getFunds_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        FundsDTO mockFunds = new FundsDTO();
        FundsDTO.SegmentFundsDTO equity = new FundsDTO.SegmentFundsDTO();
        FundsDTO.Available available = new FundsDTO.Available();
        available.setCash(new BigDecimal("50000.00"));
        equity.setAvailable(available);
        mockFunds.setEquity(equity);

        when(zerodhaLiveDataService.fetchFunds(account)).thenReturn(mockFunds);
        when(canonicalFundsRepository.findByUserIdAndBrokerAccountId(USER_ID, ACCOUNT_ID))
                .thenReturn(Optional.empty());

        var result = service.getFunds(USER_ID);

        assertNotNull(result);
        assertEquals("LIVE", result.getSource());
    }

    @Test
    @DisplayName("getFunds: skips expired token accounts")
    void getFunds_skipsExpiredToken() {
        BrokerAccount expired = buildZerodhaAccount(true, false);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(expired));

        var result = service.getFunds(USER_ID);

        assertNull(result);
    }

    @Test
    @DisplayName("getFunds: exception during fetch returns null")
    void getFunds_exceptionReturnsNull() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchFunds(account)).thenThrow(new RuntimeException("API error"));

        var result = service.getFunds(USER_ID);

        assertNull(result);
    }

    @Test
    @DisplayName("getFunds: null funds from service returns null")
    void getFunds_nullFunds() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchFunds(account)).thenReturn(null);

        var result = service.getFunds(USER_ID);

        assertNull(result);
    }

    // ── getMutualFunds ──────────────────────────────────────────

    @Test
    @DisplayName("getMutualFunds: aggregates MF holdings from Zerodha accounts")
    void getMutualFunds_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        MutualFundDTO mockMf = new MutualFundDTO();
        mockMf.setTradingSymbol("HDFC-MF-GROWTH");
        when(zerodhaLiveDataService.fetchMfHoldings(account)).thenReturn(new ArrayList<>(List.of(mockMf)));

        var response = service.getMutualFunds(USER_ID);

        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals("LIVE", response.getSource());
    }

    @Test
    @DisplayName("getMutualFunds: skips non-Zerodha accounts")
    void getMutualFunds_skipsNonZerodha() {
        BrokerAccount upstoxAccount = BrokerAccount.builder()
                .id("acc2")
                .userId(USER_ID)
                .broker(Broker.UPSTOX)
                .isActive(true)
                .accessToken("token")
                .tokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(upstoxAccount));

        var response = service.getMutualFunds(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    @Test
    @DisplayName("getMutualFunds: exception during fetch is handled gracefully")
    void getMutualFunds_exceptionHandled() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchMfHoldings(account)).thenThrow(new RuntimeException("API error"));

        var response = service.getMutualFunds(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    // ── getProfile ───────────────────────────────────────────────

    @Test
    @DisplayName("getProfile: returns profile from first valid Zerodha account")
    void getProfile_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        UserProfileDTO mockProfile = new UserProfileDTO();
        mockProfile.setUserName("Test User");
        when(zerodhaLiveDataService.fetchProfile(account)).thenReturn(mockProfile);

        var result = service.getProfile(USER_ID);

        assertNotNull(result);
        assertEquals("Test User", result.getUserName());
        assertNotNull(result.getLastSynced());
    }

    @Test
    @DisplayName("getProfile: no valid Zerodha accounts returns null")
    void getProfile_noValidAccounts() {
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(Collections.emptyList());

        var result = service.getProfile(USER_ID);

        assertNull(result);
    }

    @Test
    @DisplayName("getProfile: exception during fetch returns null")
    void getProfile_exceptionReturnsNull() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchProfile(account)).thenThrow(new RuntimeException("error"));

        var result = service.getProfile(USER_ID);

        assertNull(result);
    }

    // ── getMfOrders ─────────────────────────────────────────────

    @Test
    @DisplayName("getMfOrders: aggregates MF orders from Zerodha accounts")
    void getMfOrders_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        MutualFundOrderDTO mockOrder = buildMfOrder("MF1", "HDFC Mid-Cap");
        when(zerodhaLiveDataService.fetchMfOrders(account)).thenReturn(new ArrayList<>(List.of(mockOrder)));
        when(canonicalMfOrderRepository.findByUserIdAndBrokerAccountIdAndOrderId(USER_ID, ACCOUNT_ID, "MF1"))
                .thenReturn(Optional.empty());

        var response = service.getMfOrders(USER_ID);

        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals("LIVE", response.getSource());
    }

    @Test
    @DisplayName("getMfOrders: exception during fetch is handled gracefully")
    void getMfOrders_exceptionHandled() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchMfOrders(account)).thenThrow(new RuntimeException("error"));

        var response = service.getMfOrders(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    // ── getMfSips ───────────────────────────────────────────────

    @Test
    @DisplayName("getMfSips: returns SIPs from Zerodha accounts")
    void getMfSips_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        MfSipDTO mockSip = buildMfSip("SIP1", "Axis Bluechip");
        when(zerodhaLiveDataService.fetchMfSips(account)).thenReturn(new ArrayList<>(List.of(mockSip)));
        when(zerodhaLiveDataService.fetchMfOrders(account)).thenReturn(new ArrayList<>());

        var response = service.getMfSips(USER_ID);

        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals("LIVE", response.getSource());
    }

    @Test
    @DisplayName("getMfSips: exception during fetch is handled gracefully")
    void getMfSips_exceptionHandled() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchMfSips(account)).thenThrow(new RuntimeException("error"));
        when(zerodhaLiveDataService.fetchMfOrders(account)).thenThrow(new RuntimeException("error"));

        var response = service.getMfSips(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    // ── getMfInstruments ─────────────────────────────────────────

    @Test
    @DisplayName("getMfInstruments: returns instruments from Zerodha accounts")
    void getMfInstruments_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        MfInstrumentDTO mockInstrument = new MfInstrumentDTO();
        mockInstrument.setTradingSymbol("HDFC-MIDCAP");
        when(zerodhaLiveDataService.fetchMfInstruments(account)).thenReturn(new ArrayList<>(List.of(mockInstrument)));

        var response = service.getMfInstruments(USER_ID);

        assertNotNull(response);
        assertEquals(1, response.getData().size());
    }

    @Test
    @DisplayName("getMfInstruments: exception during fetch returns empty")
    void getMfInstruments_exceptionReturnsEmpty() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchMfInstruments(account)).thenThrow(new RuntimeException("error"));

        var response = service.getMfInstruments(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    // ── getMfTimeline ────────────────────────────────────────────

    @Test
    @DisplayName("getMfTimeline: returns timeline events from orders, SIPs, and holdings")
    void getMfTimeline_happyPath() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        when(zerodhaLiveDataService.fetchMfOrders(account)).thenReturn(new ArrayList<>());
        when(zerodhaLiveDataService.fetchMfSips(account)).thenReturn(new ArrayList<>());
        when(zerodhaLiveDataService.fetchMfHoldings(account)).thenReturn(new ArrayList<>());

        var response = service.getMfTimeline(USER_ID);

        assertNotNull(response);
        assertEquals("ZERODHA", response.getSource());
    }

    @Test
    @DisplayName("getMfTimeline: exception during fetch returns empty timeline")
    void getMfTimeline_exceptionHandled() {
        BrokerAccount account = buildZerodhaAccount(true, true);
        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));
        when(zerodhaLiveDataService.fetchMfOrders(account)).thenThrow(new RuntimeException("error"));

        var response = service.getMfTimeline(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }

    // ── Multi-broker aggregation ─────────────────────────────────

    @Test
    @DisplayName("getOrders: aggregates from multiple broker accounts")
    void getOrders_multiBroker() {
        BrokerAccount zerodha = buildZerodhaAccount(true, true);
        BrokerAccount angelOne = BrokerAccount.builder()
                .id("acc2")
                .userId(USER_ID)
                .broker(Broker.ANGELONE)
                .isActive(true)
                .encryptedAngelOneJwtToken("jwt123")
                .angelOneTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(zerodha, angelOne));

        when(zerodhaLiveDataService.fetchOrders(zerodha)).thenReturn(new ArrayList<>(List.of(buildOrder("O1"))));

        List<OrderDTO> angelOrders = List.of(buildOrder("O2"));
        when(angelOneBrokerAdapter.fetchOrders(angelOne)).thenReturn(new ArrayList<>(angelOrders));

        var response = service.getOrders(USER_ID);

        assertNotNull(response);
        assertEquals(2, response.getData().size());
    }

    @Test
    @DisplayName("getTrades: aggregates from Upstox and Zerodha accounts")
    void getTrades_multiBroker() {
        BrokerAccount zerodha = buildZerodhaAccount(true, true);
        BrokerAccount upstox = BrokerAccount.builder()
                .id("acc3")
                .userId(USER_ID)
                .broker(Broker.UPSTOX)
                .isActive(true)
                .accessToken("uptoken")
                .tokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(zerodha, upstox));

        when(zerodhaLiveDataService.fetchTrades(zerodha)).thenReturn(new ArrayList<>(List.of(buildTrade("T1"))));

        List<TradeDTO> upstoxTrades = List.of(buildTrade("T2"));
        when(upstoxBrokerAdapter.fetchTrades(upstox)).thenReturn(new ArrayList<>(upstoxTrades));

        var response = service.getTrades(USER_ID);

        assertNotNull(response);
        assertEquals(2, response.getData().size());
    }

    @Test
    @DisplayName("getFunds: falls back to Upstox when Zerodha returns null")
    void getFunds_fallbackToUpstox() {
        BrokerAccount zerodha = buildZerodhaAccount(true, true);
        BrokerAccount upstox = BrokerAccount.builder()
                .id("acc3")
                .userId(USER_ID)
                .broker(Broker.UPSTOX)
                .isActive(true)
                .accessToken("uptoken")
                .tokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(zerodha, upstox));

        when(zerodhaLiveDataService.fetchFunds(zerodha)).thenReturn(null);

        FundsDTO upstoxFunds = new FundsDTO();
        FundsDTO.SegmentFundsDTO equity = new FundsDTO.SegmentFundsDTO();
        FundsDTO.Available available = new FundsDTO.Available();
        available.setCash(new BigDecimal("30000.00"));
        equity.setAvailable(available);
        upstoxFunds.setEquity(equity);

        when(upstoxBrokerAdapter.fetchFundsAsKite(upstox)).thenReturn(upstoxFunds);
        when(canonicalFundsRepository.findByUserIdAndBrokerAccountId(USER_ID, "acc3"))
                .thenReturn(Optional.empty());

        var result = service.getFunds(USER_ID);

        assertNotNull(result);
        assertEquals("LIVE", result.getSource());
    }

    @Test
    @DisplayName("getMutualFunds: only Zerodha accounts produce MF holdings")
    void getMutualFunds_onlyZerodha() {
        BrokerAccount angelOne = BrokerAccount.builder()
                .id("acc2")
                .userId(USER_ID)
                .broker(Broker.ANGELONE)
                .isActive(true)
                .encryptedAngelOneJwtToken("jwt")
                .angelOneTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(brokerAccountRepository.findByUserId(USER_ID)).thenReturn(List.of(angelOne));

        var response = service.getMutualFunds(USER_ID);

        assertNotNull(response);
        assertTrue(response.getData().isEmpty());
    }
}
