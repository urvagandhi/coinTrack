package com.urva.myfinance.coinTrack.DTO;

import java.time.LocalDateTime;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.ExpiryReason;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BrokerStatusResponse {
    private Broker broker;
    private boolean isActive;
    private boolean hasCredentials;
    private boolean hasValidToken;
    private boolean isTokenExpired;
    private ExpiryReason expiryReason;
    private LocalDateTime lastSuccessfulSync;
    private String connectionStatus; // CONNECTED, DISCONNECTED, EXPIRED
    private LocalDateTime tokenCreatedAt;
    private LocalDateTime tokenExpiresAt;
}
