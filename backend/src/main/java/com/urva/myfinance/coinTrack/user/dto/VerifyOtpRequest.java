package com.urva.myfinance.coinTrack.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "OTP is required")
    private String otp;
}
