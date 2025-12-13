package com.urva.myfinance.coinTrack.Service.broker.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Model.CachedHolding;
import com.urva.myfinance.coinTrack.Model.CachedPosition;
import com.urva.myfinance.coinTrack.Service.broker.BrokerService;
import com.urva.myfinance.coinTrack.Service.broker.exception.BrokerException;
import com.urva.myfinance.coinTrack.Utils.EncryptionUtil;

@Service("zerodhaBrokerService")
public class ZerodhaBrokerService implements BrokerService {

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
        // Stub: Implement actual API call later
        return Collections.emptyList();
    }

    @Override
    public List<CachedPosition> fetchPositions(BrokerAccount account) {
        // Stub: Implement actual API call later
        return Collections.emptyList();
    }

    @Override
    public boolean testConnection(BrokerAccount account) {
        return account.hasValidToken();
    }

    @Override
    public LocalDateTime extractTokenExpiry(BrokerAccount account) {
        // Tokens expire at ~6:00 AM IST next day
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.withHour(6).withMinute(0).withSecond(0).withNano(0);
        if (now.isAfter(expiry)) {
            expiry = expiry.plusDays(1);
        }
        return expiry;
    }

    @Override
    public Optional<String> getLoginUrl() {
        return Optional.empty(); // Not supported without account/API Key
    }

    public String getLoginUrl(String zerodhaApiKey) {
        return "https://kite.zerodha.com/connect/login?v=3&api_key=" + zerodhaApiKey;
    }

    @Override
    public Optional<String> refreshToken(BrokerAccount account) {
        return Optional.empty();
    }

    public Map<String, Object> exchangeToken(String requestToken, String zerodhaApiKey,
            String encryptedZerodhaApiSecret) {
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

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("api_key", zerodhaApiKey);
            map.add("request_token", requestToken);
            map.add("checksum", checksum);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

            // 3. Call Kite API
            ResponseEntity<Map> response = restTemplate.postForEntity("https://api.kite.trade/session/token", request,
                    Map.class);

            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (Map<String, Object>) response.getBody().get("data");
            } else {
                throw new BrokerException("Empty response from Zerodha", Broker.ZERODHA);
            }
        } catch (NoSuchAlgorithmException e) {
            throw new BrokerException("Checksum generation failed", Broker.ZERODHA);
        } catch (Exception e) {
            e.printStackTrace();
            throw new BrokerException("Token exchange failed: " + e.getMessage(), Broker.ZERODHA);
        }
    }

    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (int i = 0; i < hash.length; i++) {
            String hex = Integer.toHexString(0xff & hash[i]);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
