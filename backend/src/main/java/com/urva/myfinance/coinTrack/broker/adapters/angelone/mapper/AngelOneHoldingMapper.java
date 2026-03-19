package com.urva.myfinance.coinTrack.broker.adapters.angelone.mapper;

import com.urva.myfinance.coinTrack.broker.adapters.angelone.raw.AngelOneHoldingRaw;
import com.urva.myfinance.coinTrack.broker.core.canonical.CanonicalHolding;
import com.urva.myfinance.coinTrack.broker.core.canonical.DataConfidence;
import com.urva.myfinance.coinTrack.broker.core.canonical.DataSource;
import com.urva.myfinance.coinTrack.broker.core.canonical.Exchange;
import com.urva.myfinance.coinTrack.broker.model.Broker;
import com.urva.myfinance.coinTrack.broker.normalization.ExchangeNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.PriceNormalizer;
import com.urva.myfinance.coinTrack.broker.normalization.SymbolNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Maps Angel One SmartAPI holdings response to canonical holding model.
 *
 * Angel One quirks handled:
 * - averageprice, ltp, close, profitandloss are Double (not String)
 * - quantity, t1quantity are Integer (not String)
 * - profitandloss is COMBINED realized + unrealized (cannot split)
 * - dayChange/dayChangePct NOT provided by Angel One
 * - isin null for SME stocks → fallback to symboltoken
 * - close used as currentPrice (more stable than ltp intraday)
 */
@Component
public class AngelOneHoldingMapper {

    private static final Logger log = LoggerFactory.getLogger(AngelOneHoldingMapper.class);

    public CanonicalHolding toCanonical(AngelOneHoldingRaw raw, String userId, String brokerAccountId) {
        DataConfidence dataConfidence = DataConfidence.HIGH;

        // ISIN — primary dedup key
        String isin = raw.getIsin();
        if (isin == null || isin.isBlank()) {
            log.warn("Angel One holding missing ISIN for tradingsymbol={}, using symboltoken={} as fallback",
                    raw.getTradingsymbol(), raw.getSymboltoken());
            isin = raw.getSymboltoken();
            dataConfidence = DataConfidence.LOW;
        } else if (!isin.startsWith("INE")) {
            log.warn("Angel One holding ISIN='{}' does not start with 'INE' for symbol={}",
                    isin, raw.getTradingsymbol());
            dataConfidence = DataConfidence.LOW;
        }

        // Symbol normalization (strips -EQ suffix)
        String symbol = SymbolNormalizer.normalize(raw.getTradingsymbol(), Broker.ANGELONE, raw.getExchange());

        // Exchange normalization
        Exchange exchange = ExchangeNormalizer.normalize(raw.getExchange(), Broker.ANGELONE);

        // Quantity (Integer from API)
        BigDecimal quantity = BigDecimal.valueOf(raw.getQuantity() != null ? raw.getQuantity() : 0);

        // T1 Quantity (Integer, no underscore in field name)
        BigDecimal t1Quantity = BigDecimal.valueOf(raw.getT1quantity() != null ? raw.getT1quantity() : 0);

        // Average buy price (Double from API)
        BigDecimal avgBuyPrice = PriceNormalizer.toBigDecimal(raw.getAverageprice(), "averageprice", Broker.ANGELONE);
        if (avgBuyPrice.compareTo(BigDecimal.ZERO) == 0) {
            dataConfidence = DataConfidence.LOW;
            log.warn("Angel One holding avgBuyPrice=0 for symbol={}", symbol);
        }

        // Current price from 'close' (Double — more stable than ltp intraday)
        BigDecimal currentPrice = PriceNormalizer.toBigDecimal(raw.getClose(), "close", Broker.ANGELONE);

        // Invested value
        BigDecimal investedValue = quantity.multiply(avgBuyPrice).setScale(2, RoundingMode.HALF_UP);

        // Current value
        BigDecimal currentValue = quantity.multiply(currentPrice).setScale(2, RoundingMode.HALF_UP);

        // P&L — profitandloss is COMBINED realized+unrealized, map to unrealizedPnL with warning
        BigDecimal unrealizedPnL = PriceNormalizer.toBigDecimal(raw.getProfitandloss(), "profitandloss", Broker.ANGELONE);
        if (log.isDebugEnabled()) {
            log.debug("Angel One 'profitandloss' for symbol={} is combined realized+unrealized: {}", symbol, unrealizedPnL);
        }

        // Unrealized P&L percentage
        BigDecimal unrealizedPnLPct = null;
        if (investedValue.compareTo(BigDecimal.ZERO) != 0) {
            unrealizedPnLPct = unrealizedPnL
                    .divide(investedValue, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(4, RoundingMode.HALF_UP);
        }

        // dayChange / dayChangePct — NOT provided by Angel One

        return CanonicalHolding.builder()
                .userId(userId)
                .brokerAccountId(brokerAccountId)
                .brokerType(Broker.ANGELONE)
                .isin(isin)
                .symbol(symbol)
                .exchange(exchange)
                .quantity(quantity)
                .t1Quantity(t1Quantity)
                .avgBuyPrice(avgBuyPrice)
                .currentPrice(currentPrice)
                .investedValue(investedValue)
                .currentValue(currentValue)
                .unrealizedPnL(unrealizedPnL)
                .unrealizedPnLPct(unrealizedPnLPct)
                .dayChange(null)
                .dayChangePct(null)
                .dataConfidence(dataConfidence)
                .lastSyncedAt(Instant.now())
                .dataSource(DataSource.LIVE)
                .build();
    }
}
