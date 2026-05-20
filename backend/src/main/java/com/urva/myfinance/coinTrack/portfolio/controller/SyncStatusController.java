package com.urva.myfinance.coinTrack.portfolio.controller;

import java.security.Principal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.model.BrokerAccount;
import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.common.response.ApiResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.SyncStatusResponse;
import com.urva.myfinance.coinTrack.portfolio.dto.SyncStatusResponse.BrokerSyncStatus;
import com.urva.myfinance.coinTrack.portfolio.model.SyncLog;
import com.urva.myfinance.coinTrack.portfolio.model.SyncStatus;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;
import com.urva.myfinance.coinTrack.user.model.User;
import com.urva.myfinance.coinTrack.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Per-broker sync health endpoint.
 * Lets the frontend show sync status per broker instead of just a generic refresh button.
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

    @GetMapping("/status")
    @Operation(summary = "Get per-broker sync health",
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

            // Latest sync attempt (any status)
            var lastAttempt = syncLogRepo.findFirstByUserIdAndBrokerOrderByTimestampDesc(userId, broker);

            // Latest successful sync
            var lastSuccess = syncLogRepo.findFirstByUserIdAndBrokerAndStatusOrderByTimestampDesc(
                    userId, broker, SyncStatus.SUCCESS);

            String lastStatus;
            String lastError = null;
            LocalDateTime lastAttemptAt = null;
            LocalDateTime lastSuccessAt = null;
            Long lastDurationMs = null;

            if (lastAttempt.isPresent()) {
                SyncLog attempt = lastAttempt.get();
                lastStatus = attempt.getStatus().name();
                lastAttemptAt = attempt.getTimestamp();
                lastDurationMs = attempt.getDurationMs();

                if (attempt.getStatus() == SyncStatus.FAILURE || attempt.getStatus() == SyncStatus.PARTIAL_FAILURE) {
                    lastError = attempt.getMessage();
                    hasIssues = true;
                }
            } else {
                lastStatus = "NEVER_SYNCED";
                hasIssues = true;
            }

            if (lastSuccess.isPresent()) {
                lastSuccessAt = lastSuccess.get().getTimestamp();
            }

            boolean tokenActive = account.getIsActive() != null && account.getIsActive()
                    && !account.isTokenExpired();

            boolean stale = lastSuccessAt == null
                    || Duration.between(lastSuccessAt, LocalDateTime.now()).toMinutes() > STALE_THRESHOLD_MINUTES;

            // needsReconnect = "the user has set up this broker (credentials saved) but the
            // OAuth session is dead". The fix is to redo OAuth — not the credentials form.
            boolean needsReconnect = Boolean.TRUE.equals(account.getIsActive())
                    && account.hasCredentials()
                    && (!tokenActive
                        || (account.getExpiryReason() != null
                            && account.getExpiryReason() != com.urva.myfinance.coinTrack.broker.model.ExpiryReason.NONE));

            if (stale || !tokenActive) {
                hasIssues = true;
            }

            brokerStatuses.add(BrokerSyncStatus.builder()
                    .broker(broker.name())
                    .lastStatus(lastStatus)
                    .lastSuccessAt(lastSuccessAt)
                    .lastAttemptAt(lastAttemptAt)
                    .lastError(lastError)
                    .lastDurationMs(lastDurationMs)
                    .tokenActive(tokenActive)
                    .stale(stale)
                    .needsReconnect(needsReconnect)
                    .build());
        }

        SyncStatusResponse response = SyncStatusResponse.builder()
                .brokers(brokerStatuses)
                .hasIssues(hasIssues)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
