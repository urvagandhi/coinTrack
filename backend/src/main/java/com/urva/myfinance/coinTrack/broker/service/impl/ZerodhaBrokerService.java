package com.urva.myfinance.coinTrack.broker.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.portfolio.model.CachedHolding;
import com.urva.myfinance.coinTrack.portfolio.model.CachedPosition;
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;
import com.urva.myfinance.coinTrack.broker.service.BrokerService;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;

/**
 * Zerodha Kite Connect broker service implementation.
 * This serves as the REFERENCE IMPLEMENTATION for other broker integrations.
 *
 * TOKEN LIFECYCLE STATE MACHINE:
 * ─────────────────────────────────────────────────
 * NEW → User has account, no token yet
 * ACTIVE → Valid access token, API calls work
 * EXPIRED → Token past 6 AM IST daily cutoff
 * REAUTH → User must re-connect via OAuth
 *
 * TRANSITIONS:
 * - NEW → ACTIVE: After successful OAuth callback + token exchange
 * - ACTIVE → EXPIRED: Daily at ~6:00 AM IST (Zerodha policy)
 * - EXPIRED → REAUTH: Detected on next API call
 * - REAUTH → ACTIVE: User completes OAuth flow again
 * ─────────────────────────────────────────────────
 *
 * IDEMPOTENCY GUARANTEES:
 * - Token exchange is safe to retry (same request_token returns same
 * access_token)
 * - Credential saving updates existing account, never duplicates
 *
 * @see BrokerService for interface contract
 */
@Service("zerodhaBrokerService")
public class ZerodhaBrokerService implements BrokerService {

    private static final Logger logger = LoggerFactory.getLogger(ZerodhaBrokerService.class);
    private static final String KITE_SESSION_TOKEN_URL = "https://api.kite.trade/session/token";
    private static final String KITE_LOGIN_URL = "https://kite.zerodha.com/connect/login?v=3&api_key=";

    private final RestTemplate restTemplate = new RestTemplate();
    private final EncryptionUtil encryptionUtil;

    @Autowired
    public ZerodhaBrokerService(EncryptionUtil encryptionUtil) {
        this.encryptionUtil = encryptionUtil;
    }

    @Override
    public String getBrokerName() {
        return Broker.ZERODHA.name();
    }

    @Override
    public boolean validateCredentials(BrokerAccount account) {
        return account.getZerodhaApiKey() != null && !account.getZerodhaApiKey().isEmpty();
    }

    @Override
    public List<CachedHolding> fetchHoldings(BrokerAccount account) {
        // TODO: Implement actual Kite API call to fetch holdings
        // Endpoint: GET /portfolio/holdings
        // Requires: Authorization header with access token
        logger.debug("fetchHoldings called for account {} - returning empty (stub)", account.getId());
        return Collections.emptyList();
    }

    @Override
    public List<CachedPosition> fetchPositions(BrokerAccount account) {
        // TODO: Implement actual Kite API call to fetch positions
        // Endpoint: GET /portfolio/positions
        // Requires: Authorization header with access token
        logger.debug("fetchPositions called for account {} - returning empty (stub)", account.getId());
        return Collections.emptyList();
    }

    @Override
    public boolean testConnection(BrokerAccount account) {
        return account.hasValidToken();
    }

    @Override
    public LocalDateTime extractTokenExpiry(BrokerAccount account) {
        // Zerodha tokens expire at ~6:00 AM IST daily
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.withHour(6).withMinute(0).withSecond(0).withNano(0);
        if (now.isAfter(expiry)) {
            expiry = expiry.plusDays(1);
        }
        return expiry;
    }

    @Override
    public Optional<String> getLoginUrl() {
        // Cannot generate login URL without API key - use getLoginUrl(String) instead
        return Optional.empty();
    }

    /**
     * Generates Zerodha Kite Connect OAuth login URL.
     *
     * @param zerodhaApiKey User's Kite Connect API key
     * @return Login URL that redirects user to Zerodha authentication
     */
    public String getLoginUrl(String zerodhaApiKey) {
        logger.debug("Generating Zerodha login URL for API key [MASKED]");
        return KITE_LOGIN_URL + zerodhaApiKey;
    }

    @Override
    public Optional<String> refreshToken(BrokerAccount account) {
        // Zerodha does not support token refresh - full re-auth required
        logger.debug("Token refresh not supported for Zerodha - returning empty");
        return Optional.empty();
    }

    @Override
    public ExpiryReason detectExpiry(Exception e) {
        String message = e.getMessage();
        if (message != null && (message.contains("TokenException") || message.contains("Invalid token"))) {
            return ExpiryReason.TOKEN_INVALID;
        }
        return ExpiryReason.NONE;
    }

    /**
     * Exchanges OAuth request_token for access_token via Kite API.
     *
     * IDEMPOTENT: Same request_token always returns same access_token.
     *
     * @param requestToken              OAuth request token from callback
     * @param zerodhaApiKey             User's API key
     * @param encryptedZerodhaApiSecret Encrypted API secret
     * @return Map containing access_token, public_token, user_id etc
     * @throws BrokerException if exchange fails
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> exchangeToken(String requestToken, String zerodhaApiKey,
            String encryptedZerodhaApiSecret) {

        logger.info("Initiating token exchange for API key [MASKED]");

        try {
            String apiSecret = encryptionUtil.decrypt(encryptedZerodhaApiSecret);

            // 1. Calculate Checksum = SHA256(api_key + request_token + api_secret)
            String data = zerodhaApiKey + requestToken + apiSecret;
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(data.getBytes(StandardCharsets.UTF_8));
            String checksum = bytesToHex(hash);

            // 2. Prepare Request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("X-Kite-Version", "3");

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("api_key", zerodhaApiKey);
            formData.add("request_token", requestToken);
            formData.add("checksum", checksum);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(formData, headers);

            // 3. Call Kite API
            logger.debug("Calling Kite session/token endpoint");
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                    KITE_SESSION_TOKEN_URL,
                    request,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("data")) {
                logger.info("Token exchange successful for API key [MASKED]");
                return (Map<String, Object>) body.get("data");
            } else {
                logger.error("Token exchange returned empty/invalid response");
                throw new BrokerException("Empty response from Zerodha", Broker.ZERODHA);
            }

        } catch (NoSuchAlgorithmException e) {
            logger.error("SHA-256 algorithm not available: {}", e.getMessage());
            throw new BrokerException("Checksum generation failed", Broker.ZERODHA);
        } catch (RestClientException e) {
            logger.error("Zerodha API call failed: {}", e.getMessage());
            throw new BrokerException("Token exchange failed: " + e.getMessage(), Broker.ZERODHA);
        } catch (BrokerException e) {
            throw e; // Re-throw broker exceptions as-is
        } catch (Exception e) {
            logger.error("Unexpected error during token exchange: {}", e.getMessage(), e);
            throw new BrokerException("Token exchange failed: " + e.getMessage(), Broker.ZERODHA);
        }
    }

    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
