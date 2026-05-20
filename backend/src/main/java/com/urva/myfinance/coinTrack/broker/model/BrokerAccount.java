package com.urva.myfinance.coinTrack.broker.model;

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

    private String zerodhaApiKey;

    @JsonIgnore
    private String encryptedZerodhaApiSecret;

    // Zerodha session tokens
    @JsonIgnore
    private String zerodhaAccessToken;

    @JsonIgnore
    private String zerodhaPublicToken;

    private LocalDateTime zerodhaTokenCreatedAt;

    private LocalDateTime zerodhaTokenExpiresAt;

    // Upstox OAuth2 client credentials
    private String upstoxApiKey;

    @JsonIgnore
    private String encryptedUpstoxApiSecret;

    private String upstoxRedirectUri;

    // AngelOne direct-login credentials (clientCode + MPIN + TOTP-seed flow).
    // AngelOne has no OAuth redirect; the backend stores the TOTP seed and
    // generates a live OTP at /connect time.
    private String angelOneApiKey;

    private String angelOneClientCode;

    @JsonIgnore
    private String encryptedAngelOnePassword;

    @JsonIgnore
    private String encryptedAngelOneTotpSecret;

    @JsonIgnore
    private String encryptedAngelOneJwtToken;

    @JsonIgnore
    private String angelOneRefreshToken;

    @JsonIgnore
    private String angelOneFeedToken;

    private LocalDateTime angelOneTokenCreatedAt;

    private LocalDateTime angelOneTokenExpiresAt;

    @JsonIgnore
    private String accessToken;

    @JsonIgnore
    private String refreshToken;

    private ExpiryReason expiryReason;

    private LocalDateTime tokenCreatedAt;

    private LocalDateTime tokenExpiresAt;

    private LocalDateTime lastSuccessfulSync;

    // Granular Sync Timestamps
    private LocalDateTime lastHoldingsSync;
    private LocalDateTime lastPositionsSync;
    private LocalDateTime lastOrdersSync;
    private LocalDateTime lastMarginSync;
    private LocalDateTime lastMfHoldingsSync;
    private LocalDateTime lastMfOrdersSync;

    private LocalDateTime lastUsed;

    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    private LocalDate createdAt;

    @LastModifiedDate
    private LocalDate updatedAt;

    // Utility methods
    public boolean hasCredentials() {
        if (Broker.ZERODHA.equals(broker)) {
            return zerodhaApiKey != null && !zerodhaApiKey.isEmpty();
        }
        if (Broker.UPSTOX.equals(broker)) {
            return upstoxApiKey != null && !upstoxApiKey.isEmpty()
                    && encryptedUpstoxApiSecret != null && !encryptedUpstoxApiSecret.isEmpty();
        }
        if (Broker.ANGELONE.equals(broker)) {
            return angelOneApiKey != null && !angelOneApiKey.isEmpty()
                    && angelOneClientCode != null && !angelOneClientCode.isEmpty()
                    && encryptedAngelOnePassword != null && !encryptedAngelOnePassword.isEmpty()
                    && encryptedAngelOneTotpSecret != null && !encryptedAngelOneTotpSecret.isEmpty();
        }
        return accessToken != null && !accessToken.isEmpty();
    }

    public boolean hasValidToken() {
        if (Broker.ZERODHA.equals(broker)) {
            return zerodhaAccessToken != null && !isTokenExpired();
        }
        if (Broker.ANGELONE.equals(broker)) {
            return encryptedAngelOneJwtToken != null && !isTokenExpired();
        }
        return accessToken != null && !isTokenExpired();
    }

    public boolean isTokenExpired() {
        if (Broker.ZERODHA.equals(broker)) {
            if (zerodhaTokenExpiresAt == null) {
                return true;
            }
            return LocalDateTime.now().isAfter(zerodhaTokenExpiresAt);
        }
        if (Broker.ANGELONE.equals(broker)) {
            if (angelOneTokenExpiresAt == null) {
                return true;
            }
            return LocalDateTime.now().isAfter(angelOneTokenExpiresAt);
        }
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
        status.put("expiryReason", expiryReason);

        // Distinguish three states for the UI:
        //  CONNECTED       — everything valid
        //  NEEDS_RECONNECT — credentials present but Zerodha rejected the token; user just needs to redo OAuth
        //  DISCONNECTED    — no credentials or account inactive
        boolean needsReconnect = Boolean.TRUE.equals(isActive)
                && hasCredentials()
                && (expiryReason != null && expiryReason != ExpiryReason.NONE
                    || !hasValidToken());
        String connectionStatus;
        if (Boolean.TRUE.equals(isActive) && hasCredentials() && hasValidToken() && !isTokenExpired()
                && (expiryReason == null || expiryReason == ExpiryReason.NONE)) {
            connectionStatus = "CONNECTED";
        } else if (needsReconnect) {
            connectionStatus = "NEEDS_RECONNECT";
        } else {
            connectionStatus = "DISCONNECTED";
        }
        status.put("connectionStatus", connectionStatus);
        return status;
    }
}
