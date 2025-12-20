package com.urva.myfinance.coinTrack.calculator.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.urva.myfinance.coinTrack.calculator.config.CalculatorConfigLoader;
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
public class TradingCalculatorServiceImpl {

        private static final String CATEGORY = "trading";
        private static final BigDecimal HUNDRED = new BigDecimal("100");

        private final CalculatorConfigLoader configLoader;

        @Autowired
        public TradingCalculatorServiceImpl(CalculatorConfigLoader configLoader) {
                this.configLoader = configLoader;
        }

        private BigDecimal getCharge(String key) {
                Map<String, Object> assumptions = configLoader.getDefaultAssumptions();
                Double value = configLoader.getValue(assumptions, "brokerage.charges." + key);
                return value != null ? BigDecimal.valueOf(value) : BigDecimal.ZERO;
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

                // Load charges from config
                BigDecimal gstRate = getCharge("gst");
                BigDecimal sebiChargesRate = getCharge("sebiCharges");
                BigDecimal transChargeRate = getCharge("transactionCharges." + request.exchange().toLowerCase());

                switch (txnType) {
                        case "DELIVERY" -> {
                                brokerage = buyValue.add(sellValue).multiply(getBrokerage(broker, "equityDelivery"))
                                                .divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                                stt = buyValue.add(sellValue).multiply(getCharge("stt.delivery")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(getCharge("stampDuty.delivery")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        case "INTRADAY" -> {
                                BigDecimal pBrokerage = buyValue.add(sellValue)
                                                .multiply(getBrokerage(broker, "equityIntraday"))
                                                .divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                                brokerage = pBrokerage.min(BigDecimal.valueOf(40)); // Max Rs 20 per side
                                stt = sellValue.multiply(getCharge("stt.intraday")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(getCharge("stampDuty.intraday")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        case "FUTURES" -> {
                                brokerage = BigDecimal.valueOf(40);
                                stt = sellValue.multiply(getCharge("stt.futuresSell")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(getCharge("stampDuty.futures")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        case "OPTIONS" -> {
                                brokerage = BigDecimal.valueOf(40);
                                stt = sellValue.multiply(getCharge("stt.optionsSell")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                                stampDuty = buyValue.multiply(getCharge("stampDuty.options")).divide(HUNDRED, 2,
                                                RoundingMode.HALF_EVEN);
                        }
                        default -> {
                                brokerage = stt = stampDuty = BigDecimal.ZERO;
                        }
                }

                BigDecimal transactionCharges = turnover.multiply(transChargeRate).divide(HUNDRED, 2,
                                RoundingMode.HALF_EVEN);
                BigDecimal sebiCharges = turnover.multiply(sebiChargesRate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                BigDecimal gst = brokerage.add(transactionCharges).multiply(gstRate).divide(HUNDRED, 2,
                                RoundingMode.HALF_EVEN);

                BigDecimal totalCharges = brokerage.add(stt).add(transactionCharges).add(gst).add(sebiCharges)
                                .add(stampDuty);
                BigDecimal netProfit = grossProfit.subtract(totalCharges);
                BigDecimal breakeven = buyValue.add(totalCharges).divide(request.quantity(), 2, RoundingMode.HALF_EVEN);

                BrokerageResponse result = new BrokerageResponse(buyValue, sellValue, grossProfit, brokerage, stt,
                                transactionCharges, gst, sebiCharges, stampDuty, totalCharges, netProfit, breakeven,
                                txnType);
                return CalculatorResponse.success(CalculatorMetadata.of("brokerage", CATEGORY,
                                List.of("Exchange: " + request.exchange())), result, null);
        }

        /**
         * Calculate Margin requirements.
         */
        @SuppressWarnings("unchecked")
        public CalculatorResponse<MarginResponse> calculateMargin(MarginRequest request, boolean debug) {
                BigDecimal totalValue = request.price().multiply(request.quantity());

                Map<String, Object> marginConf = (Map<String, Object>) configLoader.getDefaultAssumptions()
                                .get("margin");
                Double leverage = request.leverage() != null ? request.leverage().doubleValue()
                                : configLoader.getValue(marginConf,
                                                "defaultLeverage." + request.transactionType().toLowerCase());
                if (leverage == null)
                        leverage = 1.0;

                BigDecimal varRate = BigDecimal.valueOf(configLoader.getValue(marginConf, "varMargin"));
                BigDecimal elmRate = BigDecimal.valueOf(configLoader.getValue(marginConf, "elmMargin"));

                BigDecimal requiredMargin = totalValue.divide(BigDecimal.valueOf(leverage), 2, RoundingMode.HALF_EVEN);
                BigDecimal varMargin = totalValue.multiply(varRate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);
                BigDecimal elmMargin = totalValue.multiply(elmRate).divide(HUNDRED, 2, RoundingMode.HALF_EVEN);

                MarginResponse result = new MarginResponse(totalValue, requiredMargin, BigDecimal.valueOf(leverage),
                                varMargin, elmMargin);
                return CalculatorResponse.success(
                                CalculatorMetadata.of("margin", CATEGORY, List.of("Leverage used: " + leverage + "x")),
                                result, null);
        }
}
