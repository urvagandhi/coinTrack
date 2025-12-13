package com.urva.myfinance.coinTrack.portfolio.controller;

import java.security.Principal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.NetPositionDTO;
import com.urva.myfinance.coinTrack.portfolio.dto.PortfolioSummaryResponse;
import com.urva.myfinance.coinTrack.portfolio.service.NetPositionService;
import com.urva.myfinance.coinTrack.portfolio.service.PortfolioSummaryService;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

/**
 * REST controller for portfolio operations.
 * Uses Principal from SecurityContext for user identification (not
 * getUserByToken).
 */
@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioController.class);

    private final PortfolioSummaryService portfolioSummaryService;
    private final NetPositionService netPositionService;
    private final UserRepository userRepository;

    @Autowired
    public PortfolioController(PortfolioSummaryService portfolioSummaryService, NetPositionService netPositionService,
            UserRepository userRepository) {
        this.portfolioSummaryService = portfolioSummaryService;
        this.netPositionService = netPositionService;
        this.userRepository = userRepository;
    }

    /**
     * Get portfolio summary for authenticated user.
     * Uses SecurityContext Principal instead of manual token parsing.
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getPortfolioSummary(Principal principal) {
        logger.debug("Getting portfolio summary for user: {}", principal.getName());

        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            logger.warn("User not found: {}", principal.getName());
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }

        PortfolioSummaryResponse response = portfolioSummaryService.getPortfolioSummary(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get consolidated holdings (from all brokers).
     * Filtered from Summary service to ensure consistency.
     */
    @GetMapping("/holdings")
    public ResponseEntity<?> getHoldings(Principal principal) {
        logger.debug("Getting holdings for user: {}", principal.getName());

        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            logger.warn("User not found: {}", principal.getName());
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }

        PortfolioSummaryResponse summary = portfolioSummaryService.getPortfolioSummary(user.getId());
        List<com.urva.myfinance.coinTrack.portfolio.dto.SummaryHoldingDTO> holdings = summary.getHoldingsList().stream()
                .filter(h -> "HOLDING".equalsIgnoreCase(h.getType()))
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(holdings));
    }

    /**
     * Get net positions for authenticated user.
     * Renamed from /net-positions to /positions to match canonical API.
     */
    @GetMapping("/positions")
    public ResponseEntity<?> getPositions(Principal principal) {
        logger.debug("Getting net positions for user: {}", principal.getName());

        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            logger.warn("User not found: {}", principal.getName());
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }

        List<NetPositionDTO> positions = netPositionService.mergeHoldingsAndPositions(user.getId());
        return ResponseEntity.ok(ApiResponse.success(positions));
    }
}
