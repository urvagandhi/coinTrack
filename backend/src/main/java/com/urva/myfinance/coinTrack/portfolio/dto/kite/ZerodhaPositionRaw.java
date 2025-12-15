package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ZerodhaPositionRaw {
    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("instrument_token")
    private Long instrument_token;

    @JsonProperty("product")
    private String product;

    @JsonProperty("quantity")
    private Double quantity;

    @JsonProperty("overnight_quantity")
    private Double overnight_quantity;

    @JsonProperty("average_price")
    private Double average_price;

    @JsonProperty("last_price")
    private Double last_price;

    @JsonProperty("close_price")
    private Double close_price;

    @JsonProperty("pnl")
    private Double pnl;

    @JsonProperty("m2m")
    private Double m2m;

    @JsonProperty("value")
    private Double value;

    @JsonProperty("buy_quantity")
    private Double buy_quantity;

    @JsonProperty("buy_price")
    private Double buy_price;

    @JsonProperty("sell_quantity")
    private Double sell_quantity;

    @JsonProperty("sell_price")
    private Double sell_price;

    @JsonProperty("day_buy_quantity")
    private Double day_buy_quantity;

    @JsonProperty("day_sell_quantity")
    private Double day_sell_quantity;

    @JsonProperty("day_buy_value")
    private Double day_buy_value;

    @JsonProperty("day_sell_value")
    private Double day_sell_value;

    // F&O Fields
    @JsonProperty("instrument_type")
    private String instrument_type;

    @JsonProperty("strike_price")
    private Double strike_price;

    @JsonProperty("option_type")
    private String option_type;

    @JsonProperty("expiry_date")
    private String expiry_date;
}
