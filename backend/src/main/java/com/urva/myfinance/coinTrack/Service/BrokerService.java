package com.urva.myfinance.coinTrack.Service;

import java.util.Map;

/**
 * Common interface for all broker service implementations.
 * Provides standardized methods for broker authentication, token management,
 * and data fetching operations across different brokers.
 */
public interface BrokerService {

    /**
     * Connect and authenticate with the broker using provided credentials.
     * 
     * @param appUserId   Internal application user ID
     * @param credentials Map containing broker-specific credentials
     *                    - For Zerodha: apiKey, apiSecret, requestToken
     *                    - For AngelOne: apiKey, clientId, pin, totp
     *                    - For Upstox: apiKey, apiSecret, authorizationCode
     * @return Map containing connection status and user details
     * @throws BrokerConnectionException     if connection fails
     * @throws BrokerAuthenticationException if authentication fails
     */
    Map<String, Object> connect(String appUserId, Map<String, Object> credentials);

    /**
     * Refresh the authentication token for the user if expired or about to expire.
     * 
     * @param appUserId Internal application user ID
     * @return Map containing refreshed token information
     * @throws BrokerTokenException      if token refresh fails
     * @throws BrokerConnectionException if broker is not connected
     */
    Map<String, Object> refreshToken(String appUserId);

    /**
     * Fetch holdings (stocks, mutual funds) from the broker for the user.
     * 
     * @param appUserId Internal application user ID
     * @return Map containing holdings data
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if API call fails
     */
    Map<String, Object> fetchHoldings(String appUserId);

    /**
     * Fetch orders (executed, pending, cancelled) from the broker for the user.
     * 
     * @param appUserId Internal application user ID
     * @return Map containing orders data
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if API call fails
     */
    Map<String, Object> fetchOrders(String appUserId);

    /**
     * Disconnect the user from the broker by invalidating tokens and credentials.
     * 
     * @param appUserId Internal application user ID
     * @return Map containing disconnection status
     * @throws BrokerConnectionException if disconnection fails
     */
    Map<String, Object> disconnect(String appUserId);

    /**
     * Get the broker name identifier.
     * 
     * @return String representing the broker name (e.g., "ZERODHA", "ANGEL_ONE",
     *         "UPSTOX")
     */
    String getBrokerName();

    /**
     * Check if the user is currently connected to this broker.
     * 
     * @param appUserId Internal application user ID
     * @return true if connected and authenticated, false otherwise
     */
    boolean isConnected(String appUserId);

    /**
     * Fetch positions (leveraged trades, margin positions) from the broker for the
     * user.
     * 
     * @param appUserId Internal application user ID
     * @return Map containing positions data
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if API call fails
     */
    Map<String, Object> fetchPositions(String appUserId);

    /**
     * Fetch comprehensive portfolio summary including holdings, positions, and P&L.
     * 
     * @param appUserId Internal application user ID
     * @return Map containing portfolio data with total value, P&L, and allocations
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if API call fails
     */
    Map<String, Object> fetchPortfolio(String appUserId);

    /**
     * Place a trading order (buy/sell) with the broker.
     * 
     * @param appUserId    Internal application user ID
     * @param orderDetails Map containing order parameters:
     *                     - tradingsymbol: instrument symbol
     *                     - exchange: exchange (NSE, BSE, etc.)
     *                     - transaction_type: BUY or SELL
     *                     - order_type: MARKET, LIMIT, SL, SL-M
     *                     - quantity: number of shares
     *                     - price: limit price (for LIMIT orders)
     *                     - product: CNC, MIS, NRML
     *                     - validity: DAY, IOC
     * @return Map containing order placement response with order_id
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if order placement fails
     * @throws BrokerOrderException      if order parameters are invalid
     */
    Map<String, Object> placeOrder(String appUserId, Map<String, Object> orderDetails);

    /**
     * Cancel a pending order.
     * 
     * @param appUserId Internal application user ID
     * @param orderId   Broker-specific order ID to cancel
     * @return Map containing cancellation status
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if API call fails
     * @throws BrokerOrderException      if order cannot be cancelled
     */
    Map<String, Object> cancelOrder(String appUserId, String orderId);

    /**
     * Get real-time quote for a trading instrument.
     * 
     * @param appUserId  Internal application user ID
     * @param instrument Instrument identifier (e.g., "NSE:INFY", "BSE:TCS")
     * @return Map containing quote data with LTP, bid, ask, volume, etc.
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if API call fails
     */
    Map<String, Object> getQuote(String appUserId, String instrument);

    /**
     * Get account margins and fund information.
     * 
     * @param appUserId Internal application user ID
     * @return Map containing margin data with available cash, used margin,
     *         collateral
     * @throws BrokerConnectionException if broker is not connected
     * @throws BrokerTokenException      if token is invalid or expired
     * @throws BrokerApiException        if API call fails
     */
    Map<String, Object> getMargins(String appUserId);
}