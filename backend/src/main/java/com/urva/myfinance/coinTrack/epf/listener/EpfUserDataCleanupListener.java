package com.urva.myfinance.coinTrack.epf.listener;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.epf.repository.EpfTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Removes EPF ledger transactions for a deleted user. EPF settings live embedded in the user
 * document — removed with the user itself.
 */
@Component
public class EpfUserDataCleanupListener {

  private static final Logger logger = LoggerFactory.getLogger(EpfUserDataCleanupListener.class);

  private final EpfTransactionRepository epfTransactionRepository;

  public EpfUserDataCleanupListener(EpfTransactionRepository epfTransactionRepository) {
    this.epfTransactionRepository = epfTransactionRepository;
  }

  @EventListener
  public void onUserDeleted(UserDeletedEvent event) {
    try {
      epfTransactionRepository.deleteByUserId(event.userId());
      logger.info("Cascade cleanup: deleted EPF transactions for user {}", event.userId());
    } catch (Exception e) {
      logger.error(
          "Cascade cleanup failed for EPF transactions, user {}: {}",
          event.userId(),
          e.getMessage());
    }
  }
}
