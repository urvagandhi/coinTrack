package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MfInstrumentDTO {

    private String tradingSymbol;

    private String name;

    private String amc;

    private String isin;

    private String schemeType;

    private String plan;

    private String fundHouse;

    private String dividendType;

    private java.math.BigDecimal purchaseAmountMultiplier;

    private java.math.BigDecimal minimumAdditionalPurchaseAmount;

    private java.math.BigDecimal minimumPurchaseAmount;

    private Boolean redemptionAllowed;

    private java.math.BigDecimal minimumRedemptionQuantity;

    private java.math.BigDecimal redemptionQuantityMultiplier;

    private String lastPriceDate;

    private Boolean purchaseAllowed;

    private String settlementType;

    private java.math.BigDecimal lastPrice;

    /**
     * Stores the complete raw JSON object received from Zerodha.
     * This ensures forward compatibility if new fields are added.
     */
    private Map<String, Object> raw;
}
