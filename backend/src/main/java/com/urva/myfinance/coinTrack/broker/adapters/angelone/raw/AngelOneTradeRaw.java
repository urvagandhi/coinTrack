package com.urva.myfinance.coinTrack.broker.adapters.angelone.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw trade row from Angel One SmartAPI /rest/secure/angelbroking/order/v1/getTradeBook.
 * All numeric fields are Strings — parsed by PriceNormalizer in the mapper.
 * Timestamp `filltime` arrives as "HH:mm:ss" or full timestamp depending on session.
 */
@Data
public class AngelOneTradeRaw {

    @JsonProperty("orderid")
    private String orderid;

    @JsonProperty("exchorderid")
    private String exchorderid;

    @JsonProperty("fillid")
    private String fillid;

    @JsonProperty("tradevalue")
    private String tradevalue;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("producttype")
    private String producttype;

    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("symboltoken")
    private String symboltoken;

    @JsonProperty("instrumenttype")
    private String instrumenttype;

    @JsonProperty("transactiontype")
    private String transactiontype;

    @JsonProperty("fillprice")
    private String fillprice;

    @JsonProperty("fillsize")
    private String fillsize;

    @JsonProperty("filltime")
    private String filltime;

    @JsonProperty("multiplier")
    private String multiplier;

    @JsonProperty("strikeprice")
    private String strikeprice;

    @JsonProperty("optiontype")
    private String optiontype;

    @JsonProperty("expirydate")
    private String expirydate;
}
