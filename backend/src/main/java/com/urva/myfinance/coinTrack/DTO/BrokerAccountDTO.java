package com.urva.myfinance.coinTrack.DTO;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for broker account responses.
 * Contains broker account information for API responses.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BrokerAccountDTO {

    /**
     * Unique identifier for the broker account.
     */
    private Long id;

    /**
     * User ID who owns this broker account.
     */
    private Long userId;

    /**
     * Broker name (e.g., "zerodha", "upstox", "angelone").
     */
    private String brokerName;

    /**
     * Broker client ID or user ID.
     */
    private String clientId;

    /**
     * Account connection status.
     */
    private Boolean isConnected;

    /**
     * Account activation status.
     */
    private Boolean isActive;

    /**
     * Last successful connection timestamp.
     */
    private LocalDateTime lastConnectedAt;

    /**
     * Account creation timestamp.
     */
    private LocalDateTime createdAt;

    /**
     * Last account update timestamp.
     */
    private LocalDateTime updatedAt;

    /**
     * Access token expiry timestamp (if applicable).
     */
    private LocalDateTime tokenExpiryAt;

    /**
     * Default constructor for JSON deserialization.
     */
    public BrokerAccountDTO() {
    }

    /**
     * Constructor with essential fields.
     * 
     * @param id          the broker account ID
     * @param userId      the user ID
     * @param brokerName  the broker name
     * @param clientId    the broker client ID
     * @param isConnected the connection status
     */
    public BrokerAccountDTO(Long id, Long userId, String brokerName, String clientId, Boolean isConnected) {
        this.id = id;
        this.userId = userId;
        this.brokerName = brokerName;
        this.clientId = clientId;
        this.isConnected = isConnected;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getBrokerName() {
        return brokerName;
    }

    public void setBrokerName(String brokerName) {
        this.brokerName = brokerName;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public Boolean getIsConnected() {
        return isConnected;
    }

    public void setIsConnected(Boolean isConnected) {
        this.isConnected = isConnected;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getLastConnectedAt() {
        return lastConnectedAt;
    }

    public void setLastConnectedAt(LocalDateTime lastConnectedAt) {
        this.lastConnectedAt = lastConnectedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getTokenExpiryAt() {
        return tokenExpiryAt;
    }

    public void setTokenExpiryAt(LocalDateTime tokenExpiryAt) {
        this.tokenExpiryAt = tokenExpiryAt;
    }

    @Override
    public String toString() {
        return "BrokerAccountDTO{" +
                "id=" + id +
                ", userId=" + userId +
                ", brokerName='" + brokerName + '\'' +
                ", clientId='" + clientId + '\'' +
                ", isConnected=" + isConnected +
                ", isActive=" + isActive +
                ", lastConnectedAt=" + lastConnectedAt +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", tokenExpiryAt=" + tokenExpiryAt +
                '}';
    }
}