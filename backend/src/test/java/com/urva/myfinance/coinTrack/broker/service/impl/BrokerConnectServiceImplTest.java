package com.urva.myfinance.coinTrack.broker.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.AngelOneBrokerAdapter;
import com.urva.myfinance.coinTrack.broker.adapters.upstox.UpstoxBrokerAdapter;
import com.urva.myfinance.coinTrack.broker.core.session.BrokerSession;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.broker.service.ZerodhaLiveDataService;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.portfolio.sync.PortfolioSyncService;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("BrokerConnectServiceImpl - Comprehensive Tests")
class BrokerConnectServiceImplTest {

    @Mock private ZerodhaLiveDataService zerodhaLiveDataService;
    @Mock private UpstoxBrokerAdapter upstoxBrokerAdapter;
    @Mock private AngelOneBrokerAdapter angelOneBrokerAdapter;
    @Mock private BrokerAccountRepository accountRepository;
    @Mock private PortfolioSyncService portfolioSyncService;
    @Mock private EncryptionUtil encryptionUtil;

    @InjectMocks private BrokerConnectServiceImpl service;

    private static final String USER_ID = "u1";

    // ── getLoginUrl ────────────────────────────────────────────────

    @Test
    @DisplayName("getLoginUrl: ZERODHA → throws (direct endpoint)")
    void getLoginUrl_zerodha_throws() {
        assertThrows(BrokerException.class, () -> service.getLoginUrl(Broker.ZERODHA));
    }

    @Test
    @DisplayName("getLoginUrl: UPSTOX → throws (direct endpoint)")
    void getLoginUrl_upstox_throws() {
        assertThrows(BrokerException.class, () -> service.getLoginUrl(Broker.UPSTOX));
    }

    @Test
    @DisplayName("getLoginUrl: ANGELONE → throws (no OAuth)")
    void getLoginUrl_angelone_throws() {
        assertThrows(BrokerException.class, () -> service.getLoginUrl(Broker.ANGELONE));
    }

    // ── connectAngelOne ────────────────────────────────────────────

    @Test
    @DisplayName("connectAngelOne: no account found → throws BrokerException")
    void connectAngelOne_noAccount_throws() {
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.ANGELONE)).thenReturn(Optional.empty());

        assertThrows(BrokerException.class, () -> service.connectAngelOne(USER_ID));
    }

    @Test
    @DisplayName("connectAngelOne: missing credentials → throws BrokerException")
    void connectAngelOne_missingCreds_throws() {
        BrokerAccount account = BrokerAccount.builder()
                .userId(USER_ID).broker(Broker.ANGELONE)
                .angelOneApiKey("key")
                .build();
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.ANGELONE))
                .thenReturn(Optional.of(account));

        assertThrows(BrokerException.class, () -> service.connectAngelOne(USER_ID));
    }

    @Test
    @DisplayName("connectAngelOne: authentication success → saves token + triggers sync")
    void connectAngelOne_success() {
        BrokerAccount account = BrokerAccount.builder()
                .userId(USER_ID).broker(Broker.ANGELONE)
                .angelOneApiKey("key")
                .angelOneClientCode("code")
                .encryptedAngelOnePassword("encPass")
                .encryptedAngelOneTotpSecret("encTotp")
                .build();
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.ANGELONE))
                .thenReturn(Optional.of(account));
        when(encryptionUtil.decrypt("encTotp")).thenReturn("plainTotp");
        when(angelOneBrokerAdapter.generateTotpCode("plainTotp")).thenReturn("123456");

        BrokerSession session = new BrokerSession(
                "acc-123", Broker.ANGELONE, "jwt-token", Instant.now().plusSeconds(3600),
                Map.of("refreshToken", "ref", "feedToken", "feed"));
        when(angelOneBrokerAdapter.authenticate(any())).thenReturn(CompletableFuture.completedFuture(session));
        when(encryptionUtil.encrypt("jwt-token")).thenReturn("encJwt");

        service.connectAngelOne(USER_ID);

        verify(accountRepository).save(account);
        assertEquals("encJwt", account.getEncryptedAngelOneJwtToken());
        assertEquals("ref", account.getAngelOneRefreshToken());
        assertEquals("feed", account.getAngelOneFeedToken());
        assertEquals("acc-123", account.getBrokerUserId());
        assertTrue(account.getIsActive());
    }

    @Test
    @DisplayName("connectAngelOne: auth failure → wraps as BrokerException")
    void connectAngelOne_authFailure_throws() {
        BrokerAccount account = BrokerAccount.builder()
                .userId(USER_ID).broker(Broker.ANGELONE)
                .angelOneApiKey("key")
                .angelOneClientCode("code")
                .encryptedAngelOnePassword("encPass")
                .encryptedAngelOneTotpSecret("encTotp")
                .build();
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.ANGELONE))
                .thenReturn(Optional.of(account));
        when(encryptionUtil.decrypt("encTotp")).thenReturn("plainTotp");
        when(angelOneBrokerAdapter.generateTotpCode("plainTotp")).thenReturn("123456");

        when(angelOneBrokerAdapter.authenticate(any()))
                .thenReturn(CompletableFuture.failedFuture(new RuntimeException("auth failed")));

        assertThrows(BrokerException.class, () -> service.connectAngelOne(USER_ID));
    }

    // ── handleCallback ─────────────────────────────────────────────

    @Test
    @DisplayName("handleCallback: null requestToken → throws")
    void handleCallback_nullToken_throws() {
        assertThrows(BrokerException.class, () -> service.handleCallback(USER_ID, Broker.ZERODHA, null));
    }

    @Test
    @DisplayName("handleCallback: empty requestToken → throws")
    void handleCallback_emptyToken_throws() {
        assertThrows(BrokerException.class, () -> service.handleCallback(USER_ID, Broker.ZERODHA, ""));
    }

    @Test
    @DisplayName("handleCallback: Zerodha missing credentials → throws")
    void handleCallback_zerodhaMissingCreds_throws() {
        BrokerAccount account = BrokerAccount.builder()
                .userId(USER_ID).broker(Broker.ZERODHA).build();
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.ZERODHA))
                .thenReturn(Optional.of(account));

        assertThrows(BrokerException.class,
                () -> service.handleCallback(USER_ID, Broker.ZERODHA, "reqToken"));
    }

    @Test
    @DisplayName("handleCallback: Zerodha success → exchanges token + saves")
    void handleCallback_zerodhaSuccess() {
        BrokerAccount account = BrokerAccount.builder()
                .userId(USER_ID).broker(Broker.ZERODHA)
                .zerodhaApiKey("apiKey")
                .encryptedZerodhaApiSecret("encSecret")
                .build();
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.ZERODHA))
                .thenReturn(Optional.of(account));

        Map<String, Object> tokenData = Map.of("access_token", "at", "public_token", "pt");
        when(zerodhaLiveDataService.exchangeToken("reqToken", "apiKey", "encSecret")).thenReturn(tokenData);
        when(encryptionUtil.encrypt("at")).thenReturn("encAt");
        when(zerodhaLiveDataService.extractTokenExpiry(any()))
                .thenReturn(LocalDateTime.now().plusHours(6));

        service.handleCallback(USER_ID, Broker.ZERODHA, "reqToken");

        verify(accountRepository).save(account);
        assertEquals("encAt", account.getZerodhaAccessToken());
        assertEquals("pt", account.getZerodhaPublicToken());
        assertTrue(account.getIsActive());
        assertEquals(ExpiryReason.NONE, account.getExpiryReason());
    }

    @Test
    @DisplayName("handleCallback: Upstox missing credentials → throws")
    void handleCallback_upstoxMissingCreds_throws() {
        BrokerAccount account = BrokerAccount.builder()
                .userId(USER_ID).broker(Broker.UPSTOX).build();
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.UPSTOX))
                .thenReturn(Optional.of(account));

        assertThrows(BrokerException.class,
                () -> service.handleCallback(USER_ID, Broker.UPSTOX, "reqToken"));
    }

    @Test
    @DisplayName("handleCallback: Upstox success → exchanges token + saves")
    void handleCallback_upstoxSuccess() {
        BrokerAccount account = BrokerAccount.builder()
                .userId(USER_ID).broker(Broker.UPSTOX)
                .upstoxApiKey("apiKey")
                .encryptedUpstoxApiSecret("encSecret")
                .upstoxRedirectUri("http://redirect")
                .build();
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.UPSTOX))
                .thenReturn(Optional.of(account));

        BrokerSession session = new BrokerSession(
                "acc-456", Broker.UPSTOX, "token", Instant.now().plusSeconds(7200), Map.of());
        when(upstoxBrokerAdapter.authenticate(any())).thenReturn(CompletableFuture.completedFuture(session));
        when(encryptionUtil.encrypt("token")).thenReturn("encToken");

        service.handleCallback(USER_ID, Broker.UPSTOX, "reqToken");

        verify(accountRepository).save(account);
        assertEquals("encToken", account.getAccessToken());
        assertEquals("acc-456", account.getBrokerUserId());
        assertTrue(account.getIsActive());
    }

    @Test
    @DisplayName("handleCallback: no existing account → throws (credentials required first)")
    void handleCallback_noExisting_throws() {
        when(accountRepository.findByUserIdAndBroker(USER_ID, Broker.ZERODHA))
                .thenReturn(Optional.empty());

        assertThrows(BrokerException.class,
                () -> service.handleCallback(USER_ID, Broker.ZERODHA, "reqToken"));
    }
}
