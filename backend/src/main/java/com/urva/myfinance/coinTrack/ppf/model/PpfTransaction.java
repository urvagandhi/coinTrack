package com.urva.myfinance.coinTrack.ppf.model;

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

@Document(collection = "ppf_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpfTransaction {

    @Id
    private String id;

    @Indexed
    private Long transactionNo; // sequential, display-only — NOT the ordering key

    @Indexed
    private String userId; // ownership scope

    private LocalDate transactionDate; // THE ordering key for balance calc

    private String particulars;

    private PpfParticularType particularType;

    private BigDecimal debitAmount; // nullable

    private BigDecimal creditAmount; // nullable

    private BigDecimal balance; // auto-calculated, never client-supplied

    private String remarks;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
