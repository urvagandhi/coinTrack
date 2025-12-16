package com.urva.myfinance.coinTrack.broker.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
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
import com.urva.myfinance.coinTrack.broker.model.ExpiryReason;
import com.urva.myfinance.coinTrack.broker.service.BrokerService;
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
import com.urva.myfinance.coinTrack.portfolio.dto.kite.ZerodhaHoldingRaw;
import com.urva.myfinance.coinTrack.portfolio.dto.kite.ZerodhaPositionRaw;
import com.urva.myfinance.coinTrack.portfolio.model.CachedHolding;
import com.urva.myfinance.coinTrack.portfolio.model.CachedPosition;

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
        List<ZerodhaHoldingRaw> rawHoldings = fetchListFromKite(account, "https://api.kite.trade/portfolio/holdings",
                "holdings", ZerodhaHoldingRaw.class);

        return rawHoldings.stream()
                .filter(raw -> {
                    if (raw.getQuantity() != null && raw.getQuantity() < 0) {
                        logger.error("Skipping corrupted holding for {}: Negative Quantity {}", raw.getTradingsymbol(),
                                raw.getQuantity());
                        return false;
                    }
                    if (raw.getAverage_price() != null && raw.getAverage_price() < 0) {
                        logger.error("Skipping corrupted holding for {}: Negative Avg Price {}", raw.getTradingsymbol(),
                                raw.getAverage_price());
                        return false;
                    }
                    return true;
                })
                .map(raw -> CachedHolding.builder()
                        .userId(account.getUserId())
                        .broker(Broker.ZERODHA)
                        .symbol(raw.getTradingsymbol())
                        .exchange(raw.getExchange())
                        .quantity(safeBigDecimal(raw.getQuantity()))
                        .averageBuyPrice(safeBigDecimal(raw.getAverage_price()))
                        .instrumentToken(raw.getInstrument_token())
                        .product(raw.getProduct())
                        .lastPrice(safeBigDecimal(raw.getLast_price() != null ? raw.getLast_price() : raw.getPrice()))
                        .closePrice(safeBigDecimal(raw.getClose_price()))
                        .pnl(safeBigDecimal(raw.getPnl()))
                        .dayChange(safeBigDecimal(raw.getDay_change()))
                        .dayChangePercentage(safeBigDecimal(raw.getDay_change_percentage()))
                        .usedQuantity(safeBigDecimal(raw.getUsed_quantity()))
                        .t1Quantity(safeBigDecimal(raw.getT1_quantity()))
                        .realisedQuantity(safeBigDecimal(raw.getRealised_quantity()))
                        .openingQuantity(safeBigDecimal(raw.getOpening_quantity()))
                        .shortQuantity(safeBigDecimal(raw.getShort_quantity()))
                        .collateralQuantity(safeBigDecimal(raw.getCollateral_quantity()))
                        .authorisedQuantity(safeBigDecimal(raw.getAuthorised_quantity()))
                        .authorisedDate(raw.getAuthorised_date())
                        .apiVersion("v3")
                        .lastUpdated(LocalDateTime.now())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<CachedPosition> fetchPositions(BrokerAccount account) {
        if (!account.hasValidToken()) {
            logger.warn("Attempted to fetch positions with invalid token for account {}", account.getId());
            return Collections.emptyList();
        }

        try {
            String url = "https://api.kite.trade/portfolio/positions";
            HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", "token " + account.getZerodhaApiKey() + ":" + account.getZerodhaAccessToken());
            headers.add("X-Kite-Version", "3");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            org.springframework.core.ParameterizedTypeReference<Map<String, Object>> responseType = new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
            };

            @SuppressWarnings("null")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET, entity, responseType);

            Map<String, Object> body = response.getBody();
            if (body == null || !"success".equals(body.get("status"))) {
                logger.error("Failed to fetch Zerodha positions: {}", body);
                return Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null)
                return Collections.emptyList();

            @SuppressWarnings("unchecked")
            // Validated: Positions API returns data: { "net": [], "day": [] }
            // specific logic needed as fetchListFromKite expects data to be the array
            // directly.
            Map<String, Object> dataMap = fetchObjectFromKite(account,
                    "https://api.kite.trade/portfolio/positions",
                    "positions", Map.class);

            if (dataMap == null || !dataMap.containsKey("net"))
                return Collections.emptyList();

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            List<Map<String, Object>> rawNetPositionsMapList = mapper.convertValue(dataMap.get("net"),
                    mapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            if (rawNetPositionsMapList == null)
                return Collections.emptyList();

            return rawNetPositionsMapList.stream()
                    .map(rawMap -> {
                        // 1. Convert to Typed DTO for Logic
                        ZerodhaPositionRaw raw = mapper.convertValue(rawMap, ZerodhaPositionRaw.class);
                        return new AbstractMap.SimpleEntry<>(rawMap, raw);
                    })
                    .filter(entry -> {
                        ZerodhaPositionRaw raw = entry.getValue();
                        // Corrupt data check (optional but recommended)
                        if (raw.getQuantity() != null && raw.getQuantity() == 0 && raw.getPnl() == 0) {
                            // Likely a closed position or empty data, can log trace
                            return true;
                        }
                        return true;
                    })
                    .map(entry -> {
                        Map<String, Object> rawMap = entry.getKey();
                        ZerodhaPositionRaw raw = entry.getValue();

                        String product = raw.getProduct();
                        com.urva.myfinance.coinTrack.portfolio.model.PositionType pType = com.urva.myfinance.coinTrack.portfolio.model.PositionType.INTRADAY;
                        if ("CNC".equalsIgnoreCase(product)) {
                            pType = com.urva.myfinance.coinTrack.portfolio.model.PositionType.DELIVERY;
                        } else if ("NRML".equalsIgnoreCase(product)) {
                            pType = com.urva.myfinance.coinTrack.portfolio.model.PositionType.FNO;
                        }

                        return CachedPosition.builder()
                                .userId(account.getUserId())
                                .broker(Broker.ZERODHA)
                                .symbol(raw.getTradingsymbol())
                                .quantity(safeBigDecimal(raw.getQuantity()))
                                .buyPrice(safeBigDecimal(raw.getAverage_price())) // average_price is usually entry
                                .mtm(safeBigDecimal(raw.getM2m()))
                                .pnl(safeBigDecimal(raw.getPnl()))
                                // .realized(safeBigDecimal(raw.getRealised())) // Raw DTO didn't have realised
                                // in prompt list, checking
                                .lastPrice(safeBigDecimal(raw.getLast_price()))
                                .closePrice(safeBigDecimal(raw.getClose_price()))
                                .value(safeBigDecimalOrNull(raw.getValue())) // Value is optional
                                .buyQuantity(safeBigDecimalOrNull(raw.getBuy_quantity()))
                                .aggregateBuyPrice(safeBigDecimalOrNull(raw.getBuy_price()))
                                .sellQuantity(safeBigDecimalOrNull(raw.getSell_quantity()))
                                .sellPrice(safeBigDecimalOrNull(raw.getSell_price()))
                                .dayBuyQuantity(safeBigDecimalOrNull(raw.getDay_buy_quantity()))
                                .daySellQuantity(safeBigDecimalOrNull(raw.getDay_sell_quantity()))
                                .dayBuyValue(safeBigDecimalOrNull(raw.getDay_buy_value()))
                                .daySellValue(safeBigDecimalOrNull(raw.getDay_sell_value()))
                                .netQuantity(safeBigDecimalOrNull(raw.getQuantity())) // quantity IS net quantity
                                .overnightQuantity(safeBigDecimalOrNull(raw.getOvernight_quantity()))
                                .instrumentType(raw.getInstrument_type())
                                .strikePrice(safeBigDecimalOrNull(raw.getStrike_price()))
                                .optionType(raw.getOption_type())
                                .expiryDate(raw.getExpiry_date())
                                .positionType(pType)
                                .apiVersion("v3")
                                .lastUpdated(LocalDateTime.now())
                                .rawData(rawMap) // Strict Pass-Through
                                .build();
                    }).collect(java.util.stream.Collectors.toList());

        } catch (Exception e) {
            logger.error("Error fetching positions for {}: {}", account.getUserId(), e.getMessage());
            throw new BrokerException("Failed to fetch positions", Broker.ZERODHA, e);
        }
    }

    private java.math.BigDecimal safeBigDecimalOrNull(Number value) {
        if (value == null)
            return null;
        return new java.math.BigDecimal(value.toString());
    }

    private java.math.BigDecimal safeBigDecimal(Object value) {
        if (value == null)
            return java.math.BigDecimal.ZERO;
        String s = String.valueOf(value);
        if ("null".equalsIgnoreCase(s) || s.trim().isEmpty())
            return java.math.BigDecimal.ZERO;
        try {
            return new java.math.BigDecimal(s);
        } catch (NumberFormatException e) {
            return java.math.BigDecimal.ZERO;
        }
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

    // ============================================================================================
    // NEW KITE API METHODS (Direct pass-through / mapping)
    // ============================================================================================

    @Override
    public List<OrderDTO> fetchOrders(BrokerAccount account) {
        // Updated to use the new typed fetch function if complex mapping needed, but
        // ObjectMapper should handle DTO fields if names match JSON.
        // The DTO now has numeric fields. Jackson will auto-convert JSON
        // strings/numbers
        // to them.
        return fetchListFromKite(account, "https://api.kite.trade/orders", "orders", OrderDTO.class);
    }

    @Override
    public List<TradeDTO> fetchTrades(BrokerAccount account) {
        return fetchListFromKite(account, "https://api.kite.trade/trades", "trades", TradeDTO.class);
    }

    @Override
    public FundsDTO fetchFunds(BrokerAccount account) {
        // Validation
        if (!account.hasValidToken())
            throw new BrokerException("Invalid token", Broker.ZERODHA);

        try {
            String url = "https://api.kite.trade/user/margins";
            HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", "token " + account.getZerodhaApiKey() + ":" + account.getZerodhaAccessToken());
            headers.add("X-Kite-Version", "3");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            @SuppressWarnings("null")
            ResponseEntity<String> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET, entity, String.class);

            // Manual parsing
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response.getBody());
            if (root == null || !root.has("status") || !"success".equals(root.get("status").asText())) {
                throw new BrokerException("Failed to fetch margins", Broker.ZERODHA);
            }

            com.fasterxml.jackson.databind.JsonNode dataNode = root.get("data");

            // 1. Convert to DTO
            FundsDTO fundsDTO = mapper.treeToValue(dataNode, FundsDTO.class);

            // 2. Inject Raw Data (Pass-Through)
            if (dataNode != null) {
                if (fundsDTO.getEquity() != null && dataNode.has("equity")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> equityRaw = mapper.convertValue(dataNode.get("equity"), Map.class);
                    fundsDTO.getEquity().setRaw(equityRaw);
                }
                if (fundsDTO.getCommodity() != null && dataNode.has("commodity")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> commodityRaw = mapper.convertValue(dataNode.get("commodity"), Map.class);
                    fundsDTO.getCommodity().setRaw(commodityRaw);
                }
            }

            return fundsDTO;

        } catch (Exception e) {
            logger.error("Error fetching funds for {}: {}", account.getUserId(), e.getMessage());
            throw new BrokerException("Failed to fetch funds", Broker.ZERODHA, e);
        }
    }

    @Override
    public List<MutualFundDTO> fetchMfHoldings(BrokerAccount account) {
        // Fetch raw maps first to capture full fidelity data
        @SuppressWarnings({ "unchecked", "rawtypes" })
        List<Map<String, Object>> rawList = (List) fetchListFromKite(account, "https://api.kite.trade/mf/holdings",
                "MF Holdings", Map.class);

        List<MutualFundDTO> results = new ArrayList<>();
        // No ObjectMapper conversion needed for DTO fields anymore

        // Log raw list size
        // logger.info("Fetched {} MF holdings from Zerodha", rawList.size());

        for (Map<String, Object> rawMap : rawList) {
            // logger.info("Processing MF Holding Raw keys: {}", rawMap.keySet());
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
            dto.setCurrentValue(getBigDecimal(rawMap, "current_value")); // Can be null/zero if not provided
            dto.setUnrealizedPL(getBigDecimal(rawMap, "pnl"));
            dto.setLastPriceDate(getString(rawMap, "last_price_date"));

            // Inject Raw Data (Strict Isolation)
            dto.setRaw(rawMap);

            results.add(dto);
        }
        return results;
    }

    @Override
    public List<MutualFundOrderDTO> fetchMfOrders(BrokerAccount account) {
        // Fetch raw maps first to capture full fidelity data
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
            if (exchangeTimestamp == null)
                exchangeTimestamp = getString(rawMap, "order_date");
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

    public UserProfileDTO fetchProfile(BrokerAccount account) {
        // Fetch as Map to get raw data
        @SuppressWarnings("unchecked")
        Map<String, Object> rawMap = fetchObjectFromKite(account, "https://api.kite.trade/user/profile", "profile",
                Map.class);

        // Convert to DTO
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        UserProfileDTO dto = mapper.convertValue(rawMap, UserProfileDTO.class);
        if (dto != null) {
            dto.setRaw(rawMap);
        }
        return dto;
    }

    @Override
    public List<MfSipDTO> fetchMfSips(BrokerAccount account) {
        // Fetch raw maps first to capture full fidelity data
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

            // Double vs BigDecimal (DTO usage check: InstalmentAmount is Double in MfSipDTO
            // currently)
            // Ideally should be BigDecimal but strictly following existing DTO type for now
            // if not refactored to BigDecimal
            // Checked DTO: InstalmentAmount is Double.
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

    @Override
    public List<MfInstrumentDTO> fetchMfInstruments(BrokerAccount account) {
        if (!account.hasValidToken())
            throw new BrokerException("Invalid token", Broker.ZERODHA);

        String url = "https://api.kite.trade/mf/instruments";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "token " + account.getZerodhaApiKey() + ":" + account.getZerodhaAccessToken());
        headers.add("X-Kite-Version", "3");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            @SuppressWarnings("null")
            ResponseEntity<String> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET, entity, String.class);

            String csvBody = response.getBody();
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
                if (line.isEmpty())
                    continue;

                // Split by comma, respecting quotes
                String[] cols = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                MfInstrumentDTO dto = new MfInstrumentDTO();
                Map<String, Object> raw = new HashMap<>();

                // Helper to safely get value
                java.util.function.Function<String, String> getVal = (key) -> {
                    Integer idx = headerMap.get(key);
                    if (idx != null && idx < cols.length) {
                        String val = cols[idx].trim().replaceAll("^\"|\"$", "");
                        raw.put(key, val);
                        return val;
                    }
                    return null;
                };

                dto.setTradingSymbol(getVal.apply("tradingsymbol"));
                dto.setName(getVal.apply("name")); // Mapped to name/fund
                dto.setAmc(getVal.apply("amc"));
                dto.setIsin(getVal.apply("isin"));
                dto.setSchemeType(getVal.apply("scheme_type"));
                dto.setPlan(getVal.apply("plan"));
                dto.setSchemeCode(getVal.apply("scheme_code"));

                // Extra fields
                dto.setFundHouse(getVal.apply("amc")); // Map AMC to fundHouse too

                dto.setRaw(raw);
                results.add(dto);
            }
            return results;

        } catch (Exception e) {
            logger.error("Error fetching Zerodha MF Instruments:String parse error: {}", e.getMessage());
            throw new BrokerException("Failed to fetch MF Instruments (CSV parse)", Broker.ZERODHA, e);
        }
    }

    // ============================================================================================
    // HELPER METHODS
    // ============================================================================================

    private <T> T fetchObjectFromKite(BrokerAccount account, String url, String logTag, Class<T> responseType) {
        if (!account.hasValidToken())
            throw new BrokerException("Invalid token", Broker.ZERODHA);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "token " + account.getZerodhaApiKey() + ":" + account.getZerodhaAccessToken());
        headers.add("X-Kite-Version", "3");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            @SuppressWarnings("null")
            ResponseEntity<String> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET, entity, String.class);

            // Manual parsing to handle "data" wrapper properly
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response.getBody());
            if (root == null || !root.has("status") || !"success".equals(root.get("status").asText())) {
                throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA);
            }

            return mapper.treeToValue(root.get("data"), responseType);

        } catch (Exception e) {
            logger.error("Error fetching Zerodha {}: {}", logTag, e.getMessage());
            throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA, e);
        }
    }

    private <T> List<T> fetchListFromKite(BrokerAccount account, String url, String logTag, Class<T> itemType) {
        if (!account.hasValidToken())
            throw new BrokerException("Invalid token", Broker.ZERODHA);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "token " + account.getZerodhaApiKey() + ":" + account.getZerodhaAccessToken());
        headers.add("X-Kite-Version", "3");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            @SuppressWarnings("null")
            ResponseEntity<String> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET, entity, String.class);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response.getBody());
            if (root == null || !root.has("status") || !"success".equals(root.get("status").asText())) {
                throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA);
            }

            com.fasterxml.jackson.databind.JsonNode dataArray = root.get("data");
            if (dataArray != null && dataArray.isArray()) {
                return mapper.readValue(dataArray.traverse(),
                        mapper.getTypeFactory().constructCollectionType(List.class, itemType));
            }
            return Collections.emptyList();

        } catch (Exception e) {
            logger.error("Error fetching Zerodha {}: {}", logTag, e.getMessage());
            throw new BrokerException("Failed to fetch " + logTag, Broker.ZERODHA, e);
        }
    }

    public String bytesToHex(byte[] hash) {
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

    // --- Manual Mapping Helpers ---

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private java.math.BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return safeBigDecimal(val);
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null)
            return null;
        if (val instanceof Number)
            return ((Number) val).intValue();
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
