package com.urva.myfinance.coinTrack.fixeddeposit.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.urva.myfinance.coinTrack.fixeddeposit.model.FdStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedDepositResponseDTO {

    private String id;
    private Long fdNo;
    private String userId;
    private String place;
    private String holderName;
    private String nominee;
    private String accountNumber;
    private BigDecimal interestRate;
    private String investmentPeriod;
    private LocalDate issueDate;
    private LocalDate maturityDate;
    private BigDecimal issueAmount;
    private BigDecimal maturityAmount;
    private FdStatus status;
    private String remarks;
    private Instant createdAt;
    private Instant updatedAt;

    // Derived fields
    private int daysToMaturity;
    private String highlight; // "YELLOW", "RED", or null
}
