package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.util.List;

import lombok.Data;

@Data
public class UserProfileDTO {
    private String userId;
    private String userName;
    private String userShortname;
    private String email;
    private String broker;
    private List<String> exchanges;
    private List<String> products;
    private List<String> orderTypes;
    private String avatarUrl;
}
