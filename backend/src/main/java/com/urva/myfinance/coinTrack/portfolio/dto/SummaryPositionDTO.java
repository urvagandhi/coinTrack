package com.urva.myfinance.coinTrack.portfolio.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SummaryPositionDTO {
    @JsonProperty("symbol")
    private String symbol;

    @JsonProperty("broker_quantity_map")
    private Map<String, java.math.BigDecimal> brokerQuantityMap;

    @JsonProperty("total_quantity")
    private java.math.BigDecimal totalQuantity;

    @JsonProperty("average_buy_price")
    private java.math.BigDecimal averageBuyPrice;

    @JsonProperty("current_price")
    private java.math.BigDecimal currentPrice;

    @JsonProperty("previous_close")
    private java.math.BigDecimal previousClose;

    @JsonProperty("invested_value")
    private java.math.BigDecimal investedValue;

    @JsonProperty("current_value")
    private java.math.BigDecimal currentValue;

    @JsonProperty("unrealized_pl")
    private java.math.BigDecimal unrealizedPl;

    @JsonProperty("day_gain")
    private java.math.BigDecimal dayGain;

    @JsonProperty("day_gain_percent")
    private java.math.BigDecimal dayGainPercent;

    @JsonProperty("position_type")
    private String positionType;

    @JsonProperty("derivative")
    private Boolean derivative;

    @JsonProperty("instrument_type")
    private String instrumentType;

    @JsonProperty("strike_price")
    private java.math.BigDecimal strikePrice;

    @JsonProperty("option_type")
    private String optionType;

    @JsonProperty("expiry_date")
    private String expiryDate;

    @JsonProperty("raw")
    private Map<String, Object> raw;
}
