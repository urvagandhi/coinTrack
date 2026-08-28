package com.urva.myfinance.coinTrack.ppf.listener;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.ppf.repository.PpfTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Removes PPF ledger transactions for a deleted user. PPF settings live embedded in the user
 * document — removed with the user itself.
 */
@Component
public class PpfUserDataCleanupListener {

  private static final Logger logger = LoggerFactory.getLogger(PpfUserDataCleanupListener.class);

  private final PpfTransactionRepository ppfTransactionRepository;

  public PpfUserDataCleanupListener(PpfTransactionRepository ppfTransactionRepository) {
    this.ppfTransactionRepository = ppfTransactionRepository;
  }

  @EventListener
  public void onUserDeleted(UserDeletedEvent event) {
    try {
      ppfTransactionRepository.deleteByUserId(event.userId());
      logger.info("Cascade cleanup: deleted PPF transactions for user {}", event.userId());
    } catch (Exception e) {
      logger.error(
          "Cascade cleanup failed for PPF transactions, user {}: {}",
          event.userId(),
          e.getMessage());
    }
  }
}
