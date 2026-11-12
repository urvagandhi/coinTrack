package com.urva.myfinance.coinTrack.mutualfund.scheduler;

import com.urva.myfinance.coinTrack.mutualfund.model.MfPortfolioMetrics;
import com.urva.myfinance.coinTrack.mutualfund.model.PortfolioHolding;
import com.urva.myfinance.coinTrack.mutualfund.repository.MfPortfolioMetricsRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.PortfolioHoldingRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.MfXirrService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class PortfolioMetricsSyncService {

  private static final Logger logger = LoggerFactory.getLogger(PortfolioMetricsSyncService.class);

  private final PortfolioHoldingRepository holdingRepository;
  private final MfPortfolioMetricsRepository metricsRepository;
  private final MfXirrService xirrService;

  public PortfolioMetricsSyncService(
      PortfolioHoldingRepository holdingRepository,
      MfPortfolioMetricsRepository metricsRepository,
      MfXirrService xirrService) {
    this.holdingRepository = holdingRepository;
    this.metricsRepository = metricsRepository;
    this.xirrService = xirrService;
  }

  // Run every night at 1:30 AM IST (after AMFI NAV sync and basic holding updates)
  @Scheduled(cron = "0 30 1 * * ?", zone = "Asia/Kolkata")
  public void syncPortfolioMetrics() {
    logger.info("Starting Nightly Portfolio Metrics (XIRR) Sync...");

    try {
      List<PortfolioHolding> allHoldings = holdingRepository.findAll();
      // Group by userId
      Map<String, List<PortfolioHolding>> userHoldings =
          allHoldings.stream().collect(Collectors.groupingBy(PortfolioHolding::getUserId));

      for (Map.Entry<String, List<PortfolioHolding>> entry : userHoldings.entrySet()) {
        String userId = entry.getKey();
        List<PortfolioHolding> holdings = entry.getValue();

        BigDecimal totalCurrentValue = BigDecimal.ZERO;

        // 1. Calculate per-scheme XIRR
        for (PortfolioHolding holding : holdings) {
          BigDecimal currentValue =
              holding.getCurrentValue() != null ? holding.getCurrentValue() : BigDecimal.ZERO;
          totalCurrentValue = totalCurrentValue.add(currentValue);

          BigDecimal schemeXirr =
              xirrService.calculateSchemeXirr(userId, holding.getSchemeId(), currentValue);
          holding.setXirr(schemeXirr);
          holding.setLastUpdated(Instant.now());
        }

        // Batch save the updated scheme XIRRs
        holdingRepository.saveAll(holdings);

        // 2. Calculate overall portfolio XIRR
        BigDecimal overallXirr = xirrService.calculateOverallXirr(userId, totalCurrentValue);

        MfPortfolioMetrics metrics =
            metricsRepository.findByUserId(userId).orElse(new MfPortfolioMetrics());
        metrics.setUserId(userId);
        metrics.setOverallXirr(overallXirr);
        metrics.setLastUpdated(Instant.now());
        metricsRepository.save(metrics);

        logger.debug("Successfully synced XIRR for user {}", userId);
      }

      logger.info("Successfully completed Nightly Portfolio Metrics (XIRR) Sync.");
    } catch (Exception e) {
      logger.error("Error during Nightly Portfolio Metrics Sync: {}", e.getMessage(), e);
    }
  }
}
