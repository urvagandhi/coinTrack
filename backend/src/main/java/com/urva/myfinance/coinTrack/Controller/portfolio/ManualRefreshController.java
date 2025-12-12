package com.urva.myfinance.coinTrack.Controller.portfolio;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.DTO.ManualRefreshResponse;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.UserService;
import com.urva.myfinance.coinTrack.Service.sync.PortfolioSyncService;

@RestController
@RequestMapping("/api/portfolio")
public class ManualRefreshController {

    private final PortfolioSyncService portfolioSyncService;
    private final UserService userService;

    @Autowired
    public ManualRefreshController(PortfolioSyncService portfolioSyncService, UserService userService) {
        this.portfolioSyncService = portfolioSyncService;
        this.userService = userService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<ManualRefreshResponse> triggerManualRefresh(@RequestHeader("Authorization") String token) {
        // Extract userId from token
        String jwt = token;
        if (jwt != null && jwt.startsWith("Bearer ")) {
            jwt = jwt.substring(7);
        }

        // Use existing UserService method
        User user = userService.getUserByToken(jwt);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        ManualRefreshResponse response = portfolioSyncService.triggerManualRefreshForUser(user.getId());
        return ResponseEntity.ok(response);
    }
}
