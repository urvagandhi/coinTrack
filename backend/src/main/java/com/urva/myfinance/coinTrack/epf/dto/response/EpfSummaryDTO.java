package com.urva.myfinance.coinTrack.epf.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfSummaryDTO {
    private BigDecimal currentEpfBalance;
    private BigDecimal currentEpsBalance;
    private BigDecimal totalEmployeeContribution;
    private BigDecimal totalEmployerEpfContribution;
    private BigDecimal totalEmployerEpsContribution;
    private BigDecimal totalVpfContributed;
    private BigDecimal interestCreditedLifetimeEpf;
    private BigDecimal interestCreditedLifetimeEps;
    private BigDecimal interestAccruedThisFyEpf;
    private BigDecimal interestAccruedThisFyEps;
    private boolean taxableInterestFlag;
}
