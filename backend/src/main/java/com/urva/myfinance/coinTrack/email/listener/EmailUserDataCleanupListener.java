package com.urva.myfinance.coinTrack.email.listener;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.email.repository.EmailTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Purges one-time email tokens (verification / reset / MFA-recovery links) for a deleted user. The
 * collection carries a TTL index, but immediate removal closes any window where a still-valid magic
 * link could be issued against an account that no longer exists.
 */
@Component
public class EmailUserDataCleanupListener {

  private static final Logger logger = LoggerFactory.getLogger(EmailUserDataCleanupListener.class);

  private final EmailTokenRepository emailTokenRepository;

  public EmailUserDataCleanupListener(EmailTokenRepository emailTokenRepository) {
    this.emailTokenRepository = emailTokenRepository;
  }

  @EventListener
  public void onUserDeleted(UserDeletedEvent event) {
    try {
      emailTokenRepository.deleteAllByUserId(event.userId());
      logger.info("Cascade cleanup: deleted email tokens for user {}", event.userId());
    } catch (Exception e) {
      logger.error(
          "Cascade cleanup failed for email tokens, user {}: {}", event.userId(), e.getMessage());
    }
  }
}
