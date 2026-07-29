package com.urva.myfinance.coinTrack.broker.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
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

import com.urva.myfinance.coinTrack.broker.dto.BrokerStatusResponse;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("BrokerStatusServiceImpl - Comprehensive Tests")
class BrokerStatusServiceImplTest {

    @Mock private BrokerAccountRepository brokerAccountRepository;

    @InjectMocks private BrokerStatusServiceImpl service;

    @Test
    @DisplayName("getStatus: no account → DISCONNECTED")
    void getStatus_noAccount() {
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.ZERODHA)).thenReturn(Optional.empty());
        BrokerStatusResponse resp = service.getStatus("u1", Broker.ZERODHA);
        assertEquals("DISCONNECTED", resp.getConnectionStatus());
        assertFalse(resp.isActive());
    }

    @Test
    @DisplayName("getStatus: active, valid token → CONNECTED")
    void getStatus_connected() {
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.ZERODHA).isActive(true)
                .zerodhaApiKey("key").zerodhaAccessToken("tok")
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.ZERODHA))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.ZERODHA);
        assertEquals("CONNECTED", resp.getConnectionStatus());
        assertTrue(resp.isActive());
        assertTrue(resp.isHasValidToken());
    }

    @Test
    @DisplayName("getStatus: active, token expired → EXPIRED")
    void getStatus_expired() {
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.ZERODHA).isActive(true)
                .zerodhaApiKey("key").zerodhaAccessToken("tok")
                .zerodhaTokenExpiresAt(LocalDateTime.now().minusHours(1))
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.ZERODHA))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.ZERODHA);
        assertEquals("EXPIRED", resp.getConnectionStatus());
        assertTrue(resp.isTokenExpired());
    }

    @Test
    @DisplayName("getStatus: active, no credentials → MISSING_CREDENTIALS")
    void getStatus_missingCredentials() {
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.UPSTOX).isActive(true)
                .tokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.UPSTOX))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.UPSTOX);
        assertEquals("MISSING_CREDENTIALS", resp.getConnectionStatus());
    }

    @Test
    @DisplayName("getStatus: inactive → DISCONNECTED")
    void getStatus_inactive() {
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.ANGELONE).isActive(false)
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.ANGELONE))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.ANGELONE);
        assertEquals("DISCONNECTED", resp.getConnectionStatus());
    }

    @Test
    @DisplayName("getStatus: null expiryReason → defaults to NONE")
    void getStatus_nullExpiryReason() {
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.ZERODHA).isActive(true)
                .zerodhaApiKey("key").zerodhaAccessToken("tok")
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .expiryReason(null)
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.ZERODHA))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.ZERODHA);
        assertEquals(ExpiryReason.NONE, resp.getExpiryReason());
    }

    @Test
    @DisplayName("getStatus: has expiryReason → passes through")
    void getStatus_expiryReason() {
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.ZERODHA).isActive(true)
                .zerodhaApiKey("key").zerodhaAccessToken("tok")
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .expiryReason(ExpiryReason.SECRET_ROTATION)
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.ZERODHA))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.ZERODHA);
        assertEquals(ExpiryReason.SECRET_ROTATION, resp.getExpiryReason());
    }

    @Test
    @DisplayName("getStatus: ZERODHA uses zerodhaTokenCreatedAt/ExpiresAt")
    void getStatus_zerodhaTimestamps() {
        LocalDateTime created = LocalDateTime.now().minusHours(2);
        LocalDateTime expires = LocalDateTime.now().plusHours(2);
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.ZERODHA).isActive(true)
                .zerodhaApiKey("key").zerodhaAccessToken("tok")
                .zerodhaTokenCreatedAt(created)
                .zerodhaTokenExpiresAt(expires)
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.ZERODHA))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.ZERODHA);
        assertEquals(created, resp.getTokenCreatedAt());
        assertEquals(expires, resp.getTokenExpiresAt());
    }

    @Test
    @DisplayName("getStatus: non-ZERODHA uses tokenCreatedAt/tokenExpiresAt")
    void getStatus_nonZerodhaTimestamps() {
        LocalDateTime created = LocalDateTime.now().minusHours(2);
        LocalDateTime expires = LocalDateTime.now().plusHours(2);
        BrokerAccount account = BrokerAccount.builder()
                .userId("u1").broker(Broker.UPSTOX).isActive(true)
                .upstoxApiKey("key")
                .tokenCreatedAt(created)
                .tokenExpiresAt(expires)
                .build();
        when(brokerAccountRepository.findByUserIdAndBroker("u1", Broker.UPSTOX))
                .thenReturn(Optional.of(account));

        BrokerStatusResponse resp = service.getStatus("u1", Broker.UPSTOX);
        assertEquals(created, resp.getTokenCreatedAt());
        assertEquals(expires, resp.getTokenExpiresAt());
    }
}
