package com.urva.myfinance.coinTrack.Controller;

import com.urva.myfinance.coinTrack.Model.ZerodhaAccount;
import com.urva.myfinance.coinTrack.Service.ZerodhaService;
import com.zerodhatech.kiteconnect.KiteConnect;
import com.zerodhatech.kiteconnect.kitehttp.exceptions.KiteException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@RestController
@RequestMapping("/api/zerodha")
public class ZerodhaController {

    private final ZerodhaService zerodhaService;

    public ZerodhaController(ZerodhaService zerodhaService) {
        this.zerodhaService = zerodhaService;
    }

    /**
     * Step 1: First-time connect / relogin (Frontend will send requestToken after
     * user authorizes via Zerodha login)
     * 
     * @param requestToken
     * @throws KiteException
     */
    @PostMapping("/connect")
    public ResponseEntity<?> connectZerodha(
            @RequestParam String requestToken,
            @RequestParam String appUserId) throws KiteException {
        try {
            ZerodhaAccount account = zerodhaService.connectZerodha(requestToken, appUserId);
            return ResponseEntity.ok(account);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    /**
     * Step 2: Get active Kite client (test only, not for frontend)
     * You usually won’t expose KiteConnect object directly,
     * instead fetch holdings/orders and return JSON.
     */
    @GetMapping("/me")
    public String getZerodhaStatus(@RequestParam String appUserId) {
        KiteConnect kite = zerodhaService.clientFor(appUserId);
        return "Zerodha linked ✅ for UserId=" + appUserId +
                " (kiteUserId=" + kite.getUserId() + ")";
    }

    /**
     * Step 3: Example - fetch profile from Zerodha API
     */
    @GetMapping("/profile")
    public Object getProfile(@RequestParam String appUserId) throws IOException, KiteException {
        KiteConnect kite = zerodhaService.clientFor(appUserId);
        return kite.getProfile();
    }

    /**
     * Step 4: Example - fetch holdings from Zerodha API
     */
    @GetMapping("/stocks/holdings")
    public Object getHoldings(@RequestParam String appUserId) throws IOException, KiteException {
        return zerodhaService.getHoldings(appUserId);
    }

    /**
     * Step 5: Example - fetch positions from Zerodha API
     */
    @GetMapping("/stocks/positions")
    public Object getPositions(@RequestParam String appUserId) throws IOException, KiteException {
        return zerodhaService.getPositions(appUserId);
    }

    /**
     * Step 6: Example - fetch orders from Zerodha API
     */
    @GetMapping("/stocks/orders")
    public Object getOrders(@RequestParam String appUserId) throws IOException, KiteException {
        return zerodhaService.getOrders(appUserId);
    }

    /**
     * Step 7: Example - fetch mutual fund holdings from Zerodha API
     */
    @GetMapping("/mf/holdings")
    public Object getMFHoldings(@RequestParam String appUserId) throws IOException, KiteException {
        return zerodhaService.getMFHoldings(appUserId);
    }

    /**
     * Step 8: Example - fetch mutual fund orders from Zerodha API
     */
    @GetMapping("/mf/sips")
    public ResponseEntity<?> getSIPs(@RequestParam String appUserId) {
        try {
            Object sips = zerodhaService.getSIPs(appUserId);
            return ResponseEntity.ok(sips);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to fetch SIPs: " + e.getMessage());
        }
    }

}
