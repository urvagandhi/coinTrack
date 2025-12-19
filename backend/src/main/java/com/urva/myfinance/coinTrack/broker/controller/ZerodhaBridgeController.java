package com.urva.myfinance.coinTrack.broker.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class ZerodhaBridgeController {

    private final String frontendUrl;

    public ZerodhaBridgeController(
            @Value("${frontend.url:http://localhost:3000}") String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    @GetMapping("/zerodha/callback")
    public RedirectView handleCallback(@RequestParam("request_token") String requestToken) {
        // Redirect to Frontend URL (configured via frontend.url property)
        String redirectUrl = frontendUrl + "/brokers/zerodha/callback?request_token=" + requestToken;
        return new RedirectView(redirectUrl);
    }
}
