package com.urva.myfinance.coinTrack.broker.dto;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;
import java.time.LocalDateTime;
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
  private String brokerUserId;
  private String accountHolder;
  private String email;
  private String dematAccount;
  private java.util.List<String> exchanges;
  private java.util.List<String> products;
  private LocalDateTime tokenCreatedAt;
  private LocalDateTime tokenExpiresAt;
}
