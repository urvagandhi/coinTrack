package com.urva.myfinance.coinTrack.Model;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document(collection = "zerodha_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ZerodhaAccount extends BrokerAccount {

    // Per-user Zerodha API credentials
    @JsonIgnore
    private String zerodhaApiKey;

    @JsonIgnore
    private String zerodhaApiSecret;

    private String kiteUserId; // Zerodha's userId (e.g. "AB1234") - also mapped to userId in parent

    @JsonIgnore
    private String kiteAccessToken; // Access token from Kite

    @JsonIgnore
    private String kitePublicToken; // Optional: useful for some API calls

    @Override
    public String getBrokerName() {
        return "ZERODHA";
    }

    @Override
    public boolean hasCredentials() {
        return StringUtils.hasText(zerodhaApiKey) &&
                StringUtils.hasText(zerodhaApiSecret) &&
                StringUtils.hasText(kiteUserId);
    }

    @Override
    public boolean hasValidToken() {
        return StringUtils.hasText(kiteAccessToken) &&
                getTokenCreatedAt() != null &&
                !isTokenExpired();
    }

    // Helper method to sync kiteUserId with parent userId
    public void setKiteUserId(String kiteUserId) {
        this.kiteUserId = kiteUserId;
        setUserId(kiteUserId); // Keep parent userId in sync
    }
}
