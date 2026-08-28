package com.urva.myfinance.coinTrack.fixeddeposit.util;

import com.urva.myfinance.coinTrack.fixeddeposit.model.CompoundingFrequency;
import com.urva.myfinance.coinTrack.fixeddeposit.model.FdType;
import com.urva.myfinance.coinTrack.fixeddeposit.model.InterestPayoutFrequency;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

public final class FdMath {

  private static final BigDecimal HUNDRED = new BigDecimal("100");
  private static final int SCALE = 10;
  private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
  private static final int SIMPLE_INTEREST_THRESHOLD_DAYS = 181;
  private static final int DAYS_IN_YEAR = 365;

  private static final BigDecimal TDS_THRESHOLD_REGULAR = new BigDecimal("50000");
  private static final BigDecimal TDS_THRESHOLD_SENIOR = new BigDecimal("100000");
  private static final BigDecimal TDS_RATE_WITH_PAN = new BigDecimal("0.10");
  private static final BigDecimal TDS_RATE_WITHOUT_PAN = new BigDecimal("0.20");

  private FdMath() {}

  /**
   * Per-FD TDS input used by {@link #computeBankLevelTds}. Represents one FD's contribution to its
   * bank's aggregate TDS computation for a financial year.
   */
  public record FdTdsInput(
      BigDecimal grossInterest,
      boolean isSeniorCitizen,
      boolean hasPan,
      boolean form15g15hSubmitted) {}

  /**
   * Bank-level TDS result for a single FD, enriched with the bank's aggregate context so a caller
   * can explain WHY a threshold was crossed (the threshold is per-bank, not per-FD).
   */
  public record BankTdsResult(
      BigDecimal grossInterest,
      BigDecimal tdsThreshold,
      BigDecimal taxableInterest,
      BigDecimal tdsRate,
      BigDecimal tdsDeducted,
      BigDecimal netInterest,
      BigDecimal bankTotalGrossInterest,
      BigDecimal bankTaxableInterest,
      BigDecimal bankTotalTdsDeducted) {}

  public record MaturityResult(
      BigDecimal maturityAmount, BigDecimal totalInterest, BigDecimal effectiveRate) {}

  public record PrematureWithdrawalResult(
      BigDecimal contractedMaturityAmount,
      BigDecimal realizedMaturityAmount,
      BigDecimal penaltyAmount,
      BigDecimal contractedRate,
      BigDecimal applicableRate,
      BigDecimal penaltyRate,
      BigDecimal effectiveRate,
      long actualTenorDays,
      BigDecimal interestEarned) {}

  public record TdsResult(
      BigDecimal grossInterest,
      BigDecimal tdsThreshold,
      BigDecimal taxableInterest,
      BigDecimal tdsRate,
      BigDecimal tdsDeducted,
      BigDecimal netInterest) {}

  /**
   * Bank-level TDS aggregation per Section 194A.
   *
   * <p>The ₹50,000 / ₹1,00,000 threshold applies to the TOTAL interest a person earns from ALL FDs
   * at the SAME bank (payer) in a financial year — not to each FD individually. This method groups
   * the FDs of one bank, checks the threshold against the summed gross interest, and (when TDS is
   * triggered) distributes the deduction back to each FD proportionally to its own gross interest.
   *
   * <p>Semantics (per household-tracker behaviour):
   *
   * <ul>
   *   <li><b>15G/15H exemption is bank-level</b> — a declaration covers all deposits at the payer.
   *       If ANY FD at the bank is flagged exempt, the whole bank group is exempt.
   *   <li><b>Senior threshold</b> — used only when every non-exempt FD at the bank is flagged
   *       senior (a homogeneous group); otherwise the regular threshold applies.
   *   <li><b>Proportional split</b> is computed AFTER the exemption, so exempted FDs contribute
   *       their interest to the group total for threshold-crossing but receive no TDS share.
   * </ul>
   */
  public static List<BankTdsResult> computeBankLevelTds(List<FdTdsInput> fds) {
    if (fds == null || fds.isEmpty()) {
      return List.of();
    }

    boolean anyExempt = fds.stream().anyMatch(FdTdsInput::form15g15hSubmitted);
    boolean allNonExemptSenior =
        fds.stream().filter(fd -> !fd.form15g15hSubmitted()).allMatch(FdTdsInput::isSeniorCitizen);

    BigDecimal threshold = allNonExemptSenior ? TDS_THRESHOLD_SENIOR : TDS_THRESHOLD_REGULAR;

    BigDecimal bankGross = BigDecimal.ZERO;
    for (FdTdsInput fd : fds) {
      if (fd.grossInterest() != null && fd.grossInterest().compareTo(BigDecimal.ZERO) > 0) {
        bankGross = bankGross.add(fd.grossInterest());
      }
    }

    BigDecimal bankTaxable = anyExempt ? BigDecimal.ZERO : bankGross.subtract(threshold);
    if (bankTaxable.compareTo(BigDecimal.ZERO) < 0) {
      bankTaxable = BigDecimal.ZERO;
    }

    BigDecimal bankTdsDeducted = BigDecimal.ZERO;
    if (bankTaxable.compareTo(BigDecimal.ZERO) > 0) {
      // Single rate for the group: without PAN takes priority (20%) over with PAN (10%).
      boolean groupHasPan = fds.stream().allMatch(FdTdsInput::hasPan);
      BigDecimal tdsRate = groupHasPan ? TDS_RATE_WITH_PAN : TDS_RATE_WITHOUT_PAN;
      bankTdsDeducted = bankTaxable.multiply(tdsRate).setScale(2, ROUNDING);
    }

    List<BankTdsResult> results = new ArrayList<>();
    BigDecimal allocatedSum = BigDecimal.ZERO;
    int lastAllocatableIndex = -1;
    for (int i = 0; i < fds.size(); i++) {
      FdTdsInput fd = fds.get(i);
      BigDecimal gross = fd.grossInterest() != null ? fd.grossInterest() : BigDecimal.ZERO;
      if (gross.compareTo(BigDecimal.ZERO) <= 0) {
        results.add(
            buildBankTdsResult(
                gross,
                threshold,
                bankGross,
                bankTaxable,
                bankTdsDeducted,
                BigDecimal.ZERO,
                BigDecimal.ZERO));
        continue;
      }

      boolean allocatable = false;
      BigDecimal share;
      BigDecimal tdsRate;
      if (anyExempt || bankTdsDeducted.compareTo(BigDecimal.ZERO) == 0) {
        share = BigDecimal.ZERO;
        tdsRate = BigDecimal.ZERO;
      } else {
        boolean hasPan = fd.hasPan();
        tdsRate = hasPan ? TDS_RATE_WITH_PAN : TDS_RATE_WITHOUT_PAN;
        // Proportional to gross interest within the (non-exempt) bank group.
        share = bankTdsDeducted.multiply(gross).divide(bankGross, 2, ROUNDING);
        allocatable = true;
        lastAllocatableIndex = i;
      }

      results.add(
          buildBankTdsResult(
              gross, threshold, bankGross, bankTaxable, bankTdsDeducted, share, tdsRate));
      if (allocatable) {
        allocatedSum = allocatedSum.add(share.setScale(2, ROUNDING));
      }
    }

    // Rounding remainder correction: make the per-FD deductions reconcile exactly with the
    // bank total (otherwise an individual's TDS lines would not sum to the bank disclosed).
    if (lastAllocatableIndex >= 0) {
      FdMath.BankTdsResult last = results.get(lastAllocatableIndex);
      BigDecimal delta = bankTdsDeducted.subtract(allocatedSum);
      BigDecimal tdsDeducted =
          last.tdsDeducted().add(delta).max(BigDecimal.ZERO).setScale(2, ROUNDING);
      BigDecimal net =
          last.netInterest().subtract(delta).max(BigDecimal.ZERO).setScale(2, ROUNDING);
      results.set(
          lastAllocatableIndex,
          new BankTdsResult(
              last.grossInterest(),
              last.tdsThreshold(),
              last.bankTaxableInterest(),
              last.tdsRate(),
              tdsDeducted,
              net,
              last.bankTotalGrossInterest(),
              last.bankTaxableInterest(),
              last.bankTotalTdsDeducted()));
    }

    return results;
  }

  private static BankTdsResult buildBankTdsResult(
      BigDecimal gross,
      BigDecimal threshold,
      BigDecimal bankGross,
      BigDecimal bankTaxable,
      BigDecimal bankTdsDeducted,
      BigDecimal share,
      BigDecimal tdsRate) {

    BigDecimal tdsDeducted = share.setScale(2, ROUNDING);
    BigDecimal net = gross.subtract(tdsDeducted).max(BigDecimal.ZERO).setScale(2, ROUNDING);
    return new BankTdsResult(
        gross.setScale(2, ROUNDING),
        threshold,
        bankTaxable.setScale(2, ROUNDING),
        tdsRate,
        tdsDeducted,
        net,
        bankGross.setScale(2, ROUNDING),
        bankTaxable.setScale(2, ROUNDING),
        bankTdsDeducted.setScale(2, ROUNDING));
  }

  public static MaturityResult computeMaturity(
      BigDecimal principal,
      BigDecimal ratePercent,
      LocalDate issueDate,
      LocalDate maturityDate,
      FdType fdType,
      CompoundingFrequency compoundingFreq,
      boolean isSeniorCitizen,
      InterestPayoutFrequency payoutFreq) {

    if (principal == null || ratePercent == null || issueDate == null || maturityDate == null) {
      throw new IllegalArgumentException("Required parameters cannot be null");
    }

    long totalDays = ChronoUnit.DAYS.between(issueDate, maturityDate);
    if (totalDays <= 0) {
      throw new IllegalArgumentException("Maturity date must be after issue date");
    }

    // The interestRate is the final contracted rate the user transcribed from the FD
    // certificate. Any senior-citizen bonus (0.25%–0.75%, bank-dependent) is already
    // embedded in that printed rate, so no separate bonus is added here. The
    // isSeniorCitizen flag is used only for TDS threshold logic, not for rate math.
    BigDecimal effectiveRatePercent = ratePercent;

    BigDecimal totalInterest;

    if (fdType == FdType.NON_CUMULATIVE) {
      totalInterest = computeNonCumulativeInterest(principal, effectiveRatePercent, totalDays);
    } else {
      totalInterest =
          computeCumulativeInterest(principal, effectiveRatePercent, totalDays, compoundingFreq);
    }

    BigDecimal maturityAmount = principal.add(totalInterest);

    return new MaturityResult(
        maturityAmount.setScale(2, ROUNDING),
        totalInterest.setScale(2, ROUNDING),
        effectiveRatePercent.setScale(2, ROUNDING));
  }

  /**
   * Interest accrued by an FD within a single financial year (April:start → March:end).
   *
   * <p>TDS (194A) is a per-FY obligation: the interest contributed to a bank-and-holder group in FY
   * X is only the interest ACCRUED within that FY's window, not the FD's lifetime interest. For an
   * FD spanning multiple financial years, using lifetime interest would wrongly attribute it all to
   * whichever FY is queried and push it over the exemption threshold every year.
   *
   * <p>Accrual basis:
   *
   * <ul>
   *   <li><b>Cumulative</b> — interest is credited on accrual. The accrued value tracks the
   *       compounding curve, so window accrual = value(fyEnd) − value(fyStart), each value computed
   *       by the standard compounding engine up to that date.
   *   <li><b>Non-cumulative</b> — interest is paid out (cash basis) as simple interest on
   *       principal; window accrual = simple interest on the FDs active days within the FY.
   * </ul>
   *
   * <p>The window is clamped to the FD's actual active span (issue → maturity, or issue →
   * premature-withdrawal date), so no interest is accrued before issue, after maturity, or after
   * withdrawal.
   *
   * @param principal issue amount
   * @param ratePercent contracted annual rate (% p.a.)
   * @param issueDate FD issue date
   * @param endDate FD end date (maturity) — during premature withdrawal, the realized/withdrawal
   *     date should be passed here instead
   * @param fdType CUMULATIVE or NON_CUMULATIVE
   * @param compoundingFreq compounding frequency (ignored for NON_CUMULATIVE)
   * @param fyStart inclusive start of the financial year (April 1)
   * @param fyEnd inclusive end of the financial year (March 31)
   * @return interest accrued within [fyStart, fyEnd] that falls inside [issueDate, endDate]
   */
  public static BigDecimal computeFyAccruedInterest(
      BigDecimal principal,
      BigDecimal ratePercent,
      LocalDate issueDate,
      LocalDate endDate,
      FdType fdType,
      CompoundingFrequency compoundingFreq,
      LocalDate fyStart,
      LocalDate fyEnd) {

    if (principal == null
        || ratePercent == null
        || issueDate == null
        || endDate == null
        || fyStart == null
        || fyEnd == null) {
      throw new IllegalArgumentException("Required parameters cannot be null");
    }
    if (fyStart.isAfter(fyEnd)) {
      throw new IllegalArgumentException("fyStart must not be after fyEnd");
    }

    // Window over which this FD is active: overlap of [issueDate, endDate] and [fyStart, fyEnd].
    LocalDate activeStart = issueDate.isAfter(fyStart) ? issueDate : fyStart;
    LocalDate activeEnd = endDate.isBefore(fyEnd) ? endDate : fyEnd;

    // Fiscal year + FD tenure do not overlap at all → no accrual in this FY.
    if (activeEnd.isBefore(activeStart)) {
      return BigDecimal.ZERO;
    }

    if (fdType == FdType.NON_CUMULATIVE) {
      // Cash basis: simple interest on the days active within the FY.
      long days = ChronoUnit.DAYS.between(activeStart, activeEnd);
      return computeSimpleInterest(principal, ratePercent, days);
    }

    // Cumulative: value(end of window) − value(start of window), following the compounding
    // curve. Compute the accrued value via the standard maturity engine up to each boundary.
    BigDecimal valueAtStart =
        computeAccruedValue(principal, ratePercent, issueDate, activeStart, compoundingFreq);
    BigDecimal valueAtEnd =
        computeAccruedValue(principal, ratePercent, issueDate, activeEnd, compoundingFreq);

    BigDecimal accrued = valueAtEnd.subtract(valueAtStart);
    return accrued.max(BigDecimal.ZERO).setScale(2, ROUNDING);
  }

  /**
   * Accrued maturity value of an FD's principal + interest up to a given date, following the
   * compounding curve. Calendar-day math is used for a partial final period (the same broken-day
   * treatment as {@link #computeMaturity}). Before issue, the value is just the principal.
   */
  private static BigDecimal computeAccruedValue(
      BigDecimal principal,
      BigDecimal ratePercent,
      LocalDate issueDate,
      LocalDate date,
      CompoundingFrequency compoundingFreq) {

    if (!date.isAfter(issueDate)) {
      return principal;
    }
    long days = ChronoUnit.DAYS.between(issueDate, date);
    int n = compoundingFreq.getPeriodsPerYear();
    BigDecimal rateDecimal = ratePercent.divide(HUNDRED, SCALE, ROUNDING);
    BigDecimal periodicRate = rateDecimal.divide(BigDecimal.valueOf(n), SCALE, ROUNDING);

    long fullYears = days / DAYS_IN_YEAR;
    int remainingDays = (int) (days % DAYS_IN_YEAR);
    int fullPeriodsInRemaining = (remainingDays * n) / DAYS_IN_YEAR;
    int brokenDays = remainingDays - (fullPeriodsInRemaining * DAYS_IN_YEAR / n);

    long totalPeriods = fullYears * n + fullPeriodsInRemaining;
    BigDecimal factor = BigDecimal.ONE.add(periodicRate);
    BigDecimal compoundFactor = BigDecimal.ONE;
    for (int i = 0; i < totalPeriods; i++) {
      compoundFactor = compoundFactor.multiply(factor).setScale(SCALE, ROUNDING);
    }

    BigDecimal amountAfterFullPeriods = principal.multiply(compoundFactor);
    if (brokenDays > 0) {
      BigDecimal dailyRate = rateDecimal.divide(BigDecimal.valueOf(DAYS_IN_YEAR), SCALE, ROUNDING);
      BigDecimal brokenInterest =
          amountAfterFullPeriods.multiply(dailyRate).multiply(BigDecimal.valueOf(brokenDays));
      return amountAfterFullPeriods.add(brokenInterest);
    }
    return amountAfterFullPeriods;
  }

  private static BigDecimal computeCumulativeInterest(
      BigDecimal principal,
      BigDecimal ratePercent,
      long totalDays,
      CompoundingFrequency compoundingFreq) {

    if (totalDays < SIMPLE_INTEREST_THRESHOLD_DAYS) {
      return computeSimpleInterest(principal, ratePercent, totalDays);
    }

    int n = compoundingFreq.getPeriodsPerYear();
    BigDecimal rateDecimal = ratePercent.divide(HUNDRED, SCALE, ROUNDING);
    BigDecimal periodicRate = rateDecimal.divide(BigDecimal.valueOf(n), SCALE, ROUNDING);

    long fullYears = totalDays / DAYS_IN_YEAR;
    int remainingDays = (int) (totalDays % DAYS_IN_YEAR);
    int fullPeriodsInRemaining = (remainingDays * n) / DAYS_IN_YEAR;
    int brokenDays = remainingDays - (fullPeriodsInRemaining * DAYS_IN_YEAR / n);

    long totalPeriods = fullYears * n + fullPeriodsInRemaining;

    BigDecimal factor = BigDecimal.ONE.add(periodicRate);
    BigDecimal compoundFactor = BigDecimal.ONE;

    for (int i = 0; i < totalPeriods; i++) {
      compoundFactor = compoundFactor.multiply(factor).setScale(SCALE, ROUNDING);
    }

    BigDecimal amountAfterFullPeriods = principal.multiply(compoundFactor);

    BigDecimal totalInterest;
    if (brokenDays > 0) {
      BigDecimal dailyRate = rateDecimal.divide(BigDecimal.valueOf(DAYS_IN_YEAR), SCALE, ROUNDING);
      BigDecimal brokenInterest =
          amountAfterFullPeriods.multiply(dailyRate).multiply(BigDecimal.valueOf(brokenDays));
      totalInterest = amountAfterFullPeriods.add(brokenInterest).subtract(principal);
    } else {
      totalInterest = amountAfterFullPeriods.subtract(principal);
    }

    return totalInterest.setScale(2, ROUNDING);
  }

  private static BigDecimal computeNonCumulativeInterest(
      BigDecimal principal, BigDecimal ratePercent, long totalDays) {

    BigDecimal rateDecimal = ratePercent.divide(HUNDRED, SCALE, ROUNDING);
    BigDecimal dailyRate = rateDecimal.divide(BigDecimal.valueOf(DAYS_IN_YEAR), SCALE, ROUNDING);
    BigDecimal interest = principal.multiply(dailyRate).multiply(BigDecimal.valueOf(totalDays));
    return interest.setScale(2, ROUNDING);
  }

  private static BigDecimal computeSimpleInterest(
      BigDecimal principal, BigDecimal ratePercent, long days) {
    BigDecimal rateDecimal = ratePercent.divide(HUNDRED, SCALE, ROUNDING);
    BigDecimal dailyRate = rateDecimal.divide(BigDecimal.valueOf(DAYS_IN_YEAR), SCALE, ROUNDING);
    return principal.multiply(dailyRate).multiply(BigDecimal.valueOf(days)).setScale(2, ROUNDING);
  }

  public static PrematureWithdrawalResult computePrematureWithdrawal(
      BigDecimal principal,
      BigDecimal contractedRate,
      LocalDate issueDate,
      LocalDate maturityDate,
      LocalDate withdrawalDate,
      FdType fdType,
      CompoundingFrequency compoundingFreq,
      BigDecimal penaltyRate,
      boolean isSeniorCitizen) {

    if (withdrawalDate.isBefore(issueDate) || withdrawalDate.isAfter(maturityDate)) {
      throw new IllegalArgumentException(
          "Withdrawal date must be between issue date and maturity date");
    }

    long actualTenorDays = ChronoUnit.DAYS.between(issueDate, withdrawalDate);
    long totalTenorDays = ChronoUnit.DAYS.between(issueDate, maturityDate);

    if (actualTenorDays < 7) {
      MaturityResult zeroResult =
          computeMaturity(
              principal,
              contractedRate,
              issueDate,
              withdrawalDate,
              fdType,
              compoundingFreq,
              isSeniorCitizen,
              InterestPayoutFrequency.AT_MATURITY);
      return new PrematureWithdrawalResult(
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          contractedRate,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          actualTenorDays,
          BigDecimal.ZERO);
    }

    BigDecimal applicableRatePercent = contractedRate;

    MaturityResult fullMaturity =
        computeMaturity(
            principal,
            contractedRate,
            issueDate,
            maturityDate,
            fdType,
            compoundingFreq,
            isSeniorCitizen,
            InterestPayoutFrequency.AT_MATURITY);

    MaturityResult actualMaturity =
        computeMaturity(
            principal,
            contractedRate,
            issueDate,
            withdrawalDate,
            fdType,
            compoundingFreq,
            isSeniorCitizen,
            InterestPayoutFrequency.AT_MATURITY);

    BigDecimal effectiveRatePercent = applicableRatePercent.subtract(penaltyRate);
    if (effectiveRatePercent.compareTo(BigDecimal.ZERO) < 0) {
      effectiveRatePercent = BigDecimal.ZERO;
    }

    BigDecimal realizedMaturity =
        computeWithPenalty(
            principal, effectiveRatePercent, actualTenorDays, fdType, compoundingFreq);

    BigDecimal penaltyAmount = fullMaturity.maturityAmount().subtract(realizedMaturity);
    if (penaltyAmount.compareTo(BigDecimal.ZERO) < 0) {
      penaltyAmount = BigDecimal.ZERO;
    }

    BigDecimal interestEarned = realizedMaturity.subtract(principal);
    if (interestEarned.compareTo(BigDecimal.ZERO) < 0) {
      interestEarned = BigDecimal.ZERO;
    }

    return new PrematureWithdrawalResult(
        fullMaturity.maturityAmount(),
        realizedMaturity.setScale(2, ROUNDING),
        penaltyAmount.setScale(2, ROUNDING),
        contractedRate,
        applicableRatePercent,
        penaltyRate,
        effectiveRatePercent,
        actualTenorDays,
        interestEarned.setScale(2, ROUNDING));
  }

  private static BigDecimal computeWithPenalty(
      BigDecimal principal,
      BigDecimal effectiveRatePercent,
      long actualTenorDays,
      FdType fdType,
      CompoundingFrequency compoundingFreq) {

    if (fdType == FdType.NON_CUMULATIVE) {
      return principal.add(
          computeNonCumulativeInterest(principal, effectiveRatePercent, actualTenorDays));
    } else {
      if (actualTenorDays < SIMPLE_INTEREST_THRESHOLD_DAYS) {
        return principal.add(
            computeSimpleInterest(principal, effectiveRatePercent, actualTenorDays));
      }
      BigDecimal interest =
          computeCumulativeInterest(
              principal, effectiveRatePercent, actualTenorDays, compoundingFreq);
      return principal.add(interest);
    }
  }

  public static TdsResult computeTds(
      BigDecimal annualInterest,
      boolean isSeniorCitizen,
      boolean hasPan,
      boolean form15g15hSubmitted) {

    if (annualInterest == null || annualInterest.compareTo(BigDecimal.ZERO) <= 0) {
      return new TdsResult(
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO);
    }

    BigDecimal threshold = isSeniorCitizen ? TDS_THRESHOLD_SENIOR : TDS_THRESHOLD_REGULAR;

    if (form15g15hSubmitted) {
      return new TdsResult(
          annualInterest.setScale(2, ROUNDING),
          threshold,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          annualInterest.setScale(2, ROUNDING));
    }

    BigDecimal taxableInterest = annualInterest.subtract(threshold);
    if (taxableInterest.compareTo(BigDecimal.ZERO) <= 0) {
      return new TdsResult(
          annualInterest.setScale(2, ROUNDING),
          threshold,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          BigDecimal.ZERO,
          annualInterest.setScale(2, ROUNDING));
    }

    BigDecimal tdsRate = hasPan ? TDS_RATE_WITH_PAN : TDS_RATE_WITHOUT_PAN;
    BigDecimal tdsDeducted = taxableInterest.multiply(tdsRate).setScale(2, ROUNDING);
    BigDecimal netInterest = annualInterest.subtract(tdsDeducted).setScale(2, ROUNDING);

    return new TdsResult(
        annualInterest.setScale(2, ROUNDING),
        threshold,
        taxableInterest.setScale(2, ROUNDING),
        tdsRate,
        tdsDeducted,
        netInterest);
  }

  public static BigDecimal computeInterestRateFromMaturity(
      BigDecimal principal,
      BigDecimal maturityAmount,
      LocalDate issueDate,
      LocalDate maturityDate,
      FdType fdType,
      CompoundingFrequency compoundingFreq,
      boolean isSeniorCitizen) {

    if (principal == null || maturityAmount == null || issueDate == null || maturityDate == null) {
      throw new IllegalArgumentException("Required parameters cannot be null");
    }

    if (maturityAmount.compareTo(principal) <= 0) {
      return BigDecimal.ZERO;
    }

    long totalDays = ChronoUnit.DAYS.between(issueDate, maturityDate);
    if (totalDays <= 0) {
      throw new IllegalArgumentException("Maturity date must be after issue date");
    }

    BigDecimal low = BigDecimal.ZERO;
    BigDecimal high = new BigDecimal("20.00");
    BigDecimal mid;
    BigDecimal computedMaturity;

    for (int i = 0; i < 60; i++) {
      mid = low.add(high).divide(BigDecimal.valueOf(2), SCALE, ROUNDING);
      MaturityResult result =
          computeMaturity(
              principal,
              mid,
              issueDate,
              maturityDate,
              fdType,
              compoundingFreq,
              isSeniorCitizen,
              InterestPayoutFrequency.AT_MATURITY);
      computedMaturity = result.maturityAmount();

      int cmp = computedMaturity.compareTo(maturityAmount);
      if (cmp == 0) {
        return mid.setScale(2, ROUNDING);
      } else if (cmp < 0) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return low.add(high).divide(BigDecimal.valueOf(2), SCALE, ROUNDING).setScale(2, ROUNDING);
  }

  public static long computeDaysBetween(LocalDate start, LocalDate end) {
    return ChronoUnit.DAYS.between(start, end);
  }

  public static boolean isTaxSaverEligible(int tenureYears) {
    return tenureYears == 5;
  }
}
