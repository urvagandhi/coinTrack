package com.urva.myfinance.coinTrack.broker.adapters.upstox.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw funds/margin response from Upstox API v2.
 * Response shape: { "status":"success", "data": { "equity": {...}, "commodity": {...} } }
 * This DTO maps to the top-level data object (equity + commodity segments).
 */
@Data
public class UpstoxFundsRaw {

    @JsonProperty("equity")
    private EquityFunds equity;

    @JsonProperty("commodity")
    private EquityFunds commodity;

    @Data
    public static class EquityFunds {
        @JsonProperty("available_margin")
        private Float availableMargin;

        @JsonProperty("used_margin")
        private Float usedMargin;

        @JsonProperty("collateral")
        private Float collateral;

        @JsonProperty("payin_amount")
        private Float payinAmount;

        @JsonProperty("span_margin")
        private Float spanMargin;

        @JsonProperty("exposure_margin")
        private Float exposureMargin;

        @JsonProperty("adhoc_funds")
        private Float adhocFunds;

        @JsonProperty("payout")
        private Float payout;
    }
}
