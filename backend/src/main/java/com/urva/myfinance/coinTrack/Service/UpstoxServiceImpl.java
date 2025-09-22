package com.urva.myfinance.coinTrack.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import com.urva.myfinance.coinTrack.Model.UpstoxAccount;
import com.urva.myfinance.coinTrack.Repository.UpstoxAccountRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Upstox broker service implementation for handling OAuth2-based API
 * integration.
 * Provides secure authentication, token management, and data fetching
 * capabilities.
 */
@Slf4j
@Service("upstoxServiceImpl")
public class UpstoxServiceImpl implements BrokerService {

    private final UpstoxAccountRepository upstoxAccountRepository;
    private final RestTemplate restTemplate;
    private final Map<String, ReentrantLock> userLocks = new HashMap<>();

    @Value("${upstox.api.base-url:https://api.upstox.com}")
    private String upstoxApiBaseUrl;

    @Value("${upstox.api.enhanced-url:https://api-hft.upstox.com}")
    private String upstoxEnhancedUrl;

    @Value("${upstox.api.token-endpoint:/v2/login/authorization/token}")
    private String tokenEndpoint;

    @Value("${upstox.api.refresh-endpoint:/v2/login/authorization/token}")
    private String refreshEndpoint;

    @Value("${upstox.api.holdings-endpoint:/v2/portfolio/long-term-holdings}")
    private String holdingsEndpoint;

    @Value("${upstox.api.orders-endpoint:/v2/order/retrieve-all}")
    private String ordersEndpoint;

    @Value("${upstox.api.profile-endpoint:/v2/user/profile}")
    private String profileEndpoint;

    public UpstoxServiceImpl(UpstoxAccountRepository upstoxAccountRepository) {
        this.upstoxAccountRepository = upstoxAccountRepository;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public Map<String, Object> connect(String appUserId, Map<String, Object> credentials) {
        log.info("Connecting Upstox account for user: {}", appUserId);

        try {
            String apiKey = (String) credentials.get("apiKey");
            String apiSecret = (String) credentials.get("apiSecret");
            String authorizationCode = (String) credentials.get("authorizationCode");
            String redirectUri = (String) credentials.get("redirectUri");

            if (!StringUtils.hasText(apiKey) || !StringUtils.hasText(apiSecret) ||
                    !StringUtils.hasText(authorizationCode) || !StringUtils.hasText(redirectUri)) {
                throw new IllegalArgumentException(
                        "Missing required Upstox credentials: apiKey, apiSecret, authorizationCode, redirectUri");
            }

            // Get or create account
            UpstoxAccount account = upstoxAccountRepository.findByAppUserId(appUserId)
                    .orElse(new UpstoxAccount());

            // Set credentials
            account.setAppUserId(appUserId);
            account.setUpstoxApiKey(apiKey);
            account.setUpstoxApiSecret(apiSecret);
            account.setUpstoxRedirectUri(redirectUri);

            // Prepare OAuth2 token exchange request
            MultiValueMap<String, String> tokenRequest = new LinkedMultiValueMap<>();
            tokenRequest.add("code", authorizationCode);
            tokenRequest.add("client_id", apiKey);
            tokenRequest.add("client_secret", apiSecret);
            tokenRequest.add("redirect_uri", redirectUri);
            tokenRequest.add("grant_type", "authorization_code");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Accept", "application/json");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(tokenRequest, headers);

            // Make token exchange API call
            String tokenUrl = upstoxApiBaseUrl + tokenEndpoint;
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();

                if (responseBody.containsKey("access_token")) {
                    String accessToken = (String) responseBody.get("access_token");
                    String refreshToken = (String) responseBody.get("refresh_token");
                    Integer expiresIn = (Integer) responseBody.get("expires_in");

                    // Update account with tokens
                    account.setAccessToken(accessToken);
                    account.setRefreshToken(refreshToken);
                    account.setTokenCreatedAt(LocalDateTime.now());

                    // Set token expiry based on expires_in (default to 6 hours if not provided)
                    int expiryHours = expiresIn != null ? expiresIn / 3600 : 6;
                    account.setTokenExpiresAt(LocalDateTime.now().plusHours(expiryHours));
                    account.setIsActive(true);

                    // Fetch user profile to get additional details
                    try {
                        Map<String, Object> profileData = fetchUserProfile(accessToken);
                        if (profileData != null && profileData.containsKey("data")) {
                            Map<String, Object> profile = (Map<String, Object>) profileData.get("data");
                            account.setUserName((String) profile.get("user_name"));
                            account.setUserType((String) profile.get("user_type"));
                            account.setEmail((String) profile.get("email"));

                            // Set userId from profile if available
                            String userId = (String) profile.get("user_id");
                            if (StringUtils.hasText(userId)) {
                                account.setUserId(userId);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to fetch user profile for Upstox user {}: {}", appUserId, e.getMessage());
                    }

                    // Save account
                    UpstoxAccount savedAccount = upstoxAccountRepository.save(account);

                    log.info("Successfully connected Upstox account for user: {} with userId: {}", appUserId,
                            account.getUserId());

                    Map<String, Object> connectResponse = new HashMap<>();
                    connectResponse.put("status", "connected");
                    connectResponse.put("broker", getBrokerName());
                    connectResponse.put("userId", account.getUserId());
                    connectResponse.put("userName", account.getUserName());
                    connectResponse.put("userType", account.getUserType());
                    connectResponse.put("email", account.getEmail());
                    connectResponse.put("tokenExpiresAt", account.getTokenExpiresAt());
                    connectResponse.put("accountId", savedAccount.getId());

                    return connectResponse;
                } else {
                    String errorDescription = (String) responseBody.get("error_description");
                    throw new RuntimeException("Upstox OAuth2 token exchange failed: " + errorDescription);
                }
            } else {
                throw new RuntimeException("Upstox API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error connecting Upstox account for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to connect Upstox account: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> refreshToken(String appUserId) {
        log.info("Refreshing Upstox token for user: {}", appUserId);

        ReentrantLock lock = userLocks.computeIfAbsent(appUserId, k -> new ReentrantLock());
        lock.lock();

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);

            if (!account.hasRefreshToken()) {
                throw new RuntimeException("No refresh token available for Upstox account");
            }

            // Prepare refresh token request
            MultiValueMap<String, String> refreshRequest = new LinkedMultiValueMap<>();
            refreshRequest.add("refresh_token", account.getRefreshToken());
            refreshRequest.add("client_id", account.getUpstoxApiKey());
            refreshRequest.add("client_secret", account.getUpstoxApiSecret());
            refreshRequest.add("redirect_uri", account.getUpstoxRedirectUri());
            refreshRequest.add("grant_type", "refresh_token");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Accept", "application/json");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(refreshRequest, headers);

            // Make refresh API call
            String refreshUrl = upstoxApiBaseUrl + refreshEndpoint;
            ResponseEntity<Map> response = restTemplate.postForEntity(refreshUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();

                if (responseBody.containsKey("access_token")) {
                    String accessToken = (String) responseBody.get("access_token");
                    String newRefreshToken = (String) responseBody.get("refresh_token");
                    Integer expiresIn = (Integer) responseBody.get("expires_in");

                    // Update account with new tokens
                    account.setAccessToken(accessToken);
                    if (StringUtils.hasText(newRefreshToken)) {
                        account.setRefreshToken(newRefreshToken);
                    }
                    account.setTokenCreatedAt(LocalDateTime.now());

                    // Set token expiry based on expires_in (default to 6 hours if not provided)
                    int expiryHours = expiresIn != null ? expiresIn / 3600 : 6;
                    account.setTokenExpiresAt(LocalDateTime.now().plusHours(expiryHours));

                    upstoxAccountRepository.save(account);

                    Map<String, Object> refreshResponse = new HashMap<>();
                    refreshResponse.put("status", "refreshed");
                    refreshResponse.put("broker", getBrokerName());
                    refreshResponse.put("tokenExpiresAt", account.getTokenExpiresAt());

                    log.info("Successfully refreshed Upstox token for user: {}", appUserId);
                    return refreshResponse;
                } else {
                    String errorDescription = (String) responseBody.get("error_description");
                    throw new RuntimeException("Upstox token refresh failed: " + errorDescription);
                }
            } else {
                throw new RuntimeException("Upstox refresh API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error refreshing Upstox token for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to refresh Upstox token: " + e.getMessage(), e);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Map<String, Object> fetchHoldings(String appUserId) {
        log.info("Fetching Upstox holdings for user: {}", appUserId);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String holdingsUrl = upstoxApiBaseUrl + holdingsEndpoint;
            ResponseEntity<Map> response = restTemplate.exchange(holdingsUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("broker", getBrokerName());
                result.put("data", responseBody.get("data"));
                result.put("lastUpdated", LocalDateTime.now());

                log.info("Successfully fetched holdings for Upstox user: {}", appUserId);
                return result;
            } else {
                throw new RuntimeException("Upstox holdings API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error fetching Upstox holdings for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Upstox holdings: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> fetchOrders(String appUserId) {
        log.info("Fetching Upstox orders for user: {}", appUserId);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String ordersUrl = upstoxApiBaseUrl + ordersEndpoint;
            ResponseEntity<Map> response = restTemplate.exchange(ordersUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("broker", getBrokerName());
                result.put("data", responseBody.get("data"));
                result.put("lastUpdated", LocalDateTime.now());

                log.info("Successfully fetched orders for Upstox user: {}", appUserId);
                return result;
            } else {
                throw new RuntimeException("Upstox orders API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error fetching Upstox orders for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Upstox orders: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> disconnect(String appUserId) {
        log.info("Disconnecting Upstox account for user: {}", appUserId);

        try {
            UpstoxAccount account = upstoxAccountRepository.findByAppUserId(appUserId)
                    .orElseThrow(() -> new RuntimeException("Upstox account not found for user: " + appUserId));

            // Clear sensitive data
            account.setAccessToken(null);
            account.setRefreshToken(null);
            account.setTokenCreatedAt(null);
            account.setTokenExpiresAt(null);
            account.setIsActive(false);

            upstoxAccountRepository.save(account);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "disconnected");
            response.put("broker", getBrokerName());
            response.put("message", "Upstox account successfully disconnected");

            log.info("Successfully disconnected Upstox account for user: {}", appUserId);
            return response;

        } catch (Exception e) {
            log.error("Error disconnecting Upstox account for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to disconnect Upstox account: " + e.getMessage(), e);
        }
    }

    @Override
    public String getBrokerName() {
        return "UPSTOX";
    }

    @Override
    public boolean isConnected(String appUserId) {
        try {
            UpstoxAccount account = upstoxAccountRepository.findByAppUserId(appUserId).orElse(null);
            return account != null && account.getIsActive() && account.hasValidToken();
        } catch (Exception e) {
            log.error("Error checking Upstox connection status for user {}: {}", appUserId, e.getMessage());
            return false;
        }
    }

    @Override
    public Map<String, Object> fetchPositions(String appUserId) {
        log.info("Fetching Upstox positions for user: {}", appUserId);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String positionsUrl = upstoxApiBaseUrl + "/v2/portfolio/short-term-positions";
            ResponseEntity<Map> response = restTemplate.exchange(positionsUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("broker", getBrokerName());
                result.put("data", responseBody.get("data"));
                result.put("lastUpdated", LocalDateTime.now());

                log.info("Successfully fetched positions for Upstox user: {}", appUserId);
                return result;
            } else {
                throw new RuntimeException("Upstox positions API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error fetching Upstox positions for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Upstox positions: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> fetchPortfolio(String appUserId) {
        log.info("Fetching Upstox portfolio for user: {}", appUserId);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            // Fetch holdings, positions, and margins for comprehensive portfolio
            Map<String, Object> portfolioData = new HashMap<>();
            
            try {
                // Fetch holdings
                String holdingsUrl = upstoxApiBaseUrl + "/v2/portfolio/long-term-holdings";
                ResponseEntity<Map> holdingsResponse = restTemplate.exchange(holdingsUrl, HttpMethod.GET, request, Map.class);
                if (holdingsResponse.getStatusCode().is2xxSuccessful() && holdingsResponse.getBody() != null) {
                    portfolioData.put("holdings", holdingsResponse.getBody().get("data"));
                }
            } catch (Exception e) {
                log.warn("Failed to fetch holdings for user {}: {}", appUserId, e.getMessage());
                portfolioData.put("holdings", null);
            }

            try {
                // Fetch positions
                String positionsUrl = upstoxApiBaseUrl + "/v2/portfolio/short-term-positions";
                ResponseEntity<Map> positionsResponse = restTemplate.exchange(positionsUrl, HttpMethod.GET, request, Map.class);
                if (positionsResponse.getStatusCode().is2xxSuccessful() && positionsResponse.getBody() != null) {
                    portfolioData.put("positions", positionsResponse.getBody().get("data"));
                }
            } catch (Exception e) {
                log.warn("Failed to fetch positions for user {}: {}", appUserId, e.getMessage());
                portfolioData.put("positions", null);
            }

            try {
                // Fetch margins
                String marginsUrl = upstoxApiBaseUrl + "/v2/user/get-funds-and-margin";
                ResponseEntity<Map> marginsResponse = restTemplate.exchange(marginsUrl, HttpMethod.GET, request, Map.class);
                if (marginsResponse.getStatusCode().is2xxSuccessful() && marginsResponse.getBody() != null) {
                    portfolioData.put("margins", marginsResponse.getBody().get("data"));
                }
            } catch (Exception e) {
                log.warn("Failed to fetch margins for user {}: {}", appUserId, e.getMessage());
                portfolioData.put("margins", null);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("broker", getBrokerName());
            response.put("data", portfolioData);
            response.put("lastUpdated", LocalDateTime.now());

            log.info("Successfully fetched portfolio for Upstox user: {}", appUserId);
            return response;

        } catch (Exception e) {
            log.error("Error fetching Upstox portfolio for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Upstox portfolio: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> placeOrder(String appUserId, Map<String, Object> orderDetails) {
        log.info("Placing Upstox order for user: {}", appUserId);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            // Extract order parameters
            String instrumentToken = (String) orderDetails.get("instrument_token");
            Integer quantity = (Integer) orderDetails.get("quantity");
            Double price = (Double) orderDetails.get("price");
            String product = (String) orderDetails.get("product");
            String validity = (String) orderDetails.get("validity");
            String orderType = (String) orderDetails.get("order_type");
            String transactionType = (String) orderDetails.get("transaction_type");

            // Validate required parameters
            if (instrumentToken == null || quantity == null || product == null ||
                    orderType == null || transactionType == null) {
                throw new IllegalArgumentException("Missing required order parameters");
            }

            // Prepare order request
            Map<String, Object> orderRequest = new HashMap<>();
            orderRequest.put("instrument_token", instrumentToken);
            orderRequest.put("quantity", quantity);
            orderRequest.put("product", product);
            orderRequest.put("validity", validity != null ? validity : "DAY");
            orderRequest.put("order_type", orderType);
            orderRequest.put("transaction_type", transactionType);
            orderRequest.put("tag", orderDetails.getOrDefault("tag", ""));
            orderRequest.put("disclosed_quantity", orderDetails.getOrDefault("disclosed_quantity", 0));
            orderRequest.put("trigger_price", orderDetails.getOrDefault("trigger_price", 0));
            orderRequest.put("is_amo", orderDetails.getOrDefault("is_amo", false));

            if (price != null) {
                orderRequest.put("price", price);
            }

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(orderRequest, headers);

            // Use enhanced URL for order placement
            String orderUrl = upstoxEnhancedUrl + "/v2/order/place";
            ResponseEntity<Map> response = restTemplate.postForEntity(orderUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("broker", getBrokerName());
                result.put("order_id", responseBody.get("data"));
                result.put("message", "Order placed successfully");
                result.put("timestamp", LocalDateTime.now());

                log.info("Successfully placed order for Upstox user: {}", appUserId);
                return result;
            } else {
                throw new RuntimeException("Upstox place order failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error placing Upstox order for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to place Upstox order: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> cancelOrder(String appUserId, String orderId) {
        log.info("Cancelling Upstox order for user: {}, orderId: {}", appUserId, orderId);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            // Use enhanced URL for order cancellation
            String cancelUrl = upstoxEnhancedUrl + "/v2/order/cancel/" + orderId;
            ResponseEntity<Map> response = restTemplate.exchange(cancelUrl, HttpMethod.DELETE, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("broker", getBrokerName());
                result.put("order_id", orderId);
                result.put("message", "Order cancelled successfully");
                result.put("data", responseBody.get("data"));
                result.put("timestamp", LocalDateTime.now());

                log.info("Successfully cancelled order for Upstox user: {}, order_id: {}", appUserId, orderId);
                return result;
            } else {
                throw new RuntimeException("Upstox cancel order failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error cancelling Upstox order for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to cancel Upstox order: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getQuote(String appUserId, String instrument) {
        log.info("Fetching Upstox quote for user: {}, instrument: {}", appUserId, instrument);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String quoteUrl = upstoxApiBaseUrl + "/v2/market-quote/quotes?instrument_key=" + instrument;
            ResponseEntity<Map> response = restTemplate.exchange(quoteUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("broker", getBrokerName());
                result.put("instrument", instrument);
                result.put("data", responseBody.get("data"));
                result.put("timestamp", LocalDateTime.now());

                log.info("Successfully fetched quote for Upstox user: {}, instrument: {}", appUserId, instrument);
                return result;
            } else {
                throw new RuntimeException("Upstox quote API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error fetching Upstox quote for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Upstox quote: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getMargins(String appUserId) {
        log.info("Fetching Upstox margins for user: {}", appUserId);

        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String marginsUrl = upstoxApiBaseUrl + "/v2/user/get-funds-and-margin";
            ResponseEntity<Map> response = restTemplate.exchange(marginsUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("broker", getBrokerName());
                result.put("data", responseBody.get("data"));
                result.put("lastUpdated", LocalDateTime.now());

                log.info("Successfully fetched margins for Upstox user: {}", appUserId);
                return result;
            } else {
                throw new RuntimeException("Upstox margins API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error fetching Upstox margins for user {}: {}", appUserId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch Upstox margins: " + e.getMessage(), e);
        }
    }

    // Private helper methods

    private UpstoxAccount getValidatedAccount(String appUserId) {
        return upstoxAccountRepository.findByAppUserId(appUserId)
                .orElseThrow(() -> new RuntimeException("Upstox account not found for user: " + appUserId));
    }

    private void ensureValidToken(UpstoxAccount account, String appUserId) {
        if (account.isTokenExpired()) {
            log.info("Upstox token expired for user: {}. Attempting to refresh...", appUserId);
            refreshToken(appUserId);
        }
    }

    private HttpHeaders createAuthenticatedHeaders(UpstoxAccount account) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + account.getAccessToken());
        headers.set("Accept", "application/json");
        return headers;
    }

    private Map<String, Object> fetchUserProfile(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.set("Accept", "application/json");

            HttpEntity<String> request = new HttpEntity<>(headers);
            String profileUrl = upstoxApiBaseUrl + profileEndpoint;

            ResponseEntity<Map> response = restTemplate.exchange(profileUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Error fetching Upstox user profile: {}", e.getMessage());
        }
        return null;
    }

    // Additional helper methods for legacy compatibility

    /**
     * Get Upstox account by appUserId
     */
    public UpstoxAccount getAccountByAppUserId(String appUserId) {
        return upstoxAccountRepository.findByAppUserId(appUserId)
                .orElseThrow(() -> new RuntimeException("No Upstox account for user: " + appUserId));
    }

    /**
     * Get instruments master data from Upstox API
     */
    public Object getInstruments(String appUserId) {
        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String instrumentsUrl = upstoxApiBaseUrl + "/v2/option/contract";
            ResponseEntity<Map> response = restTemplate.exchange(instrumentsUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().get("data");
            } else {
                throw new RuntimeException("Upstox instruments API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new RuntimeException("Unexpected error fetching instruments for user: " + appUserId, e);
        }
    }

    /**
     * Get order history for a specific date range
     */
    public Object getOrderHistory(String appUserId, LocalDateTime fromDate, LocalDateTime toDate) {
        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String orderHistoryUrl = upstoxApiBaseUrl + "/v2/order/retrieve-all";
            ResponseEntity<Map> response = restTemplate.exchange(orderHistoryUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().get("data");
            } else {
                throw new RuntimeException("Upstox order history API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new RuntimeException("Unexpected error fetching order history for user: " + appUserId, e);
        }
    }

    /**
     * Get order details by order ID
     */
    public Object getOrderDetails(String appUserId, String orderId) {
        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String orderDetailsUrl = upstoxApiBaseUrl + "/v2/order/details?order_id=" + orderId;
            ResponseEntity<Map> response = restTemplate.exchange(orderDetailsUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().get("data");
            } else {
                throw new RuntimeException("Upstox order details API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new RuntimeException(
                    "Unexpected error fetching order details for user: " + appUserId + ", orderId: " + orderId, e);
        }
    }

    /**
     * Get trades for the day
     */
    public Object getTrades(String appUserId) {
        try {
            UpstoxAccount account = getValidatedAccount(appUserId);
            ensureValidToken(account, appUserId);

            HttpHeaders headers = createAuthenticatedHeaders(account);
            HttpEntity<String> request = new HttpEntity<>(headers);

            String tradesUrl = upstoxApiBaseUrl + "/v2/order/trades/get-trades-for-day";
            ResponseEntity<Map> response = restTemplate.exchange(tradesUrl, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().get("data");
            } else {
                throw new RuntimeException("Upstox trades API call failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new RuntimeException("Unexpected error fetching trades for user: " + appUserId, e);
        }
    }
}