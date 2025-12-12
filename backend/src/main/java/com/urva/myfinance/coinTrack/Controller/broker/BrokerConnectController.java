package com.urva.myfinance.coinTrack.Controller.broker;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.UserService;
import com.urva.myfinance.coinTrack.Service.broker.BrokerConnectService;

@RestController
@RequestMapping("/api/brokers")
public class BrokerConnectController {

    private final BrokerConnectService brokerConnectService;
    private final UserService userService;

    @Autowired
    public BrokerConnectController(BrokerConnectService brokerConnectService, UserService userService) {
        this.brokerConnectService = brokerConnectService;
        this.userService = userService;
    }

    @GetMapping("/{broker}/connect")
    public ResponseEntity<?> getConnectUrl(
            @RequestHeader("Authorization") String token,
            @PathVariable("broker") String brokerName) {

        User user = getUserFromToken(token);
        if (user == null)
            return ResponseEntity.status(401).build();

        try {
            Broker broker = Broker.valueOf(brokerName.toUpperCase());
            String url = brokerConnectService.getLoginUrl(broker);
            Map<String, String> response = new HashMap<>();
            response.put("loginUrl", url);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid broker");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{broker}/callback")
    public ResponseEntity<?> handleCallback(
            @RequestHeader("Authorization") String token,
            @PathVariable("broker") String brokerName,
            @RequestParam("request_token") String requestToken) {

        User user = getUserFromToken(token);
        if (user == null)
            return ResponseEntity.status(401).build();

        try {
            Broker broker = Broker.valueOf(brokerName.toUpperCase());
            brokerConnectService.handleCallback(user.getId(), broker, requestToken);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Connected successfully");
            response.put("broker", broker.name());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid broker");
        } catch (Exception e) {
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
