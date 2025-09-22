package com.urva.myfinance.coinTrack.Model;

import java.util.List;
import java.util.Map;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Document(collection = "upstox_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class UpstoxAccount extends BrokerAccount {

    // Upstox OAuth2 credentials
    @JsonIgnore
    private String upstoxApiKey;

    @JsonIgnore
    private String upstoxApiSecret;

    private String upstoxRedirectUri; // OAuth2 redirect URI

    @JsonIgnore
    private String accessToken; // OAuth2 access token

    @JsonIgnore
    private String refreshToken; // OAuth2 refresh token

    // User profile information
    private String userName; // User's name
    private String userType; // Type of user (individual, etc.)
    private String email; // User's email

    // Exchange and product information
    private List<String> exchangeInfo; // List of exchanges user has access to
    private List<String> products; // List of products user can trade

    @Override
    public String getBrokerName() {
        return "UPSTOX";
    }

    @Override
    public boolean hasCredentials() {
        return StringUtils.hasText(upstoxApiKey) &&
                StringUtils.hasText(upstoxApiSecret) &&
                StringUtils.hasText(upstoxRedirectUri);
    }

    @Override
    public boolean hasValidToken() {
        return StringUtils.hasText(accessToken) &&
                getTokenCreatedAt() != null &&
                !isTokenExpired();
    }

    // Helper method to check if refresh token is available
    public boolean hasRefreshToken() {
        return StringUtils.hasText(refreshToken);
    }

    // Helper method to check if user has access to specific exchange
    public boolean hasExchangeAccess(String exchange) {
        return exchangeInfo != null && exchangeInfo.contains(exchange);
    }

    // Helper method to check if user can trade specific product
    public boolean canTradeProduct(String product) {
        return products != null && products.contains(product);
    }

    // Override getAccountStatus to include Upstox-specific information
    @Override
    public Map<String, Object> getAccountStatus() {
        Map<String, Object> status = super.getAccountStatus();
        status.put("userName", userName);
        status.put("userType", userType);
        status.put("email", email);
        status.put("exchangeAccess", exchangeInfo);
        status.put("availableProducts", products);
        status.put("hasRefreshToken", hasRefreshToken());
        return status;
    }

    // Helper method to set userId from userName when available
    public void setUserName(String userName) {
        this.userName = userName;
        if (StringUtils.hasText(userName) && !StringUtils.hasText(getUserId())) {
            setUserId(userName); // Set parent userId if not already set
        }
    }
}