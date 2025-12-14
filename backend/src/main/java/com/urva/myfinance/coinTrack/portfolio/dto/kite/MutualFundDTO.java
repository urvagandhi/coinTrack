package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MutualFundDTO {
    @com.fasterxml.jackson.annotation.JsonProperty("fund")
    private String fund;

    @com.fasterxml.jackson.annotation.JsonProperty("folio")
    private String folio;

    @com.fasterxml.jackson.annotation.JsonProperty("amc")
    private String amc; // From prompt

    @com.fasterxml.jackson.annotation.JsonProperty("isin")
    private String isin; // From prompt

    @com.fasterxml.jackson.annotation.JsonProperty("quantity")
    private BigDecimal quantity;

    @com.fasterxml.jackson.annotation.JsonProperty("average_price")
    private BigDecimal averagePrice;

    @com.fasterxml.jackson.annotation.JsonProperty("last_price")
    private BigDecimal lastPrice;

    @com.fasterxml.jackson.annotation.JsonProperty("current_value")
    private BigDecimal currentValue; // Calculated or present in response

    @com.fasterxml.jackson.annotation.JsonProperty("pnl")
    private BigDecimal pnl;
}
