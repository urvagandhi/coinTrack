package com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ZerodhaKiteMetadata {
  private LocalDateTime lastSyncedAt;
  private String source; // "CACHE" or "LIVE"
}
