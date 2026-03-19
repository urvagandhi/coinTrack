package com.urva.myfinance.coinTrack.broker.adapters.angelone.raw;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw funds/margin response from Angel One SmartAPI.
 * All numeric fields are Strings — parsed by PriceNormalizer in the mapper.
 */
@Data
public class AngelOneFundsRaw {
    @JsonProperty("availablecash")
    private String availablecash;

    @JsonProperty("utiliseddebits")
    private String utiliseddebits;

    @JsonProperty("net")
    private String net;

    @JsonProperty("collateral")
    private String collateral;

    @JsonProperty("utilisedamount")
    private String utilisedamount;

    @JsonProperty("m2munrealized")
    private String m2munrealized;

    @JsonProperty("m2mrealized")
    private String m2mrealized;

    @JsonProperty("utilisedpayout")
    private String utilisedpayout;
}
