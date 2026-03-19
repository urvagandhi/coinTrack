package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.math.BigDecimal;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ZerodhaMfInstrumentRaw {

    private String tradingSymbol;

    private String name;

    private String amc;

    private String isin;

    private String schemeType;

    private String plan;

    private String fundHouse;

    private String dividendType;

    private BigDecimal purchaseAmountMultiplier;

    private BigDecimal minimumAdditionalPurchaseAmount;

    private BigDecimal minimumPurchaseAmount;

    private Boolean redemptionAllowed;

    private Boolean purchaseAllowed;

    private BigDecimal minimumRedemptionQuantity;

    private BigDecimal redemptionQuantityMultiplier;

    private String lastPriceDate;

    private String settlementType;

    private BigDecimal lastPrice;

    /**
     * Stores the complete raw JSON object received from Zerodha.
     * This ensures forward compatibility if new fields are added.
     */
    private Map<String, Object> raw;
}
