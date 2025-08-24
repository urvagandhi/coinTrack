package com.urva.myfinance.coinTrack.Controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.Model.User;
import com.urva.myfinance.coinTrack.Service.UserService;

@RestController
public class LoginController {

    private final UserService service;

    public LoginController(UserService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public String login(@RequestBody User user) {
        try {
            String result = service.verifyUser(user);
            return result;
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }
}
