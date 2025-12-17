package com.urva.myfinance.coinTrack.broker.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.broker.service.BrokerConnectService;
import com.urva.myfinance.coinTrack.broker.service.BrokerServiceFactory;
import com.urva.myfinance.coinTrack.broker.service.exception.BrokerException;
import com.urva.myfinance.coinTrack.broker.service.impl.ZerodhaBrokerService;
import com.urva.myfinance.coinTrack.common.util.EncryptionUtil;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.security.model.UserPrincipal;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.service.UserService;

/**
 * Controller for broker connection and credential management.
 * Handles OAuth flows and credential storage for all supported brokers.
 *
 * IDEMPOTENCY: Credential saving updates existing accounts, never duplicates.
 */
@RestController
@RequestMapping("/api/brokers")
public class BrokerConnectController {

    private static final Logger logger = LoggerFactory.getLogger(BrokerConnectController.class);

    private final BrokerConnectService brokerConnectService;
    private final UserService userService;
    private final BrokerAccountRepository accountRepository;
    private final EncryptionUtil encryptionUtil;
    private final BrokerServiceFactory brokerFactory;
    private final String frontendUrl;

    @Autowired
    public BrokerConnectController(BrokerConnectService brokerConnectService, UserService userService,
            BrokerAccountRepository accountRepository, EncryptionUtil encryptionUtil,
            BrokerServiceFactory brokerFactory,
            @Value("${frontend.url:http://localhost:3000}") String frontendUrl) {
        this.brokerConnectService = brokerConnectService;
        this.userService = userService;
        this.accountRepository = accountRepository;
        this.encryptionUtil = encryptionUtil;
        this.brokerFactory = brokerFactory;
        this.frontendUrl = frontendUrl;
    }

    /**
     * Returns login URL for a broker if credentials already exist.
     */
    @GetMapping("/{broker}/connect")
    public ResponseEntity<?> getConnectUrl(
            @PathVariable("broker") String brokerName) {

        User user = getAuthenticatedUser();
        if (user == null) {
            logger.warn("Unauthorized broker connect attempt for broker: {}", brokerName);
            return ResponseEntity.status(401).build();
        }

        // 🔐 Security: Broker connection requires TOTP
        if (!user.isTotpEnabled() || !user.isTotpVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("TOTP 2FA must be enabled to connect brokers.");
        }

        try {
            Broker broker = Broker.valueOf(brokerName.toUpperCase());
            logger.info(LoggingConstants.BROKER_CONNECT_STARTED, broker, user.getId());

            BrokerAccount account = accountRepository.findByUserIdAndBroker(user.getId(), broker)
                    .stream().findFirst().orElse(null);

            if (broker == Broker.ZERODHA) {
                if (account != null && account.getZerodhaApiKey() != null) {
                    ZerodhaBrokerService service = (ZerodhaBrokerService) brokerFactory.getService(Broker.ZERODHA);
                    return ResponseEntity.ok(Map.of("loginUrl", service.getLoginUrl(account.getZerodhaApiKey())));
                } else {
                    return ResponseEntity.badRequest()
                            .body("Zerodha credentials not found. Please provide API Key and Secret.");
                }
            }

            // Fallback for other brokers
            String url = brokerConnectService.getLoginUrl(broker);
            return ResponseEntity.ok(Map.of("loginUrl", url));

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid broker name: {}", brokerName);
            return ResponseEntity.badRequest().body("Invalid broker");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    /**
     * Saves Zerodha API credentials for the authenticated user.
     * IDEMPOTENT: Updates existing account if present, creates new if not.
     */
    @PostMapping("/zerodha/credentials")
    public ResponseEntity<?> saveZerodhaCredentials(
            @RequestBody Map<String, String> credentials) {

        User user = getAuthenticatedUser();
        if (user == null) {
            logger.warn("Unauthorized Zerodha credential save attempt");
            return ResponseEntity.status(401).build();
        }

        String apiKey = credentials.get("apiKey");
        String apiSecret = credentials.get("apiSecret");

        if (apiKey == null || apiSecret == null) {
            return ResponseEntity.badRequest().body("apiKey and apiSecret are required");
        }

        try {
            BrokerAccount account = accountRepository.findByUserIdAndBroker(user.getId(), Broker.ZERODHA)
                    .stream().findFirst().orElse(null);

            if (account == null) {
                account = BrokerAccount.builder()
                        .userId(user.getId())
                        .broker(Broker.ZERODHA)
                        .createdAt(LocalDate.now())
                        .build();
            }

            account.setZerodhaApiKey(apiKey);
            account.setEncryptedZerodhaApiSecret(encryptionUtil.encrypt(apiSecret));
            accountRepository.save(account);

            logger.info(LoggingConstants.BROKER_CREDENTIALS_SAVED, Broker.ZERODHA, user.getId());
            return ResponseEntity.ok(Map.of("message", "Credentials saved successfully"));

        } catch (Exception e) {
            logger.error("Error saving Zerodha credentials for user {}: {}", user.getId(), e.getMessage());
            return ResponseEntity.internalServerError().body("Error saving credentials: " + e.getMessage());
        }
    }

    /**
     * Handles OAuth callback from broker.
     * Exchanges request_token for access_token.
     */
    @PostMapping("/callback")
    public ResponseEntity<?> handleBrokerCallback(
            @RequestBody Map<String, String> payload) {

        User user = getAuthenticatedUser();
        if (user == null) {
            logger.warn("Unauthorized broker callback attempt");
            return ResponseEntity.status(401).build();
        }

        String brokerName = payload.get("broker");
        String requestToken = payload.get("requestToken");

        if (brokerName == null || requestToken == null) {
            return ResponseEntity.badRequest().body("broker and requestToken are required");
        }

        try {
            Broker broker = Broker.valueOf(brokerName.toUpperCase());
            logger.info("Processing {} callback for user {}", broker, user.getId());

            brokerConnectService.handleCallback(user.getId(), broker, requestToken);

            logger.info(LoggingConstants.BROKER_CONNECT_SUCCESS, broker, user.getId());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Connected successfully");
            response.put("broker", brokerName);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid broker in callback: {}", brokerName);
            return ResponseEntity.badRequest().body("Invalid broker");
        } catch (BrokerException e) {
            logger.warn("Broker connection failed: {}", e.getMessage());
            // Safe to return 400 as this usually means invalid/expired token
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error(LoggingConstants.BROKER_CONNECT_FAILED, brokerName, user.getId(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    /**
     * Handles browser redirect from Zerodha.
     * Redirects to Frontend Callback Page with request_token.
     */
    @GetMapping("/zerodha/callback")
    public ResponseEntity<Void> handleBrowserCallback(
            @RequestParam("request_token") String requestToken,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "action", required = false) String action) {

        logger.info("Received browser callback from Zerodha. Request Token: {}", requestToken);

        // Using configured frontend URL

        StringBuilder redirectUrl = new StringBuilder(frontendUrl);
        redirectUrl.append("?request_token=").append(requestToken);

        if (status != null)
            redirectUrl.append("&status=").append(status);
        if (action != null)
            redirectUrl.append("&action=").append(action);

        return ResponseEntity.status(302)
                .header("Location", redirectUrl.toString())
                .build();
    }

    /**
     * Gets authenticated user from SecurityContext.
     * Preferred method for authenticated endpoints.
     *
     * @return User or null if not authenticated
     */
    @SuppressWarnings("unused")
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal) {
            String username = ((UserPrincipal) principal).getUsername();
            return userService.findUserByUsername(username);
        }
        return null;
    }
}
