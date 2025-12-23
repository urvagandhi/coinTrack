package com.urva.myfinance.coinTrack.broker.adapters.angelone.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw position response from Angel One SmartAPI.
 * All numeric fields are Strings — parsed by PriceNormalizer in the mapper.
 */
@Data
public class AngelOnePositionRaw {
    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("symboltoken")
    private String symboltoken;

    @JsonProperty("producttype")
    private String producttype;

    @JsonProperty("instrumenttype")
    private String instrumenttype;

    @JsonProperty("netqty")
    private String netqty;

    @JsonProperty("buyavgprice")
    private String buyavgprice;

    @JsonProperty("sellavgprice")
    private String sellavgprice;

    @JsonProperty("avg_price")
    private String avgPrice;

    @JsonProperty("buqty")
    private String buqty;

    @JsonProperty("sellqty")
    private String sellqty;

    @JsonProperty("buyamt")
    private String buyamt;

    @JsonProperty("sellamt")
    private String sellamt;

    @JsonProperty("ltp")
    private String ltp;

    @JsonProperty("close")
    private String close;

    @JsonProperty("realisedprofitloss")
    private String realisedprofitloss;

    @JsonProperty("unrealisedprofitloss")
    private String unrealisedprofitloss;

    @JsonProperty("totalprofitloss")
    private String totalprofitloss;

    @JsonProperty("multiplier")
    private String multiplier;

    @JsonProperty("lotsize")
    private String lotsize;

    @JsonProperty("strikeprice")
    private String strikeprice;

    @JsonProperty("optiontype")
    private String optiontype;

    @JsonProperty("expirydate")
    private String expirydate;
}
