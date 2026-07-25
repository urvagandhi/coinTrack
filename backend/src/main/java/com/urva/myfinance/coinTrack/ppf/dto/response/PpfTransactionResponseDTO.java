package com.urva.myfinance.coinTrack.ppf.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.urva.myfinance.coinTrack.ppf.model.PpfParticularType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpfTransactionResponseDTO {

    private String id;
    private Long transactionNo;
    private String userId;
    private LocalDate transactionDate;
    private String particulars;
    private PpfParticularType particularType;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal balance;
    private String remarks;
    private Instant createdAt;
    private Instant updatedAt;
}
