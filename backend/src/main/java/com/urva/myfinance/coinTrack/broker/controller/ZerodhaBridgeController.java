package com.urva.myfinance.coinTrack.broker.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class ZerodhaBridgeController {

    @GetMapping("/zerodha/callback")
    public RedirectView handleCallback(@RequestParam("request_token") String requestToken) {
        // Redirect to Frontend (Port 3000)
        // Adjust the URL if your frontend runs on a different port or domain
        String frontendUrl = "http://localhost:3000/brokers/zerodha/callback?request_token=" + requestToken;
        return new RedirectView(frontendUrl);
    }
}
