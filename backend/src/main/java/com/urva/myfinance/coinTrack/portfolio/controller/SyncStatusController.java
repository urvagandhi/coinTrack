package com.urva.myfinance.coinTrack.portfolio.controller;

import com.urva.myfinance.coinTrack.broker.core.capability.BrokerCapability;
import com.urva.myfinance.coinTrack.broker.core.port.BrokerAdapter;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.registry.BrokerAdapterRegistry;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.SyncStatusResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.SyncStatusResponse.BrokerChannelTelemetry;
import com.urva.myfinance.coinTrack.portfolio.dto.SyncStatusResponse.BrokerSyncStatus;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;
import com.urva.myfinance.coinTrack.portfolio.model.SyncStatus;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalFundsRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Per-broker sync health endpoint. Lets the frontend show sync status per broker instead of just a
 * generic refresh button.
 */
@RestController
@RequestMapping("/api/portfolio/sync")
@RequiredArgsConstructor
@Tag(name = "Portfolio Sync", description = "Portfolio sync status and health")
public class SyncStatusController {

  private static final Logger log = LoggerFactory.getLogger(SyncStatusController.class);
  private static final long STALE_THRESHOLD_MINUTES = 30;

  private final SyncLogRepository syncLogRepo;
  private final BrokerAccountRepository brokerAccountRepo;
  private final UserRepository userRepository;
  private final Optional<BrokerAdapterRegistry> adapterRegistry;
  private final CanonicalHoldingRepository canonicalHoldingRepo;
  private final CanonicalMfHoldingRepository canonicalMfHoldingRepo;
  private final CanonicalPositionRepository canonicalPositionRepo;
  private final CanonicalFundsRepository canonicalFundsRepo;

  @GetMapping("/status")
  @Operation(
      summary = "Get per-broker sync health",
      description = "Returns last sync status, timestamps, and staleness for each connected broker")
  public ResponseEntity<?> getSyncStatus(Principal principal) {
    User user = userRepository.findByUsername(principal.getName());
    if (user == null) {
      return ResponseEntity.status(401).body(ApiResponse.error("User not found"));
    }

    String userId = user.getId();
    List<BrokerAccount> accounts = brokerAccountRepo.findByUserId(userId);
    List<BrokerSyncStatus> brokerStatuses = new ArrayList<>();
    boolean hasIssues = false;

    for (BrokerAccount account : accounts) {
      Broker broker = account.getBroker();

      // Latest sync attempt (per broker or overall user sync — pick whichever is newest)
      var brokerAttempt = syncLogRepo.findFirstByUserIdAndBrokerOrderByTimestampDesc(userId, broker);
      var overallAttempt = syncLogRepo.findFirstByUserIdOrderByTimestampDesc(userId);

      SyncLog attempt = null;
      if (brokerAttempt.isPresent() && overallAttempt.isPresent()) {
        attempt = brokerAttempt.get().getTimestamp().isAfter(overallAttempt.get().getTimestamp())
            ? brokerAttempt.get()
            : overallAttempt.get();
      } else if (brokerAttempt.isPresent()) {
        attempt = brokerAttempt.get();
      } else if (overallAttempt.isPresent()) {
        attempt = overallAttempt.get();
      }

      // Latest successful sync (per broker or overall user sync — pick whichever is newest)
      var brokerSuccess =
          syncLogRepo.findFirstByUserIdAndBrokerAndStatusOrderByTimestampDesc(
              userId, broker, SyncStatus.SUCCESS);
      var overallSuccess =
          syncLogRepo.findFirstByUserIdAndStatusOrderByTimestampDesc(userId, SyncStatus.SUCCESS);

      SyncLog successLog = null;
      if (brokerSuccess.isPresent() && overallSuccess.isPresent()) {
        successLog = brokerSuccess.get().getTimestamp().isAfter(overallSuccess.get().getTimestamp())
            ? brokerSuccess.get()
            : overallSuccess.get();
      } else if (brokerSuccess.isPresent()) {
        successLog = brokerSuccess.get();
      } else if (overallSuccess.isPresent()) {
        successLog = overallSuccess.get();
      }

      String lastStatus = "NEVER_SYNCED";
      String lastError = null;
      LocalDateTime lastAttemptAt = null;
      LocalDateTime lastSuccessAt = null;
      Long lastDurationMs = null;

      if (attempt != null) {
        lastStatus = attempt.getStatus().name();
        lastAttemptAt = attempt.getTimestamp();
        lastDurationMs = attempt.getDurationMs();

        if (attempt.getStatus() == SyncStatus.FAILURE
            || attempt.getStatus() == SyncStatus.PARTIAL_FAILURE) {
          lastError = attempt.getMessage();
          hasIssues = true;
        }
      } else {
        hasIssues = true;
      }

      if (successLog != null) {
        lastSuccessAt = successLog.getTimestamp();
      }
      if (account.getLastSuccessfulSync() != null) {
        if (lastSuccessAt == null || account.getLastSuccessfulSync().isAfter(lastSuccessAt)) {
          lastSuccessAt = account.getLastSuccessfulSync();
        }
      }

      if (lastSuccessAt != null) {
        if (lastAttemptAt == null || lastSuccessAt.isAfter(lastAttemptAt)) {
          lastAttemptAt = lastSuccessAt;
          lastStatus = "SUCCESS";
        }
      }

      // If duration is 0 or null from a stale log, pick duration from overallAttempt if valid
      if ((lastDurationMs == null || lastDurationMs <= 0) && overallAttempt.isPresent()) {
        Long overallDuration = overallAttempt.get().getDurationMs();
        if (overallDuration != null && overallDuration > 0) {
          lastDurationMs = overallDuration;
        }
      }

      boolean tokenActive =
          account.getIsActive() != null && account.getIsActive() && !account.isTokenExpired();

      boolean stale =
          lastSuccessAt == null
              || Duration.between(lastSuccessAt, LocalDateTime.now()).toMinutes()
                  > STALE_THRESHOLD_MINUTES;

      // needsReconnect = "the user has set up this broker (credentials saved) but the
      // OAuth session is dead". The fix is to redo OAuth — not the credentials form.
      boolean needsReconnect =
          Boolean.TRUE.equals(account.getIsActive())
              && account.hasCredentials()
              && (!tokenActive
                  || (account.getExpiryReason() != null
                      && account.getExpiryReason()
                          != com.urva.myfinance.coinTrack.broker.model.ExpiryReason.NONE));

      if (stale || !tokenActive) {
        hasIssues = true;
      }

      // Query real capabilities supported by this broker's adapter
      Set<BrokerCapability> capabilities = Collections.emptySet();
      if (adapterRegistry.isPresent()) {
        try {
          BrokerAdapter adapter = adapterRegistry.get().getAdapter(broker);
          if (adapter != null) {
            capabilities = adapter.getCapabilities();
          }
        } catch (Exception ex) {
          log.debug("Could not resolve adapter for {}: {}", broker, ex.getMessage());
        }
      }

      // Dynamically calculate record counts for each channel
      int equityCount = canonicalHoldingRepo.findByUserIdAndBrokerType(userId, broker).size();
      int mfCount = canonicalMfHoldingRepo.findByUserIdAndBrokerType(userId, broker).size();
      int positionsCount = canonicalPositionRepo.findByUserIdAndBrokerType(userId, broker).size();
      var fundsOpt = canonicalFundsRepo.findByUserIdAndBrokerAccountId(userId, account.getId());

      List<BrokerChannelTelemetry> channels = new ArrayList<>();

      // 1. Equity Holdings Channel
      boolean equitySupported = capabilities.contains(BrokerCapability.EQUITY_HOLDINGS);
      channels.add(
          BrokerChannelTelemetry.builder()
              .id("EQUITY_HOLDINGS")
              .name("Equity Holdings")
              .desc(equityCount > 0 ? equityCount + " Demat securities active" : "Demat portfolio, purchase price & daily gain")
              .tag("NSE / BSE")
              .supported(equitySupported)
              .streaming(tokenActive && equitySupported)
              .status(!equitySupported ? "Unsupported" : tokenActive ? "Streaming" : "Idle")
              .recordCount(equityCount)
              .build());

      // 2. Mutual Funds Channel
      boolean mfSupported = capabilities.contains(BrokerCapability.MF_HOLDINGS);
      channels.add(
          BrokerChannelTelemetry.builder()
              .id("MF_HOLDINGS")
              .name("Mutual Funds")
              .desc(mfCount > 0 ? mfCount + " Folios synced" : "Folio numbers, units held & live NAVs")
              .tag("AMFI Daily")
              .supported(mfSupported)
              .streaming(tokenActive && mfSupported)
              .status(!mfSupported ? "Unsupported" : tokenActive ? "Streaming" : "Idle")
              .recordCount(mfCount)
              .build());

      // 3. Positions & F&O Channel
      boolean positionsSupported = capabilities.contains(BrokerCapability.INTRADAY_POSITIONS)
          || capabilities.contains(BrokerCapability.FNO_POSITIONS);
      channels.add(
          BrokerChannelTelemetry.builder()
              .id("POSITIONS_FNO")
              .name("Positions & F&O")
              .desc(positionsCount > 0 ? positionsCount + " Open contracts active" : "Intraday & open derivative contracts")
              .tag("Real-Time")
              .supported(positionsSupported)
              .streaming(tokenActive && positionsSupported)
              .status(!positionsSupported ? "Unsupported" : tokenActive ? "Streaming" : "Idle")
              .recordCount(positionsCount)
              .build());

      // 4. Funds & Margin Channel
      boolean fundsSupported = capabilities.contains(BrokerCapability.FUNDS);
      String fundsSummary = fundsOpt.map(f -> "Cash ₹" + f.getAvailableCash()).orElse("Available cash balance & margin utilized");
      channels.add(
          BrokerChannelTelemetry.builder()
              .id("FUNDS_MARGIN")
              .name("Funds & Margin")
              .desc(fundsSummary)
              .tag("Ledger")
              .supported(fundsSupported)
              .streaming(tokenActive && fundsSupported)
              .status(!fundsSupported ? "Unsupported" : tokenActive ? "Streaming" : "Idle")
              .recordCount(fundsOpt.isPresent() ? 1 : 0)
              .build());

      // Protocol & Display Name metadata
      String protocol = switch (broker) {
        case ZERODHA -> "Kite Connect v3 (OAuth2)";
        case UPSTOX -> "Upstox Pro API v2 (OAuth2)";
        case ANGELONE -> "SmartAPI Direct (Base32 TOTP)";
      };

      String displayName = switch (broker) {
        case ZERODHA -> "Zerodha";
        case UPSTOX -> "Upstox";
        case ANGELONE -> "Angel One";
      };

      brokerStatuses.add(
          BrokerSyncStatus.builder()
              .broker(broker.name())
              .displayName(displayName)
              .protocol(protocol)
              .securityMode("Read-Only Enforced")
              .gatewayHealth(tokenActive ? "Operational" : "Idle")
              .gatewayLatencyMs(lastDurationMs != null ? (double) lastDurationMs : null)
              .lastStatus(lastStatus)
              .lastSuccessAt(lastSuccessAt)
              .lastAttemptAt(lastAttemptAt)
              .lastError(lastError)
              .lastDurationMs(lastDurationMs)
              .tokenActive(tokenActive)
              .tokenExpiresAt(account.getTokenExpiresAt())
              .stale(stale)
              .needsReconnect(needsReconnect)
              .channels(channels)
              .build());
    }

    SyncStatusResponse response =
        SyncStatusResponse.builder().brokers(brokerStatuses).hasIssues(hasIssues).build();

    return ResponseEntity.ok(ApiResponse.success(response));
  }
}
