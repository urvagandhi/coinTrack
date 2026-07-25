package com.urva.myfinance.coinTrack.goldsilver.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;
import com.urva.myfinance.coinTrack.goldsilver.model.RateSource;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldSilverRequestDTO {

    private Long itemNo;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    private String purchasedFrom;

    @NotNull(message = "Metal type is required")
    private MetalType metalType;

    @NotBlank(message = "Purchase item is required")
    private String purchaseItem;

    private String purity;

    private String purityOptionId;

    private RateSource rateSource;

    @NotNull(message = "Rate per gram is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rate per gram must be greater than 0")
    private BigDecimal ratePerGram;

    @NotNull(message = "Net weight is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Net weight must be greater than 0")
    private BigDecimal netWeight;

    private BigDecimal makingChargePercent;
    
    private BigDecimal stoneOtherCharges;
    
    private BigDecimal gstPercent;
    
    private BigDecimal currentMarketRate;
    
    private LocalDate maturityDate;
    
    private String remarks;
}
