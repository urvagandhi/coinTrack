package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class KiteResponseMetadata {
    private LocalDateTime lastSyncedAt;
    private String source; // "CACHE" or "LIVE"
}
