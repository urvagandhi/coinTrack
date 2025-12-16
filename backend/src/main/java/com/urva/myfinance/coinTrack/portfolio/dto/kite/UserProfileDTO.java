package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.util.List;

import lombok.Data;

@Data
public class UserProfileDTO {
    @com.fasterxml.jackson.annotation.JsonProperty("user_id")
    private String userId;

    @com.fasterxml.jackson.annotation.JsonProperty("user_name")
    private String userName;

    @com.fasterxml.jackson.annotation.JsonProperty("user_shortname")
    private String userShortname;

    @com.fasterxml.jackson.annotation.JsonProperty("email")
    private String email;

    @com.fasterxml.jackson.annotation.JsonProperty("broker")
    private String broker;

    @com.fasterxml.jackson.annotation.JsonProperty("exchanges")
    private List<String> exchanges;
    @com.fasterxml.jackson.annotation.JsonProperty("products")
    private List<String> products;

    @com.fasterxml.jackson.annotation.JsonProperty("order_types")
    private List<String> orderTypes;

    @com.fasterxml.jackson.annotation.JsonProperty("avatar_url")
    private String avatarUrl;

    @com.fasterxml.jackson.annotation.JsonProperty("last_synced")
    private java.time.LocalDateTime lastSynced;

    @com.fasterxml.jackson.annotation.JsonProperty("raw")
    private java.util.Map<String, Object> raw;
}
