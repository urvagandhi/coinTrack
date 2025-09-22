package com.urva.myfinance.coinTrack.Model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class BrokerAccount {
    @Id
    private String id;

    private String appUserId; // Reference to internal user

    private String userId; // Broker-specific user ID

    private Boolean isActive = true; // Account status

    @JsonIgnore
    private LocalDateTime tokenCreatedAt; // When token was issued

    @JsonIgnore
    private LocalDateTime tokenExpiresAt; // When token expires

    @CreatedDate
    private LocalDate createdAt;

    @LastModifiedDate
    private LocalDate updatedAt;

    // Abstract methods that subclasses must implement
    public abstract String getBrokerName();

    public abstract boolean hasCredentials();

    public abstract boolean hasValidToken();

    // Common methods
    public boolean isTokenExpired() {
        if (tokenExpiresAt == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(tokenExpiresAt);
    }

    public Map<String, Object> getAccountStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("broker", getBrokerName());
        status.put("userId", userId);
        status.put("isActive", isActive);
        status.put("hasCredentials", hasCredentials());
        status.put("hasValidToken", hasValidToken());
        status.put("isTokenExpired", isTokenExpired());
        status.put("tokenCreatedAt", tokenCreatedAt);
        status.put("tokenExpiresAt", tokenExpiresAt);
        status.put("connectionStatus",
                isActive && hasCredentials() && hasValidToken() && !isTokenExpired() ? "CONNECTED" : "DISCONNECTED");
        return status;
    }
}