package com.urva.myfinance.coinTrack.Controller;

import java.io.IOException;

import org.json.JSONException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.urva.myfinance.coinTrack.Model.ZerodhaAccount;
import com.urva.myfinance.coinTrack.Service.ZerodhaService;
import com.zerodhatech.kiteconnect.KiteConnect;
import com.zerodhatech.kiteconnect.kitehttp.exceptions.KiteException;

@RestController
@RequestMapping("/zerodha")
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
    public ResponseEntity<?> connectZerodhaPost(
            @RequestParam String requestToken,
            @RequestParam String appUserId) {
        return connectZerodha(requestToken, appUserId);
    }

    @GetMapping("/connect")
    public ResponseEntity<?> connectZerodhaGet(
            @RequestParam String requestToken,
            @RequestParam String appUserId) {
        return connectZerodha(requestToken, appUserId);
    }

    private ResponseEntity<?> connectZerodha(String requestToken, String appUserId) {
        try {
            ZerodhaAccount account = zerodhaService.connectZerodha(requestToken, appUserId);
            return ResponseEntity.ok(account);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("IO Error: " + e.getMessage());
        } catch (KiteException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kite API Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error: " + e.getMessage());
        }
    }

    /**
     * Step 2: Get active Kite client (test only, not for frontend)
     * You usually won't expose KiteConnect object directly,
     * instead fetch holdings/orders and return JSON.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getZerodhaStatus(@RequestParam String appUserId) {
        try {
            KiteConnect kite = zerodhaService.clientFor(appUserId);
            String statusMessage = "Zerodha linked ✅ for UserId=" + appUserId +
                    " (kiteUserId=" + kite.getUserId() + ")";
            return ResponseEntity.ok(statusMessage);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (NullPointerException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting Zerodha status: " + e.getMessage());
        }
    }

    /**
     * Step 3: Example - fetch profile from Zerodha API
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestParam String appUserId) {
        try {
            KiteConnect kite = zerodhaService.clientFor(appUserId);
            Object profile = kite.getProfile();
            return ResponseEntity.ok(profile);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("IO Error: " + e.getMessage());
        } catch (KiteException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kite API Error: " + e.getMessage());
        } catch (JSONException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching profile: " + e.getMessage());
        }
    }

    /**
     * Step 4: Example - fetch holdings from Zerodha API
     */
    @GetMapping("/stocks/holdings")
    public ResponseEntity<?> getHoldings(@RequestParam String appUserId) {
        try {
            Object holdings = zerodhaService.getHoldings(appUserId);
            return ResponseEntity.ok(holdings);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("IO Error: " + e.getMessage());
        } catch (KiteException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kite API Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching holdings: " + e.getMessage());
        }
    }

    /**
     * Step 5: Example - fetch positions from Zerodha API
     */
    @GetMapping("/stocks/positions")
    public ResponseEntity<?> getPositions(@RequestParam String appUserId) {
        try {
            Object positions = zerodhaService.getPositions(appUserId);
            return ResponseEntity.ok(positions);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("IO Error: " + e.getMessage());
        } catch (KiteException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kite API Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching positions: " + e.getMessage());
        }
    }

    /**
     * Step 6: Example - fetch orders from Zerodha API
     */
    @GetMapping("/stocks/orders")
    public ResponseEntity<?> getOrders(@RequestParam String appUserId) {
        try {
            Object orders = zerodhaService.getOrders(appUserId);
            return ResponseEntity.ok(orders);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("IO Error: " + e.getMessage());
        } catch (KiteException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kite API Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching orders: " + e.getMessage());
        }
    }

    /**
     * Step 7: Example - fetch mutual fund holdings from Zerodha API
     */
    @GetMapping("/mf/holdings")
    public ResponseEntity<?> getMFHoldings(@RequestParam String appUserId) {
        try {
            Object mfHoldings = zerodhaService.getMFHoldings(appUserId);
            return ResponseEntity.ok(mfHoldings);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("IO Error: " + e.getMessage());
        } catch (KiteException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kite API Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching MF holdings: " + e.getMessage());
        }
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch SIPs: " + e.getMessage());
        }
    }

}
