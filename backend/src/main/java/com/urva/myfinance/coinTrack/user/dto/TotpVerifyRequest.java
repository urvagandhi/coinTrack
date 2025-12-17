package com.urva.myfinance.coinTrack.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TotpVerifyRequest {
    @NotBlank
    @Size(min = 6, max = 6, message = "Code must be 6 digits")
    private String code;

    // Optional tempToken for login completion
    private String tempToken;
}
