package com.urva.myfinance.coinTrack.user.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class TotpSetupResponse {
    private String secret; // Base32 encoded secret for manual entry
    private String qrCodeUri; // otpauth://totp/...
    private String qrCodeBase64; // Data URL for QR image
    private List<String> backupCodes; // Only on initial setup and reset
}
