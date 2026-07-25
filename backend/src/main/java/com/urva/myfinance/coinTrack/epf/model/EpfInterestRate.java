package com.urva.myfinance.coinTrack.epf.model;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "epf_interest_rates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpfInterestRate {
    @Id
    private String id;

    @Indexed(unique = true)
    private String financialYear; // e.g. "2025-26"

    private BigDecimal ratePercent; // e.g. 8.25

    @LastModifiedDate
    private Instant updatedAt;
}
