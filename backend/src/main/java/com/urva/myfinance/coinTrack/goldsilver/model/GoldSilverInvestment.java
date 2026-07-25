package com.urva.myfinance.coinTrack.goldsilver.model;

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

@Document(collection = "gold_silver_investments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldSilverInvestment {

    @Id
    private String id;

    @Indexed
    private Long itemNo;

    @Indexed
    private String userId;

    private LocalDate purchaseDate;
    private String purchasedFrom;
    private MetalType metalType;
    private String purchaseItem;
    private String purity;
    private String purityOptionId;
    private String purityLabel;
    private BigDecimal purityFactor;
    @Builder.Default
    private RateSource rateSource = RateSource.LIVE;
    private BigDecimal ratePerGram;
    private BigDecimal netWeight;
    private BigDecimal metalAmount;
    private BigDecimal makingChargePercent;
    private BigDecimal makingChargeAmount;
    private BigDecimal stoneOtherCharges;
    private BigDecimal totalAmount;
    private BigDecimal gstPercent;
    private BigDecimal gstAmount;
    private BigDecimal netAmount;
    private BigDecimal currentMarketRate;
    private BigDecimal currentValue;
    private BigDecimal profitLoss;
    private BigDecimal returnPercent;
    private LocalDate maturityDate;
    private GsStatus status;
    private String remarks;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
