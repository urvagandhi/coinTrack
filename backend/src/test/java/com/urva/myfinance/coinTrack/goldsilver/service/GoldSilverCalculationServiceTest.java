package com.urva.myfinance.coinTrack.goldsilver.service;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.urva.myfinance.coinTrack.goldsilver.model.GoldSilverInvestment;
import com.urva.myfinance.coinTrack.goldsilver.model.MetalType;

class GoldSilverCalculationServiceTest {

    private GoldSilverCalculationService service;

    @BeforeEach
    void setUp() {
        service = new GoldSilverCalculationService();
    }

    @Test
    @DisplayName("1. calculateFields computes metal amount, making charges, GST, net amount")
    void calculateFields_StandardGoldInvestment_AllFieldsComputed() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .metalType(MetalType.GOLD)
                .ratePerGram(new BigDecimal("6500.00"))
                .netWeight(new BigDecimal("10.000"))
                .makingChargePercent(new BigDecimal("12.00"))
                .stoneOtherCharges(new BigDecimal("500.00"))
                .gstPercent(new BigDecimal("3.00"))
                .build();

        service.calculateFields(investment);

        assertEquals(new BigDecimal("65000.00"), investment.getMetalAmount());
        assertEquals(new BigDecimal("7800.00"), investment.getMakingChargeAmount());
        assertEquals(new BigDecimal("73300.00"), investment.getTotalAmount());
        assertEquals(new BigDecimal("2199.00"), investment.getGstAmount());
        assertEquals(new BigDecimal("75499.00"), investment.getNetAmount());
    }

    @Test
    @DisplayName("2. calculateFields with null rate defaults to ZERO")
    void calculateFields_NullRate_DefaultsToZero() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .metalType(MetalType.SILVER)
                .netWeight(new BigDecimal("100.000"))
                .build();

        service.calculateFields(investment);

        assertEquals(new BigDecimal("0.00"), investment.getMetalAmount());
        assertEquals(new BigDecimal("0.00"), investment.getNetAmount());
    }

    @Test
    @DisplayName("3. calculateFields with zero making charge")
    void calculateFields_ZeroMakingCharge_NoChargeAdded() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .ratePerGram(new BigDecimal("6500.00"))
                .netWeight(new BigDecimal("10.000"))
                .makingChargePercent(BigDecimal.ZERO)
                .stoneOtherCharges(BigDecimal.ZERO)
                .build();

        service.calculateFields(investment);

        assertEquals(new BigDecimal("65000.00"), investment.getMetalAmount());
        assertEquals(new BigDecimal("0.00"), investment.getMakingChargeAmount());
        assertEquals(new BigDecimal("65000.00"), investment.getTotalAmount());
    }

    @Test
    @DisplayName("4. calculateFields with null making charge defaults to ZERO")
    void calculateFields_NullMakingCharge_DefaultsToZero() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .ratePerGram(new BigDecimal("100.00"))
                .netWeight(new BigDecimal("5.000"))
                .build();

        service.calculateFields(investment);

        assertEquals(new BigDecimal("0.00"), investment.getMakingChargeAmount());
    }

    @Test
    @DisplayName("5. calculateFields with null stone charges defaults to ZERO")
    void calculateFields_NullStoneCharges_DefaultsToZero() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .ratePerGram(new BigDecimal("100.00"))
                .netWeight(new BigDecimal("5.000"))
                .makingChargePercent(new BigDecimal("10.00"))
                .build();

        service.calculateFields(investment);

        // metalAmount=500, makingCharge=50, stoneOtherCharges=0, totalAmount=550
        assertEquals(new BigDecimal("550.00"), investment.getTotalAmount());
    }

    @Test
    @DisplayName("6. calculateFields with null GST defaults to 3%")
    void calculateFields_NullGst_DefaultsTo3Percent() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .ratePerGram(new BigDecimal("100.00"))
                .netWeight(new BigDecimal("5.000"))
                .makingChargePercent(BigDecimal.ZERO)
                .build();

        service.calculateFields(investment);

        assertEquals(new BigDecimal("3.00"), investment.getGstPercent());
    }

    @Test
    @DisplayName("7. recalculateMarketValue computes profit/loss and return %")
    void recalculateMarketValue_ProfitScenario_ReturnsPositive() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .netAmount(new BigDecimal("50000.00"))
                .netWeight(new BigDecimal("10.000"))
                .currentMarketRate(new BigDecimal("6000.00"))
                .build();

        service.recalculateMarketValue(investment);

        assertEquals(new BigDecimal("60000.00"), investment.getCurrentValue());
        assertEquals(new BigDecimal("10000.00"), investment.getProfitLoss());
        assertEquals(new BigDecimal("20.00"), investment.getReturnPercent());
    }

    @Test
    @DisplayName("8. recalculateMarketValue computes loss scenario")
    void recalculateMarketValue_LossScenario_ReturnsNegative() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .netAmount(new BigDecimal("60000.00"))
                .netWeight(new BigDecimal("10.000"))
                .currentMarketRate(new BigDecimal("5000.00"))
                .build();

        service.recalculateMarketValue(investment);

        assertEquals(new BigDecimal("50000.00"), investment.getCurrentValue());
        assertEquals(new BigDecimal("-10000.00"), investment.getProfitLoss());
        assertEquals(new BigDecimal("-16.67"), investment.getReturnPercent());
    }

    @Test
    @DisplayName("9. recalculateMarketValue with zero net amount returns 0% return")
    void recalculateMarketValue_ZeroNetAmount_ReturnsZeroPercent() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .netAmount(BigDecimal.ZERO)
                .netWeight(new BigDecimal("10.000"))
                .currentMarketRate(new BigDecimal("6000.00"))
                .build();

        service.recalculateMarketValue(investment);

        assertEquals(0, investment.getReturnPercent().compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("10. recalculateMarketValue with null current market rate defaults to ZERO")
    void recalculateMarketValue_NullRate_DefaultsToZero() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .netAmount(new BigDecimal("50000.00"))
                .netWeight(new BigDecimal("10.000"))
                .build();

        service.recalculateMarketValue(investment);

        assertEquals(new BigDecimal("0.00"), investment.getCurrentValue());
        assertEquals(new BigDecimal("-50000.00"), investment.getProfitLoss());
    }

    @Test
    @DisplayName("11. Silver investment calculates correctly")
    void calculateFields_SilverInvestment_CalculatesCorrectly() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .metalType(MetalType.SILVER)
                .ratePerGram(new BigDecimal("75.00"))
                .netWeight(new BigDecimal("100.000"))
                .makingChargePercent(new BigDecimal("5.00"))
                .stoneOtherCharges(new BigDecimal("100.00"))
                .gstPercent(new BigDecimal("3.00"))
                .build();

        service.calculateFields(investment);

        assertEquals(new BigDecimal("7500.00"), investment.getMetalAmount());
        assertEquals(new BigDecimal("375.00"), investment.getMakingChargeAmount());
        assertEquals(new BigDecimal("7975.00"), investment.getTotalAmount());
    }

    @Test
    @DisplayName("12. Zero weight produces zero metal amount")
    void calculateFields_ZeroWeight_ZeroMetalAmount() {
        GoldSilverInvestment investment = GoldSilverInvestment.builder()
                .ratePerGram(new BigDecimal("6500.00"))
                .netWeight(BigDecimal.ZERO)
                .build();

        service.calculateFields(investment);

        assertEquals(new BigDecimal("0.00"), investment.getMetalAmount());
        assertEquals(new BigDecimal("0.00"), investment.getNetAmount());
    }
}
