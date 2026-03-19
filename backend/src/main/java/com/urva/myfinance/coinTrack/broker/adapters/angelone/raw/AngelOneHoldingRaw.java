package com.urva.myfinance.coinTrack.broker.adapters.angelone.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw holding response from Angel One SmartAPI.
 * Per official docs: quantity/t1quantity are int, averageprice/ltp/close/profitandloss are double.
 * isin can be null for SME stocks.
 */
@Data
public class AngelOneHoldingRaw {
    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("isin")
    private String isin;

    @JsonProperty("symboltoken")
    private String symboltoken;

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("t1quantity")
    private Integer t1quantity;

    @JsonProperty("realisedquantity")
    private Integer realisedquantity;

    @JsonProperty("authorisedquantity")
    private Integer authorisedquantity;

    @JsonProperty("averageprice")
    private Double averageprice;

    @JsonProperty("ltp")
    private Double ltp;

    @JsonProperty("close")
    private Double close;

    @JsonProperty("profitandloss")
    private Double profitandloss;

    @JsonProperty("pnlpercentage")
    private Double pnlpercentage;

    @JsonProperty("product")
    private String product;

    @JsonProperty("collateralquantity")
    private Integer collateralquantity;

    @JsonProperty("collateraltype")
    private String collateraltype;

    @JsonProperty("haircut")
    private Double haircut;

    @JsonProperty("symbolname")
    private String symbolname;
}
