package com.urva.myfinance.coinTrack.portfolio.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Per-broker sync health for the frontend dashboard. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Portfolio sync health across all connected brokers")
public class SyncStatusResponse {

  @Schema(description = "Per-broker sync status list")
  private List<BrokerSyncStatus> brokers;

  @Schema(description = "Whether any broker has a stale or failed sync")
  private boolean hasIssues;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @Schema(description = "Sync health for a single broker account")
  public static class BrokerSyncStatus {

    @Schema(description = "Broker name", example = "ZERODHA")
    private String broker;

    @Schema(description = "Broker display name", example = "Zerodha")
    private String displayName;

    @Schema(description = "Broker protocol version", example = "Kite Connect v3 (OAuth2)")
    private String protocol;

    @Schema(description = "Security mode enforced", example = "Read-Only Enforced")
    private String securityMode;

    @Schema(description = "Gateway health status", example = "Operational")
    private String gatewayHealth;

    @Schema(description = "Gateway ping latency in milliseconds", example = "42.0")
    private Double gatewayLatencyMs;

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

    @Schema(description = "Token expiration timestamp")
    private LocalDateTime tokenExpiresAt;

    @Schema(description = "Whether the last sync is older than 30 minutes")
    private boolean stale;

    @Schema(
        description =
            "Credentials present but OAuth token rejected/expired — user just needs to redo OAuth, not re-enter API keys")
    private boolean needsReconnect;

    @Schema(description = "Dynamic list of syndicated feeds with streaming status and counts")
    private List<BrokerChannelTelemetry> channels;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @Schema(description = "Syndicated channel telemetry")
  public static class BrokerChannelTelemetry {

    @Schema(description = "Channel identifier", example = "EQUITY_HOLDINGS")
    private String id;

    @Schema(description = "Display name", example = "Equity Holdings")
    private String name;

    @Schema(description = "Channel description", example = "Demat portfolio, purchase price & daily gain")
    private String desc;

    @Schema(description = "Market/exchange tag", example = "NSE / BSE")
    private String tag;

    @Schema(description = "Whether the broker adapter supports this capability")
    private boolean supported;

    @Schema(description = "Whether this channel is currently active and streaming")
    private boolean streaming;

    @Schema(description = "Status label: Streaming, Syncing, Idle, Unsupported", example = "Streaming")
    private String status;

    @Schema(description = "Number of active records or holdings in this feed", example = "24")
    private Integer recordCount;

    @Schema(description = "Summary formatted balance or value if applicable", example = "₹1,24,500")
    private String formattedValue;
  }
}
