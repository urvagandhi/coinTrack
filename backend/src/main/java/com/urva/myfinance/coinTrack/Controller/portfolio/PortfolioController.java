package com.urva.myfinance.coinTrack.Controller.portfolio;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.DTO.PortfolioSummaryResponse;
import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.UserService;
import com.urva.myfinance.coinTrack.Service.portfolio.PortfolioSummaryService;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioSummaryService portfolioSummaryService;
    private final UserService userService;

    @Autowired
    public PortfolioController(PortfolioSummaryService portfolioSummaryService, UserService userService) {
        this.portfolioSummaryService = portfolioSummaryService;
        this.userService = userService;
    }

    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummaryResponse> getPortfolioSummary(@RequestHeader("Authorization") String token) {
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

        PortfolioSummaryResponse response = portfolioSummaryService.getPortfolioSummary(user.getId());
        return ResponseEntity.ok(response);
    }
}
