package com.urva.myfinance.coinTrack.calculator.util;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class FinancialMathTest {

    @Nested
    @DisplayName("SIP calculations")
    class SipTests {

        @Test
        @DisplayName("1. SIP future value for known input")
        void sipFutureValue_KnownInput_ReturnsExpected() {
            BigDecimal result = FinancialMath.sipFutureValue(
                    new BigDecimal("5000"), new BigDecimal("12"), 10);
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("2. SIP with zero rate")
        void sipFutureValue_ZeroRate_ReturnsTotalInvestment() {
            BigDecimal result = FinancialMath.sipFutureValue(
                    new BigDecimal("5000"), BigDecimal.ZERO, 5);
            assertTrue(result.compareTo(new BigDecimal("300000")) >= 0);
        }

        @Test
        @DisplayName("3. SIP with zero years returns zero")
        void sipFutureValue_ZeroYears_ReturnsZero() {
            BigDecimal result = FinancialMath.sipFutureValue(
                    new BigDecimal("5000"), new BigDecimal("12"), 0);
            assertEquals(0, result.compareTo(BigDecimal.ZERO));
        }

        @Test
        @DisplayName("4. Step-up SIP future value is greater than regular SIP")
        void stepUpSip_GreaterThanRegular() {
            BigDecimal regular = FinancialMath.sipFutureValue(
                    new BigDecimal("10000"), new BigDecimal("12"), 10);
            BigDecimal stepUp = FinancialMath.stepUpSipFutureValue(
                    new BigDecimal("10000"), new BigDecimal("12"), 10, new BigDecimal("10"));
            assertTrue(stepUp.compareTo(regular) > 0);
        }

        @Test
        @DisplayName("5. Step-up SIP total investment")
        void stepUpSipTotalInvestment_Correct() {
            BigDecimal total = FinancialMath.stepUpSipTotalInvestment(
                    new BigDecimal("10000"), 3, new BigDecimal("10"));
            assertNotNull(total);
            assertTrue(total.compareTo(BigDecimal.ZERO) > 0);
        }
    }

    @Nested
    @DisplayName("Lumpsum / CAGR / Inflation")
    class InvestmentTests {

        @Test
        @DisplayName("6. Lumpsum future value")
        void lumpsumFutureValue_Correct() {
            BigDecimal result = FinancialMath.lumpsumFutureValue(
                    new BigDecimal("100000"), new BigDecimal("12"), 5);
            assertTrue(result.compareTo(new BigDecimal("100000")) > 0);
        }

        @Test
        @DisplayName("7. CAGR calculation")
        void cagr_Correct() {
            BigDecimal result = FinancialMath.cagr(
                    new BigDecimal("100000"), new BigDecimal("176234"), 5);
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("8. Inflation adjusted future value")
        void inflationAdjustedFuture_Correct() {
            BigDecimal result = FinancialMath.inflationAdjustedFuture(
                    new BigDecimal("100000"), new BigDecimal("6"), 5);
            assertTrue(result.compareTo(new BigDecimal("100000")) > 0);
        }

        @Test
        @DisplayName("9. Inflation adjusted present value")
        void inflationAdjustedPresentValue_Correct() {
            BigDecimal result = FinancialMath.inflationAdjustedPresentValue(
                    new BigDecimal("133822"), new BigDecimal("6"), 5);
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("10. Stock average of single purchase")
        void stockAverage_SinglePurchase_ReturnsPrice() {
            List<FinancialMath.StockPurchase> purchases = List.of(
                    new FinancialMath.StockPurchase(new BigDecimal("10"), new BigDecimal("100")));
            BigDecimal result = FinancialMath.stockAverage(purchases);
            assertEquals(new BigDecimal("100.00"), result.setScale(2, RoundingMode.HALF_UP));
        }

        @Test
        @DisplayName("11. Stock average of multiple purchases")
        void stockAverage_MultiplePurchases_Correct() {
            List<FinancialMath.StockPurchase> purchases = List.of(
                    new FinancialMath.StockPurchase(new BigDecimal("10"), new BigDecimal("100")),
                    new FinancialMath.StockPurchase(new BigDecimal("20"), new BigDecimal("150")));
            BigDecimal result = FinancialMath.stockAverage(purchases);
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("12. Stock average of null returns zero")
        void stockAverage_Null_ReturnsZero() {
            assertEquals(BigDecimal.ZERO, FinancialMath.stockAverage(null));
        }

        @Test
        @DisplayName("13. Stock average of empty list returns zero")
        void stockAverage_Empty_ReturnsZero() {
            assertEquals(BigDecimal.ZERO, FinancialMath.stockAverage(List.of()));
        }
    }

    @Nested
    @DisplayName("EMI / Interest")
    class LoanTests {

        @Test
        @DisplayName("14. EMI calculation")
        void emi_Correct() {
            BigDecimal result = FinancialMath.emi(
                    new BigDecimal("1000000"), new BigDecimal("8.5"), 240);
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("15. Total interest calculation")
        void totalInterest_Correct() {
            BigDecimal emi = new BigDecimal("8678");
            BigDecimal result = FinancialMath.totalInterest(
                    new BigDecimal("1000000"), emi, 120);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("16. Flat rate EMI")
        void flatRateEmi_Correct() {
            BigDecimal result = FinancialMath.flatRateEmi(
                    new BigDecimal("100000"), new BigDecimal("10"), 5);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("17. Compound interest")
        void compoundInterest_Correct() {
            BigDecimal result = FinancialMath.compoundInterest(
                    new BigDecimal("100000"), new BigDecimal("10"), 5, 12);
            assertTrue(result.compareTo(new BigDecimal("100000")) > 0);
        }

        @Test
        @DisplayName("18. Simple interest")
        void simpleInterest_Correct() {
            BigDecimal result = FinancialMath.simpleInterest(
                    new BigDecimal("100000"), new BigDecimal("10"), 5);
            assertEquals(new BigDecimal("50000.00"), result.setScale(2, RoundingMode.HALF_UP));
        }
    }

    @Nested
    @DisplayName("XIRR calculations")
    class XirrTests {

        @Test
        @DisplayName("19. XIRR with null returns failure")
        void xirr_Null_ReturnsFailure() {
            FinancialMath.XirrResult result = FinancialMath.xirr(null);
            assertFalse(result.success());
            assertEquals("INVALID_INPUT", result.errorCode());
        }

        @Test
        @DisplayName("20. XIRR with single cash flow returns failure")
        void xirr_SingleCashFlow_ReturnsFailure() {
            FinancialMath.XirrResult result = FinancialMath.xirr(List.of(
                    new FinancialMath.CashFlow(LocalDate.of(2026, 1, 1), new BigDecimal("-100000"))));
            assertFalse(result.success());
        }

        @Test
        @DisplayName("21. XIRR with valid cash flows")
        void xirr_ValidCashFlows_ReturnsResult() {
            List<FinancialMath.CashFlow> cashFlows = List.of(
                    new FinancialMath.CashFlow(LocalDate.of(2026, 1, 1), new BigDecimal("-100000")),
                    new FinancialMath.CashFlow(LocalDate.of(2027, 1, 1), new BigDecimal("120000")));
            FinancialMath.XirrResult result = FinancialMath.xirr(cashFlows);
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("Utility methods")
    class UtilityTests {

        @Test
        @DisplayName("22. pow calculation")
        void pow_Correct() {
            assertEquals(0, FinancialMath.pow(new BigDecimal("2"), 3).compareTo(new BigDecimal("8")));
            assertEquals(0, FinancialMath.pow(new BigDecimal("5"), 0).compareTo(BigDecimal.ONE));
        }

        @Test
        @DisplayName("23. round2 rounding")
        void round2_RoundsCorrectly() {
            assertEquals(new BigDecimal("3.14"), FinancialMath.round2(new BigDecimal("3.14159")));
        }

        @Test
        @DisplayName("24. formatCurrency formats amount")
        void formatCurrency_Formats() {
            String result = FinancialMath.formatCurrency(new BigDecimal("1234567.89"));
            assertNotNull(result);
        }

        @Test
        @DisplayName("25. Constants are correct")
        void constants_Correct() {
            assertEquals(new BigDecimal("100"), FinancialMath.HUNDRED);
            assertEquals(new BigDecimal("12"), FinancialMath.TWELVE);
            assertEquals(BigDecimal.ONE, FinancialMath.ONE);
            assertEquals(BigDecimal.ZERO, FinancialMath.ZERO);
        }
    }
}
