package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MfInstrumentDTO {

    private String tradingSymbol;

    private String name;

    private String amc;

    private String isin;

    private String schemeType;

    private String plan;

    private String category;

    private String fundHouse;

    private String schemeCode;

    /**
     * Stores the complete raw JSON object received from Zerodha.
     * This ensures forward compatibility if new fields are added.
     */
    private Map<String, Object> raw;
}
