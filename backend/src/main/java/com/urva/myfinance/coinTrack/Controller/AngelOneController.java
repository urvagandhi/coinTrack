package com.urva.myfinance.coinTrack.Controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.Service.AngelOneServiceImpl;
import com.urva.myfinance.coinTrack.Service.JWTService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * REST controller for AngelOne (Angel Broking) broker integration.
 * Handles authentication, account management, and trading operations with
 * AngelOne.
 */
@RestController
@RequestMapping("/api/brokers/angelone")
@Validated
public class AngelOneController {

    private static final Logger logger = LoggerFactory.getLogger(AngelOneController.class);

    private final AngelOneServiceImpl angelOneService;
    private final JWTService jwtService;

    public AngelOneController(AngelOneServiceImpl angelOneService, JWTService jwtService) {
        this.angelOneService = angelOneService;
        this.jwtService = jwtService;
    }

    /**
     * Get AngelOne login URL for authentication.
     * Note: AngelOne typically uses direct credential authentication rather than
     * OAuth.
     * 
     * @param request HTTP request to extract user info
     * @return login information for AngelOne authentication
     */
    @GetMapping("/login-url")
    public ResponseEntity<?> getAngelOneLoginUrl(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            // AngelOne typically uses direct credential authentication
            Map<String, String> response = new HashMap<>();
            response.put("message", "AngelOne uses direct credential authentication");
            response.put("loginMethod", "credentials");
            response.put("broker", "angelone");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error generating AngelOne login info: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to generate login information"));
        }
    }

    /**
     * Store AngelOne credentials and connect account.
     * 
     * @param request     HTTP request to extract user info
     * @param credentials AngelOne API credentials
     * @return success message
     */
    @PostMapping("/credentials")
    public ResponseEntity<?> storeCredentials(
            HttpServletRequest request,
            @Valid @RequestBody AngelOneCredentialsDTO credentials) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            // Store credentials without connecting
            Map<String, Object> credentialsMap = new HashMap<>();
            credentialsMap.put("apiKey", credentials.getApiKey());
            credentialsMap.put("clientId", credentials.getClientId());
            credentialsMap.put("pin", credentials.getPin());
            if (credentials.getTotp() != null) {
                credentialsMap.put("totp", credentials.getTotp());
            }

            Map<String, Object> result = angelOneService.storeCredentials(userId, credentialsMap);
            if (result != null && "stored".equals(result.get("status"))) {
                return ResponseEntity.ok(result);
            } else {
                String errorMsg = result != null ? (String) result.get("message") : "Unknown error";
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to store credentials: " + errorMsg));
            }
        } catch (Exception e) {
            logger.error("Error storing AngelOne credentials: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Failed to store credentials: " + e.getMessage()));
        }
    }

    /**
     * Connect AngelOne account with authentication.
     * 
     * @param request     HTTP request to extract user info
     * @param credentials Authentication credentials
     * @return connection status
     */
    @PostMapping("/connect")
    public ResponseEntity<?> connectAccount(
            HttpServletRequest request,
            @RequestBody AngelOneCredentialsDTO credentials) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            // Use existing connect method from AngelOneServiceImpl
            Map<String, Object> credentialsMap = new HashMap<>();
            credentialsMap.put("apiKey", credentials.getApiKey());
            credentialsMap.put("clientId", credentials.getClientId());
            credentialsMap.put("pin", credentials.getPin());
            if (credentials.getTotp() != null) {
                credentialsMap.put("totp", credentials.getTotp());
            }

            Map<String, Object> result = angelOneService.connect(userId, credentialsMap);
            if (result != null && "connected".equals(result.get("status"))) {
                Map<String, Object> response = new HashMap<>();
                response.put("connected", true);
                response.put("message", "AngelOne account connected successfully");
                response.put("broker", "angelone");
                return ResponseEntity.ok(response);
            } else {
                String errorMsg = result != null ? (String) result.get("message") : "Unknown error";
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to connect account: " + errorMsg));
            }
        } catch (Exception e) {
            logger.error("Error connecting AngelOne account: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Connection failed"));
        }
    }

    /**
     * Get user's holdings from AngelOne.
     * 
     * @param request HTTP request to extract user info
     * @return list of holdings
     */
    @GetMapping("/holdings")
    public ResponseEntity<?> getHoldings(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            Map<String, Object> holdings = angelOneService.fetchHoldings(userId);
            if (holdings != null) {
                return ResponseEntity.ok(holdings);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No holdings found or account not connected"));
            }
        } catch (Exception e) {
            logger.error("Error fetching AngelOne holdings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch holdings"));
        }
    }

    /**
     * Get user's orders from AngelOne.
     * 
     * @param request HTTP request to extract user info
     * @return list of orders
     */
    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            Map<String, Object> orders = angelOneService.fetchOrders(userId);
            if (orders != null) {
                return ResponseEntity.ok(orders);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No orders found or account not connected"));
            }
        } catch (Exception e) {
            logger.error("Error fetching AngelOne orders: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch orders"));
        }
    }

    /**
     * Get user's positions from AngelOne.
     * 
     * @param request HTTP request to extract user info
     * @return list of positions
     */
    @GetMapping("/positions")
    public ResponseEntity<?> getPositions(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            Map<String, Object> positions = angelOneService.fetchPositions(userId);
            if (positions != null) {
                return ResponseEntity.ok(positions);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No positions found or account not connected"));
            }
        } catch (Exception e) {
            logger.error("Error fetching AngelOne positions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch positions"));
        }
    }

    /**
     * Get account status for current user.
     * 
     * @param request HTTP request to extract user info
     * @return account connection status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getAccountStatus(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            boolean connected = angelOneService.isConnected(userId);
            Map<String, Object> status = new HashMap<>();
            status.put("userId", userId);
            status.put("broker", "angelone");
            status.put("connected", connected);
            status.put("message", connected ? "Account connected" : "Account not connected");
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Error fetching AngelOne account status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch account status"));
        }
    }

    /**
     * Refresh AngelOne session token.
     * 
     * @param request HTTP request to extract user info
     * @return refresh status
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            Map<String, Object> result = angelOneService.refreshToken(userId);
            if (result != null && "success".equals(result.get("status"))) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "AngelOne token refreshed successfully");
                response.put("broker", "angelone");
                return ResponseEntity.ok(response);
            } else {
                String errorMsg = result != null ? (String) result.get("message") : "Unknown error";
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to refresh token: " + errorMsg));
            }
        } catch (Exception e) {
            logger.error("Error refreshing AngelOne token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to refresh token"));
        }
    }

    /**
     * Disconnect AngelOne account.
     * 
     * @param request HTTP request to extract user info
     * @return success message
     */
    @PostMapping("/disconnect")
    public ResponseEntity<?> disconnectAccount(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            Map<String, Object> result = angelOneService.disconnect(userId);
            if (result != null && "disconnected".equals(result.get("status"))) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "AngelOne account disconnected successfully");
                response.put("broker", "angelone");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to disconnect account"));
            }
        } catch (Exception e) {
            logger.error("Error disconnecting AngelOne account: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to disconnect account"));
        }
    }

    /**
     * Extract user ID from JWT token in request.
     * 
     * @param request HTTP request
     * @return user ID or null if invalid
     */
    private String extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            try {
                return jwtService.extractUsername(token);
            } catch (Exception ex) {
                logger.error("Failed to extract user ID from JWT: {}", ex.getMessage());
            }
        }
        return null;
    }

    /**
     * Create standardized error response.
     * 
     * @param message error message
     * @return error response map
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }

    /**
     * DTO for AngelOne credentials.
     * Note: userId is not included here as it should always come from JWT to prevent spoofing.
     */
    public static class AngelOneCredentialsDTO {
        private String apiKey;
        private String clientId;
        private String pin;
        private String totp;

        // Default constructor
        public AngelOneCredentialsDTO() {
        }

        // Getters and setters
        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getPin() {
            return pin;
        }

        public void setPin(String pin) {
            this.pin = pin;
        }

        public String getTotp() {
            return totp;
        }

        public void setTotp(String totp) {
            this.totp = totp;
        }
    }
}