package com.urva.myfinance.coinTrack.goldsilver.dto.response;

import java.math.BigDecimal;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurityOptionDTO {
    private String id;

    @NotNull(message = "Metal type is required")
    private MetalType metalType;

    @NotBlank(message = "Label is required")
    private String label;

    @NotNull(message = "Purity factor is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Purity factor must be > 0")
    private BigDecimal purityFactor;

    private boolean isSystemDefault;
}
