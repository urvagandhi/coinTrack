package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

/**
 * Raw MF holding response from Zerodha Kite API.
 * Wire format: prices and quantity are doubles.
 * CRITICAL: tradingsymbol field IS the ISIN (starts with INF).
 */
@Data
public class ZerodhaMfHoldingRaw {

    @JsonProperty("folio")
    private String folio;

    @JsonProperty("fund")
    private String fund;

    @JsonProperty("tradingsymbol")
    private String tradingsymbol;

    @JsonProperty("average_price")
    private Double averagePrice;

    @JsonProperty("last_price")
    private Double lastPrice;

    @JsonProperty("last_price_date")
    private String lastPriceDate;

    @JsonProperty("pledged_quantity")
    private Integer pledgedQuantity;

    @JsonProperty("pnl")
    private Double pnl;

    @JsonProperty("quantity")
    private Double quantity;

    // For mapper compatibility — derived fields
    public String getIsin() {
        return tradingsymbol; // tradingsymbol IS the ISIN for MF
    }

    public String getAmc() {
        return null; // Not provided by Zerodha
    }

    public Double getCurrentPrice() {
        return lastPrice;
    }

    // Raw pass-through for ZerodhaLiveDataService
    private Map<String, Object> raw;
}
