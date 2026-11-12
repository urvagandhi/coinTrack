package com.urva.myfinance.coinTrack.goldsilver.listener;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.goldsilver.repository.GoldSilverInvestmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Removes gold/silver investments for a deleted user. Metal rate settings live embedded in the user
 * document; rate snapshots are deployment-wide shared data — both survive the deletion.
 */
@Component
public class GoldSilverUserDataCleanupListener {

  private static final Logger logger =
      LoggerFactory.getLogger(GoldSilverUserDataCleanupListener.class);

  private final GoldSilverInvestmentRepository investmentRepository;

  public GoldSilverUserDataCleanupListener(GoldSilverInvestmentRepository investmentRepository) {
    this.investmentRepository = investmentRepository;
  }

  @EventListener
  public void onUserDeleted(UserDeletedEvent event) {
    try {
      investmentRepository.deleteByUserId(event.userId());
      logger.info("Cascade cleanup: deleted gold/silver investments for user {}", event.userId());
    } catch (Exception e) {
      logger.error(
          "Cascade cleanup failed for gold/silver investments, user {}: {}",
          event.userId(),
          e.getMessage());
    }
  }
}
