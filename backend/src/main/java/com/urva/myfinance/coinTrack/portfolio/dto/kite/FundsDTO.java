package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.math.BigDecimal;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class FundsDTO extends KiteResponseMetadata {

    // Using strict objects instead of Map
    @com.fasterxml.jackson.annotation.JsonProperty("equity")
    private SegmentFundsDTO equity;

    @com.fasterxml.jackson.annotation.JsonProperty("commodity")
    private SegmentFundsDTO commodity;

    @Data
    public static class SegmentFundsDTO {
        @com.fasterxml.jackson.annotation.JsonProperty("enabled")
        private boolean enabled;

        @com.fasterxml.jackson.annotation.JsonProperty("net")
        private BigDecimal net;

        @com.fasterxml.jackson.annotation.JsonProperty("available")
        private Available available; // Nested

        @com.fasterxml.jackson.annotation.JsonProperty("utilised")
        private Utilised utilised; // Nested
    }

    @Data
    public static class Available {
        @com.fasterxml.jackson.annotation.JsonProperty("cash")
        private BigDecimal cash;

        @com.fasterxml.jackson.annotation.JsonProperty("collateral")
        private BigDecimal collateral;

        @com.fasterxml.jackson.annotation.JsonProperty("intraday_payin")
        private BigDecimal intradayPayin;
    }

    @Data
    public static class Utilised {
        @com.fasterxml.jackson.annotation.JsonProperty("debits")
        private BigDecimal debits;

        @com.fasterxml.jackson.annotation.JsonProperty("exposure")
        private BigDecimal exposure;

        @com.fasterxml.jackson.annotation.JsonProperty("span")
        private BigDecimal span;

        @com.fasterxml.jackson.annotation.JsonProperty("option_premium")
        private BigDecimal optionPremium;
    }
}
