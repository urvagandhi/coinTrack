package com.urva.myfinance.coinTrack.broker.listener;

import com.urva.myfinance.coinTrack.broker.repository.BrokerAccountRepository;
import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Removes broker accounts (incl. stored credentials/tokens) for a deleted user. */
@Component
public class BrokerUserDataCleanupListener {

  private static final Logger logger = LoggerFactory.getLogger(BrokerUserDataCleanupListener.class);

  private final BrokerAccountRepository brokerAccountRepository;

  public BrokerUserDataCleanupListener(BrokerAccountRepository brokerAccountRepository) {
    this.brokerAccountRepository = brokerAccountRepository;
  }

  @EventListener
  public void onUserDeleted(UserDeletedEvent event) {
    try {
      brokerAccountRepository.deleteByUserId(event.userId());
      logger.info("Cascade cleanup: deleted broker accounts for user {}", event.userId());
    } catch (Exception e) {
      logger.error(
          "Cascade cleanup failed for broker accounts, user {}: {}",
          event.userId(),
          e.getMessage());
    }
  }
}
