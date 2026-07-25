package com.urva.myfinance.coinTrack.epf.model;

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

@Document(collection = "epf_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfTransaction {
    @Id
    private String id;

    @Indexed
    private Long transactionNo;

    @Indexed
    private String userId;

    private LocalDate transactionDate;             // ordering key
    private ContributionMode mode;                   // AUTO_SALARY or MANUAL_OVERRIDE
    private BigDecimal basicDA;                      // populated if AUTO_SALARY; nullable if MANUAL_OVERRIDE
    private BigDecimal employeeContribution;          // computed (AUTO) or user-entered (MANUAL)
    private BigDecimal employerEpfContribution;       // computed (AUTO) or user-entered (MANUAL)
    private BigDecimal employerEpsContribution;       // computed (AUTO) or user-entered (MANUAL)
    private BigDecimal vpfAmount;                      // additional, goes to EPF balance only
    private BigDecimal withdrawalAmount;               // nullable — from EPF balance only, EPS withdrawal handled separately if ever needed
    private BigDecimal epfBalance;                      // auto-calculated running balance (post-transaction, pre-interest-credit)
    private BigDecimal epsBalance;                      // auto-calculated running balance (post-transaction, pre-interest-credit)
    private String remarks;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
