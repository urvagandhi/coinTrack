package com.urva.myfinance.coinTrack.epf.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.urva.myfinance.coinTrack.epf.model.ContributionMode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfTransactionResponseDTO {
    private String id;
    private Long transactionNo;
    private String userId;
    private LocalDate transactionDate;
    private ContributionMode mode;
    private BigDecimal basicDA;
    private BigDecimal employeeContribution;
    private BigDecimal employerEpfContribution;
    private BigDecimal employerEpsContribution;
    private BigDecimal vpfAmount;
    private BigDecimal withdrawalAmount;
    private BigDecimal epfBalance;
    private BigDecimal epsBalance;
    private String remarks;
    private Instant createdAt;
    private Instant updatedAt;
}
