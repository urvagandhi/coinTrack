package com.urva.myfinance.coinTrack.portfolio.sync.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalPosition;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.portfolio.aggregation.AggregatedPortfolio;
import com.urva.myfinance.coinTrack.portfolio.aggregation.BrokerSyncError;
import com.urva.myfinance.coinTrack.portfolio.aggregation.PortfolioAggregationService;
import com.urva.myfinance.coinTrack.portfolio.dto.ManualRefreshResponse;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;
import com.urva.myfinance.coinTrack.portfolio.model.SyncStatus;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalFundsRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.portfolio.sync.SyncSafetyService;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("PortfolioSyncServiceImpl - Comprehensive Tests")
class PortfolioSyncServiceImplTest {

    @InjectMocks private PortfolioSyncServiceImpl service;
    @Mock private BrokerAccountRepository brokerAccountRepository;
    @Mock private CanonicalHoldingRepository holdingRepository;
    @Mock private CanonicalPositionRepository positionRepository;
    @Mock private CanonicalFundsRepository fundsRepository;
    @Mock private CanonicalMfHoldingRepository mfHoldingRepository;
    @Mock private SyncLogRepository syncLogRepository;
    @Mock private PortfolioAggregationService aggregationService;
    @Mock private SyncSafetyService syncSafetyService;

    private BrokerAccount activeAccount;

    @BeforeEach
    void setUp() {
        activeAccount = BrokerAccount.builder()
                .id("acc1").userId("u1").broker(Broker.ZERODHA)
                .zerodhaApiKey("key123")
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        when(syncLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private AggregatedPortfolio emptyAgg() {
        return new AggregatedPortfolio(
                Collections.emptyList(), Collections.emptyList(),
                Collections.emptyMap(), Collections.emptyList(),
                Collections.emptyList(), Instant.now(), Collections.emptySet());
    }

    private AggregatedPortfolio aggWithHoldings(CanonicalHolding h) {
        return new AggregatedPortfolio(
                List.of(h), Collections.emptyList(),
                Collections.emptyMap(), Collections.emptyList(),
                Collections.emptyList(), Instant.now(), Collections.emptySet());
    }

    private AggregatedPortfolio aggWithPosition(CanonicalPosition p) {
        return new AggregatedPortfolio(
                Collections.emptyList(), List.of(p),
                Collections.emptyMap(), Collections.emptyList(),
                Collections.emptyList(), Instant.now(), Collections.emptySet());
    }

    private AggregatedPortfolio aggWithMfHolding(CanonicalMfHolding mf) {
        return new AggregatedPortfolio(
                Collections.emptyList(), Collections.emptyList(),
                Collections.emptyMap(), List.of(mf),
                Collections.emptyList(), Instant.now(), Collections.emptySet());
    }

    private AggregatedPortfolio aggWithError(BrokerSyncError err) {
        return new AggregatedPortfolio(
                Collections.emptyList(), Collections.emptyList(),
                Collections.emptyMap(), Collections.emptyList(),
                List.of(err), Instant.now(), Collections.emptySet());
    }

    private AggregatedPortfolio aggWithStale(Set<Broker> staleBrokers) {
        return new AggregatedPortfolio(
                Collections.emptyList(), Collections.emptyList(),
                Collections.emptyMap(), Collections.emptyList(),
                Collections.emptyList(), Instant.now(), staleBrokers);
    }

    // ══════════════════════════════════════════════════════════════
    //  syncUser
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("syncUser")
    class SyncUser {
        @Test
        @DisplayName("no accounts → returns without syncing")
        void noAccounts() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(Collections.emptyList());
            service.syncUser("u1");
            verify(aggregationService, never()).aggregateForUser(anyString());
        }

        @Test
        @DisplayName("successful sync → logs SUCCESS and updates lastSuccessfulSync")
        void success() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenReturn(emptyAgg());

            service.syncUser("u1");

            verify(aggregationService).aggregateForUser("u1");
            verify(brokerAccountRepository).save(argThat(a -> a.getLastSuccessfulSync() != null));
            verify(syncLogRepository).save(argThat(l -> SyncStatus.SUCCESS.equals(l.getStatus())));
        }

        @Test
        @DisplayName("sync with errors → logs PARTIAL_FAILURE")
        void partialFailure() {
            BrokerSyncError err = new BrokerSyncError(
                    Broker.ZERODHA, "acc1",
                    BrokerSyncError.SyncErrorType.RATE_LIMITED, "Rate limit exceeded", true);
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenReturn(aggWithError(err));

            service.syncUser("u1");

            verify(syncLogRepository).save(argThat(l -> SyncStatus.PARTIAL_FAILURE.equals(l.getStatus())));
        }

        @Test
        @DisplayName("stale broker: does NOT update lastSuccessfulSync for that broker")
        void staleBroker() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenReturn(
                    aggWithStale(Set.of(Broker.ZERODHA)));

            service.syncUser("u1");

            verify(brokerAccountRepository, never()).save(any());
        }

        @Test
        @DisplayName("exception during aggregation → throws")
        void exceptionThrown() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenThrow(new RuntimeException("Network error"));

            assertThrows(RuntimeException.class, () -> service.syncUser("u1"));
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  syncBrokerAccount / runFullSyncForAccount
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("syncBrokerAccount")
    class SyncBrokerAccount {
        @Test
        @DisplayName("inactive account → FAILURE log")
        void inactive() {
            BrokerAccount inactive = BrokerAccount.builder()
                    .id("acc2").userId("u1").broker(Broker.ZERODHA).isActive(false).build();
            when(syncSafetyService.tryAccountLock("acc2")).thenReturn(true);

            SyncLog result = service.runFullSyncForAccount(inactive);

            assertEquals(SyncStatus.FAILURE, result.getStatus());
            assertEquals("Account is inactive", result.getMessage());
            verify(aggregationService, never()).aggregateForUser(anyString());
        }

        @Test
        @DisplayName("no credentials → FAILURE log")
        void noCredentials() {
            BrokerAccount bare = BrokerAccount.builder()
                    .id("acc3").userId("u1").broker(Broker.ZERODHA).isActive(true).build();
            when(syncSafetyService.tryAccountLock("acc3")).thenReturn(true);

            SyncLog result = service.runFullSyncForAccount(bare);

            assertEquals(SyncStatus.FAILURE, result.getStatus());
            assertTrue(result.getMessage().contains("No credentials"));
        }

        @Test
        @DisplayName("expired token → FAILURE log")
        void expiredToken() {
            BrokerAccount expired = BrokerAccount.builder()
                    .id("acc4").userId("u1").broker(Broker.ZERODHA)
                    .zerodhaApiKey("key123")
                    .zerodhaTokenExpiresAt(LocalDateTime.now().minusHours(1))
                    .build();
            when(syncSafetyService.tryAccountLock("acc4")).thenReturn(true);

            SyncLog result = service.runFullSyncForAccount(expired);

            assertEquals(SyncStatus.FAILURE, result.getStatus());
            assertTrue(result.getMessage().contains("Token expired"));
        }

        @Test
        @DisplayName("successful sync → SUCCESS log")
        void success() {
            when(syncSafetyService.tryAccountLock("acc1")).thenReturn(true);
            when(aggregationService.aggregateForUser("u1")).thenReturn(emptyAgg());

            SyncLog result = service.runFullSyncForAccount(activeAccount);

            assertEquals(SyncStatus.SUCCESS, result.getStatus());
            verify(syncSafetyService).releaseAccountLock("acc1");
        }

        @Test
        @DisplayName("account lock fails → FAILURE with locked message")
        void lockFails() {
            when(syncSafetyService.tryAccountLock("acc1")).thenReturn(false);

            SyncLog result = service.runFullSyncForAccount(activeAccount);

            assertEquals(SyncStatus.FAILURE, result.getStatus());
            assertTrue(result.getMessage().contains("Already in progress"));
        }

        @Test
        @DisplayName("exception during sync → FAILURE with error, lock released")
        void exceptionDuringSync() {
            when(syncSafetyService.tryAccountLock("acc1")).thenReturn(true);
            when(aggregationService.aggregateForUser("u1")).thenThrow(new RuntimeException("API timeout"));

            SyncLog result = service.runFullSyncForAccount(activeAccount);

            assertEquals(SyncStatus.FAILURE, result.getStatus());
            assertTrue(result.getMessage().contains("API timeout"));
            verify(syncSafetyService).releaseAccountLock("acc1");
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  syncAllActiveAccounts
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("syncAllActiveAccounts")
    class SyncAllActiveAccounts {
        @Test
        @DisplayName("global lock fails → skips entirely")
        void globalLockFails() {
            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(false);

            service.syncAllActiveAccounts();

            verify(brokerAccountRepository, never()).findByIsActiveTrue(any());
            verify(syncSafetyService, never()).releaseGlobalSyncLock();
        }

        @Test
        @DisplayName("market closed → skips, releases lock")
        void marketClosed() {
            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(true);
            when(syncSafetyService.isMarketOpen()).thenReturn(false);

            service.syncAllActiveAccounts();

            verify(brokerAccountRepository, never()).findByIsActiveTrue(any());
            verify(syncSafetyService).releaseGlobalSyncLock();
        }

        @Test
        @DisplayName("expired token accounts are skipped")
        void expiredTokenSkipped() {
            BrokerAccount expired = BrokerAccount.builder()
                    .id("acc-exp").userId("u-exp").broker(Broker.ZERODHA)
                    .zerodhaApiKey("key123")
                    .zerodhaTokenExpiresAt(LocalDateTime.now().minusHours(1))
                    .build();

            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(true);
            when(syncSafetyService.isMarketOpen()).thenReturn(true);
            when(brokerAccountRepository.findByIsActiveTrue(any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(expired)));

            service.syncAllActiveAccounts();

            verify(brokerAccountRepository, never()).findByUserId("u-exp");
            verify(syncSafetyService).releaseGlobalSyncLock();
        }

        @Test
        @DisplayName("successful sync for active accounts")
        void success() {
            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(true);
            when(syncSafetyService.isMarketOpen()).thenReturn(true);
            when(brokerAccountRepository.findByIsActiveTrue(any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(activeAccount)));
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenReturn(emptyAgg());

            service.syncAllActiveAccounts();

            verify(aggregationService).aggregateForUser("u1");
            verify(syncSafetyService).releaseGlobalSyncLock();
        }

        @Test
        @DisplayName("pagination: processes multiple pages")
        void pagination() {
            BrokerAccount a1 = BrokerAccount.builder()
                    .id("a1").userId("u1").broker(Broker.ZERODHA)
                    .zerodhaApiKey("k1").zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1)).build();
            BrokerAccount a2 = BrokerAccount.builder()
                    .id("a2").userId("u2").broker(Broker.ZERODHA)
                    .zerodhaApiKey("k2")
                    .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1)).build();

            Page<BrokerAccount> page1 = new PageImpl<>(List.of(a1), PageRequest.of(0, 100), 200);
            Page<BrokerAccount> page2 = new PageImpl<>(List.of(a2), PageRequest.of(1, 100), 200);

            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(true);
            when(syncSafetyService.isMarketOpen()).thenReturn(true);
            when(brokerAccountRepository.findByIsActiveTrue(PageRequest.of(0, 100))).thenReturn(page1);
            when(brokerAccountRepository.findByIsActiveTrue(PageRequest.of(1, 100))).thenReturn(page2);
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(a1));
            when(brokerAccountRepository.findByUserId("u2")).thenReturn(List.of(a2));
            when(aggregationService.aggregateForUser("u1")).thenReturn(emptyAgg());
            when(aggregationService.aggregateForUser("u2")).thenReturn(emptyAgg());

            service.syncAllActiveAccounts();

            verify(aggregationService).aggregateForUser("u1");
            verify(aggregationService).aggregateForUser("u2");
        }

        @Test
        @DisplayName("duplicate user IDs: only synced once per cycle")
        void duplicateUsersSkipped() {
            BrokerAccount a1 = BrokerAccount.builder()
                    .id("a1").userId("u1").broker(Broker.ZERODHA)
                    .zerodhaApiKey("k1").zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1)).build();
            BrokerAccount a2 = BrokerAccount.builder()
                    .id("a2").userId("u1").broker(Broker.ANGELONE)
                    .angelOneApiKey("k2").angelOneClientCode("c2")
                    .encryptedAngelOnePassword("p2").encryptedAngelOneTotpSecret("t2")
                    .angelOneTokenExpiresAt(LocalDateTime.now().plusHours(1)).build();

            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(true);
            when(syncSafetyService.isMarketOpen()).thenReturn(true);
            when(brokerAccountRepository.findByIsActiveTrue(any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(a1, a2)));
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(a1, a2));
            when(aggregationService.aggregateForUser("u1")).thenReturn(emptyAgg());

            service.syncAllActiveAccounts();

            verify(aggregationService, times(1)).aggregateForUser("u1");
        }

        @Test
        @DisplayName("exception during user sync: caught, does not abort cycle")
        void exceptionCaught() {
            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(true);
            when(syncSafetyService.isMarketOpen()).thenReturn(true);
            when(brokerAccountRepository.findByIsActiveTrue(any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(activeAccount)));
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenThrow(new RuntimeException("Boom"));

            assertDoesNotThrow(() -> service.syncAllActiveAccounts());
            verify(syncSafetyService).releaseGlobalSyncLock();
        }

        @Test
        @DisplayName("no active accounts: nothing happens")
        void noActiveAccounts() {
            when(syncSafetyService.tryGlobalSyncLock()).thenReturn(true);
            when(syncSafetyService.isMarketOpen()).thenReturn(true);
            when(brokerAccountRepository.findByIsActiveTrue(any(PageRequest.class)))
                    .thenReturn(Page.empty());

            service.syncAllActiveAccounts();

            verify(aggregationService, never()).aggregateForUser(anyString());
            verify(syncSafetyService).releaseGlobalSyncLock();
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  triggerManualRefreshForUser
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("triggerManualRefreshForUser")
    class TriggerManualRefreshForUser {
        @Test
        @DisplayName("no accounts → not accepted")
        void noAccounts() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(Collections.emptyList());

            ManualRefreshResponse resp = service.triggerManualRefreshForUser("u1");
            assertFalse(resp.isAccepted());
            assertEquals("No accounts synced.", resp.getMessage());
        }

        @Test
        @DisplayName("valid ZERODHA account → accepted, triggeredBrokers contains ZERODHA")
        void validAccount() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenReturn(emptyAgg());

            ManualRefreshResponse resp = service.triggerManualRefreshForUser("u1");
            assertTrue(resp.isAccepted());
            assertTrue(resp.getTriggeredBrokers().contains("ZERODHA"));
        }

        @Test
        @DisplayName("expired token → skipped, not accepted")
        void expiredToken() {
            BrokerAccount expired = BrokerAccount.builder()
                    .id("acc-exp").userId("u1").broker(Broker.ZERODHA)
                    .zerodhaApiKey("key123")
                    .zerodhaTokenExpiresAt(LocalDateTime.now().minusHours(1))
                    .build();
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(expired));

            ManualRefreshResponse resp = service.triggerManualRefreshForUser("u1");
            assertFalse(resp.isAccepted());
            assertTrue(resp.getSkippedBrokers().stream().anyMatch(s -> s.contains("Invalid Token")));
        }

        @Test
        @DisplayName("no credentials → skipped")
        void noCredentials() {
            BrokerAccount bare = BrokerAccount.builder()
                    .id("acc-bare").userId("u1").broker(Broker.ZERODHA).build();
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(bare));

            ManualRefreshResponse resp = service.triggerManualRefreshForUser("u1");
            assertFalse(resp.isAccepted());
        }

        @Test
        @DisplayName("mixed valid + expired: some triggered, some skipped")
        void mixedAccounts() {
            BrokerAccount expired = BrokerAccount.builder()
                    .id("acc-exp").userId("u1").broker(Broker.UPSTOX)
                    .upstoxApiKey("k1").encryptedUpstoxApiSecret("s1")
                    .tokenExpiresAt(LocalDateTime.now().minusHours(1))
                    .build();
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(expired, activeAccount));
            when(aggregationService.aggregateForUser("u1")).thenReturn(emptyAgg());

            ManualRefreshResponse resp = service.triggerManualRefreshForUser("u1");
            assertTrue(resp.isAccepted());
            assertTrue(resp.getTriggeredBrokers().contains("ZERODHA"));
            assertTrue(resp.getSkippedBrokers().stream().anyMatch(s -> s.contains("UPSTOX")));
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  persistAggregatedData via syncUser
    // ══════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("persistAggregatedData via syncUser")
    class PersistAggregatedData {
        @Test
        @DisplayName("new holdings: saves without id lookup")
        void newHoldings() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalHolding h = CanonicalHolding.builder()
                    .isin("INE123").symbol("RELIANCE").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(aggWithHoldings(h));
            when(holdingRepository.findByUserIdAndBrokerAccountIdAndIsin(any(), any(), any()))
                    .thenReturn(Optional.empty());

            service.syncUser("u1");

            verify(holdingRepository).save(any());
        }

        @Test
        @DisplayName("existing holdings: upserts with existing id")
        void existingHoldings() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalHolding h = CanonicalHolding.builder()
                    .isin("INE123").symbol("RELIANCE").build();
            CanonicalHolding existing = CanonicalHolding.builder()
                    .id("existing-id").isin("INE123").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(aggWithHoldings(h));
            when(holdingRepository.findByUserIdAndBrokerAccountIdAndIsin(any(), any(), any()))
                    .thenReturn(Optional.of(existing));

            service.syncUser("u1");

            verify(holdingRepository).save(argThat(saved -> "existing-id".equals(saved.getId())));
        }

        @Test
        @DisplayName("new positions: saves")
        void newPositions() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalPosition p = CanonicalPosition.builder()
                    .symbol("RELIANCE").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(aggWithPosition(p));
            when(positionRepository.findByUserIdAndBrokerAccountIdAndSymbolAndInstrumentType(
                    any(), any(), any(), any()))
                    .thenReturn(Optional.empty());

            service.syncUser("u1");

            verify(positionRepository).save(any());
        }

        @Test
        @DisplayName("existing positions: upserts with existing id")
        void existingPositions() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalPosition p = CanonicalPosition.builder()
                    .symbol("RELIANCE").build();
            CanonicalPosition existing = CanonicalPosition.builder()
                    .id("pos-existing").symbol("RELIANCE").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(aggWithPosition(p));
            when(positionRepository.findByUserIdAndBrokerAccountIdAndSymbolAndInstrumentType(
                    any(), any(), any(), any()))
                    .thenReturn(Optional.of(existing));

            service.syncUser("u1");

            verify(positionRepository).save(argThat(s -> "pos-existing".equals(s.getId())));
        }

        @Test
        @DisplayName("new MF holdings: saves")
        void newMfHoldings() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalMfHolding mf = CanonicalMfHolding.builder()
                    .isin("INF123").fundName("Test Fund").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(aggWithMfHolding(mf));
            when(mfHoldingRepository.findByUserIdAndBrokerAccountIdAndIsin(any(), any(), any()))
                    .thenReturn(Optional.empty());

            service.syncUser("u1");

            verify(mfHoldingRepository).save(any());
        }

        @Test
        @DisplayName("existing MF holdings: upserts with existing id")
        void existingMfHoldings() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalMfHolding mf = CanonicalMfHolding.builder()
                    .isin("INF123").fundName("Test Fund").build();
            CanonicalMfHolding existing = CanonicalMfHolding.builder()
                    .id("mf-existing").isin("INF123").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(aggWithMfHolding(mf));
            when(mfHoldingRepository.findByUserIdAndBrokerAccountIdAndIsin(any(), any(), any()))
                    .thenReturn(Optional.of(existing));

            service.syncUser("u1");

            verify(mfHoldingRepository).save(argThat(s -> "mf-existing".equals(s.getId())));
        }

        @Test
        @DisplayName("funds: upserts correctly")
        void funds() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalFunds funds = CanonicalFunds.builder()
                    .brokerAccountId("acc1").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(
                    new AggregatedPortfolio(
                            Collections.emptyList(), Collections.emptyList(),
                            Map.of(Broker.ZERODHA, funds), Collections.emptyList(),
                            Collections.emptyList(), Instant.now(), Collections.emptySet()));
            when(fundsRepository.findByUserIdAndBrokerAccountId(any(), any()))
                    .thenReturn(Optional.empty());

            service.syncUser("u1");

            verify(fundsRepository).save(any());
        }

        @Test
        @DisplayName("existing funds: upserts with existing id")
        void existingFunds() {
            when(brokerAccountRepository.findByUserId("u1")).thenReturn(List.of(activeAccount));
            CanonicalFunds funds = CanonicalFunds.builder()
                    .brokerAccountId("acc1").build();
            CanonicalFunds existing = CanonicalFunds.builder()
                    .id("funds-existing").build();
            when(aggregationService.aggregateForUser("u1")).thenReturn(
                    new AggregatedPortfolio(
                            Collections.emptyList(), Collections.emptyList(),
                            Map.of(Broker.ZERODHA, funds), Collections.emptyList(),
                            Collections.emptyList(), Instant.now(), Collections.emptySet()));
            when(fundsRepository.findByUserIdAndBrokerAccountId(any(), any()))
                    .thenReturn(Optional.of(existing));

            service.syncUser("u1");

            verify(fundsRepository).save(argThat(s -> "funds-existing".equals(s.getId())));
        }
    }
}
