package com.urva.myfinance.coinTrack.Service;

import com.urva.myfinance.coinTrack.Model.ZerodhaAccount;
import com.urva.myfinance.coinTrack.Repository.ZerodhaAccountRepository;
import com.zerodhatech.kiteconnect.KiteConnect;
import com.zerodhatech.kiteconnect.kitehttp.exceptions.KiteException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class ZerodhaService {

    private final ZerodhaAccountRepository zerodhaRepo;

    @Value("${zerodha.api.key}")
    private String apiKey;

    @Value("${zerodha.api.secret}")
    private String apiSecret;

    public ZerodhaService(ZerodhaAccountRepository zerodhaRepo) {
        this.zerodhaRepo = zerodhaRepo;
    }

    /**
     * First-time connect or refresh with request token
     */
    public ZerodhaAccount connectZerodha(String requestToken, String appUserId)
            throws IOException, KiteException {

        try {
            KiteConnect kite = new KiteConnect(apiKey);
            com.zerodhatech.models.User kiteUser = kite.generateSession(requestToken, apiSecret);

            ZerodhaAccount account = zerodhaRepo.findByAppUserId(appUserId)
                    .orElse(new ZerodhaAccount());

            account.setAppUserId(appUserId);
            account.setKiteUserId(kiteUser.userId);
            account.setKiteAccessToken(kiteUser.accessToken);
            account.setKitePublicToken(kiteUser.publicToken);
            account.setKiteTokenCreatedAt(LocalDateTime.now());

            return zerodhaRepo.save(account);
        } catch (KiteException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Invalid or expired requestToken. Please re-login.", e);
        }
    }

    /**
     * Get authenticated Kite client for user (reused session)
     */

    public boolean isTokenExpired(ZerodhaAccount account) {
        return account.getKiteTokenCreatedAt() == null ||
                account.getKiteTokenCreatedAt().toLocalDate().isBefore(LocalDate.now());
    }

    public KiteConnect clientFor(String appUserId) {
        ZerodhaAccount account = zerodhaRepo.findByAppUserId(appUserId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Zerodha not linked for this user"));

        if (account.getKiteAccessToken() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No active token. Please login again.");
        }

        if (isTokenExpired(account)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Zerodha session expired. Please relogin.");
        }

        KiteConnect kite = new KiteConnect(apiKey);
        kite.setUserId(account.getKiteUserId());
        kite.setAccessToken(account.getKiteAccessToken());
        return kite;
    }

    /**
     * Step 4: Example - fetch holdings from Zerodha API
     */
    public Object getHoldings(String appUserId) throws IOException, KiteException {
        KiteConnect kite = clientFor(appUserId);
        return kite.getHoldings();
    }

    /**
     * Step 5: Example - fetch positions from Zerodha API
     */
    public Object getPositions(String appUserId) throws IOException, KiteException {
        KiteConnect kite = clientFor(appUserId);
        return kite.getPositions();
    }

    /**
     * Step 6: Example - fetch orders from Zerodha API
     */
    public Object getOrders(String appUserId) throws IOException, KiteException {
        KiteConnect kite = clientFor(appUserId);
        return kite.getOrders();
    }

    /**
     * Step 7: Example - fetch mutual fund holdings from Zerodha API
     */
    public Object getMFHoldings(String appUserId) throws IOException, KiteException {
        KiteConnect kite = clientFor(appUserId);
        return kite.getMFHoldings();
    }

    // /**
    // * Step 8: Example - fetch SIP orders from Zerodha API
    // */
    // public Object getSIPOrders(String appUserId) throws IOException,
    // KiteException {
    // KiteConnect kite = clientFor(appUserId);
    // return kite.getSIP();
    // }

    // Fetch SIPs for the user using Zerodha MF API - REST API
    public Object getSIPs(String appUserId) {
        ZerodhaAccount account = zerodhaRepo.findByAppUserId(appUserId)
                .orElseThrow(() -> new RuntimeException("Zerodha not linked for this user"));
        if (account.getKiteAccessToken() == null) {
            throw new IllegalStateException("No active token. Please login again.");
        }
        if (isTokenExpired(account)) {
            throw new IllegalStateException("Zerodha session expired. Please relogin.");
        }
        String url = "https://api.kite.trade/mf/sips";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "token " + apiKey + ":" + account.getKiteAccessToken());
        HttpEntity<String> entity = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
        return response.getBody();
    }

}
