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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.Service.UpstoxServiceImpl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * REST controller for Upstox broker integration.
 * Handles authentication, account management, and trading operations with
 * Upstox.
 */
@RestController
@RequestMapping("/api/brokers/upstox")
@Validated
public class UpstoxController {

    private static final Logger logger = LoggerFactory.getLogger(UpstoxController.class);

    private final UpstoxServiceImpl upstoxService;

    public UpstoxController(UpstoxServiceImpl upstoxService) {
        this.upstoxService = upstoxService;
    }

    /**
     * Get Upstox login URL for OAuth authentication.
     * 
     * @param request HTTP request to extract user info
     * @return login URL for Upstox authentication
     */
    @GetMapping("/login-url")
    public ResponseEntity<?> getUpstoxLoginUrl(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            // TODO: Implement with actual Upstox OAuth URL generation
            String loginUrl = "https://api.upstox.com/v2/login/authorization/dialog?api_key=YOUR_API_KEY";
            Map<String, String> response = new HashMap<>();
            response.put("loginUrl", loginUrl);
            response.put("redirectUrl", loginUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error generating Upstox login URL: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to generate login URL"));
        }
    }

    /**
     * Handle OAuth callback from Upstox.
     * 
     * @param authorizationCode OAuth authorization code from Upstox
     * @param userId            user ID
     * @return success message with account status
     */
    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(
            @RequestParam("code") String authorizationCode,
            @RequestParam("user_id") String userId) {
        try {
            logger.info("Processing Upstox callback for user: {}", userId);

            // Use existing connect method from UpstoxServiceImpl
            Map<String, Object> credentials = new HashMap<>();
            credentials.put("authorizationCode", authorizationCode);

            Map<String, Object> result = upstoxService.connect(userId, credentials);
            if (result.containsKey("status") && "connected".equals(result.get("status"))) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Upstox account connected successfully");
                response.put("broker", "upstox");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to connect Upstox account"));
            }
        } catch (Exception e) {
            logger.error("Error processing Upstox callback: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Callback processing failed"));
        }
    }

    /**
     * Store Upstox credentials and connect account.
     * 
     * @param request     HTTP request to extract user info
     * @param credentials Upstox API credentials
     * @return success message
     */
    @PostMapping("/credentials")
    public ResponseEntity<?> storeCredentials(
            HttpServletRequest request,
            @Valid @RequestBody UpstoxCredentialsDTO credentials) {
        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Invalid or missing authentication token"));
            }

            // Use existing connect method from UpstoxServiceImpl
            Map<String, Object> credentialsMap = new HashMap<>();
            credentialsMap.put("apiKey", credentials.getApiKey());
            credentialsMap.put("apiSecret", credentials.getApiSecret());
            if (credentials.getAuthorizationCode() != null) {
                credentialsMap.put("authorizationCode", credentials.getAuthorizationCode());
            }

            Map<String, Object> result = upstoxService.connect(userId, credentialsMap);
            if (result.containsKey("status") && "connected".equals(result.get("status"))) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Upstox credentials stored and connected successfully");
                response.put("broker", "upstox");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to connect to Upstox: " + result.get("message")));
            }
        } catch (Exception e) {
            logger.error("Error storing Upstox credentials: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Failed to store credentials: " + e.getMessage()));
        }
    }

    /**
     * Get user's holdings from Upstox.
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

            Map<String, Object> holdings = upstoxService.fetchHoldings(userId);
            if (holdings != null) {
                return ResponseEntity.ok(holdings);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No holdings found or account not connected"));
            }
        } catch (Exception e) {
            logger.error("Error fetching Upstox holdings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch holdings"));
        }
    }

    /**
     * Get user's orders from Upstox.
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

            Map<String, Object> orders = upstoxService.fetchOrders(userId);
            if (orders != null) {
                return ResponseEntity.ok(orders);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No orders found or account not connected"));
            }
        } catch (Exception e) {
            logger.error("Error fetching Upstox orders: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch orders"));
        }
    }

    /**
     * Get user's positions from Upstox.
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

            Map<String, Object> positions = upstoxService.fetchPositions(userId);
            if (positions != null) {
                return ResponseEntity.ok(positions);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No positions found or account not connected"));
            }
        } catch (Exception e) {
            logger.error("Error fetching Upstox positions: {}", e.getMessage());
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

            boolean connected = upstoxService.isConnected(userId);
            Map<String, Object> status = new HashMap<>();
            status.put("userId", userId);
            status.put("broker", "upstox");
            status.put("connected", connected);
            status.put("message", connected ? "Account connected" : "Account not connected");
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Error fetching Upstox account status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch account status"));
        }
    }

    /**
     * Disconnect Upstox account.
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

            Map<String, Object> result = upstoxService.disconnect(userId);
            if (result.containsKey("status") && "disconnected".equals(result.get("status"))) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Upstox account disconnected successfully");
                response.put("broker", "upstox");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to disconnect account"));
            }
        } catch (Exception e) {
            logger.error("Error disconnecting Upstox account: {}", e.getMessage());
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
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // TODO: Use JWTService to extract user ID from token
                // For now, return a placeholder
                return "user_placeholder";
            }
        } catch (Exception e) {
            logger.error("Error extracting user ID from token: {}", e.getMessage());
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
     * DTO for Upstox credentials.
     */
    public static class UpstoxCredentialsDTO {
        private String apiKey;
        private String apiSecret;
        private String authorizationCode;
        private String userId;

        // Default constructor
        public UpstoxCredentialsDTO() {
        }

        // Getters and setters
        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getApiSecret() {
            return apiSecret;
        }

        public void setApiSecret(String apiSecret) {
            this.apiSecret = apiSecret;
        }

        public String getAuthorizationCode() {
            return authorizationCode;
        }

        public void setAuthorizationCode(String authorizationCode) {
            this.authorizationCode = authorizationCode;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }
    }
}