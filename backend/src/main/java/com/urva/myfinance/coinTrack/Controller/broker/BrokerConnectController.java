package com.urva.myfinance.coinTrack.Controller.broker;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.BrokerAccount;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.Service.UserService;
import com.urva.myfinance.coinTrack.Service.broker.BrokerConnectService;
import com.urva.myfinance.coinTrack.Service.broker.BrokerServiceFactory;
import com.urva.myfinance.coinTrack.Service.broker.impl.ZerodhaBrokerService;
import com.urva.myfinance.coinTrack.Utils.EncryptionUtil;

@RestController
@RequestMapping("/api/brokers")
public class BrokerConnectController {

    private final BrokerConnectService brokerConnectService;
    private final UserService userService;
    private final BrokerAccountRepository accountRepository;
    private final EncryptionUtil encryptionUtil;
    private final BrokerServiceFactory brokerFactory;

    @Autowired
    public BrokerConnectController(BrokerConnectService brokerConnectService, UserService userService,
            BrokerAccountRepository accountRepository, EncryptionUtil encryptionUtil,
            BrokerServiceFactory brokerFactory) {
        this.brokerConnectService = brokerConnectService;
        this.userService = userService;
        this.accountRepository = accountRepository;
        this.encryptionUtil = encryptionUtil;
        this.brokerFactory = brokerFactory;
    }

    // Generic Connect: returns Login URL if credentials already exist
    @GetMapping("/{broker}/connect")
    public ResponseEntity<?> getConnectUrl(
            @RequestHeader("Authorization") String token,
            @PathVariable("broker") String brokerName) {

        User user = getUserFromToken(token);
        if (user == null)
            return ResponseEntity.status(401).build();

        try {
            Broker broker = Broker.valueOf(brokerName.toUpperCase());
            // Check if account exists
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

            // Fallback for others
            String url = brokerConnectService.getLoginUrl(broker);
            return ResponseEntity.ok(Map.of("loginUrl", url));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid broker");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // Zerodha specific connect: Saves credentials
    @PostMapping("/zerodha/credentials")
    public ResponseEntity<?> saveZerodhaCredentials(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> credentials) {

        User user = getUserFromToken(token);
        if (user == null)
            return ResponseEntity.status(401).build();

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

            return ResponseEntity.ok(Map.of("message", "Credentials saved successfully"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error saving credentials: " + e.getMessage());
        }
    }

    // Generic Callback Handler (POST)
    @PostMapping("/callback")
    public ResponseEntity<?> handleBrokerCallback(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> payload) {

        User user = getUserFromToken(token);
        if (user == null)
            return ResponseEntity.status(401).build();

        String brokerName = payload.get("broker");
        String requestToken = payload.get("requestToken");

        if (brokerName == null || requestToken == null) {
            return ResponseEntity.badRequest().body("broker and requestToken are required");
        }

        try {
            Broker broker = Broker.valueOf(brokerName.toUpperCase());
            brokerConnectService.handleCallback(user.getId(), broker, requestToken);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Connected successfully");
            response.put("broker", brokerName);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid broker");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    private User getUserFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return userService.getUserByToken(token);
    }
}
