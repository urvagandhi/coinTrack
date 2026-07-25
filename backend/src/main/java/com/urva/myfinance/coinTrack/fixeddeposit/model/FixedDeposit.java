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
@Builder
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

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
