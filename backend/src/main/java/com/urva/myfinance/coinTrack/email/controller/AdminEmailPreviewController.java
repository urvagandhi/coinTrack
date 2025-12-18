package com.urva.myfinance.coinTrack.email.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.email.service.EmailService;

import lombok.RequiredArgsConstructor;

/**
 * Admin controller for previewing email templates.
 *
 * DEV-ONLY: This controller is only available in dev profile.
 *
 * Usage:
 * GET /admin/emails/preview?template=welcome&username=TestUser
 * GET
 * /admin/emails/preview?template=verify-email&username=TestUser&magicLink=https://example.com
 * GET
 * /admin/emails/preview?template=reset-password&username=TestUser&magicLink=https://example.com
 * GET
 * /admin/emails/preview?template=change-email&username=TestUser&oldEmail=old@email.com&newEmail=new@email.com
 * GET
 * /admin/emails/preview?template=security-alert&username=TestUser&event=Password+Changed
 */
@RestController
@RequestMapping("/admin/emails")
@RequiredArgsConstructor
// Note: Endpoint is secured by SecurityConfig, accessible for development
public class AdminEmailPreviewController {

    private final EmailService emailService;

    /**
     * Preview an email template with sample data.
     */
    @GetMapping(value = "/preview", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> previewTemplate(
            @RequestParam String template,
            @RequestParam(defaultValue = "TestUser") String username,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String magicLink,
            @RequestParam(required = false) String oldEmail,
            @RequestParam(required = false) String newEmail,
            @RequestParam(required = false) String event,
            @RequestParam(defaultValue = "10") int expiryMinutes) {

        Map<String, Object> variables = new HashMap<>();
        variables.put("username", username);
        variables.put("name", name != null ? name : username);
        variables.put("expiryMinutes", expiryMinutes);

        // Template-specific variables
        switch (template) {
            case "verify-email":
            case "reset-password":
                variables.put("magicLink",
                        magicLink != null ? magicLink : "https://app.cointrack.app/verify?token=sample-token-123");
                break;
            case "change-email":
                variables.put("magicLink",
                        magicLink != null ? magicLink : "https://app.cointrack.app/verify?token=sample-token-123");
                variables.put("oldEmail", oldEmail != null ? oldEmail : "old@example.com");
                variables.put("newEmail", newEmail != null ? newEmail : "new@example.com");
                break;
            case "security-alert":
                variables.put("event", event != null ? event : "Password Changed");
                variables.put("timestamp", "December 18, 2025 at 09:30 AM");
                Map<String, String> metadata = new HashMap<>();
                metadata.put("IP Address", "192.168.1.1");
                metadata.put("Location", "Mumbai, India");
                variables.put("metadata", metadata);
                break;
            case "welcome":
            default:
                // Welcome doesn't need extra variables
                break;
        }

        String html = emailService.previewEmailTemplate(template, variables);
        return ResponseEntity.ok(html);
    }

    /**
     * List available templates.
     */
    @GetMapping("/templates")
    public ResponseEntity<?> listTemplates() {
        return ResponseEntity.ok(Map.of(
                "templates", new String[] {
                        "welcome",
                        "verify-email",
                        "reset-password",
                        "change-email",
                        "security-alert"
                },
                "usage", "/admin/emails/preview?template=<name>&username=<user>"));
    }
}
