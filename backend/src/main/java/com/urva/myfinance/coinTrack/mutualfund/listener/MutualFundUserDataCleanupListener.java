package com.urva.myfinance.coinTrack.mutualfund.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.urva.myfinance.coinTrack.common.event.UserDeletedEvent;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfPortfolioMetricsRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.PortfolioHoldingRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipMandateRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.ValuationSnapshotRepository;

/**
 * Removes all mutual-fund data (schemes, ledgers, holdings, metrics, snapshots)
 * for a deleted user. NAV cache and LTP repositories are shared/global — kept.
 */
@Component
public class MutualFundUserDataCleanupListener {

    private static final Logger logger = LoggerFactory.getLogger(MutualFundUserDataCleanupListener.class);

    private final MfSchemeRepository schemeRepository;
    private final LumpsumTransactionRepository lumpsumRepository;
    private final SipMandateRepository sipMandateRepository;
    private final SipContributionRepository sipContributionRepository;
    private final RedemptionTransactionRepository redemptionRepository;
    private final ValuationSnapshotRepository valuationRepository;
    private final PortfolioHoldingRepository holdingRepository;
    private final MfPortfolioMetricsRepository metricsRepository;

    public MutualFundUserDataCleanupListener(MfSchemeRepository schemeRepository,
                                             LumpsumTransactionRepository lumpsumRepository,
                                             SipMandateRepository sipMandateRepository,
                                             SipContributionRepository sipContributionRepository,
                                             RedemptionTransactionRepository redemptionRepository,
                                             ValuationSnapshotRepository valuationRepository,
                                             PortfolioHoldingRepository holdingRepository,
                                             MfPortfolioMetricsRepository metricsRepository) {
        this.schemeRepository = schemeRepository;
        this.lumpsumRepository = lumpsumRepository;
        this.sipMandateRepository = sipMandateRepository;
        this.sipContributionRepository = sipContributionRepository;
        this.redemptionRepository = redemptionRepository;
        this.valuationRepository = valuationRepository;
        this.holdingRepository = holdingRepository;
        this.metricsRepository = metricsRepository;
    }

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        String userId = event.userId();
        try {
            lumpsumRepository.deleteByUserId(userId);
            sipContributionRepository.deleteByUserId(userId);
            sipMandateRepository.deleteByUserId(userId);
            redemptionRepository.deleteByUserId(userId);
            valuationRepository.deleteByUserId(userId);
            holdingRepository.deleteByUserId(userId);
            metricsRepository.deleteByUserId(userId);
            // Schemes last — they are the FK parents of the ledgers above.
            schemeRepository.deleteByUserId(userId);
            logger.info("Cascade cleanup: deleted mutual-fund data for user {}", userId);
        } catch (Exception e) {
            logger.error("Cascade cleanup failed for mutual-fund data, user {}: {}", userId, e.getMessage());
        }
    }
}
