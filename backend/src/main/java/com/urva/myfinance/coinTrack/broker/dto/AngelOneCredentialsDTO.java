package com.urva.myfinance.coinTrack.broker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Data Transfer Object for AngelOne credentials.
 * 
 * Supports two authentication methods:
 * 1. Manual TOTP: Provide 6-digit TOTP code directly in 'totp' field
 * 2. Auto TOTP: Provide Base32-encoded 'totpSecret' for automatic code generation
 * 
 * If both are provided, 'totp' takes precedence for that request.
 * If only 'totpSecret' is provided, TOTP will be generated automatically on each connection.
 * 
 * @author coinTrack Team
 * @version 2.0
 * @since 2025-01-06
 */
@Data
public class AngelOneCredentialsDTO {

    private String appUserId; // Your internal user ID (optional, extracted from JWT)

    @NotBlank(message = "API key is required")
    private String apiKey; // SmartAPI API key (required in header)

    @NotBlank(message = "Client ID is required")
    private String clientId; // Angel One client code (clientcode)

    @NotBlank(message = "PIN is required")
    private String pin; // Trading PIN / MPIN (used as password)

    private String totp; // Current 6-digit TOTP code (optional if totpSecret is provided)

    private String totpSecret; // Base32-encoded TOTP secret for automatic code generation (optional)
}
