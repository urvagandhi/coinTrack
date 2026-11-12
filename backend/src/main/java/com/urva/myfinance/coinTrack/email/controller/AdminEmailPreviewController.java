package com.urva.myfinance.coinTrack.email.controller;

import com.urva.myfinance.coinTrack.email.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin controller for previewing email templates.
 *
 * <p>DEV-ONLY: This controller is only available in dev profile.
 *
 * <p>Usage Examples: GET /admin/emails/preview?template=welcome&username=TestUser GET
 * /admin/emails/preview?template=verify-email&username=TestUser&magicLink=https://example.com GET
 * /admin/emails/preview?template=reset-password&username=TestUser&magicLink=https://example.com GET
 * /admin/emails/preview?template=change-email&oldEmail=old@example.com&newEmail=new@example.com GET
 * /admin/emails/preview?template=2fa-recovery&username=TestUser GET
 * /admin/emails/preview?template=security-alert&username=TestUser&event=Password+Changed GET
 * /admin/emails/preview?template=contact-form
 */
@RestController
@org.springframework.context.annotation.Profile("dev")
@RequestMapping("/admin/emails")
@RequiredArgsConstructor
@Tag(name = "Admin Email Preview", description = "Preview email templates (dev only)")
public class AdminEmailPreviewController {

  private final EmailService emailService;

  /** Preview an email template with sample data. */
  @Operation(summary = "Preview an email template with sample data")
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
        variables.put(
            "magicLink",
            magicLink != null
                ? magicLink
                : "https://app.cointrack.app/verify?token=sample-token-123");
        break;
      case "change-email":
        variables.put(
            "magicLink",
            magicLink != null
                ? magicLink
                : "https://app.cointrack.app/verify?token=sample-token-123");
        variables.put("oldEmail", oldEmail != null ? oldEmail : "old@example.com");
        variables.put("newEmail", newEmail != null ? newEmail : "new@example.com");
        break;
      case "2fa-recovery":
        variables.put(
            "magicLink",
            magicLink != null
                ? magicLink
                : "https://app.cointrack.app/reset-2fa?token=sample-token-123");
        break;
      case "security-alert":
        variables.put("event", event != null ? event : "Password Changed");
        variables.put("timestamp", "March 18, 2026 at 09:30 AM");
        Map<String, String> metadata = new HashMap<>();
        metadata.put("IP Address", "192.168.1.1");
        metadata.put("Device", "Chrome 122 / Windows 11");
        variables.put("metadata", metadata);
        break;
      case "contact-form":
        variables.put("name", name != null ? name : "Rahul Sharma");
        variables.put("email", "rahul@example.com");
        variables.put(
            "message",
            "Hi, I'm having trouble connecting my Zerodha account.\nThe callback page shows a blank screen after login.\n\nCan you help?");
        break;
      case "welcome":
      default:
        break;
    }

    String html = emailService.previewEmailTemplate(template, variables);
    return ResponseEntity.ok(html);
  }

  /** List available templates with sample preview URLs. */
  @Operation(summary = "List available email templates with sample preview URLs")
  @GetMapping("/templates")
  public ResponseEntity<?> listTemplates() {
    List<Map<String, String>> templateDetails =
        List.of(
            Map.of(
                "name", "welcome",
                "description", "Welcome email for newly registered users",
                "previewUrl", "/admin/emails/preview?template=welcome&username=TestUser"),
            Map.of(
                "name", "verify-email",
                "description", "Email address verification link",
                "previewUrl", "/admin/emails/preview?template=verify-email&username=TestUser"),
            Map.of(
                "name", "reset-password",
                "description", "Password reset link",
                "previewUrl", "/admin/emails/preview?template=reset-password&username=TestUser"),
            Map.of(
                "name", "change-email",
                "description", "Email change confirmation",
                "previewUrl",
                    "/admin/emails/preview?template=change-email&oldEmail=old@example.com&newEmail=new@example.com"),
            Map.of(
                "name", "2fa-recovery",
                "description", "Two-factor authentication email recovery link",
                "previewUrl", "/admin/emails/preview?template=2fa-recovery"),
            Map.of(
                "name", "security-alert",
                "description", "Security notification alert",
                "previewUrl",
                    "/admin/emails/preview?template=security-alert&event=Password+Changed"),
            Map.of(
                "name", "contact-form",
                "description", "Support contact form notification",
                "previewUrl", "/admin/emails/preview?template=contact-form"));

    return ResponseEntity.ok(
        Map.of(
            "usage",
            "/admin/emails/preview?template=<name>",
            "templates",
            new String[] {
              "welcome",
              "verify-email",
              "reset-password",
              "change-email",
              "2fa-recovery",
              "security-alert",
              "contact-form"
            },
            "previews",
            templateDetails));
  }
}
