package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ZerodhaUserProfileRaw {
    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("user_shortname")
    private String userShortname;

    @JsonProperty("email")
    private String email;

    @JsonProperty("broker")
    private String broker;

    @JsonProperty("exchanges")
    private List<String> exchanges;

    @JsonProperty("products")
    private List<String> products;

    @JsonProperty("order_types")
    private List<String> orderTypes;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    @JsonProperty("last_synced")
    private String lastSynced;

    @JsonProperty("raw")
    private Map<String, Object> raw;
}
