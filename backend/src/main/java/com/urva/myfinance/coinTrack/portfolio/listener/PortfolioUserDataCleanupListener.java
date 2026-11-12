package com.urva.myfinance.coinTrack.portfolio.listener;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalFundsRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfHoldingRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalMfOrderRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.CanonicalPositionRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncCooldownRepository;
import com.urva.myfinance.coinTrack.portfolio.repository.SyncLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Removes all portfolio cache/canonical data for a deleted user. market_prices is deliberately kept
 * — it is deployment-wide shared data, not user-owned.
 */
@Component
public class PortfolioUserDataCleanupListener {

  private static final Logger logger =
      LoggerFactory.getLogger(PortfolioUserDataCleanupListener.class);

  private final CanonicalHoldingRepository holdingRepository;
  private final CanonicalPositionRepository positionRepository;
  private final CanonicalFundsRepository fundsRepository;
  private final CanonicalMfOrderRepository mfOrderRepository;
  private final CanonicalMfHoldingRepository mfHoldingRepository;
  private final SyncLogRepository syncLogRepository;
  private final SyncCooldownRepository syncCooldownRepository;

  public PortfolioUserDataCleanupListener(
      CanonicalHoldingRepository holdingRepository,
      CanonicalPositionRepository positionRepository,
      CanonicalFundsRepository fundsRepository,
      CanonicalMfOrderRepository mfOrderRepository,
      CanonicalMfHoldingRepository mfHoldingRepository,
      SyncLogRepository syncLogRepository,
      SyncCooldownRepository syncCooldownRepository) {
    this.holdingRepository = holdingRepository;
    this.positionRepository = positionRepository;
    this.fundsRepository = fundsRepository;
    this.mfOrderRepository = mfOrderRepository;
    this.mfHoldingRepository = mfHoldingRepository;
    this.syncLogRepository = syncLogRepository;
    this.syncCooldownRepository = syncCooldownRepository;
  }

  @EventListener
  public void onUserDeleted(UserDeletedEvent event) {
    String userId = event.userId();
    try {
      holdingRepository.deleteByUserId(userId);
      positionRepository.deleteByUserId(userId);
      fundsRepository.deleteByUserId(userId);
      mfOrderRepository.deleteByUserId(userId);
      mfHoldingRepository.deleteByUserId(userId);
      syncLogRepository.deleteByUserId(userId);
      syncCooldownRepository.deleteByUserId(userId);
      logger.info("Cascade cleanup: deleted portfolio data for user {}", userId);
    } catch (Exception e) {
      logger.error(
          "Cascade cleanup failed for portfolio data, user {}: {}", userId, e.getMessage());
    }
  }
}
