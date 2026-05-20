package com.urva.myfinance.coinTrack.broker.adapters.angelone.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw order row from Angel One SmartAPI /rest/secure/angelbroking/order/v1/getOrderBook.
 * All numeric fields are Strings — parsed by PriceNormalizer in the mapper.
 * Timestamps arrive as "dd-MMM-yyyy HH:mm:ss" (e.g. "12-May-2026 14:30:45").
 */
@Data
public class AngelOneOrderRaw {

    @JsonProperty("orderid")
    private String orderid;

    @JsonProperty("uniqueorderid")
    private String uniqueorderid;

    @JsonProperty("exchorderid")
    private String exchorderid;

    @JsonProperty("status")
    private String status;

    @JsonProperty("text")
    private String text;

    @JsonProperty("orderstatus")
    private String orderstatus;

    @JsonProperty("variety")
    private String variety;

    @JsonProperty("ordertype")
    private String ordertype;

    @JsonProperty("producttype")
    private String producttype;

    @JsonProperty("duration")
    private String duration;

    @JsonProperty("transactiontype")
    private String transactiontype;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("symboltoken")
    private String symboltoken;

    @JsonProperty("instrumenttype")
    private String instrumenttype;

    @JsonProperty("price")
    private String price;

    @JsonProperty("triggerprice")
    private String triggerprice;

    @JsonProperty("averageprice")
    private String averageprice;

    @JsonProperty("quantity")
    private String quantity;

    @JsonProperty("filledshares")
    private String filledshares;

    @JsonProperty("unfilledshares")
    private String unfilledshares;

    @JsonProperty("disclosedquantity")
    private String disclosedquantity;

    @JsonProperty("squareoff")
    private String squareoff;

    @JsonProperty("stoploss")
    private String stoploss;

    @JsonProperty("trailingstoploss")
    private String trailingstoploss;

    @JsonProperty("ordertag")
    private String ordertag;

    @JsonProperty("updatetime")
    private String updatetime;

    @JsonProperty("exchtime")
    private String exchtime;

    @JsonProperty("exchorderupdatetime")
    private String exchorderupdatetime;
}
