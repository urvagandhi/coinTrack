package com.urva.myfinance.coinTrack.fixeddeposit.listener;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.fixeddeposit.repository.FixedDepositRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Removes fixed deposits for a deleted user. */
@Component
public class FixedDepositUserDataCleanupListener {

  private static final Logger logger =
      LoggerFactory.getLogger(FixedDepositUserDataCleanupListener.class);

  private final FixedDepositRepository fixedDepositRepository;

  public FixedDepositUserDataCleanupListener(FixedDepositRepository fixedDepositRepository) {
    this.fixedDepositRepository = fixedDepositRepository;
  }

  @EventListener
  public void onUserDeleted(UserDeletedEvent event) {
    try {
      fixedDepositRepository.deleteByUserId(event.userId());
      logger.info("Cascade cleanup: deleted fixed deposits for user {}", event.userId());
    } catch (Exception e) {
      logger.error(
          "Cascade cleanup failed for fixed deposits, user {}: {}", event.userId(), e.getMessage());
    }
  }
}
