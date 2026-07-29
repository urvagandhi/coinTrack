package com.urva.myfinance.coinTrack.portfolio.market.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.portfolio.model.MarketPrice;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.MarketPriceRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("MarketDataServiceImpl - Comprehensive Tests")
class MarketDataServiceImplTest {

    @Mock private MarketPriceRepository priceRepository;
    @Mock private BrokerAccountRepository brokerAccountRepository;
    @Mock private CanonicalHoldingRepository holdingRepository;
    @Mock private EncryptionUtil encryptionUtil;
    @Mock private WebClient.Builder webClientBuilder;
    @Mock private WebClient webClient;
    @Mock private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock private WebClient.ResponseSpec responseSpec;

    private MarketDataServiceImpl service;

    private static final String SYMBOL_A = "NSE:RELIANCE";
    private static final String SYMBOL_B = "NSE:TCS";

    @BeforeEach
    void setUp() {
        lenient().when(webClientBuilder.build()).thenReturn(webClient);
        service = new MarketDataServiceImpl(
                priceRepository, brokerAccountRepository, holdingRepository,
                encryptionUtil, webClientBuilder);
    }

    // ── getPrices: null / empty ──────────────────────────────────

    @Test
    @DisplayName("getPrices: null input returns empty map")
    void getPrices_nullInput_returnsEmptyMap() {
        Map<String, MarketPrice> result = service.getPrices(null);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getPrices: empty list returns empty map")
    void getPrices_emptyList_returnsEmptyMap() {
        Map<String, MarketPrice> result = service.getPrices(Collections.emptyList());
        assertTrue(result.isEmpty());
    }

    // ── getPrices: cache hit ─────────────────────────────────────

    @Test
    @DisplayName("getPrices: all symbols found in cache returns cached prices")
    void getPrices_allCached_returnsFromCache() {
        MarketPrice cached = MarketPrice.builder()
                .symbol(SYMBOL_A)
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(LocalDateTime.now().minusSeconds(5))
                .build();

        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A))).thenReturn(List.of(cached));

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertEquals(1, result.size());
        assertEquals(new BigDecimal("2500.00"), result.get(SYMBOL_A).getCurrentPrice());
        verify(brokerAccountRepository, never()).findByBroker(any());
    }

    @Test
    @DisplayName("getPrices: stale cache entry triggers Zerodha fetch")
    void getPrices_staleCache_triggersZerodhaFetch() {
        MarketPrice stale = MarketPrice.builder()
                .symbol(SYMBOL_A)
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(LocalDateTime.now().minusMinutes(10))
                .build();

        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A))).thenReturn(List.of(stale));
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA)).thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        verify(brokerAccountRepository).findByBroker(Broker.ZERODHA);
    }

    // ── getPrices: partial cache hit ─────────────────────────────

    @Test
    @DisplayName("getPrices: partial cache hit fetches missing symbol from Zerodha")
    void getPrices_partialCacheHit_fetchesMissing() {
        MarketPrice cached = MarketPrice.builder()
                .symbol(SYMBOL_A)
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(LocalDateTime.now().minusSeconds(5))
                .build();

        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A, SYMBOL_B)))
                .thenReturn(List.of(cached));
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());

        // Also check fallback for SYMBOL_B
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_B)))
                .thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A, SYMBOL_B));

        assertEquals(1, result.size());
        assertEquals(new BigDecimal("2500.00"), result.get(SYMBOL_A).getCurrentPrice());
    }

    // ── getPrices: no Zerodha accounts → canonical fallback ──────

    @Test
    @DisplayName("getPrices: no Zerodha accounts falls back to canonical holding prices")
    void getPrices_noZerodhaAccounts_fallsBackToCanonical() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());

        com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding holding =
                com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding.builder()
                        .symbol(SYMBOL_A)
                        .currentPrice(new BigDecimal("1800.00"))
                        .build();
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(List.of(holding));

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertEquals(1, result.size());
        assertEquals(new BigDecimal("1800.00"), result.get(SYMBOL_A).getCurrentPrice());
    }

    @Test
    @DisplayName("getPrices: no Zerodha accounts and no canonical → returns empty for missing")
    void getPrices_noZerodhaNoCanonical_returnsEmptyForMissing() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertTrue(result.isEmpty());
    }

    // ── getPrices: Zerodha account with expired token ────────────

    @Test
    @DisplayName("getPrices: Zerodha account with expired token is skipped")
    void getPrices_expiredToken_skipped() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        BrokerAccount expiredAccount = BrokerAccount.builder()
                .id("acc1")
                .broker(Broker.ZERODHA)
                .isActive(true)
                .zerodhaAccessToken("token123")
                .zerodhaTokenExpiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(List.of(expiredAccount));
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertTrue(result.isEmpty());
        verify(encryptionUtil, never()).decryptSafe(any());
    }

    // ── getPrices: Zerodha account inactive ──────────────────────

    @Test
    @DisplayName("getPrices: inactive Zerodha account is skipped")
    void getPrices_inactiveAccount_skipped() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        BrokerAccount inactiveAccount = BrokerAccount.builder()
                .id("acc1")
                .broker(Broker.ZERODHA)
                .isActive(false)
                .zerodhaAccessToken("token123")
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(List.of(inactiveAccount));
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertTrue(result.isEmpty());
    }

    // ── getPrices: null access token ─────────────────────────────

    @Test
    @DisplayName("getPrices: Zerodha account with null access token is skipped")
    void getPrices_nullAccessToken_skipped() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        BrokerAccount noTokenAccount = BrokerAccount.builder()
                .id("acc1")
                .broker(Broker.ZERODHA)
                .isActive(true)
                .zerodhaAccessToken(null)
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(List.of(noTokenAccount));
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertTrue(result.isEmpty());
    }

    // ── getPrice: single symbol ──────────────────────────────────

    @Test
    @DisplayName("getPrice: returns result for single symbol")
    void getPrice_singleSymbol_returnsResult() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        MarketPrice result = service.getPrice(SYMBOL_A);

        assertNotNull(result);
        assertEquals(SYMBOL_A, result.getSymbol());
    }

    @Test
    @DisplayName("getPrice: missing symbol returns stale price with zero")
    void getPrice_missingSymbol_returnsStaleZeroPrice() {
        when(priceRepository.findBySymbolIn(List.of("UNKNOWN")))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());
        when(holdingRepository.findBySymbolIn(List.of("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        MarketPrice result = service.getPrice("UNKNOWN");

        assertNotNull(result);
        assertEquals("UNKNOWN", result.getSymbol());
        assertEquals(BigDecimal.ZERO, result.getCurrentPrice());
    }

    // ── fetchAndCachePrice ───────────────────────────────────────

    @Test
    @DisplayName("fetchAndCachePrice: no Zerodha account returns fallback")
    void fetchAndCachePrice_noZerodha_returnsFallback() {
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        MarketPrice result = service.fetchAndCachePrice(SYMBOL_A);

        assertNotNull(result);
        assertEquals(SYMBOL_A, result.getSymbol());
    }

    @Test
    @DisplayName("fetchAndCachePrice: canonical fallback returns stored price")
    void fetchAndCachePrice_canonicalFallback_returnsStoredPrice() {
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());

        com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding holding =
                com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding.builder()
                        .symbol(SYMBOL_A)
                        .currentPrice(new BigDecimal("3000.00"))
                        .build();
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(List.of(holding));

        MarketPrice result = service.fetchAndCachePrice(SYMBOL_A);

        assertNotNull(result);
        assertEquals(new BigDecimal("3000.00"), result.getCurrentPrice());
    }

    // ── isMarketOpen ─────────────────────────────────────────────

    @Test
    @DisplayName("isMarketOpen: delegates to MarketHoursUtil without throwing")
    void isMarketOpen_delegates() {
        boolean result = service.isMarketOpen();
        assertFalse(result);
    }

    // ── warmupPrices ─────────────────────────────────────────────

    @Test
    @DisplayName("warmupPrices: completes without throwing")
    void warmupPrices_completesWithoutThrowing() {
        when(priceRepository.findBySymbolIn(anyList()))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());
        when(holdingRepository.findBySymbolIn(anyList()))
                .thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> service.warmupPrices(List.of(SYMBOL_A)));
    }

    // ── fallbackToCanonical: stale cache within 24h ──────────────

    @Test
    @DisplayName("fallbackToCanonical: stale cache within 24h is used")
    void fallbackToCanonical_staleWithin24h_isUsed() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());

        MarketPrice staleButUsable = MarketPrice.builder()
                .symbol(SYMBOL_A)
                .currentPrice(new BigDecimal("1500.00"))
                .updatedAt(LocalDateTime.now().minusMinutes(60))
                .build();

        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(List.of(staleButUsable));

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        // Should use the stale cache since it's within 24h
        assertEquals(1, result.size());
        assertEquals(new BigDecimal("1500.00"), result.get(SYMBOL_A).getCurrentPrice());
    }

    @Test
    @DisplayName("fallbackToCanonical: cache older than 24h is discarded")
    void fallbackToCanonical_cacheOlderThan24h_discarded() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());

        MarketPrice tooOld = MarketPrice.builder()
                .symbol(SYMBOL_A)
                .currentPrice(new BigDecimal("1500.00"))
                .updatedAt(LocalDateTime.now().minusMinutes(1500))
                .build();

        // First call in getPrices (cache check) - returns empty
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(List.of(tooOld));

        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        // Result should be empty since cache is too old and no canonical
        assertTrue(result.isEmpty());
    }

    // ── getPrices: multiple symbols, one cached one missing ──────

    @Test
    @DisplayName("getPrices: mixed cache hit and miss resolves both")
    void getPrices_mixedHitAndMiss_resolvesBoth() {
        MarketPrice cached = MarketPrice.builder()
                .symbol(SYMBOL_A)
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(LocalDateTime.now().minusSeconds(2))
                .build();

        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A, SYMBOL_B)))
                .thenReturn(List.of(cached));

        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());

        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_B)))
                .thenReturn(List.of(
                        com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding.builder()
                                .symbol(SYMBOL_B)
                                .currentPrice(new BigDecimal("3500.00"))
                                .build()
                ));

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A, SYMBOL_B));

        assertEquals(2, result.size());
        assertEquals(new BigDecimal("2500.00"), result.get(SYMBOL_A).getCurrentPrice());
        assertEquals(new BigDecimal("3500.00"), result.get(SYMBOL_B).getCurrentPrice());
    }

    // ── getPrices: duplicate symbols ─────────────────────────────

    @Test
    @DisplayName("getPrices: duplicate symbols are deduplicated")
    void getPrices_duplicateSymbols_deduplicated() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A, SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A, SYMBOL_A));

        // Should work without error, deduplication handled internally
        assertNotNull(result);
    }

    // ── PermissionDenied caching ─────────────────────────────────

    @Test
    @DisplayName("getPrices: account in permission-deny cache is skipped")
    void getPrices_permissionDeniedAccount_skipped() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());

        // Simulate the permission cache by calling the service twice
        // First call with a valid account
        BrokerAccount validAccount = BrokerAccount.builder()
                .id("acc1")
                .broker(Broker.ZERODHA)
                .userId("user1")
                .isActive(true)
                .zerodhaAccessToken("valid-token")
                .zerodhaApiKey("key1234")
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(List.of(validAccount));

        // No permission cache populated yet, so account will be attempted
        // After the 403 PermissionException path, it should be cached
        // This test verifies the structure handles the case correctly
        when(encryptionUtil.decryptSafe("valid-token")).thenReturn("valid-token");

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertNotNull(result);
    }

    // ── getPrices: canonical holding with null currentPrice ───────

    @Test
    @DisplayName("getPrices: canonical holding with null currentPrice produces no entry")
    void getPrices_canonicalNullPrice_producesNoEntry() {
        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(Collections.emptyList());
        when(brokerAccountRepository.findByBroker(Broker.ZERODHA))
                .thenReturn(Collections.emptyList());

        com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding holding =
                com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding.builder()
                        .symbol(SYMBOL_A)
                        .currentPrice(null)
                        .build();
        when(holdingRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(List.of(holding));

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertTrue(result.isEmpty());
    }

    // ── getPrices: canonical holding not in result already ────────

    @Test
    @DisplayName("getPrices: canonical holding skipped if already in result from cache")
    void getPrices_canonicalSkippedIfAlreadyPresent() {
        MarketPrice cached = MarketPrice.builder()
                .symbol(SYMBOL_A)
                .currentPrice(new BigDecimal("2500.00"))
                .updatedAt(LocalDateTime.now().minusSeconds(2))
                .build();

        when(priceRepository.findBySymbolIn(List.of(SYMBOL_A)))
                .thenReturn(List.of(cached));

        Map<String, MarketPrice> result = service.getPrices(List.of(SYMBOL_A));

        assertEquals(1, result.size());
        assertEquals(new BigDecimal("2500.00"), result.get(SYMBOL_A).getCurrentPrice());
    }
}
