package com.urva.myfinance.coinTrack.calculator.dto.response;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CalculatorResponseTest {

    @Test
    @DisplayName("1. success factory creates successful response")
    void success_CreatesResponse() {
        CalculatorResponse<String> response = CalculatorResponse.success(
                CalculatorResponse.CalculatorMetadata.of("emi", "loans"),
                "result-data",
                null);

        assertTrue(response.success());
        assertNotNull(response.metadata());
        assertEquals("result-data", response.result());
        assertNull(response.error());
        assertNull(response.debug());
    }

    @Test
    @DisplayName("2. success with breakdown")
    void success_WithBreakdown() {
        var breakdown = List.of(
                new CalculatorResponse.YearlyBreakdown(1,
                        new BigDecimal("1000"), new BigDecimal("500"), new BigDecimal("9000")));

        CalculatorResponse<EmiResponse> response = CalculatorResponse.success(
                CalculatorResponse.CalculatorMetadata.of("emi", "loans"),
                new EmiResponse(new BigDecimal("10000"), new BigDecimal("1200000"),
                        new BigDecimal("200000"), new BigDecimal("1000000")),
                breakdown);

        assertTrue(response.success());
        assertEquals(1, response.breakdown().size());
    }

    @Test
    @DisplayName("3. successWithDebug creates response with debug info")
    void successWithDebug_CreatesResponse() {
        CalculatorResponse<String> response = CalculatorResponse.successWithDebug(
                CalculatorResponse.CalculatorMetadata.of("emi", "loans"),
                "result",
                null,
                CalculatorResponse.DebugInfo.of(new BigDecimal("0.007"), 240, "E = P × r × (1+r)^n / ((1+r)^n − 1)"));

        assertTrue(response.success());
        assertNotNull(response.debug());
        assertEquals(240, response.debug().totalMonths());
    }

    @Test
    @DisplayName("4. error factory creates error response")
    void error_CreatesErrorResponse() {
        CalculatorResponse<String> response = CalculatorResponse.error("INVALID", "Bad input", "principal");

        assertFalse(response.success());
        assertNull(response.result());
        assertNotNull(response.error());
        assertEquals("INVALID", response.error().code());
        assertEquals("Bad input", response.error().message());
        assertEquals("principal", response.error().field());
    }

    @Test
    @DisplayName("5. error without field")
    void error_WithoutField() {
        CalculatorResponse<String> response = CalculatorResponse.error("ERROR", "Something went wrong");

        assertFalse(response.success());
        assertNull(response.error().field());
    }

    @Test
    @DisplayName("6. CalculatorMetadata.of with category only")
    void metadata_WithCategory() {
        CalculatorResponse.CalculatorMetadata metadata =
                CalculatorResponse.CalculatorMetadata.of("sip", "investments");

        assertEquals("sip", metadata.calculatorId());
        assertEquals("investments", metadata.category());
        assertEquals("1.0", metadata.version());
        assertNotNull(metadata.lastUpdated());
        assertTrue(metadata.assumptions().isEmpty());
    }

    @Test
    @DisplayName("7. CalculatorMetadata.of with assumptions")
    void metadata_WithAssumptions() {
        CalculatorResponse.CalculatorMetadata metadata =
                CalculatorResponse.CalculatorMetadata.of("emi", "loans",
                        List.of("EMI is calculated using reducing balance method"));

        assertEquals(1, metadata.assumptions().size());
    }

    @Test
    @DisplayName("8. DebugInfo.of without additional info")
    void debugInfo_WithoutInfo() {
        CalculatorResponse.DebugInfo debug = CalculatorResponse.DebugInfo.of(
                new BigDecimal("0.007"), 120, "EMI formula");

        assertEquals(new BigDecimal("0.007"), debug.monthlyRate());
        assertEquals(120, debug.totalMonths());
        assertEquals("EMI formula", debug.formulaUsed());
        assertNull(debug.additionalInfo());
    }

    @Test
    @DisplayName("9. DebugInfo.withInfo includes additional info")
    void debugInfo_WithInfo() {
        Map<String, Object> info = Map.of("rate", 8.5, "tenure", 20);
        CalculatorResponse.DebugInfo debug = CalculatorResponse.DebugInfo.withInfo(
                new BigDecimal("0.007"), 120, "EMI formula", info);

        assertNotNull(debug.additionalInfo());
        assertEquals(8.5, debug.additionalInfo().get("rate"));
    }

    @Test
    @DisplayName("10. ErrorInfo record fields")
    void errorInfo_Fields() {
        CalculatorResponse.ErrorInfo error = new CalculatorResponse.ErrorInfo("CODE", "msg", "field");
        assertEquals("CODE", error.code());
        assertEquals("msg", error.message());
        assertEquals("field", error.field());
    }

    @Test
    @DisplayName("11. YearlyBreakdown record fields")
    void yearlyBreakdown_Fields() {
        CalculatorResponse.YearlyBreakdown yb = new CalculatorResponse.YearlyBreakdown(
                3, new BigDecimal("1000"), new BigDecimal("500"), new BigDecimal("5000"));
        assertEquals(3, yb.year());
        assertEquals(new BigDecimal("1000"), yb.investment());
        assertEquals(new BigDecimal("500"), yb.interest());
        assertEquals(new BigDecimal("5000"), yb.balance());
    }

    @Test
    @DisplayName("12. EmiResponse record fields")
    void emiResponse_Fields() {
        EmiResponse response = new EmiResponse(
                new BigDecimal("10000"), new BigDecimal("1200000"),
                new BigDecimal("200000"), new BigDecimal("1000000"));
        assertEquals(new BigDecimal("10000"), response.emi());
        assertEquals(new BigDecimal("1200000"), response.totalPayment());
        assertEquals(new BigDecimal("200000"), response.totalInterest());
        assertEquals(new BigDecimal("1000000"), response.principal());
    }

    @Test
    @DisplayName("13. BrokerageResponse record")
    void brokerageResponse_Fields() {
        BrokerageResponse res = new BrokerageResponse(BigDecimal.valueOf(100), BigDecimal.valueOf(110),
                BigDecimal.valueOf(10), BigDecimal.valueOf(1), BigDecimal.valueOf(1), BigDecimal.valueOf(1),
                BigDecimal.valueOf(1), BigDecimal.valueOf(1), BigDecimal.valueOf(1), BigDecimal.valueOf(6),
                BigDecimal.valueOf(4), BigDecimal.valueOf(102), BigDecimal.valueOf(210), "DELIVERY");

        assertEquals(BigDecimal.valueOf(100), res.buyValue());
        assertEquals(BigDecimal.valueOf(10), res.grossPnl());
        assertEquals(BigDecimal.valueOf(4), res.netPnl());
        assertEquals(BigDecimal.valueOf(210), res.turnover());
    }

    @Test
    @DisplayName("16. MarginResponse record fields")
    void marginResponse_Fields() {
        MarginResponse res = new MarginResponse(BigDecimal.valueOf(1000), BigDecimal.valueOf(200),
                BigDecimal.valueOf(20), BigDecimal.valueOf(5), BigDecimal.valueOf(1000), BigDecimal.valueOf(50),
                BigDecimal.valueOf(50), BigDecimal.ZERO);

        assertEquals(BigDecimal.valueOf(1000), res.tradeValue());
        assertEquals(BigDecimal.valueOf(200), res.requiredMargin());
        assertEquals(BigDecimal.valueOf(5), res.leverage());
    }

    @Test
    @DisplayName("14. SimpleInterestResponse record fields")
    void simpleInterestResponse_Fields() {
        SimpleInterestResponse response = new SimpleInterestResponse(
                new BigDecimal("100000"), new BigDecimal("150000"), new BigDecimal("50000"));
        assertEquals(new BigDecimal("100000"), response.principal());
        assertEquals(new BigDecimal("150000"), response.totalAmount());
        assertEquals(new BigDecimal("50000"), response.interest());
    }

    @Test
    @DisplayName("15. CompoundInterestResponse record fields")
    void compoundInterestResponse_Fields() {
        CompoundInterestResponse response = new CompoundInterestResponse(
                new BigDecimal("100000"), new BigDecimal("161051"),
                new BigDecimal("61051"), new BigDecimal("10.47"), 12);
        assertEquals(12, response.compoundingFrequency());
        assertEquals(new BigDecimal("10.47"), response.effectiveRate());
    }



    @Test
    @DisplayName("17. FlatVsReducingResponse record fields")
    void flatVsReducingResponse_Fields() {
        FlatVsReducingResponse response = new FlatVsReducingResponse(
                new BigDecimal("100000"), new BigDecimal("9000"),
                new BigDecimal("20000"), new BigDecimal("120000"),
                new BigDecimal("10000"), new BigDecimal("40000"),
                new BigDecimal("140000"), new BigDecimal("20000"), true, new BigDecimal("11.5"));
        assertEquals(new BigDecimal("20000"), response.savings());
    }
}
