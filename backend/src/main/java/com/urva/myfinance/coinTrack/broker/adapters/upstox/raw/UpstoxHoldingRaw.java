package com.urva.myfinance.coinTrack.broker.adapters.upstox.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw holding response from Upstox API v2.
 * Prices are Float, quantities are Integer.
 */
@Data
public class UpstoxHoldingRaw {
    @JsonProperty("isin")
    private String isin;

    @JsonProperty("trading_symbol")
    private String tradingSymbol;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("instrument_token")
    private String instrumentToken;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("t1_quantity")
    private Integer t1Quantity;

    @JsonProperty("average_price")
    private Float averagePrice;

    @JsonProperty("last_price")
    private Float lastPrice;

    @JsonProperty("close_price")
    private Float closePrice;

    @JsonProperty("pnl")
    private Float pnl;

    @JsonProperty("day_change")
    private Float dayChange;

    @JsonProperty("day_change_percentage")
    private Float dayChangePercentage;

    @JsonProperty("product")
    private String product;

    @JsonProperty("company_name")
    private String companyName;
}
