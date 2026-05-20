package com.urva.myfinance.coinTrack.portfolio.dto;

import java.time.LocalDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * Per-broker sync health for the frontend dashboard.
 */
@Data
@Builder
@Schema(description = "Portfolio sync health across all connected brokers")
public class SyncStatusResponse {

    @Schema(description = "Per-broker sync status list")
    private List<BrokerSyncStatus> brokers;

    @Schema(description = "Whether any broker has a stale or failed sync")
    private boolean hasIssues;

    @Data
    @Builder
    @Schema(description = "Sync health for a single broker account")
    public static class BrokerSyncStatus {

        @Schema(description = "Broker name", example = "ZERODHA")
        private String broker;

        @Schema(description = "Last sync result: SUCCESS, FAILURE, PARTIAL_FAILURE, NEVER_SYNCED")
        private String lastStatus;

        @Schema(description = "Last successful sync timestamp")
        private LocalDateTime lastSuccessAt;

        @Schema(description = "Last sync attempt timestamp (regardless of outcome)")
        private LocalDateTime lastAttemptAt;

        @Schema(description = "Error message from last failed sync, null if last sync succeeded")
        private String lastError;

        @Schema(description = "Duration of last sync in milliseconds")
        private Long lastDurationMs;

        @Schema(description = "Whether the broker token is still active")
        private boolean tokenActive;

        @Schema(description = "Whether the last sync is older than 30 minutes")
        private boolean stale;

        @Schema(description = "Credentials present but OAuth token rejected/expired — user just needs to redo OAuth, not re-enter API keys")
        private boolean needsReconnect;
    }
}
