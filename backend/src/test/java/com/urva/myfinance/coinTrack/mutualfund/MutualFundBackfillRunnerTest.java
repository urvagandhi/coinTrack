package com.urva.myfinance.coinTrack.mutualfund;

import com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction;
import com.urva.myfinance.coinTrack.mutualfund.model.SipContribution;
import com.urva.myfinance.coinTrack.mutualfund.repository.LumpsumTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.RedemptionTransactionRepository;
import com.urva.myfinance.coinTrack.mutualfund.repository.SipContributionRepository;
import com.urva.myfinance.coinTrack.mutualfund.service.MfNavService;
import com.urva.myfinance.coinTrack.mutualfund.service.PortfolioHoldingService;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.junit.jupiter.api.Disabled;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Disabled("Manual backfill script - do not run in automated suite")
@SpringBootTest(properties = "spring.autoconfigure.exclude=de.flapdoodle.embed.mongo.spring.autoconfigure.EmbeddedMongoAutoConfiguration")
@ActiveProfiles("dev")
public class MutualFundBackfillRunnerTest {

    private static final Logger logger = LoggerFactory.getLogger(MutualFundBackfillRunnerTest.class);

    @Autowired
    private LumpsumTransactionRepository lumpsumRepo;

    @Autowired
    private SipContributionRepository sipRepo;

    @Autowired
    private RedemptionTransactionRepository redemptionRepo;

    @Autowired
    private MfNavService mfNavService;

    @Autowired
    private PortfolioHoldingService portfolioHoldingService;

    @Autowired
    private com.urva.myfinance.coinTrack.mutualfund.repository.MfSchemeRepository schemeRepo;

    @Test
    public void backfillMissingNavAndUnits() {
        logger.info("Starting Mutual Fund historical backfill...");
        Set<String> schemeUserKeys = new HashSet<>();

        // 1. Backfill Lumpsum
        List<LumpsumTransaction> lumpsums = lumpsumRepo.findAll();
        for (LumpsumTransaction txn : lumpsums) {
            if (txn.getNavPrice() == null || txn.getTotalUnit() == null || txn.getTotalUnit().compareTo(BigDecimal.ZERO) == 0) {
                try {
                    String amfiCode = schemeRepo.findById(txn.getSchemeId()).orElseThrow().getAmfiCode();
                    BigDecimal nav = mfNavService.fetchNavForDate(amfiCode, txn.getInvestmentDate());
                    if (nav != null && nav.compareTo(BigDecimal.ZERO) > 0) {
                        txn.setNavPrice(nav);
                        txn.setTotalUnit(txn.getLumpsumInvestment().divide(nav, 4, RoundingMode.HALF_UP));
                        lumpsumRepo.save(txn);
                        schemeUserKeys.add(txn.getUserId() + "|" + txn.getSchemeId());
                        logger.info("Backfilled Lumpsum: {} -> NAV: {}, Units: {}", txn.getId(), nav, txn.getTotalUnit());
                    }
                } catch (Exception e) {
                    logger.error("Failed to backfill Lumpsum {}", txn.getId(), e);
                }
            }
        }

        // 2. Backfill SIPs
        List<SipContribution> sips = sipRepo.findAll();
        for (SipContribution txn : sips) {
            if (txn.getNavPrice() == null || txn.getTotalUnit() == null || txn.getTotalUnit().compareTo(BigDecimal.ZERO) == 0) {
                try {
                    String amfiCode = schemeRepo.findById(txn.getSchemeId()).orElseThrow().getAmfiCode();
                    BigDecimal nav = mfNavService.fetchNavForDate(amfiCode, txn.getContributionDate());
                    if (nav != null && nav.compareTo(BigDecimal.ZERO) > 0) {
                        txn.setNavPrice(nav);
                        txn.setTotalUnit(txn.getAmount().divide(nav, 4, RoundingMode.HALF_UP));
                        sipRepo.save(txn);
                        schemeUserKeys.add(txn.getUserId() + "|" + txn.getSchemeId());
                        logger.info("Backfilled SIP: {} -> NAV: {}, Units: {}", txn.getId(), nav, txn.getTotalUnit());
                    }
                } catch (Exception e) {
                    logger.error("Failed to backfill SIP {}", txn.getId(), e);
                }
            }
        }

        // 3. Backfill Redemptions
        List<RedemptionTransaction> redemptions = redemptionRepo.findAll();
        for (RedemptionTransaction txn : redemptions) {
            if (txn.getRedemptionNav() == null || txn.getRedemptionUnit() == null || txn.getRedemptionValue() == null || txn.getCapitalGain() == null) {
                try {
                    String amfiCode = schemeRepo.findById(txn.getSchemeId()).orElseThrow().getAmfiCode();
                    BigDecimal nav = mfNavService.fetchNavForDate(amfiCode, txn.getRedemptionDate());
                    if (nav != null && nav.compareTo(BigDecimal.ZERO) > 0) {
                        txn.setRedemptionNav(nav);
                        if (txn.getRedemptionUnit() == null && txn.getRedemptionValue() != null) {
                            txn.setRedemptionUnit(txn.getRedemptionValue().divide(nav, 4, RoundingMode.HALF_UP));
                        } else if (txn.getRedemptionValue() == null && txn.getRedemptionUnit() != null) {
                            txn.setRedemptionValue(txn.getRedemptionUnit().multiply(nav));
                        }
                        // Also compute capital gain if trade investment value is present
                        if (txn.getRedemptionValue() != null && txn.getTradeInvestmentValue() != null) {
                            txn.setCapitalGain(txn.getRedemptionValue().subtract(txn.getTradeInvestmentValue()));
                        }
                        redemptionRepo.save(txn);
                        schemeUserKeys.add(txn.getUserId() + "|" + txn.getSchemeId());
                        logger.info("Backfilled Redemption: {} -> NAV: {}", txn.getId(), nav);
                    }
                } catch (Exception e) {
                    logger.error("Failed to backfill Redemption {}", txn.getId(), e);
                }
            }
        }

        // 4. Recalculate Portfolio Holdings
        for (String key : schemeUserKeys) {
            String[] parts = key.split("\\|");
            String userId = parts[0];
            String schemeId = parts[1];
            try {
                portfolioHoldingService.updateHoldingForScheme(userId, schemeId);
                logger.info("Recalculated Portfolio Holding for User: {}, Scheme: {}", userId, schemeId);
            } catch (Exception e) {
                logger.error("Failed to recalculate Portfolio Holding for User: {}, Scheme: {}", userId, schemeId, e);
            }
        }

        logger.info("Mutual Fund historical backfill completed successfully.");
    }
}
