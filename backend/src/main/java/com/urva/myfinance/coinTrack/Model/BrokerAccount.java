package com.urva.myfinance.coinTrack.Model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "broker_accounts")
public class BrokerAccount {
    @Id
    private String id;

    private String userId; // Reference to internal user

    private String brokerUserId; // Broker-specific user ID

    private Broker broker;

    @JsonIgnore
    private String accessToken;

    @JsonIgnore
    private String refreshToken;

    private ExpiryReason expiryReason;

    private LocalDateTime tokenCreatedAt;

    private LocalDateTime tokenExpiresAt;

    private LocalDateTime lastSuccessfulSync;

    private LocalDateTime lastUsed;

    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    private LocalDate createdAt;

    @LastModifiedDate
    private LocalDate updatedAt;

    // Utility methods
    public boolean hasCredentials() {
        return accessToken != null && !accessToken.isEmpty();
    }

    public boolean hasValidToken() {
        return accessToken != null && !isTokenExpired();
    }

    public boolean isTokenExpired() {
        if (tokenExpiresAt == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(tokenExpiresAt);
    }

    public Map<String, Object> getAccountStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("broker", broker);
        status.put("brokerUserId", brokerUserId);
        status.put("isActive", isActive);
        status.put("hasCredentials", hasCredentials());
        status.put("hasValidToken", hasValidToken());
        status.put("isTokenExpired", isTokenExpired());
        status.put("tokenCreatedAt", tokenCreatedAt);
        status.put("tokenExpiresAt", tokenExpiresAt);
        status.put("lastSuccessfulSync", lastSuccessfulSync);
        status.put("connectionStatus",
                isActive && hasCredentials() && hasValidToken() && !isTokenExpired() ? "CONNECTED" : "DISCONNECTED");
        return status;
    }
}
