package com.urva.myfinance.coinTrack.portfolio.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualRefreshResponse {
    private boolean accepted;
    private String message;
    private List<String> triggeredBrokers;
    private List<String> skippedBrokers;
}
