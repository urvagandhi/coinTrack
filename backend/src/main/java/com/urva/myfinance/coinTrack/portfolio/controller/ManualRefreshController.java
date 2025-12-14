package com.urva.myfinance.coinTrack.portfolio.controller;

import java.security.Principal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.common.util.LoggingConstants;
import com.urva.myfinance.coinTrack.portfolio.dto.ManualRefreshResponse;
import com.urva.myfinance.coinTrack.portfolio.sync.PortfolioSyncService;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

/**
 * Controller for manual portfolio refresh.
 * Uses Principal from SecurityContext for user identification.
 */
@RestController
@RequestMapping("/api/portfolio")
public class ManualRefreshController {

    private static final Logger logger = LoggerFactory.getLogger(ManualRefreshController.class);

    private final PortfolioSyncService portfolioSyncService;
    private final UserRepository userRepository;

    @Autowired
    public ManualRefreshController(PortfolioSyncService portfolioSyncService, UserRepository userRepository) {
        this.portfolioSyncService = portfolioSyncService;
        this.userRepository = userRepository;
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> triggerManualRefresh(Principal principal) {
        logger.info(LoggingConstants.SYNC_STARTED, principal.getName());

        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            logger.warn(LoggingConstants.USER_NOT_FOUND, principal.getName());
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }

        ManualRefreshResponse response = portfolioSyncService.triggerManualRefreshForUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
