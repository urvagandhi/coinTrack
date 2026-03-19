package com.urva.myfinance.coinTrack.broker.adapters.zerodha.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaMfHoldingRaw;
import com.urva.myfinance.coinTrack.broker.adapters.zerodha.raw.ZerodhaMfOrderRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalMfOrder;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.DateNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Maps Zerodha Kite mutual fund holdings and orders to canonical MF models.
 *
 * Zerodha MF quirks:
 * - ISIN must start with "INF" for mutual funds — logged as warning if not
 * - Quantity and prices are already BigDecimal in the raw DTO
 * - Order dates come as Strings — parsed via DateNormalizer
 */
@Component
public class ZerodhaMfMapper {

    private static final Logger log = LoggerFactory.getLogger(ZerodhaMfMapper.class);

    /**
     * Maps a Zerodha MF holding to canonical MF holding.
     */
    public CanonicalMfHolding toCanonicalMfHolding(ZerodhaMfHoldingRaw raw, String userId, String brokerAccountId) {
        // ISIN validation
        String isin = raw.getIsin();
        if (isin != null && !isin.startsWith("INF")) {
            log.warn("Zerodha MF holding ISIN='{}' does not start with 'INF' for fund={}",
                    isin, raw.getFund());
        }

        // Fund name and AMC
        String fundName = raw.getFund();
        String amcName = raw.getAmc();

        // Units (quantity — double, can be fractional)
        BigDecimal units = raw.getQuantity() != null
                ? new BigDecimal(Double.toString(raw.getQuantity())).setScale(4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Average NAV (purchase price — double)
        BigDecimal avgNav = raw.getAveragePrice() != null
                ? new BigDecimal(Double.toString(raw.getAveragePrice())).setScale(4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Current NAV (last_price — double)
        BigDecimal currentNav = raw.getCurrentPrice() != null
                ? new BigDecimal(Double.toString(raw.getCurrentPrice())).setScale(4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Invested value = units * avgNav
        BigDecimal investedValue = units.multiply(avgNav).setScale(2, RoundingMode.HALF_UP);

        // Current value = units * currentNav
        BigDecimal currentValue = units.multiply(currentNav).setScale(2, RoundingMode.HALF_UP);

        // Unrealized P&L = currentValue - investedValue
        BigDecimal unrealizedPnL = currentValue.subtract(investedValue).setScale(2, RoundingMode.HALF_UP);

        // Unrealized P&L percentage
        BigDecimal unrealizedPnLPct = null;
        if (investedValue.compareTo(BigDecimal.ZERO) != 0) {
            unrealizedPnLPct = unrealizedPnL
                    .divide(investedValue, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(4, RoundingMode.HALF_UP);
        }

        return CanonicalMfHolding.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ZERODHA)
                .isin(isin)
                .fundName(fundName)
                .amcName(amcName)
                .units(units)
                .avgNav(avgNav)
                .currentNav(currentNav)
                .investedValue(investedValue)
                .currentValue(currentValue)
                .unrealizedPnL(unrealizedPnL)
                .unrealizedPnLPct(unrealizedPnLPct)
                .lastSyncedAt(Instant.now())
                .build();
    }

    /**
     * Maps a Zerodha MF order to canonical MF order.
     */
    public CanonicalMfOrder toCanonicalMfOrder(ZerodhaMfOrderRaw raw, String userId, String brokerAccountId) {
        // Parse dates via DateNormalizer
        Instant orderTimestamp = DateNormalizer.toInstant(raw.getOrderTimestamp(), Broker.ZERODHA);
        Instant executionDate = DateNormalizer.toInstant(raw.getExecutionDate(), Broker.ZERODHA);

        // Amount
        BigDecimal amount = raw.getAmount() != null
                ? raw.getAmount().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Executed quantity (units allotted)
        BigDecimal executedQuantity = raw.getExecutedQuantity() != null
                ? raw.getExecutedQuantity().setScale(4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Executed NAV
        BigDecimal executedNav = raw.getExecutedNav() != null
                ? raw.getExecutedNav().setScale(4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return CanonicalMfOrder.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ZERODHA)
                .orderId(raw.getOrderId())
                .fund(raw.getFund())
                .tradingSymbol(raw.getTradingSymbol())
                .isin(null) // Zerodha MF orders don't include ISIN directly
                .transactionType(raw.getTransactionType())
                .amount(amount)
                .status(raw.getStatus())
                .executedQuantity(executedQuantity)
                .executedNav(executedNav)
                .folio(raw.getFolio())
                .orderTimestamp(orderTimestamp)
                .executionDate(executionDate)
                .lastSyncedAt(Instant.now())
                .build();
    }
}
