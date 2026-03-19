package com.urva.myfinance.coinTrack.broker.adapters.upstox.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.upstox.raw.UpstoxFundsRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Maps Upstox API v2 funds/margin response to canonical funds model.
 * Response is nested: data.equity.available_margin etc.
 */
@Component
public class UpstoxFundsMapper {

    private static final Logger log = LoggerFactory.getLogger(UpstoxFundsMapper.class);

    public CanonicalFunds toCanonical(UpstoxFundsRaw raw, String userId, String brokerAccountId) {
        UpstoxFundsRaw.EquityFunds equity = raw.getEquity();
        if (equity == null) {
            log.warn("Upstox funds response has null equity segment for userId={}", userId);
            return CanonicalFunds.builder()
                    .userId(userId)
                    .brokerAccountId(brokerAccountId)
                    .brokerType(Broker.UPSTOX)
                    .availableCash(BigDecimal.ZERO)
                    .usedMargin(BigDecimal.ZERO)
                    .totalMargin(BigDecimal.ZERO)
                    .lastSyncedAt(Instant.now())
                    .build();
        }

        BigDecimal availableCash = PriceNormalizer.toBigDecimal(
                equity.getAvailableMargin(), "available_margin", Broker.UPSTOX);

        BigDecimal usedMargin = PriceNormalizer.toBigDecimal(
                equity.getUsedMargin(), "used_margin", Broker.UPSTOX);

        BigDecimal totalMargin = availableCash.add(usedMargin).setScale(2, RoundingMode.HALF_UP);

        BigDecimal collateral = equity.getCollateral() != null
                ? PriceNormalizer.toBigDecimal(equity.getCollateral(), "collateral", Broker.UPSTOX)
                : null;

        return CanonicalFunds.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.UPSTOX)
                .availableCash(availableCash)
                .usedMargin(usedMargin)
                .totalMargin(totalMargin)
                .collateral(collateral)
                .openingBalance(null)
                .lastSyncedAt(Instant.now())
                .build();
    }
}
