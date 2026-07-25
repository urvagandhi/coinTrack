package com.urva.myfinance.coinTrack.epf.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfInterestRateRequestDTO {

    @NotBlank(message = "Financial year is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Financial year must be in format YYYY-YY (e.g. 2025-26)")
    private String financialYear;

    @NotNull(message = "Interest rate percent is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rate must be greater than 0")
    @DecimalMax(value = "20.0", inclusive = true, message = "Rate must be less than or equal to 20")
    private BigDecimal ratePercent;
}
