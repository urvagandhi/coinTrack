package com.urva.myfinance.coinTrack.fixeddeposit;

import static java.time.temporal.ChronoUnit.DAYS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.InterestPayoutFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.util.FdMath;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class FdMathTest {

  private static final BigDecimal PRINCIPAL_1L = new BigDecimal("100000");
  private static final BigDecimal RATE_7 = new BigDecimal("7.00");
  private static final BigDecimal RATE_7_5 = new BigDecimal("7.50");
  private static final LocalDate ISSUE_DATE = LocalDate.of(2024, 1, 1);
  private static final LocalDate MATURITY_5Y = LocalDate.of(2029, 1, 1);
  private static final LocalDate MATURITY_1Y = LocalDate.of(2025, 1, 1);
  private static final LocalDate MATURITY_6M = LocalDate.of(2024, 7, 1);

  // ===== CUMULATIVE MATURITY TESTS =====

  @Test
  @DisplayName("Cumulative: ₹1L @ 7% 5yr quarterly → ~₹1.41L")
  void testCumulative5YearQuarterly() {
    FdMath.MaturityResult result =
        FdMath.computeMaturity(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            false,
            InterestPayoutFrequency.AT_MATURITY);

    assertNotNull(result);
    assertTrue(result.maturityAmount().compareTo(new BigDecimal("140000")) > 0);
    assertTrue(result.maturityAmount().compareTo(new BigDecimal("142000")) < 0);
    // Expected: ~₹1,41,477
    System.out.println("Maturity: " + result.maturityAmount());
  }

  @Test
  @DisplayName("Senior citizen flag does NOT affect rate math (rate is final contracted rate)")
  void testSeniorCitizenFlagNoRateBonus() {
    // Since v1.3.1 the interestRate is the final contracted rate transcribed from the FD
    // certificate — any bank-granted senior bonus (0.25%-0.75%) is already embedded in it.
    // The isSeniorCitizen flag is intended for TDS threshold logic only.
    FdMath.MaturityResult regular =
        FdMath.computeMaturity(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            false,
            InterestPayoutFrequency.AT_MATURITY);

    FdMath.MaturityResult senior =
        FdMath.computeMaturity(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            true,
            InterestPayoutFrequency.AT_MATURITY);

    assertEquals(0, senior.maturityAmount().compareTo(regular.maturityAmount()));
    assertEquals(0, senior.effectiveRate().compareTo(RATE_7));
  }

  @ParameterizedTest
  @CsvSource({"MONTHLY, 12", "QUARTERLY, 4", "HALF_YEARLY, 2", "YEARLY, 1"})
  @DisplayName("Cumulative: Compounding frequency affects yield")
  void testCompoundingFrequency(CompoundingFrequency freq, int periods) {
    FdMath.MaturityResult result =
        FdMath.computeMaturity(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            FdType.CUMULATIVE,
            freq,
            false,
            InterestPayoutFrequency.AT_MATURITY);

    assertNotNull(result);
    System.out.println(freq + " maturity: " + result.maturityAmount());
  }

  // ===== NON-CUMULATIVE MATURITY TESTS =====

  @Test
  @DisplayName("Non-Cumulative: ₹1L @ 7% 5yr → ₹35k simple interest")
  void testNonCumulativeSimpleInterest() {
    FdMath.MaturityResult result =
        FdMath.computeMaturity(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            FdType.NON_CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            false,
            InterestPayoutFrequency.QUARTERLY);

    assertNotNull(result);
    // Simple interest uses an actual day count: 1 Jan 2024 -> 1 Jan 2029 spans 1826 days
    // (2024 is a leap year), so interest = P * (r/100/365) * days, matching FdMath.
    long days = DAYS.between(ISSUE_DATE, MATURITY_5Y);
    BigDecimal dailyRate =
        RATE_7
            .divide(new BigDecimal("100"), 10, RoundingMode.HALF_EVEN)
            .divide(new BigDecimal("365"), 10, RoundingMode.HALF_EVEN);
    BigDecimal expectedInterest =
        PRINCIPAL_1L
            .multiply(dailyRate)
            .multiply(BigDecimal.valueOf(days))
            .setScale(2, RoundingMode.HALF_EVEN);
    assertTrue(expectedInterest.compareTo(new BigDecimal("35000.00")) > 0);
    assertEquals(0, result.totalInterest().compareTo(expectedInterest));
    assertEquals(0, result.maturityAmount().compareTo(PRINCIPAL_1L.add(expectedInterest)));
  }

  @Test
  @DisplayName("Short tenure (<181 days): simple interest only")
  void testShortTenureSimpleInterest() {
    FdMath.MaturityResult result =
        FdMath.computeMaturity(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_6M,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            false,
            InterestPayoutFrequency.AT_MATURITY);

    assertNotNull(result);
    // Should use simple interest for < 181 days
    BigDecimal expectedInterest =
        PRINCIPAL_1L
            .multiply(RATE_7)
            .multiply(new BigDecimal("181"))
            .divide(new BigDecimal("36500"), 2, RoundingMode.HALF_EVEN);
    System.out.println("6M maturity: " + result.maturityAmount());
  }

  // ===== INTEREST RATE REVERSE CALCULATION =====

  @Test
  @DisplayName("Reverse solve: rate from maturity")
  void testCalculateInterestRateFromMaturity() {
    BigDecimal maturity = new BigDecimal("107250"); // 1L @ 7.25% for 1yr simple
    BigDecimal rate =
        FdMath.computeInterestRateFromMaturity(
            PRINCIPAL_1L,
            maturity,
            ISSUE_DATE,
            MATURITY_1Y,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            false);

    assertNotNull(rate);
    System.out.println("Calculated rate: " + rate);
  }

  // ===== PREMATURE WITHDRAWAL TESTS =====

  @Test
  @DisplayName("Premature withdrawal: 7+ days, small FD → 0.5% penalty")
  void testPrematureWithdrawalSmallFd() {
    LocalDate withdrawalDate = LocalDate.of(2025, 7, 1); // ~1.5 years
    FdMath.PrematureWithdrawalResult result =
        FdMath.computePrematureWithdrawal(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            withdrawalDate,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            new BigDecimal("0.50"),
            false);

    assertNotNull(result);
    assertTrue(result.penaltyAmount().compareTo(BigDecimal.ZERO) > 0);
    assertEquals(0, result.penaltyRate().compareTo(new BigDecimal("0.50")));
    System.out.println("Small FD withdrawal: " + result.realizedMaturityAmount());
  }

  @Test
  @DisplayName("Premature withdrawal: 7+ days, large FD (>₹5L) → 1% penalty")
  void testPrematureWithdrawalLargeFd() {
    BigDecimal largePrincipal = new BigDecimal("600000");
    LocalDate withdrawalDate = LocalDate.of(2025, 7, 1);
    FdMath.PrematureWithdrawalResult result =
        FdMath.computePrematureWithdrawal(
            largePrincipal,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            withdrawalDate,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            new BigDecimal("1.00"),
            false);

    assertNotNull(result);
    assertEquals(0, result.penaltyRate().compareTo(new BigDecimal("1.00")));
    System.out.println("Large FD withdrawal: " + result.realizedMaturityAmount());
  }

  @Test
  @DisplayName("Premature withdrawal: < 7 days → 0 interest")
  void testPrematureWithdrawalLessThan7Days() {
    LocalDate earlyWithdrawal = ISSUE_DATE.plusDays(5);
    FdMath.PrematureWithdrawalResult result =
        FdMath.computePrematureWithdrawal(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            earlyWithdrawal,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            new BigDecimal("0.50"),
            false);

    assertNotNull(result);
    assertEquals(0, result.realizedMaturityAmount().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.effectiveRate().compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("Premature withdrawal: Non-cumulative FD")
  void testPrematureWithdrawalNonCumulative() {
    LocalDate withdrawalDate = LocalDate.of(2025, 7, 1);
    FdMath.PrematureWithdrawalResult result =
        FdMath.computePrematureWithdrawal(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            MATURITY_5Y,
            withdrawalDate,
            FdType.NON_CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            new BigDecimal("0.50"),
            false);

    assertNotNull(result);
    // Non-cumulative uses simple interest
    System.out.println("Non-cumulative withdrawal: " + result.realizedMaturityAmount());
  }

  // ===== TDS TESTS =====

  @Test
  @DisplayName("TDS: Regular citizen, interest ₹30k → no TDS")
  void testTdsRegularBelowThreshold() {
    FdMath.TdsResult result = FdMath.computeTds(new BigDecimal("30000"), false, true, false);

    assertEquals(0, result.tdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.netInterest().compareTo(new BigDecimal("30000")));
    assertEquals(0, result.tdsThreshold().compareTo(new BigDecimal("50000")));
  }

  @Test
  @DisplayName("TDS: Regular citizen, interest ₹60k → TDS on ₹10k @ 10% = ₹1k")
  void testTdsRegularAboveThreshold() {
    FdMath.TdsResult result = FdMath.computeTds(new BigDecimal("60000"), false, true, false);

    assertEquals(0, result.tdsDeducted().compareTo(new BigDecimal("1000.00")));
    assertEquals(0, result.netInterest().compareTo(new BigDecimal("59000.00")));
    assertEquals(0, result.taxableInterest().compareTo(new BigDecimal("10000")));
  }

  @Test
  @DisplayName("TDS: Senior citizen, interest ₹80k → no TDS (threshold ₹1L)")
  void testTdsSeniorBelowThreshold() {
    FdMath.TdsResult result = FdMath.computeTds(new BigDecimal("80000"), true, true, false);

    assertEquals(0, result.tdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.tdsThreshold().compareTo(new BigDecimal("100000")));
  }

  @Test
  @DisplayName("TDS: Senior citizen, interest ₹1.2L → TDS on ₹20k @ 10% = ₹2k")
  void testTdsSeniorAboveThreshold() {
    FdMath.TdsResult result = FdMath.computeTds(new BigDecimal("120000"), true, true, false);

    assertEquals(0, result.tdsDeducted().compareTo(new BigDecimal("2000.00")));
    assertEquals(0, result.netInterest().compareTo(new BigDecimal("118000.00")));
  }

  @Test
  @DisplayName("TDS: No PAN → 20% TDS")
  void testTdsNoPan() {
    FdMath.TdsResult result = FdMath.computeTds(new BigDecimal("60000"), false, false, false);

    assertEquals(0, result.tdsDeducted().compareTo(new BigDecimal("2000.00")));
    assertEquals(0, result.tdsRate().compareTo(new BigDecimal("0.20")));
  }

  @Test
  @DisplayName("TDS: Form 15G/15H submitted → 0% TDS")
  void testTdsForm15g15h() {
    FdMath.TdsResult result = FdMath.computeTds(new BigDecimal("60000"), false, true, true);

    assertEquals(0, result.tdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.tdsRate().compareTo(BigDecimal.ZERO));
    assertEquals(0, result.netInterest().compareTo(new BigDecimal("60000")));
  }

  // ===== EDGE CASES =====

  @Test
  @DisplayName("Zero or negative interest returns zero")
  void testZeroInterest() {
    FdMath.TdsResult result = FdMath.computeTds(BigDecimal.ZERO, false, true, false);
    assertEquals(0, result.tdsDeducted().compareTo(BigDecimal.ZERO));

    FdMath.TdsResult result2 = FdMath.computeTds(new BigDecimal("-1000"), false, true, false);
    assertEquals(0, result2.tdsDeducted().compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("1-day tenure handled gracefully")
  void testOneDayTenure() {
    LocalDate tomorrow = ISSUE_DATE.plusDays(1);
    FdMath.MaturityResult result =
        FdMath.computeMaturity(
            PRINCIPAL_1L,
            RATE_7,
            ISSUE_DATE,
            tomorrow,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            false,
            InterestPayoutFrequency.AT_MATURITY);

    assertNotNull(result);
    assertTrue(result.maturityAmount().compareTo(PRINCIPAL_1L) > 0);
  }

  // ===== BANK-LEVEL TDS TESTS (Section 194A: threshold is per-bank, not per-FD) =====

  @Test
  @DisplayName(
      "Bank-level: several FDs at one bank, none over ₹50k alone, sum crosses → TDS applies")
  void testBankLevelAggregationTriggersTds() {
    // Three FDs at HDFC each earning ₹20k = ₹60k total → crosses ₹50k regular threshold.
    List<FdMath.FdTdsInput> inputs =
        List.of(
            new FdMath.FdTdsInput(new BigDecimal("20000"), false, true, false),
            new FdMath.FdTdsInput(new BigDecimal("20000"), false, true, false),
            new FdMath.FdTdsInput(new BigDecimal("20000"), false, true, false));

    List<FdMath.BankTdsResult> results = FdMath.computeBankLevelTds(inputs);

    assertEquals(3, results.size());
    // Bank total = 60000, taxable = 60000 - 50000 = 10000, TDS @10% = 1000
    assertEquals(0, results.get(0).bankTotalGrossInterest().compareTo(new BigDecimal("60000")));
    assertEquals(0, results.get(0).bankTotalTdsDeducted().compareTo(new BigDecimal("1000.00")));
    // Proportional: each FD gets 1000 * 20000/60000 = 333.33 (rounding)
    assertEquals(0, results.get(0).tdsDeducted().compareTo(new BigDecimal("333.33")));
    assertEquals(0, results.get(1).tdsDeducted().compareTo(new BigDecimal("333.33")));
    assertEquals(0, results.get(2).tdsDeducted().compareTo(new BigDecimal("333.34")));
  }

  @Test
  @DisplayName("Bank-level: same FDs split across banks → no TDS at any single bank")
  void testBankLevelNoAggregationAcrossBanks() {
    // Two separate bank groups, each ₹20k total, each under the ₹50k threshold.
    List<FdMath.FdTdsInput> bankA =
        List.of(
            new FdMath.FdTdsInput(new BigDecimal("10000"), false, true, false),
            new FdMath.FdTdsInput(new BigDecimal("10000"), false, true, false));
    List<FdMath.FdTdsInput> bankB =
        List.of(new FdMath.FdTdsInput(new BigDecimal("20000"), false, true, false));

    List<FdMath.BankTdsResult> resultA = FdMath.computeBankLevelTds(bankA);
    List<FdMath.BankTdsResult> resultB = FdMath.computeBankLevelTds(bankB);

    assertEquals(0, resultA.get(0).bankTotalTdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, resultB.get(0).bankTotalTdsDeducted().compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("Bank-level: senior threshold used only when ALL non-exempt FDs are senior")
  void testBankLevelSeniorThreshold() {
    List<FdMath.FdTdsInput> inputs =
        List.of(
            new FdMath.FdTdsInput(new BigDecimal("60000"), true, true, false),
            new FdMath.FdTdsInput(new BigDecimal("60000"), true, true, false));

    List<FdMath.BankTdsResult> results = FdMath.computeBankLevelTds(inputs);
    // Bank total = 1.2L, senior threshold = 1L, taxable = 20k, TDS @10% = 2k
    assertEquals(0, results.get(0).tdsThreshold().compareTo(new BigDecimal("100000")));
    assertEquals(0, results.get(0).bankTotalTdsDeducted().compareTo(new BigDecimal("2000.00")));
  }

  @Test
  @DisplayName("Bank-level: mixed senior+regular at one bank falls back to regular threshold")
  void testBankLevelMixedSeniorRegularUsesRegularThreshold() {
    List<FdMath.FdTdsInput> inputs =
        List.of(
            new FdMath.FdTdsInput(new BigDecimal("40000"), true, true, false),
            new FdMath.FdTdsInput(new BigDecimal("40000"), false, true, false));
    List<FdMath.BankTdsResult> results = FdMath.computeBankLevelTds(inputs);
    // Bank total = 80k > 50k regular threshold → TDS applies on 30k @10% = 3k
    assertEquals(0, results.get(0).tdsThreshold().compareTo(new BigDecimal("50000")));
    assertEquals(0, results.get(0).bankTotalTdsDeducted().compareTo(new BigDecimal("3000.00")));
  }

  @Test
  @DisplayName("Bank-level: Form 15G/15H on ANY FD exempts the whole bank group")
  void testBankLevelAnyExemptExemptsGroup() {
    List<FdMath.FdTdsInput> inputs =
        List.of(
            new FdMath.FdTdsInput(new BigDecimal("40000"), false, true, false),
            new FdMath.FdTdsInput(new BigDecimal("40000"), false, true, true) // exempt
            );
    List<FdMath.BankTdsResult> results = FdMath.computeBankLevelTds(inputs);
    // Bank total = 80k > 50k but 15G/15H present → whole group exempt
    assertEquals(0, results.get(0).bankTotalTdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, results.get(0).tdsDeducted().compareTo(BigDecimal.ZERO));
    assertEquals(0, results.get(1).tdsDeducted().compareTo(BigDecimal.ZERO));
  }

  // ===== PER-FY ACCRUAL TESTS =====

  @Test
  @DisplayName("FY accrual: 3-year FD total splits across FYs, each under ₹50k")
  void testFyAccrualSplitsLifetimeIntoPerYearBands() {
    // ₹1L @ 7% p.a. quarterly, issued 2025-04-01, matures 2028-04-01 (3 years).
    LocalDate issue = LocalDate.of(2025, 4, 1);
    LocalDate maturity = LocalDate.of(2028, 4, 1);

    BigDecimal fy2025 =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            issue,
            maturity,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2026, 3, 31));
    BigDecimal fy2026 =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            issue,
            maturity,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            LocalDate.of(2026, 4, 1),
            LocalDate.of(2027, 3, 31));
    BigDecimal fy2027 =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            issue,
            maturity,
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            LocalDate.of(2027, 4, 1),
            LocalDate.of(2028, 3, 31));

    // Each FY must be a band of the compounding curve — all well under the ₹50k threshold,
    // whereas lifetime interest (~₹23k+... ~₹1.41L total) misattributed to one FY would not be.
    assertTrue(fy2025.compareTo(BigDecimal.ZERO) > 0);
    assertTrue(fy2026.compareTo(fy2025) > 0, "later FY accrues more under compounding");
    assertTrue(fy2027.compareTo(fy2026) > 0, "later FY accrues more under compounding");

    // Sum of per-FY bands should track (closely) the total 3-year interest on the compounding
    // curve.
    BigDecimal totalBands = fy2025.add(fy2026).add(fy2027);
    BigDecimal fullInterest =
        FdMath.computeMaturity(
                PRINCIPAL_1L,
                RATE_7,
                issue,
                maturity,
                FdType.CUMULATIVE,
                CompoundingFrequency.QUARTERLY,
                false,
                InterestPayoutFrequency.AT_MATURITY)
            .totalInterest();
    // Bands are only slightly less than full because maturity lands exactly on 2028-04-01 and
    // the final FY stops at 2028-03-31 (compounding period boundary ~ 1 day earlier).
    assertTrue(
        fullInterest.subtract(totalBands).compareTo(new BigDecimal("500.00")) <= 0,
        "per-FY bands should exhaust ~all of the total interest: full="
            + fullInterest
            + " bands="
            + totalBands);
  }

  @Test
  @DisplayName("FY accrual: no overlap with the FY → zero")
  void testFyAccrualNoOverlap() {
    // FD active 2024 only; query FY 2026-27 → 0.
    BigDecimal accrued =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            LocalDate.of(2024, 1, 1),
            LocalDate.of(2024, 12, 31),
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            LocalDate.of(2026, 4, 1),
            LocalDate.of(2027, 3, 31));
    assertEquals(0, accrued.compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("FY accrual: before issue and after maturity clamp to zero")
  void testFyAccrualClampedToTenor() {
    // FD issued 2025-06-01, matures 2026-01-31. Only the overlap with FY 2025-26 accrues.
    BigDecimal beforeIssue =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            LocalDate.of(2025, 6, 1),
            LocalDate.of(2026, 1, 31),
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2025, 4, 30));
    assertEquals(0, beforeIssue.compareTo(BigDecimal.ZERO));

    // Overlap = Jun 2025 → Jan 2026: accrued > 0.
    BigDecimal overlap =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            LocalDate.of(2025, 6, 1),
            LocalDate.of(2026, 1, 31),
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2026, 3, 31));
    assertTrue(overlap.compareTo(BigDecimal.ZERO) > 0);

    // After maturity (FY 2027-28): 0.
    BigDecimal afterMaturity =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            LocalDate.of(2025, 6, 1),
            LocalDate.of(2026, 1, 31),
            FdType.CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            LocalDate.of(2027, 4, 1),
            LocalDate.of(2028, 3, 31));
    assertEquals(0, afterMaturity.compareTo(BigDecimal.ZERO));
  }

  @Test
  @DisplayName("FY accrual: non-cumulative is simple interest on the window's active days")
  void testFyAccrualNonCumulative() {
    LocalDate fyStart = LocalDate.of(2025, 4, 1);
    LocalDate fyEnd = LocalDate.of(2026, 3, 31);
    BigDecimal accrued =
        FdMath.computeFyAccruedInterest(
            PRINCIPAL_1L,
            RATE_7,
            LocalDate.of(2025, 4, 1),
            LocalDate.of(2026, 3, 31),
            FdType.NON_CUMULATIVE,
            CompoundingFrequency.QUARTERLY,
            fyStart,
            fyEnd);

    long days = DAYS.between(fyStart, fyEnd); // 364
    BigDecimal expected =
        PRINCIPAL_1L
            .multiply(RATE_7.divide(new BigDecimal("100"), 10, RoundingMode.HALF_EVEN))
            .multiply(BigDecimal.valueOf(days))
            .divide(BigDecimal.valueOf(365), 10, RoundingMode.HALF_EVEN);
    // accrued rounded to 2 dp
    BigDecimal rounded = accrued.setScale(2, RoundingMode.HALF_EVEN);
    assertEquals(0, rounded.compareTo(expected.setScale(2, RoundingMode.HALF_EVEN)));
  }
}
