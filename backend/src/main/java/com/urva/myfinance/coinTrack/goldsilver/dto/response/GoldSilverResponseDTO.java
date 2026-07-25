package com.urva.myfinance.coinTrack.goldsilver.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.GsStatus;
import com.urva.myfinance.coinTrack.goldsilver.model.RateSource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldSilverResponseDTO {

    private String id;
    private Long itemNo;
    private String userId;
    private LocalDate purchaseDate;
    private String purchasedFrom;
    private MetalType metalType;
    private String purchaseItem;
    private String purity;
    private String purityOptionId;
    private String purityLabel;
    private BigDecimal purityFactor;
    private RateSource rateSource;
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
    private Instant createdAt;
    private Instant updatedAt;

    // Derived fields
    private Integer daysToMaturity;
    private String highlight; // "YELLOW", "RED", or null
    private boolean rateStale;
    private Instant rateAsOf;
}
