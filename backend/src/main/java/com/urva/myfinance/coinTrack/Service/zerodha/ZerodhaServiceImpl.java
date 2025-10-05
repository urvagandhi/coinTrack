package com.urva.myfinance.coinTrack.Service.zerodha;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;

import org.json.JSONException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.urva.myfinance.coinTrack.Model.ZerodhaAccount;
import com.urva.myfinance.coinTrack.Repository.ZerodhaAccountRepository;
import com.urva.myfinance.coinTrack.Service.BrokerService;
import com.zerodhatech.kiteconnect.KiteConnect;
import com.zerodhatech.kiteconnect.kitehttp.exceptions.KiteException;
import com.zerodhatech.models.User;

import lombok.extern.slf4j.Slf4j;

/**
 * Zerodha broker service implementation for handling Kite Connect API
 * integration.
 * Provides secure authentication, token management, and data fetching
 * capabilities.
 */
@Slf4j
@Service("zerodhaServiceImpl")
public class ZerodhaServiceImpl implements BrokerService {

    private final ZerodhaAccountRepository zerodhaAccountRepository;
    private final Map<String, ReentrantLock> userLocks = new HashMap<>();

    @Value("${zerodha.login.url:https://kite.zerodha.com/connect/login}")
    private String zerodhaLoginUrl;

    public ZerodhaServiceImpl(ZerodhaAccountRepository zerodhaAccountRepository) {
        this.zerodhaAccountRepository = zerodhaAccountRepository;
    }

    @Override
    public Map<String, Object> connect(String appUserId, Map<String, Object> credentials) {
        log.info("Connecting Zerodha account for user: {}", appUserId);

        try {
            String apiKey = (String) credentials.get("apiKey");
            String apiSecret = (String) credentials.get("apiSecret");
            String requestToken = (String) credentials.get("requestToken");

            if (!StringUtils.hasText(apiKey) || !StringUtils.hasText(apiSecret) || !StringUtils.hasText(requestToken)) {
                throw new IllegalArgumentException(
                        "Missing required Zerodha credentials: apiKey, apiSecret, requestToken");
            }

            // Get or create account
            ZerodhaAccount account = zerodhaAccountRepository.findByAppUserId(appUserId)
                    .orElse(new ZerodhaAccount());

            // Set credentials
            account.setAppUserId(appUserId);
            account.setZerodhaApiKey(apiKey);
            account.setZerodhaApiSecret(apiSecret);

            // Initialize Kite Connect and generate session
            KiteConnect kite = new KiteConnect(apiKey);
            User kiteUser = kite.generateSession(requestToken, apiSecret);

            // Update account with session details
            account.setKiteUserId(kiteUser.userId);
            account.setKiteAccessToken(kiteUser.accessToken);
            account.setKitePublicToken(kiteUser.publicToken);
            account.setTokenCreatedAt(LocalDateTime.now());
            account.setTokenExpiresAt(LocalDateTime.now().plusHours(24)); // Zerodha tokens are valid for 24 hours
            account.setIsActive(true);

            // Save account
            ZerodhaAccount savedAccount = zerodhaAccountRepository.save(account);

            log.info("Successfully connected Zerodha account for user: {} with userId: {}", appUserId, kiteUser.userId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "connected");
            response.put("broker", getBrokerName());
            response.put("userId", kiteUser.userId);
            response.put("userType", kiteUser.userType);
            response.put("userName", kiteUser.userName);
            response.put("tokenExpiresAt", account.getTokenExpiresAt());
            response.put("accountId", savedAccount.getId());

            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha authentication failed: " + e.getMessage(), e);
        } catch (IOException | IllegalArgumentException | JSONException e) {
            log.error("Error connecting Zerodha account for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to connect Zerodha account: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> refreshToken(String appUserId) {
        log.info("Refreshing Zerodha token for user: {}", appUserId);

        ReentrantLock lock = userLocks.computeIfAbsent(appUserId, k -> new ReentrantLock());
        lock.lock();

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);

            // Zerodha doesn't support automatic token refresh
            // Tokens need to be regenerated through login flow
            Map<String, Object> response = new HashMap<>();
            response.put("status", "refresh_required");
            response.put("message", "Zerodha tokens cannot be refreshed automatically. Please re-login.");
            response.put("loginUrl", zerodhaLoginUrl + "?api_key=" + account.getZerodhaApiKey());
            response.put("broker", getBrokerName());

            // Mark account as inactive due to expired token
            account.setIsActive(false);
            zerodhaAccountRepository.save(account);

            log.warn("Zerodha token refresh not supported for user: {}. Manual re-login required.", appUserId);
            return response;

        } finally {
            lock.unlock();
        }
    }

    @Override
    public Map<String, Object> fetchHoldings(String appUserId) {
        log.info("Fetching Zerodha holdings for user: {}", appUserId);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Fetch actual holdings from Zerodha API
            Object holdings = kite.getHoldings();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("data", holdings);
            response.put("lastUpdated", LocalDateTime.now());

            log.info("Successfully fetched holdings for Zerodha user: {}", appUserId);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error fetching holdings for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha API error: " + e.getMessage(), e);
        } catch (IOException | JSONException e) {
            log.error("Error fetching Zerodha holdings for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Zerodha holdings: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> fetchOrders(String appUserId) {
        log.info("Fetching Zerodha orders for user: {}", appUserId);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Fetch actual orders from Zerodha API
            Object orders = kite.getOrders();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("data", orders);
            response.put("lastUpdated", LocalDateTime.now());

            log.info("Successfully fetched orders for Zerodha user: {}", appUserId);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error fetching orders for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha API error: " + e.getMessage(), e);
        } catch (IOException | JSONException e) {
            log.error("Error fetching Zerodha orders for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Zerodha orders: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> disconnect(String appUserId) {
        log.info("Disconnecting Zerodha account for user: {}", appUserId);

        try {
            ZerodhaAccount account = zerodhaAccountRepository.findByAppUserId(appUserId)
                    .orElseThrow(() -> new RuntimeException("Zerodha account not found for user: " + appUserId));

            // Clear sensitive data
            account.setKiteAccessToken(null);
            account.setKitePublicToken(null);
            account.setTokenCreatedAt(null);
            account.setTokenExpiresAt(null);
            account.setIsActive(false);

            zerodhaAccountRepository.save(account);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "disconnected");
            response.put("broker", getBrokerName());
            response.put("message", "Zerodha account successfully disconnected");

            log.info("Successfully disconnected Zerodha account for user: {}", appUserId);
            return response;

        } catch (Exception e) {
            log.error("Error disconnecting Zerodha account for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to disconnect Zerodha account: " + e.getMessage(), e);
        }
    }

    @Override
    public String getBrokerName() {
        return "ZERODHA";
    }

    @Override
    public boolean isConnected(String appUserId) {
        try {
            ZerodhaAccount account = zerodhaAccountRepository.findByAppUserId(appUserId).orElse(null);
            return account != null && account.getIsActive() && account.hasValidToken();
        } catch (Exception e) {
            log.error("Error checking Zerodha connection status for user {}: {}", appUserId, e.getMessage());
            return false;
        }
    }

    @Override
    public Map<String, Object> fetchPositions(String appUserId) {
        log.info("Fetching Zerodha positions for user: {}", appUserId);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Fetch actual positions from Zerodha API
            Object positions = kite.getPositions();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("data", positions);
            response.put("lastUpdated", LocalDateTime.now());

            log.info("Successfully fetched positions for Zerodha user: {}", appUserId);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error fetching positions for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha API error: " + e.getMessage(), e);
        } catch (IOException | JSONException e) {
            log.error("Error fetching Zerodha positions for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Zerodha positions: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> fetchPortfolio(String appUserId) {
        log.info("Fetching Zerodha portfolio for user: {}", appUserId);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Fetch holdings, positions, and margins for comprehensive portfolio
            Object holdings = kite.getHoldings();
            Object positions = kite.getPositions();
            Object margins = kite.getMargins();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());

            Map<String, Object> portfolioData = new HashMap<>();
            portfolioData.put("holdings", holdings);
            portfolioData.put("positions", positions);
            portfolioData.put("margins", margins);

            response.put("data", portfolioData);
            response.put("lastUpdated", LocalDateTime.now());

            log.info("Successfully fetched portfolio for Zerodha user: {}", appUserId);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error fetching portfolio for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha API error: " + e.getMessage(), e);
        } catch (IOException | JSONException e) {
            log.error("Error fetching Zerodha portfolio for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Zerodha portfolio: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> placeOrder(String appUserId, Map<String, Object> orderDetails) {
        log.info("Placing Zerodha order for user: {}", appUserId);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Extract order parameters
            String tradingSymbol = (String) orderDetails.get("tradingsymbol");
            String exchange = (String) orderDetails.get("exchange");
            String transactionType = (String) orderDetails.get("transaction_type");
            String orderType = (String) orderDetails.get("order_type");
            Integer quantity = (Integer) orderDetails.get("quantity");
            Double price = (Double) orderDetails.get("price");
            String product = (String) orderDetails.get("product");
            String validity = (String) orderDetails.get("validity");

            // Validate required parameters
            if (tradingSymbol == null || exchange == null || transactionType == null ||
                    orderType == null || quantity == null || product == null) {
                throw new IllegalArgumentException("Missing required order parameters");
            }

            // Create order parameters
            com.zerodhatech.models.OrderParams orderParams = new com.zerodhatech.models.OrderParams();
            orderParams.tradingsymbol = tradingSymbol;
            orderParams.exchange = exchange;
            orderParams.transactionType = transactionType;
            orderParams.orderType = orderType;
            orderParams.quantity = quantity;
            orderParams.product = product;
            orderParams.validity = validity != null ? validity : "DAY";

            if (price != null) {
                orderParams.price = price;
            }
            com.zerodhatech.models.Order orderResponse = kite.placeOrder(orderParams, "regular");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("order_id", orderResponse.orderId);
            response.put("message", "Order placed successfully");
            response.put("timestamp", LocalDateTime.now());

            log.info("Successfully placed order for Zerodha user: {}, order_id: {}", appUserId, orderResponse.orderId);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error placing order for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha order placement failed: " + e.getMessage(), e);
        } catch (IOException | JSONException | IllegalArgumentException e) {
            log.error("Error placing Zerodha order for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to place Zerodha order: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> cancelOrder(String appUserId, String orderId) {
        log.info("Cancelling Zerodha order for user: {}, orderId: {}", appUserId, orderId);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Cancel order using Kite Connect
            com.zerodhatech.models.Order cancelResponse = kite.cancelOrder(orderId, "regular");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("order_id", cancelResponse.orderId);
            response.put("message", "Order cancelled successfully");
            response.put("timestamp", LocalDateTime.now());

            log.info("Successfully cancelled order for Zerodha user: {}, order_id: {}", appUserId, orderId);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error cancelling order for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha order cancellation failed: " + e.getMessage(), e);
        } catch (IOException | JSONException e) {
            log.error("Error cancelling Zerodha order for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to cancel Zerodha order: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getQuote(String appUserId, String instrument) {
        log.info("Fetching Zerodha quote for user: {}, instrument: {}", appUserId, instrument);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Get quote for the instrument
            String[] instruments = { instrument };
            Object quote = kite.getQuote(instruments);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("instrument", instrument);
            response.put("data", quote);
            response.put("timestamp", LocalDateTime.now());

            log.info("Successfully fetched quote for Zerodha user: {}, instrument: {}", appUserId, instrument);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error fetching quote for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha quote fetch failed: " + e.getMessage(), e);
        } catch (IOException | JSONException e) {
            log.error("Error fetching Zerodha quote for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Zerodha quote: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getMargins(String appUserId) {
        log.info("Fetching Zerodha margins for user: {}", appUserId);

        try {
            ZerodhaAccount account = getValidatedAccount(appUserId);
            validateTokenExpiry(account);

            KiteConnect kite = createKiteClient(account);

            // Fetch margins from Zerodha API
            Object margins = kite.getMargins();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("data", margins);
            response.put("lastUpdated", LocalDateTime.now());

            log.info("Successfully fetched margins for Zerodha user: {}", appUserId);
            return response;

        } catch (KiteException e) {
            log.error("Zerodha API error fetching margins for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Zerodha API error: " + e.getMessage(), e);
        } catch (IOException | JSONException e) {
            log.error("Error fetching Zerodha margins for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Zerodha margins: " + e.getMessage(), e);
        }
    }

    // Private helper methods

    private ZerodhaAccount getValidatedAccount(String appUserId) {
        return zerodhaAccountRepository.findByAppUserId(appUserId)
                .orElseThrow(() -> new RuntimeException("Zerodha account not found for user: " + appUserId));
    }

    private void validateTokenExpiry(ZerodhaAccount account) {
        if (isTokenExpiredLegacy(account)) {
            log.warn("Zerodha token expired for user: {}. Token created at: {}, expires at: {}",
                    account.getAppUserId(), account.getTokenCreatedAt(), account.getTokenExpiresAt());
            throw new RuntimeException("Zerodha token has expired. Please re-authenticate.");
        }
    }

    /**
     * Check if token is expired using same logic as original ZerodhaService
     */
    private boolean isTokenExpiredLegacy(ZerodhaAccount account) {
        if (account.getTokenCreatedAt() == null) {
            return true; // No token creation time means expired
        }
        // Zerodha tokens are valid for 24 hours
        LocalDateTime expiryTime = account.getTokenCreatedAt().plusHours(24);
        return LocalDateTime.now().isAfter(expiryTime);
    }

    private KiteConnect createKiteClient(ZerodhaAccount account) {
        KiteConnect kite = new KiteConnect(account.getZerodhaApiKey());
        kite.setUserId(account.getKiteUserId());
        kite.setAccessToken(account.getKiteAccessToken());
        return kite;
    }

    // Additional methods from original ZerodhaService for compatibility

    /**
     * Get ZerodhaAccount by appUserId
     */
    public ZerodhaAccount getAccountByAppUserId(String appUserId) {
        return zerodhaAccountRepository.findByAppUserId(appUserId)
                .orElseThrow(() -> new RuntimeException("No Zerodha account for user: " + appUserId));
    }

    /**
     * Set or update Zerodha API key/secret for a user
     */
    public ZerodhaAccount setZerodhaCredentials(String appUserId, String apiKey, String apiSecret) {
        ZerodhaAccount account = zerodhaAccountRepository.findByAppUserId(appUserId)
                .orElse(new ZerodhaAccount());
        account.setAppUserId(appUserId);
        account.setZerodhaApiKey(apiKey);
        account.setZerodhaApiSecret(apiSecret);
        return zerodhaAccountRepository.save(account);
    }

    /**
     * First-time connect or refresh with request token (legacy method)
     */
    public ZerodhaAccount connectZerodha(String requestToken, String appUserId) throws KiteException {
        try {
            ZerodhaAccount account = zerodhaAccountRepository.findByAppUserId(appUserId)
                    .orElse(new ZerodhaAccount());

            // Fetch API key/secret from DB (must be set previously)
            String apiKey = account.getZerodhaApiKey();
            String apiSecret = account.getZerodhaApiSecret();
            if (apiKey == null || apiSecret == null) {
                throw new RuntimeException("Zerodha API key/secret not set for user.");
            }

            KiteConnect kite = new KiteConnect(apiKey);
            com.zerodhatech.models.User kiteUser = kite.generateSession(requestToken, apiSecret);

            account.setAppUserId(appUserId);
            account.setZerodhaApiKey(apiKey);
            account.setZerodhaApiSecret(apiSecret);
            account.setKiteUserId(kiteUser.userId);
            account.setKiteAccessToken(kiteUser.accessToken);
            account.setKitePublicToken(kiteUser.publicToken);
            account.setTokenCreatedAt(LocalDateTime.now());
            account.setTokenExpiresAt(LocalDateTime.now().plusHours(24)); // Zerodha tokens are valid for 24 hours
            account.setIsActive(true);

            return zerodhaAccountRepository.save(account);
        } catch (KiteException e) {
            throw new RuntimeException("Invalid or expired requestToken. Please re-login.", e);
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Error connecting to Zerodha: " + e.getMessage(), e);
        }
    }

    /**
     * Get authenticated Kite client for user (reused session) - legacy method
     */
    public KiteConnect clientFor(String appUserId) {
        ZerodhaAccount account = zerodhaAccountRepository.findByAppUserId(appUserId)
                .orElseThrow(() -> new RuntimeException("Zerodha not linked for this user"));

        if (account.getKiteAccessToken() == null) {
            throw new RuntimeException("No active token. Please login again.");
        }

        if (isTokenExpiredLegacy(account)) {
            throw new RuntimeException("Zerodha session expired. Please relogin.");
        }

        String apiKey = account.getZerodhaApiKey();
        if (apiKey == null) {
            throw new RuntimeException("Zerodha API key not set for this user.");
        }
        KiteConnect kite = new KiteConnect(apiKey);
        kite.setUserId(account.getKiteUserId());
        kite.setAccessToken(account.getKiteAccessToken());
        return kite;
    }

    /**
     * Fetch holdings from Zerodha API (legacy method)
     */
    public Object getHoldings(String appUserId) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getHoldings();
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException("Unexpected error fetching holdings for user: " + appUserId, e);
        }
    }

    /**
     * Fetch positions from Zerodha API
     */
    public Object getPositions(String appUserId) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getPositions();
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException("Unexpected error fetching positions for user: " + appUserId, e);
        }
    }

    /**
     * Fetch orders from Zerodha API (legacy method)
     */
    public Object getOrders(String appUserId) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getOrders();
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException("Unexpected error fetching orders for user: " + appUserId, e);
        }
    }

    /**
     * Fetch mutual fund holdings from Zerodha API
     */
    public Object getMFHoldings(String appUserId) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getMFHoldings();
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException("Unexpected error fetching MF holdings for user: " + appUserId, e);
        }
    }

    /**
     * Fetch SIPs for the user using Zerodha MF API - REST API
     */
    @SuppressWarnings("UseSpecificCatch")
    public Object getSIPs(String appUserId) {
        try {
            ZerodhaAccount account = zerodhaAccountRepository.findByAppUserId(appUserId)
                    .orElseThrow(() -> new RuntimeException("Zerodha not linked for this user"));
            if (account.getKiteAccessToken() == null) {
                throw new IllegalStateException("No active token. Please login again.");
            }
            if (isTokenExpiredLegacy(account)) {
                throw new IllegalStateException("Zerodha session expired. Please relogin.");
            }
            String url = "https://api.kite.trade/mf/sips";
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            String apiKey = account.getZerodhaApiKey();
            if (apiKey == null) {
                throw new IllegalStateException("Zerodha API key not set for this user.");
            }
            headers.set("Authorization", "token " + apiKey + ":" + account.getKiteAccessToken());
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.ResponseEntity<String> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET, entity, String.class);
            return response.getBody();
        } catch (RuntimeException e) {
            throw e; // Re-throw expected exceptions
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error fetching SIPs for user: " + appUserId, e);
        }
    }

    /**
     * Get instruments master data from Zerodha API
     */
    public Object getInstruments(String appUserId) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getInstruments();
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException("Unexpected error fetching instruments for user: " + appUserId, e);
        }
    }

    /**
     * Get instruments for specific exchange
     */
    public Object getInstruments(String appUserId, String exchange) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getInstruments(exchange);
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException(
                    "Unexpected error fetching instruments for user: " + appUserId + ", exchange: " + exchange, e);
        }
    }

    /**
     * Get order history for a specific date range
     */
    public Object getOrderHistory(String appUserId, LocalDateTime fromDate, LocalDateTime toDate) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            // Note: Kite Connect doesn't have direct date range order history
            // This returns all orders, which can be filtered by date on the client side
            return kite.getOrders();
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException("Unexpected error fetching order history for user: " + appUserId, e);
        }
    }

    /**
     * Get order details by order ID
     */
    public Object getOrderDetails(String appUserId, String orderId) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getOrderHistory(orderId);
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException(
                    "Unexpected error fetching order details for user: " + appUserId + ", orderId: " + orderId, e);
        }
    }

    /**
     * Get trades for the day
     */
    public Object getTrades(String appUserId) throws KiteException {
        try {
            KiteConnect kite = clientFor(appUserId);
            return kite.getTrades();
        } catch (KiteException e) {
            throw e; // Re-throw specific exceptions
        } catch (org.json.JSONException | IOException e) {
            throw new RuntimeException("Unexpected error fetching trades for user: " + appUserId, e);
        }
    }
}