package com.urva.myfinance.coinTrack.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for Upstox broker credentials.
 * Contains all required fields for Upstox API integration.
 * Note: userId is not included as it should always come from JWT to prevent spoofing.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpstoxCredentialsDTO {

    /**
     * Upstox API key provided by Upstox for application access.
     * Required for all Upstox API calls.
     */
    @NotBlank(message = "Upstox API key is required")
    @Size(min = 10, max = 100, message = "API key must be between 10 and 100 characters")
    private String apiKey;

    /**
     * Upstox API secret provided by Upstox for secure authentication.
     * Used for generating access tokens.
     */
    @NotBlank(message = "Upstox API secret is required")
    @Size(min = 10, max = 100, message = "API secret must be between 10 and 100 characters")
    private String apiSecret;

    /**
     * Upstox client ID for the broker account.
     * Typically the user's Upstox trading account ID.
     */
    @Size(max = 50, message = "Client ID must not exceed 50 characters")
    private String clientId;

    /**
     * Authorization code received from Upstox OAuth flow.
     * Used to generate access token for API calls.
     */
    private String authorizationCode;

    /**
     * Redirect URI used in OAuth flow.
     * Must match the redirect URI registered with Upstox.
     */
    private String redirectUri;

    /**
     * Default constructor for JSON deserialization.
     */
    public UpstoxCredentialsDTO() {
    }

    /**
     * Constructor with required fields.
     * 
     * @param apiKey    the Upstox API key
     * @param apiSecret the Upstox API secret
     */
    public UpstoxCredentialsDTO(String apiKey, String apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }

    public void setApiSecret(String apiSecret) {
        this.apiSecret = apiSecret;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getAuthorizationCode() {
        return authorizationCode;
    }

    public void setAuthorizationCode(String authorizationCode) {
        this.authorizationCode = authorizationCode;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    @Override
    public String toString() {
        return "UpstoxCredentialsDTO{" +
                "apiKey='" + (apiKey != null ? "[PROTECTED]" : null) + '\'' +
                ", apiSecret='" + (apiSecret != null ? "[PROTECTED]" : null) + '\'' +
                ", clientId='" + clientId + '\'' +
                ", authorizationCode='" + (authorizationCode != null ? "[PROTECTED]" : null) + '\'' +
                ", redirectUri='" + redirectUri + '\'' +
                '}';
    }
}