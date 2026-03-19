package com.urva.myfinance.coinTrack.broker.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.FundsDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfInstrumentDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MfSipDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.MutualFundOrderDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.OrderDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.TradeDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.UserProfileDTO;

/**
 * Provides live data fetching from Zerodha Kite API for pass-through endpoints.
 * This is NOT a BrokerAdapter — it returns Kite DTOs directly for the REST API contract.
 *
 * This service replaces ZerodhaBrokerService for live API pass-through use cases.
 * It lives in broker/service/ (not broker/adapters/) so portfolio/ can import it.
 * Uses WebClient for all HTTP calls.
 */
@Service
public class ZerodhaLiveDataService {

    private static final Logger logger = LoggerFactory.getLogger(ZerodhaLiveDataService.class);
    private static final String KITE_SESSION_TOKEN_URL = "https://api.kite.trade/session/token";
    private static final String KITE_LOGIN_URL = "https://kite.zerodha.com/connect/login?v=3&api_key=";

    private final WebClient webClient;
    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public ZerodhaLiveDataService(WebClient.Builder brokerWebClientBuilder, EncryptionUtil encryptionUtil) {
        this.webClient = brokerWebClientBuilder.build();
        this.encryptionUtil = encryptionUtil;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    // ============================================================================================
    // TOKEN EXCHANGE
    // ============================================================================================

    /**
     * Exchanges OAuth request_token for access_token via Kite API.
     *
     * IDEMPOTENT: Same request_token always returns same access_token.
     *
     * @param requestToken              OAuth request token from callback
     * @param apiKey                    User's API key
     * @param encryptedApiSecret        Encrypted API secret
     * @return Map containing access_token, public_token, user_id etc
     * @throws BrokerException if exchange fails
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> exchangeToken(String requestToken, String apiKey, String encryptedApiSecret) {

        logger.info("Initiating token exchange for API key [MASKED]");

        try {
            String apiSecret = encryptionUtil.decrypt(encryptedApiSecret);

            // 1. Calculate Checksum = SHA256(api_key + request_token + api_secret)
            String data = apiKey + requestToken + apiSecret;
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(data.getBytes(StandardCharsets.UTF_8));
            String checksum = bytesToHex(hash);

            // 2. Call Kite API
            logger.debug("Calling Kite session/token endpoint");
            String responseBody = webClient.post()
                    .uri(KITE_SESSION_TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .header("X-Kite-Version", "3")
                    .body(BodyInserters.fromFormData("api_key", apiKey)
                            .with("request_token", requestToken)
                            .with("checksum", checksum))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            Map<String, Object> body = objectMapper.readValue(responseBody, Map.class);
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
        } catch (WebClientResponseException e) {
            logger.error("Zerodha API call failed: {}", e.getMessage());
            throw new BrokerException("Token exchange failed: " + e.getMessage(), Broker.ZERODHA);
        } catch (BrokerException e) {
            throw e; // Re-throw broker exceptions as-is
        } catch (Exception e) {
            logger.error("Unexpected error during token exchange: {}", e.getMessage(), e);
            throw new BrokerException("Token exchange failed: " + e.getMessage(), Broker.ZERODHA);
        }
    }

    /**
     * Extracts the token expiry time for a Zerodha account.
     * Zerodha tokens expire at ~6:00 AM IST daily.
     *
     * @param account the broker account
     * @return next 6:00 AM IST
     */
    public LocalDateTime extractTokenExpiry(BrokerAccount account) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.withHour(6).withMinute(0).withSecond(0).withNano(0);
        if (now.isAfter(expiry)) {
            expiry = expiry.plusDays(1);
        }
        return expiry;
    }

    /**
     * Generates Zerodha Kite Connect OAuth login URL.
     *
     * @param apiKey User's Kite Connect API key
     * @return Login URL that redirects user to Zerodha authentication
     */
    public String getLoginUrl(String apiKey) {
        logger.debug("Generating Zerodha login URL for API key [MASKED]");
        return KITE_LOGIN_URL + apiKey;
    }

    // ============================================================================================
    // LIVE DATA FETCH METHODS
    // ============================================================================================

    /**
     * Fetches orders from Zerodha Kite API.
     *
     * @param account the broker account with valid token
     * @return list of orders
     */
    public List<OrderDTO> fetchOrders(BrokerAccount account) {
        return fetchListFromKite(account, "https://api.kite.trade/orders", "orders", OrderDTO.class);
    }

    /**
     * Fetches trades from Zerodha Kite API.
     *
     * @param account the broker account with valid token
     * @return list of trades
     */
    public List<TradeDTO> fetchTrades(BrokerAccount account) {
        return fetchListFromKite(account, "https://api.kite.trade/trades", "trades", TradeDTO.class);
    }

    /**
     * Fetches funds/margins from Zerodha Kite API.
     * Uses manual parsing to inject raw data into equity/commodity segments.
     *
     * @param account the broker account with valid token
     * @return funds DTO with raw data injected
     */
    @SuppressWarnings("unchecked")
    public FundsDTO fetchFunds(BrokerAccount account) {
        if (!account.hasValidToken()) {
            throw new BrokerException("Invalid token", Broker.ZERODHA);
        }

        try {
            String url = "https://api.kite.trade/user/margins";

            String responseBody = webClient.get()
                    .uri(url)
                    .headers(headers -> buildKiteHeaders(headers, account))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Manual parsing
            JsonNode root = objectMapper.readTree(responseBody);
            if (root == null || !root.has("status") || !"success".equals(root.get("status").asText())) {
                throw new BrokerException("Failed to fetch margins", Broker.ZERODHA);
            }

            JsonNode dataNode = root.get("data");

            // 1. Convert to DTO
            FundsDTO fundsDTO = objectMapper.treeToValue(dataNode, FundsDTO.class);

            // 2. Inject Raw Data (Pass-Through)
            if (dataNode != null) {
                if (fundsDTO.getEquity() != null && dataNode.has("equity")) {
                    Map<String, Object> equityRaw = objectMapper.convertValue(dataNode.get("equity"), Map.class);
                    fundsDTO.getEquity().setRaw(equityRaw);
                }
                if (fundsDTO.getCommodity() != null && dataNode.has("commodity")) {
                    Map<String, Object> commodityRaw = objectMapper.convertValue(dataNode.get("commodity"), Map.class);
                    fundsDTO.getCommodity().setRaw(commodityRaw);
                }
            }

            return fundsDTO;

        } catch (BrokerException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error fetching funds for {}: {}", account.getUserId(), e.getMessage());
            throw new BrokerException("Failed to fetch funds", Broker.ZERODHA, e);
        }
    }

    /**
     * Fetches mutual fund holdings from Zerodha Kite API.
     * Uses manual mapping from raw maps to MutualFundDTO.
     *
     * @param account the broker account with valid token
     * @return list of mutual fund holdings
     */
    public List<MutualFundDTO> fetchMfHoldings(BrokerAccount account) {
        @SuppressWarnings({ "unchecked", "rawtypes" })
        List<Map<String, Object>> rawList = (List) fetchListFromKite(account, "https://api.kite.trade/mf/holdings",
                "MF Holdings", Map.class);

        List<MutualFundDTO> results = new ArrayList<>();

        for (Map<String, Object> rawMap : rawList) {
            MutualFundDTO dto = new MutualFundDTO();

            // Manual Mapping: Source of Truth = Zerodha Raw Map
            dto.setFund(getString(rawMap, "fund"));
            dto.setTradingSymbol(getString(rawMap, "tradingsymbol"));
            dto.setFolio(getString(rawMap, "folio"));
            dto.setAmc(getString(rawMap, "amc"));
            dto.setIsin(getString(rawMap, "isin"));

            dto.setQuantity(getBigDecimal(rawMap, "quantity"));
            dto.setAveragePrice(getBigDecimal(rawMap, "average_price"));
            dto.setCurrentPrice(getBigDecimal(rawMap, "last_price"));
            dto.setCurrentValue(getBigDecimal(rawMap, "current_value"));
            dto.setUnrealizedPL(getBigDecimal(rawMap, "pnl"));
            dto.setLastPriceDate(getString(rawMap, "last_price_date"));

            // Inject Raw Data (Strict Isolation)
            dto.setRaw(rawMap);

            results.add(dto);
        }
        return results;
    }

    /**
     * Fetches mutual fund orders from Zerodha Kite API.
     * Uses manual mapping from raw maps to MutualFundOrderDTO.
     *
     * @param account the broker account with valid token
     * @return list of mutual fund orders
     */
    public List<MutualFundOrderDTO> fetchMfOrders(BrokerAccount account) {
        @SuppressWarnings({ "unchecked", "rawtypes" })
        List<Map<String, Object>> rawList = (List) fetchListFromKite(account, "https://api.kite.trade/mf/orders",
                "MF Orders", Map.class);

        List<MutualFundOrderDTO> results = new ArrayList<>();

        for (Map<String, Object> rawMap : rawList) {
            MutualFundOrderDTO dto = new MutualFundOrderDTO();

            // Manual Mapping
            dto.setOrderId(getString(rawMap, "order_id"));
            dto.setFund(getString(rawMap, "fund"));
            dto.setTradingSymbol(getString(rawMap, "tradingsymbol"));
            dto.setTransactionType(getString(rawMap, "transaction_type"));
            dto.setAmount(getBigDecimal(rawMap, "amount"));
            dto.setStatus(getString(rawMap, "status"));

            // Date Logic: exchange_timestamp (execution) vs order_timestamp (creation)
            // Priority: exchange_timestamp > order_date (legacy) for executionDate
            String exchangeTimestamp = getString(rawMap, "exchange_timestamp");
            if (exchangeTimestamp == null) {
                exchangeTimestamp = getString(rawMap, "order_date");
            }
            dto.setExecutionDate(exchangeTimestamp);

            dto.setOrderTimestamp(getString(rawMap, "order_timestamp"));
            dto.setExecutedQuantity(getBigDecimal(rawMap, "quantity"));
            dto.setExecutedNav(getBigDecimal(rawMap, "average_price"));
            dto.setFolio(getString(rawMap, "folio"));
            dto.setVariety(getString(rawMap, "variety"));
            dto.setPurchaseType(getString(rawMap, "purchase_type"));
            dto.setSettlementId(getString(rawMap, "settlement_id"));

            // Inject Raw Data
            dto.setRaw(rawMap);

            results.add(dto);
        }
        return results;
    }

    /**
     * Fetches user profile from Zerodha Kite API.
     *
     * @param account the broker account with valid token
     * @return user profile DTO with raw data injected
     */
    @SuppressWarnings("unchecked")
    public UserProfileDTO fetchProfile(BrokerAccount account) {
        Map<String, Object> rawMap = fetchObjectFromKite(account, "https://api.kite.trade/user/profile", "profile",
                Map.class);

        UserProfileDTO dto = objectMapper.convertValue(rawMap, UserProfileDTO.class);
        if (dto != null) {
            dto.setRaw(rawMap);
        }
        return dto;
    }

    /**
     * Fetches mutual fund SIPs from Zerodha Kite API.
     * Uses manual mapping from raw maps to MfSipDTO.
     *
     * @param account the broker account with valid token
     * @return list of MF SIPs
     */
    public List<MfSipDTO> fetchMfSips(BrokerAccount account) {
        @SuppressWarnings({ "unchecked", "rawtypes" })
        List<Map<String, Object>> rawList = (List) fetchListFromKite(account, "https://api.kite.trade/mf/sips",
                "MF SIPs", Map.class);

        List<MfSipDTO> results = new ArrayList<>();

        for (Map<String, Object> rawMap : rawList) {
            MfSipDTO dto = new MfSipDTO();

            // Manual Mapping
            dto.setSipId(getString(rawMap, "sip_id"));
            dto.setFund(getString(rawMap, "fund"));
            dto.setTradingSymbol(getString(rawMap, "tradingsymbol"));
            dto.setStatus(getString(rawMap, "status"));

            // instalmentAmount is Double in MfSipDTO
            Number amt = (Number) rawMap.get("instalment_amount");
            dto.setInstalmentAmount(amt != null ? amt.doubleValue() : null);

            dto.setFrequency(getString(rawMap, "frequency"));
            dto.setStartDate(getString(rawMap, "created"));
            dto.setLastInstalmentDate(getString(rawMap, "last_instalment"));
            dto.setNextInstalmentDate(getString(rawMap, "next_instalment"));

            // Integer fields
            dto.setInstalmentDay(getInteger(rawMap, "instalment_day"));
            dto.setCompletedInstalments(getInteger(rawMap, "completed_instalments"));
            dto.setPendingInstalments(getInteger(rawMap, "pending_instalments"));
            dto.setTotalInstalments(getInteger(rawMap, "instalments"));

            dto.setSipType(getString(rawMap, "sip_type"));
            dto.setTransactionType(getString(rawMap, "transaction_type"));
            dto.setDividendType(getString(rawMap, "dividend_type"));
            dto.setFundSource(getString(rawMap, "fund_source"));
            dto.setMandateType(getString(rawMap, "mandate_type"));
            dto.setMandateId(getString(rawMap, "mandate_id"));

            // Inject Raw Data
            dto.setRaw(rawMap);

            results.add(dto);
        }
        return results;
    }

    /**
     * Fetches mutual fund instruments from Zerodha Kite API.
     * Note: This endpoint returns CSV (not JSON!).
     *
     * @param account the broker account with valid token
     * @return list of MF instruments
     */
    public List<MfInstrumentDTO> fetchMfInstruments(BrokerAccount account) {
        if (!account.hasValidToken()) {
            throw new BrokerException("Invalid token", Broker.ZERODHA);
        }

        String url = "https://api.kite.trade/mf/instruments";

        try {
            String csvBody = webClient.get()
                    .uri(url)
                    .headers(headers -> buildKiteHeaders(headers, account))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (csvBody == null || csvBody.isEmpty()) {
                return Collections.emptyList();
            }

            List<MfInstrumentDTO> results = new ArrayList<>();
            // Split by newline
            String[] lines = csvBody.split("\\r?\\n");
            if (lines.length < 2) {
                return results; // Only header or empty
            }

            // Parse Header
            String headerLine = lines[0].trim();
            String[] headersArr = headerLine.split(",");
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headersArr.length; i++) {
                // Remove quotes if present
                headerMap.put(headersArr[i].trim().replaceAll("^\"|\"$", ""), i);
            }

            // Parse Data Lines
            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) {
                    continue;
                }

                // Split by comma, respecting quotes
                String[] cols = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                MfInstrumentDTO dto = new MfInstrumentDTO();
                Map<String, Object> raw = new HashMap<>();

                // 1. Populate full raw map
                for (Map.Entry<String, Integer> entry : headerMap.entrySet()) {
                    Integer idx = entry.getValue();
                    if (idx != null && idx < cols.length) {
                        String val = cols[idx].trim().replaceAll("^\"|\"$", "");
                        raw.put(entry.getKey(), val);
                    }
                }

                // 2. Map to DTO properties from raw map
                dto.setTradingSymbol((String) raw.get("tradingsymbol"));
                dto.setName((String) raw.get("name"));
                dto.setAmc((String) raw.get("amc"));
                dto.setIsin((String) raw.get("isin"));
                dto.setSchemeType((String) raw.get("scheme_type"));
                dto.setPlan((String) raw.get("plan"));

                // Helper to get string from raw map safely
                java.util.function.Function<String, String> str = (key) -> {
                    Object val = raw.get(key);
                    return val != null ? val.toString() : null;
                };

                // Extra fields
                dto.setFundHouse(str.apply("amc")); // Map AMC to fundHouse too

                dto.setDividendType(str.apply("dividend_type"));
                dto.setPurchaseAmountMultiplier(safeBigDecimal(str.apply("purchase_amount_multiplier")));
                dto.setMinimumAdditionalPurchaseAmount(
                        safeBigDecimal(str.apply("minimum_additional_purchase_amount")));
                dto.setMinimumPurchaseAmount(safeBigDecimal(str.apply("minimum_purchase_amount")));

                String redAllowed = str.apply("redemption_allowed");
                dto.setRedemptionAllowed("1".equals(redAllowed));

                dto.setMinimumRedemptionQuantity(safeBigDecimal(str.apply("minimum_redemption_quantity")));
                dto.setRedemptionQuantityMultiplier(safeBigDecimal(str.apply("redemption_quantity_multiplier")));
                dto.setLastPriceDate(str.apply("last_price_date"));

                String purchAllowed = str.apply("purchase_allowed");
                dto.setPurchaseAllowed("1".equals(purchAllowed));

                dto.setSettlementType(str.apply("settlement_type"));
                dto.setLastPrice(safeBigDecimal(str.apply("last_price")));

                dto.setRaw(raw);
                results.add(dto);
            }
            return results;

        } catch (BrokerException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error fetching Zerodha MF Instruments: CSV parse error: {}", e.getMessage());
            throw new BrokerException("Failed to fetch MF Instruments (CSV parse)", Broker.ZERODHA, e);
        }
    }

    // ============================================================================================
    // HELPER METHODS
    // ============================================================================================

    /**
     * Fetches a list of items from Kite API, unwrapping the "data" array.
     *
     * @param account  the broker account with valid token
     * @param url      the Kite API endpoint URL
     * @param logTag   human-readable label for logging
     * @param itemType the class type of each list item
     * @return list of items
     */
    private <T> List<T> fetchListFromKite(BrokerAccount account, String url, String logTag, Class<T> itemType) {
        if (!account.hasValidToken()) {
            throw new BrokerException("Invalid token", Broker.ZERODHA);
        }

        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(headers -> buildKiteHeaders(headers, account))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            if (root == null || !root.has("status") || !"success".equals(root.get("status").asText())) {
                throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA);
            }

            JsonNode dataArray = root.get("data");
            if (dataArray != null && dataArray.isArray()) {
                return objectMapper.readValue(dataArray.traverse(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, itemType));
            }
            return Collections.emptyList();

        } catch (BrokerException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error fetching Zerodha {}: {}", logTag, e.getMessage());
            throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA, e);
        }
    }

    /**
     * Fetches a single object from Kite API, unwrapping the "data" object.
     *
     * @param account      the broker account with valid token
     * @param url          the Kite API endpoint URL
     * @param logTag       human-readable label for logging
     * @param responseType the class type of the response object
     * @return the parsed object
     */
    private <T> T fetchObjectFromKite(BrokerAccount account, String url, String logTag, Class<T> responseType) {
        if (!account.hasValidToken()) {
            throw new BrokerException("Invalid token", Broker.ZERODHA);
        }

        try {
            String responseBody = webClient.get()
                    .uri(url)
                    .headers(headers -> buildKiteHeaders(headers, account))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            if (root == null || !root.has("status") || !"success".equals(root.get("status").asText())) {
                throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA);
            }

            return objectMapper.treeToValue(root.get("data"), responseType);

        } catch (BrokerException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error fetching Zerodha {}: {}", logTag, e.getMessage());
            throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA, e);
        }
    }

    /**
     * Builds Kite API authentication headers.
     * Authorization format: "token {apiKey}:{accessToken}"
     *
     * @param headers the HTTP headers to populate
     * @param account the broker account containing API key and access token
     */
    private void buildKiteHeaders(org.springframework.http.HttpHeaders headers, BrokerAccount account) {
        String accessToken = encryptionUtil.decryptSafe(account.getZerodhaAccessToken());
        headers.set("Authorization", "token " + account.getZerodhaApiKey() + ":" + accessToken);
        headers.set("X-Kite-Version", "3");
    }

    /**
     * Safely converts an object to BigDecimal, returning ZERO for null/invalid values.
     */
    private BigDecimal safeBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        String s = String.valueOf(value);
        if ("null".equalsIgnoreCase(s) || s.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    /**
     * Safely gets a String value from a map.
     */
    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    /**
     * Safely gets a BigDecimal value from a map.
     */
    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return safeBigDecimal(val);
    }

    /**
     * Safely gets an Integer value from a map.
     */
    private Integer getInteger(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) {
            return null;
        }
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Converts a byte array to its hex string representation.
     */
    private String bytesToHex(byte[] hash) {
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
