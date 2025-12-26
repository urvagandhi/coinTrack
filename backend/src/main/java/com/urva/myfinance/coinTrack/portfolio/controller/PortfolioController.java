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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

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
@Tag(name = "Portfolio", description = "Portfolio summary, holdings, positions, funds, and mutual funds")
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
    @Operation(summary = "Get consolidated portfolio summary")
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
    @Operation(summary = "Get equity holdings")
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
    @Operation(summary = "Get net positions")
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

    @Operation(summary = "Get orders")
    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null)
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getOrders(user.getId())));
    }

    @Operation(summary = "Get funds and margin")
    @GetMapping("/funds")
    public ResponseEntity<?> getFunds(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null)
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getFunds(user.getId())));
    }

    @Operation(summary = "Get mutual fund holdings")
    @GetMapping("/mf/holdings")
    public ResponseEntity<?> getMutualFunds(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getMutualFunds(user.getId())));
    }

    @Operation(summary = "Get trades")
    @GetMapping("/trades")
    public ResponseEntity<?> getTrades(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getTrades(user.getId())));
    }

    @Operation(summary = "Get mutual fund orders")
    @GetMapping("/mf/orders")
    public ResponseEntity<?> getMfOrders(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getMfOrders(user.getId())));
    }

    @Operation(summary = "Get mutual fund timeline")
    @GetMapping("/mf/timeline")
    public ResponseEntity<?> getMfTimeline(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getMfTimeline(user.getId())));
    }

    @Operation(summary = "Get broker profile")
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null)
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getProfile(user.getId())));
    }

    @Operation(summary = "Get mutual fund SIPs")
    @GetMapping("/mf/sips")
    public ResponseEntity<?> getMfSips(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getMfSips(user.getId())));
    }

    @Operation(summary = "Get mutual fund instruments")
    @GetMapping("/mf/instruments")
    public ResponseEntity<?> getMfInstruments(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(portfolioSummaryService.getMfInstruments(user.getId())));
    }
}
