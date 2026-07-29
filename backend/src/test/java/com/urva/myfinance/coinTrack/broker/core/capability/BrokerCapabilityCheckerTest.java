package com.urva.myfinance.coinTrack.broker.core.capability;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.urva.myfinance.coinTrack.broker.core.exception.UnsupportedBrokerOperationException;
import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;

@ExtendWith(MockitoExtension.class)
class BrokerCapabilityCheckerTest {

    @Mock
    private BrokerAdapter adapter;

    @InjectMocks
    private BrokerCapabilityChecker checker;

    @Test
    @DisplayName("1. supports returns true when capability present")
    void supports_CapabilityPresent_ReturnsTrue() {
        when(adapter.getCapabilities()).thenReturn(Set.of(BrokerCapability.EQUITY_HOLDINGS, BrokerCapability.FUNDS));

        assertTrue(checker.supports(adapter, BrokerCapability.EQUITY_HOLDINGS));
    }

    @Test
    @DisplayName("2. supports returns false when capability absent")
    void supports_CapabilityAbsent_ReturnsFalse() {
        when(adapter.getCapabilities()).thenReturn(Set.of(BrokerCapability.EQUITY_HOLDINGS));

        assertFalse(checker.supports(adapter, BrokerCapability.MF_HOLDINGS));
    }

    @Test
    @DisplayName("3. supports returns false for empty capabilities")
    void supports_EmptyCapabilities_ReturnsFalse() {
        when(adapter.getCapabilities()).thenReturn(Set.of());

        assertFalse(checker.supports(adapter, BrokerCapability.EQUITY_HOLDINGS));
    }

    @Test
    @DisplayName("4. require does not throw when capability present")
    void require_CapabilityPresent_DoesNotThrow() {
        when(adapter.getCapabilities()).thenReturn(Set.of(BrokerCapability.FUNDS));

        assertDoesNotThrow(() -> checker.require(adapter, BrokerCapability.FUNDS));
    }

    @Test
    @DisplayName("5. require throws UnsupportedBrokerOperationException when capability absent")
    void require_CapabilityAbsent_ThrowsException() {
        when(adapter.getCapabilities()).thenReturn(Set.of(BrokerCapability.EQUITY_HOLDINGS));

        UnsupportedBrokerOperationException ex = assertThrows(
                UnsupportedBrokerOperationException.class,
                () -> checker.require(adapter, BrokerCapability.MF_HOLDINGS));

        assertNotNull(ex.getMessage());
        assertTrue(ex.getMessage().contains("MF_HOLDINGS"));
    }

    @Test
    @DisplayName("6. require with empty capabilities throws exception")
    void require_EmptyCapabilities_ThrowsException() {
        when(adapter.getCapabilities()).thenReturn(Set.of());

        assertThrows(UnsupportedBrokerOperationException.class,
                () -> checker.require(adapter, BrokerCapability.LIVE_QUOTES));
    }

    @Test
    @DisplayName("7. All capability enum values are checkable")
    void allCapabilityValues_AreCheckable() {
        when(adapter.getCapabilities()).thenReturn(Set.of(BrokerCapability.values()));

        for (BrokerCapability cap : BrokerCapability.values()) {
            assertTrue(checker.supports(adapter, cap));
        }
    }
}
