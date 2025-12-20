package com.urva.myfinance.coinTrack.email.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.email.service.EmailService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class ContactController {

    private final EmailService emailService;

    @PostMapping("/contact")
    public ResponseEntity<String> sendContactMessage(@Valid @RequestBody ContactFormRequest request) {
        emailService.sendContactFormEmail(request.getName(), request.getEmail(), request.getMessage());
        return ResponseEntity.ok("Message sent successfully");
    }

    @Data
    public static class ContactFormRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Message is required")
        private String message;
    }
}
