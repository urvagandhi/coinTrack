package com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaFundsRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Maps Zerodha Kite funds/margins API response to canonical funds model.
 *
 * Zerodha quirks:
 * - Response has equity and commodity segments — we only use the equity segment
 * - Commodity segment may be null entirely
 * - Nested structure: equity.available.cash, equity.utilised.debits, etc.
 */
@Component
public class ZerodhaFundsMapper {

    private static final Logger log = LoggerFactory.getLogger(ZerodhaFundsMapper.class);

    public CanonicalFunds toCanonical(ZerodhaFundsRaw raw, String userId, String brokerAccountId) {
        BigDecimal availableCash = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal usedMargin = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalMargin = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal collateral = null;
        BigDecimal openingBalance = null;

        ZerodhaFundsRaw.SegmentFundsDTO equity = raw.getEquity();
        if (equity != null) {
            // Total margin (net)
            if (equity.getNet() != null) {
                totalMargin = equity.getNet().setScale(2, RoundingMode.HALF_UP);
            }

            // Available cash
            ZerodhaFundsRaw.Available available = equity.getAvailable();
            if (available != null) {
                if (available.getCash() != null) {
                    availableCash = available.getCash().setScale(2, RoundingMode.HALF_UP);
                }
                if (available.getCollateral() != null) {
                    collateral = available.getCollateral().setScale(2, RoundingMode.HALF_UP);
                }
                if (available.getOpeningBalance() != null) {
                    openingBalance = available.getOpeningBalance().setScale(2, RoundingMode.HALF_UP);
                }
            }

            // Used margin (utilised debits)
            ZerodhaFundsRaw.Utilised utilised = equity.getUtilised();
            if (utilised != null && utilised.getDebits() != null) {
                usedMargin = utilised.getDebits().setScale(2, RoundingMode.HALF_UP);
            }
        } else {
            log.warn("Zerodha funds response has null equity segment for brokerAccountId={}", brokerAccountId);
        }

        return CanonicalFunds.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ZERODHA)
                .availableCash(availableCash)
                .usedMargin(usedMargin)
                .totalMargin(totalMargin)
                .collateral(collateral)
                .openingBalance(openingBalance)
                .lastSyncedAt(Instant.now())
                .build();
    }
}
