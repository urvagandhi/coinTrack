package com.urva.myfinance.coinTrack.Controller.broker;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.DTO.BrokerStatusResponse;
import com.urva.myfinance.coinTrack.Model.Broker;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.UserService;
import com.urva.myfinance.coinTrack.Service.broker.BrokerStatusService;

@RestController
@RequestMapping("/api/brokers")
public class BrokerStatusController {

    private final BrokerStatusService brokerStatusService;
    private final UserService userService;

    @Autowired
    public BrokerStatusController(BrokerStatusService brokerStatusService, UserService userService) {
        this.brokerStatusService = brokerStatusService;
        this.userService = userService;
    }

    @GetMapping("/{broker}/status")
    public ResponseEntity<BrokerStatusResponse> getBrokerStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable("broker") String brokerName) {

        // Extract userId from token
        String jwt = token;
        if (jwt != null && jwt.startsWith("Bearer ")) {
            jwt = jwt.substring(7);
        }
        User user = userService.getUserByToken(jwt);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        // Parse Broker Enum
        Broker broker;
        try {
            broker = Broker.valueOf(brokerName.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        BrokerStatusResponse response = brokerStatusService.getStatus(user.getId(), broker);
        return ResponseEntity.ok(response);
    }
}
