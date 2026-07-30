package com.urva.myfinance.coinTrack.epf.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EpfSettingsResponseDTO {
    private String userId;
    private BigDecimal currentBalance;
    private LocalDate asOfDate;
    private BigDecimal employeeContributionRate;
    private BigDecimal employerContributionRate;
    private BigDecimal epsContributionRate;
    private BigDecimal defaultBasicDA;
    private boolean useActualSalaryForEps;
    private BigDecimal monthlyVpfAmount;
    private Instant updatedAt;
}
