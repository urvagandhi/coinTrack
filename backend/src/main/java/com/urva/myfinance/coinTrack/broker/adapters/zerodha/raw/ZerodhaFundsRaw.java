package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ZerodhaFundsRaw {

    private LocalDateTime lastSyncedAt;
    private String source; // "CACHE" or "LIVE"

    @JsonProperty("equity")
    private SegmentFundsDTO equity;

    @JsonProperty("commodity")
    private SegmentFundsDTO commodity;

    @Data
    public static class SegmentFundsDTO {
        @JsonProperty("enabled")
        private boolean enabled;

        @JsonProperty("net")
        private BigDecimal net;

        @JsonProperty("available")
        private Available available;

        @JsonProperty("utilised")
        private Utilised utilised;

        @JsonProperty("raw")
        private Map<String, Object> raw;
    }

    @Data
    public static class Available {
        @JsonProperty("cash")
        private BigDecimal cash;

        @JsonProperty("collateral")
        private BigDecimal collateral;

        @JsonProperty("intraday_payin")
        private BigDecimal intradayPayin;

        @JsonProperty("opening_balance")
        private BigDecimal openingBalance;

        @JsonProperty("live_balance")
        private BigDecimal liveBalance;
    }

    @Data
    public static class Utilised {
        @JsonProperty("debits")
        private BigDecimal debits;

        @JsonProperty("exposure")
        private BigDecimal exposure;

        @JsonProperty("span")
        private BigDecimal span;

        @JsonProperty("option_premium")
        private BigDecimal optionPremium;
    }
}
