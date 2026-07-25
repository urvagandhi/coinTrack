package com.urva.myfinance.coinTrack.epf.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfSettingsRequestDTO {

    @NotNull(message = "Default Basic+DA is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Basic+DA must be greater than or equal to 0")
    private BigDecimal defaultBasicDA;

    @NotNull(message = "Employee contribution rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Employee contribution rate must be greater than 0")
    private BigDecimal employeeContributionRate; // e.g. 12.00, 10.00, 8.00

    private boolean useActualSalaryForEps;

    private BigDecimal monthlyVpfAmount;
}
