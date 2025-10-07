package com.urva.myfinance.coinTrack.Controller.angelone;

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

import com.urva.myfinance.coinTrack.DTO.angelone.AngelOneCredentialsDTO;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.JWTService;
import com.urva.myfinance.coinTrack.Service.UserService;
import com.urva.myfinance.coinTrack.Service.angelone.AngelOneServiceImpl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Production-ready REST controller for AngelOne (Angel Broking SmartAPI) broker
 * integration.
 * 
 * Provides comprehensive broker account lifecycle management including:
 * - JWT-based authentication and authorization
 * - Credential storage and secure connection management
 * - Real-time portfolio data fetching (holdings, orders, positions)
 * - Token refresh and session management
 * - Account disconnection and cleanup
 * 
 * All endpoints require valid JWT authentication via Authorization header.
 * 
 * @author coinTrack Team
 * @version 1.0
 * @since 2025-01-01
 */
@RestController
@RequestMapping("/api/brokers/angelone")
// @CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
// RequestMethod.GET,
// RequestMethod.POST,
// RequestMethod.PUT,
// RequestMethod.DELETE,
// RequestMethod.OPTIONS
// })
@Validated
public class AngelOneController {

    private static final Logger logger = LoggerFactory.getLogger(AngelOneController.class);

    // Constants for repeated messages
    private static final String AUTH_ERROR = "Invalid or missing authentication token";
    private static final String BROKER_NAME = "angelone";
    private static final String CONNECTION_SUCCESS = "AngelOne account connected successfully";
    private static final String DISCONNECTION_SUCCESS = "AngelOne account disconnected successfully";
    private static final String TOKEN_REFRESH_SUCCESS = "AngelOne token refreshed successfully";
    private static final String CREDENTIALS_STORED_SUCCESS = "Credentials stored successfully";
    private static final String FETCH_ERROR = "Failed to fetch data from AngelOne";
    private static final String INTERNAL_ERROR = "Internal server error occurred";

    private final AngelOneServiceImpl angelOneService;
    private final JWTService jwtService;
    private final UserService userService;

    public AngelOneController(AngelOneServiceImpl angelOneService, JWTService jwtService, UserService userService) {
        this.angelOneService = angelOneService;
        this.jwtService = jwtService;
        this.userService = userService;
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
    public ResponseEntity<?> getLoginUrl(HttpServletRequest request) {
        logger.info("GET /api/brokers/angelone/login-url - Fetching login information");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /login-url - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} requesting AngelOne login information", userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "AngelOne uses direct credential authentication");
            response.put("loginMethod", "credentials");
            response.put("broker", BROKER_NAME);
            response.put("requiredFields", "apiKey, clientId, pin, totp");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error generating AngelOne login info: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(INTERNAL_ERROR));
        }
    }

    /**
     * Store AngelOne credentials and connect account.
     * Accepts TOTP secret for automatic TOTP generation on future connections.
     * 
     * @param request     HTTP request to extract user info
     * @param credentials AngelOne API credentials
     * @return success message
     */
    @PostMapping("/credentials")
    public ResponseEntity<?> storeCredentials(
            HttpServletRequest request,
            @Valid @RequestBody AngelOneCredentialsDTO credentials) {

        logger.info("POST /api/brokers/angelone/credentials - Storing credentials (TOTP secret: {})",
                credentials.getTotpSecret() != null ? "provided" : "not provided");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /credentials - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} storing AngelOne credentials", userId);

            // Store credentials without connecting
            Map<String, Object> credentialsMap = new HashMap<>();
            credentialsMap.put("apiKey", credentials.getApiKey());
            credentialsMap.put("clientId", credentials.getClientId());
            credentialsMap.put("pin", credentials.getPin());

            // Add totpSecret if provided (will be encrypted by service layer)
            if (credentials.getTotpSecret() != null && !credentials.getTotpSecret().isBlank()) {
                credentialsMap.put("totpSecret", credentials.getTotpSecret());
            }

            Map<String, Object> result = angelOneService.storeCredentials(userId, credentialsMap);

            if (result != null && "stored".equals(result.get("status"))) {
                logger.info("Successfully stored AngelOne credentials for user: {}", userId);
                // Normalize success response and use constant message
                Map<String, Object> response = new HashMap<>();
                response.put("status", "stored");
                response.put("message", CREDENTIALS_STORED_SUCCESS);
                response.put("broker", BROKER_NAME);
                response.put("userId", userId); // Use the extracted userId from token
                response.put("accountId", result.get("accountId")); // Add accountId from service
                return ResponseEntity.ok(response);
            } else {
                String errorMsg = result != null ? (String) result.get("message") : "Unknown error";
                logger.error("Failed to store credentials for user {}: {}", userId, errorMsg);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to store credentials: " + errorMsg));
            }
        } catch (IllegalArgumentException e) {
            logger.error("Validation error storing credentials: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error storing AngelOne credentials: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(INTERNAL_ERROR));
        }
    }

    /**
     * Connect AngelOne account with authentication.
     * Supports both manual TOTP and automatic TOTP generation from stored secret.
     * 
     * @param request     HTTP request to extract user info
     * @param credentials Authentication credentials
     * @return connection status
     */
    @PostMapping("/connect")
    public ResponseEntity<?> connectAccount(
            HttpServletRequest request,
            @RequestBody(required = false) AngelOneCredentialsDTO credentials) {

        logger.info("POST /api/brokers/angelone/connect - Connecting account (TOTP: {}, Secret: {})",
                credentials.getTotp() != null ? "provided" : "not provided",
                credentials.getTotpSecret() != null ? "provided" : "not provided");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /connect - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} attempting to connect AngelOne account", userId);

            // Prepare credentials map - use provided values or empty for database retrieval
            Map<String, Object> credentialsMap = new HashMap<>();
            if (credentials != null) {
                if (credentials.getApiKey() != null && !credentials.getApiKey().isBlank()) {
                    credentialsMap.put("apiKey", credentials.getApiKey());
                }
                if (credentials.getClientId() != null && !credentials.getClientId().isBlank()) {
                    credentialsMap.put("clientId", credentials.getClientId());
                }
                if (credentials.getPin() != null && !credentials.getPin().isBlank()) {
                    credentialsMap.put("pin", credentials.getPin());
                }
                if (credentials.getTotp() != null && !credentials.getTotp().isBlank()) {
                    credentialsMap.put("totp", credentials.getTotp());
                }
                if (credentials.getTotpSecret() != null && !credentials.getTotpSecret().isBlank()) {
                    credentialsMap.put("totpSecret", credentials.getTotpSecret());
                }
            }

            Map<String, Object> result = angelOneService.connect(userId, credentialsMap);

            if (result != null && "connected".equals(result.get("status"))) {
                logger.info("Successfully connected AngelOne account for user: {}", userId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "connected");
                response.put("message", CONNECTION_SUCCESS);
                response.put("broker", BROKER_NAME);
                response.put("userId", userId); // Use our app userId from token
                response.put("angelOneUserId", result.get("userId")); // AngelOne's userId
                response.put("tokenExpiresAt", result.get("tokenExpiresAt"));

                return ResponseEntity.ok(response);
            } else {
                String errorMsg = result != null ? (String) result.get("message") : "Unknown error";
                logger.error("Failed to connect account for user {}: {}", userId, errorMsg);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to connect account: " + errorMsg));
            }
        } catch (IllegalArgumentException e) {
            logger.error("Validation error connecting account: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error connecting AngelOne account: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Connection failed: " + e.getMessage()));
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
        logger.info("GET /api/brokers/angelone/holdings - Fetching holdings");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /holdings - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} fetching AngelOne holdings", userId);

            Map<String, Object> holdings = angelOneService.fetchHoldings(userId);

            if (holdings != null && "success".equals(holdings.get("status"))) {
                logger.info("Successfully fetched holdings for user: {}", userId);
                return ResponseEntity.ok(holdings);
            } else {
                logger.warn("No holdings found for user: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No holdings found or account not connected"));
            }
        } catch (RuntimeException e) {
            logger.error("Error fetching AngelOne holdings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(FETCH_ERROR + ": " + e.getMessage()));
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
        logger.info("GET /api/brokers/angelone/orders - Fetching orders");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /orders - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} fetching AngelOne orders", userId);

            Map<String, Object> orders = angelOneService.fetchOrders(userId);

            if (orders != null && "success".equals(orders.get("status"))) {
                logger.info("Successfully fetched orders for user: {}", userId);
                return ResponseEntity.ok(orders);
            } else {
                logger.warn("No orders found for user: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No orders found or account not connected"));
            }
        } catch (RuntimeException e) {
            logger.error("Error fetching AngelOne orders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(FETCH_ERROR + ": " + e.getMessage()));
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
        logger.info("GET /api/brokers/angelone/positions - Fetching positions");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /positions - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} fetching AngelOne positions", userId);

            Map<String, Object> positions = angelOneService.fetchPositions(userId);

            if (positions != null && "success".equals(positions.get("status"))) {
                logger.info("Successfully fetched positions for user: {}", userId);
                return ResponseEntity.ok(positions);
            } else {
                logger.warn("No positions found for user: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("No positions found or account not connected"));
            }
        } catch (RuntimeException e) {
            logger.error("Error fetching AngelOne positions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(FETCH_ERROR + ": " + e.getMessage()));
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
        logger.info("GET /api/brokers/angelone/status - Checking account status");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /status - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} checking AngelOne account status", userId);

            boolean connected = angelOneService.isConnected(userId);

            Map<String, Object> status = new HashMap<>();
            status.put("userId", userId);
            status.put("broker", BROKER_NAME);
            status.put("connected", connected);
            status.put("message", connected ? "Account connected" : "Account not connected");

            logger.info("AngelOne account status for user {}: {}", userId, connected ? "connected" : "not connected");
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Error fetching AngelOne account status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(INTERNAL_ERROR));
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
        logger.info("POST /api/brokers/angelone/refresh-token - Refreshing token");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /refresh-token - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} refreshing AngelOne token", userId);

            Map<String, Object> result = angelOneService.refreshToken(userId);

            if (result != null && "refreshed".equals(result.get("status"))) {
                logger.info("Successfully refreshed AngelOne token for user: {}", userId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "refreshed");
                response.put("message", TOKEN_REFRESH_SUCCESS);
                response.put("broker", BROKER_NAME);
                response.put("tokenExpiresAt", result.get("tokenExpiresAt"));

                return ResponseEntity.ok(response);
            } else {
                String errorMsg = result != null ? (String) result.get("message") : "Unknown error";
                logger.error("Failed to refresh token for user {}: {}", userId, errorMsg);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to refresh token: " + errorMsg));
            }
        } catch (RuntimeException e) {
            logger.error("Error refreshing AngelOne token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to refresh token: " + e.getMessage()));
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
        logger.info("POST /api/brokers/angelone/disconnect - Disconnecting account");

        try {
            String userId = extractUserIdFromToken(request);
            if (userId == null) {
                logger.warn("Unauthorized access attempt to /disconnect - missing or invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(AUTH_ERROR));
            }

            logger.debug("User {} disconnecting AngelOne account", userId);

            Map<String, Object> result = angelOneService.disconnect(userId);

            if (result != null && "disconnected".equals(result.get("status"))) {
                logger.info("Successfully disconnected AngelOne account for user: {}", userId);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "disconnected");
                response.put("message", DISCONNECTION_SUCCESS);
                response.put("broker", BROKER_NAME);

                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to disconnect account for user: {}", userId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Failed to disconnect account"));
            }
        } catch (Exception e) {
            logger.error("Error disconnecting AngelOne account: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(INTERNAL_ERROR));
        }
    }

    /**
     * Extract user ID (MongoDB ObjectId) from JWT token in request.
     * 
     * @param request HTTP request
     * @return user ObjectId or null if invalid
     */
    private String extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.debug("Missing or invalid Authorization header format");
            return null;
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            logger.debug("Empty JWT token in Authorization header");
            return null;
        }

        try {
            // Extract username from JWT token
            String username = jwtService.extractUsername(token);
            if (username == null || username.isEmpty()) {
                logger.warn("JWT token contains null or empty username");
                return null;
            }

            // Get user by username to retrieve ObjectId
            User user = userService.getUserByToken(token);
            if (user == null) {
                logger.warn("User not found for username: {}", username);
                return null;
            }

            // Return the MongoDB ObjectId
            return user.getId();
        } catch (Exception ex) {
            logger.error("Failed to extract user ID from JWT: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Create standardized error response map.
     *
     * @param message error message
     * @return error response map
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        error.put("broker", BROKER_NAME);
        return error;
    }
}