package com.urva.myfinance.coinTrack.broker.adapters.upstox.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw position response from Upstox API v2.
 * Prices are Float, quantities are Integer (can be negative for sells).
 */
@Data
public class UpstoxPositionRaw {
    @JsonProperty("trading_symbol")
    private String tradingSymbol;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("instrument_token")
    private String instrumentToken;

    @JsonProperty("product")
    private String product;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("overnight_quantity")
    private Integer overnightQuantity;

    @JsonProperty("average_price")
    private Float averagePrice;

    @JsonProperty("last_price")
    private Float lastPrice;

    @JsonProperty("close_price")
    private Float closePrice;

    @JsonProperty("buy_price")
    private Float buyPrice;

    @JsonProperty("sell_price")
    private Float sellPrice;

    @JsonProperty("buy_quantity")
    private Integer buyQuantity;

    @JsonProperty("sell_quantity")
    private Integer sellQuantity;

    @JsonProperty("realised")
    private Float realised;

    @JsonProperty("unrealised")
    private Float unrealised;

    @JsonProperty("multiplier")
    private Integer multiplier;

    @JsonProperty("instrument_type")
    private String instrumentType;

    @JsonProperty("strike_price")
    private Float strikePrice;

    @JsonProperty("option_type")
    private String optionType;

    @JsonProperty("expiry")
    private String expiry;

    @JsonProperty("pnl")
    private Float pnl;

    /** 1 = long, -1 = short. Use this instead of deriving from quantity sign. */
    @JsonProperty("side")
    private Integer side;

    @JsonProperty("day_buy_value")
    private Float dayBuyValue;

    @JsonProperty("day_sell_value")
    private Float daySellValue;

    @JsonProperty("overnight_buy_amount")
    private Float overnightBuyAmount;

    @JsonProperty("overnight_sell_amount")
    private Float overnightSellAmount;

    @JsonProperty("overnight_buy_quantity")
    private Integer overnightBuyQuantity;

    @JsonProperty("overnight_sell_quantity")
    private Integer overnightSellQuantity;

    @JsonProperty("day_buy_quantity")
    private Integer dayBuyQuantity;

    @JsonProperty("day_sell_quantity")
    private Integer daySellQuantity;
}
