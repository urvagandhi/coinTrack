package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ZerodhaHoldingRaw {
    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("instrument_token")
    private Long instrument_token;

    @JsonProperty("isin")
    private String isin;

    @JsonProperty("product")
    private String product;

    @JsonProperty("quantity")
    private Double quantity;

    @JsonProperty("used_quantity")
    private Double used_quantity;

    @JsonProperty("t1_quantity")
    private Double t1_quantity;

    @JsonProperty("realised_quantity")
    private Double realised_quantity;

    @JsonProperty("opening_quantity")
    private Double opening_quantity;

    @JsonProperty("short_quantity")
    private Double short_quantity;

    @JsonProperty("collateral_quantity")
    private Double collateral_quantity;

    @JsonProperty("average_price")
    private Double average_price;

    @JsonProperty("last_price")
    private Double last_price;

    @JsonProperty("close_price")
    private Double close_price;

    @JsonProperty("pnl")
    private Double pnl;

    @JsonProperty("day_change")
    private Double day_change;

    @JsonProperty("day_change_percentage")
    private Double day_change_percentage;

    @JsonProperty("price")
    private Double price;

    @JsonProperty("authorised_quantity")
    private Double authorised_quantity;

    @JsonProperty("authorised_date")
    private String authorised_date;

    @JsonProperty("authorisation")
    private java.util.Map<String, Object> authorisation;
}
