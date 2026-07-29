package com.urva.myfinance.coinTrack.goldsilver.dto.response;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldApiUsageDTO {
    private int requestsToday;
    private int requestsYesterday;
    private int requestsThisMonth;
    private int requestsLastMonth;
    private int monthlyLimit;
    private int remainingRequests;
    private Instant fetchedAt;
}
