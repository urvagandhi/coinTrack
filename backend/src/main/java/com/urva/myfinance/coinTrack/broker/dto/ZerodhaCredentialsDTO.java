package com.urva.myfinance.coinTrack.broker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for Zerodha broker credentials.
 * Contains all required fields for Zerodha API integration.
 * Note: userId is not included as it should always come from JWT to prevent
 * spoofing.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ZerodhaCredentialsDTO {

    /**
     * Zerodha API key provided by Zerodha for application access.
     * Required for all Zerodha API calls.
     */
    @NotBlank(message = "Zerodha API key is required")
    @Size(min = 10, max = 100, message = "API key must be between 10 and 100 characters")
    private String zerodhaApiKey;

    /**
     * Zerodha API secret provided by Zerodha for secure authentication.
     * Used for generating access tokens.
     */
    @NotBlank(message = "Zerodha API secret is required")
    @Size(min = 10, max = 100, message = "API secret must be between 10 and 100 characters")
    private String zerodhaApiSecret;

    /**
     * Zerodha client ID (user ID) for the broker account.
     * Typically the user's Zerodha trading account ID.
     */
    @Size(max = 50, message = "Client ID must not exceed 50 characters")
    private String clientId;

    /**
     * Request token received from Zerodha OAuth flow.
     * Used to generate access token for API calls.
     */
    private String requestToken;

    /**
     * Default constructor for JSON deserialization.
     */
    public ZerodhaCredentialsDTO() {
    }

    /**
     * Constructor with required fields.
     * 
     * @param zerodhaApiKey    the Zerodha API key
     * @param zerodhaApiSecret the Zerodha API secret
     */
    public ZerodhaCredentialsDTO(String zerodhaApiKey, String zerodhaApiSecret) {
        this.zerodhaApiKey = zerodhaApiKey;
        this.zerodhaApiSecret = zerodhaApiSecret;
    }

    public String getZerodhaApiKey() {
        return zerodhaApiKey;
    }

    public void setZerodhaApiKey(String zerodhaApiKey) {
        this.zerodhaApiKey = zerodhaApiKey;
    }

    public String getZerodhaApiSecret() {
        return zerodhaApiSecret;
    }

    public void setZerodhaApiSecret(String zerodhaApiSecret) {
        this.zerodhaApiSecret = zerodhaApiSecret;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getRequestToken() {
        return requestToken;
    }

    public void setRequestToken(String requestToken) {
        this.requestToken = requestToken;
    }

    @Override
    public String toString() {
        return "ZerodhaCredentialsDTO{" +
                "zerodhaApiKey='" + (zerodhaApiKey != null ? "[PROTECTED]" : null) + '\'' +
                ", zerodhaApiSecret='" + (zerodhaApiSecret != null ? "[PROTECTED]" : null) + '\'' +
                ", clientId='" + clientId + '\'' +
                ", requestToken='" + (requestToken != null ? "[PROTECTED]" : null) + '\'' +
                '}';
    }
}