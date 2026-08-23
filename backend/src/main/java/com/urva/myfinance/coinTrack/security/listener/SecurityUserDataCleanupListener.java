package com.urva.myfinance.coinTrack.security.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.security.repository.InvalidatedTokenRepository;

/**
 * Removes blacklisted-token rows for a deleted user. Refresh tokens are revoked
 * by the user module itself before this event fires; the TTL index would
 * eventually clean these rows anyway, but immediate removal avoids any window
 * where orphaned rows linger.
 */
@Component
public class SecurityUserDataCleanupListener {

    private static final Logger logger = LoggerFactory.getLogger(SecurityUserDataCleanupListener.class);

    private final InvalidatedTokenRepository invalidatedTokenRepository;

    public SecurityUserDataCleanupListener(InvalidatedTokenRepository invalidatedTokenRepository) {
        this.invalidatedTokenRepository = invalidatedTokenRepository;
    }

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        try {
            invalidatedTokenRepository.deleteByUserId(event.userId());
            logger.info("Cascade cleanup: deleted invalidated-token rows for user {}", event.userId());
        } catch (Exception e) {
            logger.error("Cascade cleanup failed for invalidated tokens, user {}: {}", event.userId(), e.getMessage());
        }
    }
}
