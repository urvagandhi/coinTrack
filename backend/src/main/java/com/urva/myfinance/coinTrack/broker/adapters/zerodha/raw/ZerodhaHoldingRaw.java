package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.util.Map;

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
    private Integer quantity;

    @JsonProperty("used_quantity")
    private Integer used_quantity;

    @JsonProperty("t1_quantity")
    private Integer t1_quantity;

    @JsonProperty("realised_quantity")
    private Integer realised_quantity;

    @JsonProperty("opening_quantity")
    private Integer opening_quantity;

    @JsonProperty("short_quantity")
    private Integer short_quantity;

    @JsonProperty("collateral_quantity")
    private Integer collateral_quantity;

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
    private Integer authorised_quantity;

    @JsonProperty("authorised_date")
    private String authorised_date;

    @JsonProperty("authorisation")
    private Map<String, Object> authorisation;
}
