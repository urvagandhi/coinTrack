package com.urva.myfinance.coinTrack.portfolio.dto.kite;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class KiteResponseMetadata {
  private LocalDateTime lastSyncedAt;
  private String source; // "CACHE" or "LIVE"
}
