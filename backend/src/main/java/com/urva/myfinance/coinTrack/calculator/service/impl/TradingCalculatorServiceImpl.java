package com.urva.myfinance.coinTrack.calculator.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.calculator.config.CalculatorConfigLoader;
import com.urva.myfinance.coinTrack.config.StatutoryChargesConfig;
import com.urva.myfinance.coinTrack.calculator.dto.request.BrokerageRequest;
import com.urva.myfinance.coinTrack.calculator.dto.request.MarginRequest;
import com.urva.myfinance.coinTrack.calculator.dto.response.BrokerageResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse;
import com.urva.myfinance.coinTrack.calculator.dto.response.CalculatorResponse.CalculatorMetadata;
import com.urva.myfinance.coinTrack.calculator.dto.response.MarginResponse;

/**
 * Service implementation for Trading Calculators.
 */
@Service
public class TradingCalculatorServiceImpl implements com.urva.myfinance.coinTrack.calculator.service.TradingCalculatorService {

        private static final String CATEGORY = "trading";
        private static final BigDecimal HUNDRED = new BigDecimal("100");

        private final CalculatorConfigLoader configLoader;
        private final StatutoryChargesConfig statutoryConfig;

        @Autowired
        public TradingCalculatorServiceImpl(CalculatorConfigLoader configLoader, StatutoryChargesConfig statutoryConfig) {
                this.configLoader = configLoader;
                this.statutoryConfig = statutoryConfig;
        }

        private BigDecimal getBrokerage(String broker, String type) {
                Map<String, Object> assumptions = configLoader.getDefaultAssumptions();
                Double value = configLoader.getValue(assumptions, "brokerage." + broker.toLowerCase() + "." + type);
                return value != null ? BigDecimal.valueOf(value) : BigDecimal.ZERO;
        }

        /**
         * Calculate brokerage and all charges.
         */
        public CalculatorResponse<BrokerageResponse> calculateBrokerage(BrokerageRequest request, boolean debug) {
                BigDecimal buyValue = request.buyPrice().multiply(request.quantity());
                BigDecimal sellValue = request.sellPrice().multiply(request.quantity());
                BigDecimal turnover = buyValue.add(sellValue);
                BigDecimal grossProfit = sellValue.subtract(buyValue);

                String txnType = request.transactionType().toUpperCase();
                String broker = request.broker();

                BigDecimal brokerage;
                BigDecimal stt;
                BigDecimal stampDuty;

                LocalDate now = LocalDate.now();
                BigDecimal gstRate = statutoryConfig.getGst() != null ? statutoryConfig.getGst().getDefaultRate() : new BigDecimal("18");
                BigDecimal sebiChargesRate = statutoryConfig.getEffectiveRate(statutoryConfig.getSebiCharges(), now);
                
                String segmentKey = switch (txnType) {
                        case "DELIVERY", "INTRADAY" -> "cash";
                        case "FUTURES" -> "futures";
                        case "OPTIONS" -> "options";
                        default -> "cash";
                };
                
                BigDecimal transChargeRate = BigDecimal.ZERO;
                if (statutoryConfig.getTransactionCharges() != null) {
                        var exchangeCharges = statutoryConfig.getTransactionCharges().get(request.exchange().toLowerCase());
                        if (exchangeCharges != null) {
                                transChargeRate = statutoryConfig.getEffectiveRate(exchangeCharges.get(segmentKey), now);
                        }
                }

                switch (txnType) {
                        case "DELIVERY" -> {
                                brokerage = buyValue.add(sellValue).multiply(getBrokerage(broker, "equityDelivery"))
                                                .divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                                stt = buyValue.add(sellValue).multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStt().getTrading().get("delivery"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStampDuty().getTrading().get("delivery"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        case "INTRADAY" -> {
                                BigDecimal pBrokerage = buyValue.add(sellValue)
                                                .multiply(getBrokerage(broker, "equityIntraday"))
                                                .divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                                brokerage = pBrokerage.min(BigDecimal.valueOf(40)); // Max Rs 20 per side
                                stt = sellValue.multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStt().getTrading().get("intraday"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStampDuty().getTrading().get("intraday"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        case "FUTURES" -> {
                                brokerage = BigDecimal.valueOf(40);
                                stt = sellValue.multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStt().getTrading().get("futuresSell"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStampDuty().getTrading().get("futures"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        case "OPTIONS" -> {
                                brokerage = BigDecimal.valueOf(40);
                                stt = sellValue.multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStt().getTrading().get("optionsSell"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(statutoryConfig.getEffectiveRate(statutoryConfig.getStampDuty().getTrading().get("options"), now)).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        default -> {
                                brokerage = stt = stampDuty = BigDecimal.ZERO;
                        }
                }

                BigDecimal transactionCharges = turnover.multiply(transChargeRate).divide(HUNDRED, 2,
                                RoundingMode.HALF_EVEN);
                BigDecimal sebiCharges = turnover.multiply(sebiChargesRate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                BigDecimal gst = brokerage.add(transactionCharges).add(sebiCharges).multiply(gstRate).divide(HUNDRED, 2,
                                RoundingMode.HALF_EVEN);

                BigDecimal totalCharges = brokerage.add(stt).add(transactionCharges).add(gst).add(sebiCharges)
                                .add(stampDuty);
                BigDecimal netProfit = grossProfit.subtract(totalCharges);
                BigDecimal breakeven = buyValue.add(totalCharges).divide(request.quantity(), 2, RoundingMode.HALF_EVEN);

                BrokerageResponse result = new BrokerageResponse(buyValue, sellValue, grossProfit, brokerage, stt,
                                transactionCharges, gst, sebiCharges, stampDuty, totalCharges, netProfit, breakeven, turnover,
                                txnType);
                return CalculatorResponse.success(CalculatorMetadata.of("brokerage", CATEGORY,
                                List.of("Exchange: " + request.exchange())), result, null);
        }

        /**
         * Calculate Margin requirements.
         */
        @SuppressWarnings("unchecked")
        public CalculatorResponse<MarginResponse> calculateMargin(MarginRequest request, boolean debug) {
                BigDecimal tradeValue = request.tradeValue();

                Map<String, Object> marginConf = (Map<String, Object>) configLoader.getDefaultAssumptions()
                                .get("margin");
                Double leverage = request.leverage() != null ? request.leverage().doubleValue()
                                : configLoader.getValue(marginConf,
                                                "defaultLeverage." + request.segmentType().toLowerCase());
                if (leverage == null)
                        leverage = 1.0;

                BigDecimal varRate = BigDecimal.valueOf(configLoader.getValue(marginConf, "varMargin"));
                BigDecimal elmRate = BigDecimal.valueOf(configLoader.getValue(marginConf, "elmMargin"));

                BigDecimal requiredMargin = tradeValue.divide(BigDecimal.valueOf(leverage), 2, RoundingMode.HALF_EVEN);
                BigDecimal varMargin = tradeValue.multiply(varRate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                BigDecimal elmMargin = tradeValue.multiply(elmRate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                BigDecimal marginPercent = BigDecimal.valueOf(100.0 / leverage).setScale(2, RoundingMode.HALF_EVEN);
                BigDecimal exposure = tradeValue;

                MarginResponse result = new MarginResponse(tradeValue, requiredMargin, marginPercent, BigDecimal.valueOf(leverage),
                                exposure, varMargin, elmMargin, BigDecimal.ZERO);
                return CalculatorResponse.success(
                                CalculatorMetadata.of("margin", CATEGORY, List.of("Leverage used: " + leverage + "x")),
                                result, null);
        }
}
