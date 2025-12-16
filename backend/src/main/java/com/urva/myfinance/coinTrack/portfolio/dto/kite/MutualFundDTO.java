package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MutualFundDTO {
    private String fund;

    private String tradingSymbol;

    private String folio;

    private String amc;

    private String isin;

    private BigDecimal quantity;

    private BigDecimal averagePrice;

    private BigDecimal currentPrice;

    private BigDecimal currentValue;

    private BigDecimal unrealizedPL;

    private String lastPriceDate;

    // Raw Pass-Through
    private java.util.Map<String, Object> raw;

    // --- Fallback & Computed Logic (API Layer) ---

    // Computed Fields
    public BigDecimal getInvestedValue() {
        if (quantity != null && averagePrice != null) {
            return quantity.multiply(averagePrice).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal getCurrentValue() {
        // Trust Broker First
        if (this.currentValue != null && this.currentValue.compareTo(BigDecimal.ZERO) != 0) {
            return this.currentValue;
        }
        // Fallback: Quantity * Current Price
        if (quantity != null && currentPrice != null) {
            return quantity.multiply(currentPrice).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal getUnrealizedPL() {
        // Trust Broker First
        if (this.unrealizedPL != null && this.unrealizedPL.compareTo(BigDecimal.ZERO) != 0) {
            return this.unrealizedPL;
        }
        // Fallback: Current Value - Invested Value
        BigDecimal cv = getCurrentValue();
        BigDecimal iv = getInvestedValue();
        return cv.subtract(iv).setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
