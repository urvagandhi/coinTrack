package com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneFundsRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalFunds;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Maps Angel One SmartAPI funds/margin response to canonical funds model.
 *
 * Angel One quirks:
 * - All fields are Strings — parsed via PriceNormalizer
 * - Opening balance is not provided
 */
@Component
public class AngelOneFundsMapper {

    private static final Logger log = LoggerFactory.getLogger(AngelOneFundsMapper.class);

    public CanonicalFunds toCanonical(AngelOneFundsRaw raw, String userId, String brokerAccountId) {
        // Available cash from availablecash (String)
        BigDecimal availableCash = PriceNormalizer.toBigDecimal(
                raw.getAvailablecash(), "availablecash", Broker.ANGELONE);

        // Used margin from utilisedamount (String) — spec field name
        BigDecimal usedMargin = PriceNormalizer.toBigDecimal(
                raw.getUtilisedamount(), "utilisedamount", Broker.ANGELONE);

        // Total margin from net (String)
        BigDecimal totalMargin = PriceNormalizer.toBigDecimal(
                raw.getNet(), "net", Broker.ANGELONE);

        // Collateral from collateral (String)
        BigDecimal collateral = raw.getCollateral() != null && !raw.getCollateral().isBlank()
                ? PriceNormalizer.toBigDecimal(raw.getCollateral(), "collateral", Broker.ANGELONE)
                : null;

        // Opening balance — not provided by Angel One

        return CanonicalFunds.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ANGELONE)
                .availableCash(availableCash)
                .usedMargin(usedMargin)
                .totalMargin(totalMargin)
                .collateral(collateral)
                .openingBalance(null)
                .lastSyncedAt(Instant.now())
                .build();
    }
}
