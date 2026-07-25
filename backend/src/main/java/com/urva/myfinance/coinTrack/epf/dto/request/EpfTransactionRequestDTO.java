package com.urva.myfinance.coinTrack.epf.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import com.urva.myfinance.coinTrack.epf.model.ContributionMode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfTransactionRequestDTO {

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    @NotNull(message = "Contribution mode is required")
    private ContributionMode mode;

    private BigDecimal basicDA;                      // populated if AUTO_SALARY; nullable if MANUAL_OVERRIDE
    private BigDecimal employeeContribution;          // computed (AUTO) or user-entered (MANUAL)
    private BigDecimal employerEpfContribution;       // computed (AUTO) or user-entered (MANUAL)
    private BigDecimal employerEpsContribution;       // computed (AUTO) or user-entered (MANUAL)
    private BigDecimal vpfAmount;                      // additional, goes to EPF balance only
    private BigDecimal withdrawalAmount;               // nullable — from EPF balance only
    private String remarks;
}
