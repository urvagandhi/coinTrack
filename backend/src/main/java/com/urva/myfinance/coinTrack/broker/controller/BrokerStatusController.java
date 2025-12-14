package com.urva.myfinance.coinTrack.broker.controller;

import java.security.Principal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.broker.dto.BrokerStatusResponse;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import com.urva.myfinance.coinTrack.broker.service.BrokerStatusService;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;

/**
 * Controller for broker connection status.
 * Uses Principal from SecurityContext for user identification.
 */
@RestController
@RequestMapping("/api/brokers")
public class BrokerStatusController {

    private static final Logger logger = LoggerFactory.getLogger(BrokerStatusController.class);

    private final BrokerStatusService brokerStatusService;
    private final UserRepository userRepository;

    @Autowired
    public BrokerStatusController(BrokerStatusService brokerStatusService, UserRepository userRepository) {
        this.brokerStatusService = brokerStatusService;
        this.userRepository = userRepository;
    }

    @GetMapping("/{broker}/status")
    public ResponseEntity<?> getBrokerStatus(
            Principal principal,
            @PathVariable("broker") String brokerName) {

        logger.debug("Getting broker status for {} - user: {}", brokerName, principal.getName());

        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            logger.warn("User not found: {}", principal.getName());
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }

        Broker broker;
        try {
            broker = Broker.valueOf(brokerName.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid broker: {}", brokerName);
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid broker: " + brokerName));
        }

        BrokerStatusResponse response = brokerStatusService.getStatus(user.getId(), broker);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
