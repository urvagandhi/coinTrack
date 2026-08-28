package com.urva.myfinance.coinTrack.fixeddeposit.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "fixed_deposits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class FixedDeposit {

    @Id
    private String id;

    @Indexed
    private Long fdNo;

    @Indexed
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

    // FD Type & Compounding
    @Builder.Default
    private FdType fdType = FdType.CUMULATIVE;

    @Builder.Default
    private CompoundingFrequency compoundingFrequency = CompoundingFrequency.QUARTERLY;

    private InterestPayoutFrequency payoutFrequency;

    // Senior Citizen / Tax-Saver
    @Builder.Default
    private Boolean isSeniorCitizen = false;

    @Builder.Default
    private Boolean isTaxSaver = false;

    @Builder.Default
    private Integer taxSaverLockInYears = 5;

    // TDS
    @Builder.Default
    private Boolean hasPan = true;

    @Builder.Default
    private Boolean form15g15hSubmitted = false;

    private Integer financialYear;

    // Premature Withdrawal
    @Builder.Default
    private Boolean isPrematurelyWithdrawn = false;

    private LocalDate withdrawalDate;
    private BigDecimal realizedMaturityAmount;
    private BigDecimal penaltyAmount;
    private BigDecimal effectiveRateApplied;

    // Server-side validation
    private BigDecimal serverComputedMaturityAmount;
    private Boolean maturityAmountOverridden;
    private BigDecimal maturityDifference;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
