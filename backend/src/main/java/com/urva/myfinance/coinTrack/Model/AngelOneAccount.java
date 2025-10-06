package com.urva.myfinance.coinTrack.Model;

import java.time.Instant;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document(collection = "angelone_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AngelOneAccount extends BrokerAccount {

    // Angel One API credentials
    @JsonIgnore
    private String angelApiKey;

    private String angelClientId; // Angel One client ID - also mapped to userId in parent

    @JsonIgnore
    private String angelPin; // Trading PIN

    @JsonIgnore
    private String angelTotp; // TOTP for 2FA (deprecated - use totpSecret instead)

    @JsonIgnore
    private String totpSecret; // Encrypted Base32-encoded TOTP secret for automatic TOTP generation

    // Auth tokens
    @JsonIgnore
    private String jwtToken; // JWT authentication token

    @JsonIgnore
    private String refreshToken; // Refresh token for token renewal

    @JsonIgnore
    private String sessionToken; // Session token

    // 🆕 Additions for WebSocket + tracking
    @JsonIgnore
    private String feedToken; // WebSocket live feed token

    private String lastLoginStatus; // "SUCCESS" or error reason
    private Instant lastConnectedAt; // time of last successful connect

    @Override
    public String getBrokerName() {
        return "ANGEL_ONE";
    }

    @Override
    public boolean hasCredentials() {
        return StringUtils.hasText(angelApiKey) &&
                StringUtils.hasText(angelClientId) &&
                StringUtils.hasText(angelPin);
    }

    @Override
    public boolean hasValidToken() {
        return StringUtils.hasText(jwtToken) &&
                getTokenCreatedAt() != null &&
                !isTokenExpired();
    }

    public void setAngelClientId(String angelClientId) {
        this.angelClientId = angelClientId;
        setUserId(angelClientId); // Keep parent userId in sync
    }

    public boolean hasRefreshToken() {
        return StringUtils.hasText(refreshToken);
    }

    public boolean hasActiveSession() {
        return StringUtils.hasText(sessionToken) && hasValidToken();
    }

    // 🆕 Helper
    public boolean hasFeedToken() {
        return StringUtils.hasText(feedToken);
    }
}
