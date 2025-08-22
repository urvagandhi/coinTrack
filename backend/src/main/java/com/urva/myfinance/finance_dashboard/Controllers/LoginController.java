package com.urva.myfinance.finance_dashboard.Controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.finance_dashboard.Model.User;
import com.urva.myfinance.finance_dashboard.Service.UserService;

@RestController
public class LoginController {

    private final UserService service;

    public LoginController(UserService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public String login(@RequestBody User user) {
        return service.verifyUser(user);
    }
}
