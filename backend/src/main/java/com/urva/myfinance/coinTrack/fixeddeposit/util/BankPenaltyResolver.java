package com.urva.myfinance.coinTrack.fixeddeposit.util;

import java.math.BigDecimal;
import java.util.Locale;

/**
 * Resolves a default premature-withdrawal penalty rate (in percentage points)
 * from an FD's bank/institution name, issue amount and (optionally) the tenor
 * actually held in days.
 *
 * <p>This is the server-side mirror of the frontend {@code bankPenalty} map. The
 * UI always sends a {@code penaltyRateOverride} for the interactive Withdraw
 * dialog; this resolver serves as the fallback for raw API calls so a request
 * with no override still resolves a sensible, bank-aware default instead of a
 * blanket amount-tier rate.
 *
 * <p>Resolution order: curated override for well-known issuers (from official
 * bank T&C / policy pages) → category classifier for the long tail of
 * co-operative / small-finance / gramin / payments / post-office / NBFC names
 * → amount-tier fallback (0.50% up to ₹5L, 1.00% above).
 */
public final class BankPenaltyResolver {

  private static final BigDecimal PENALTY_0 = new BigDecimal("0.00");
  private static final BigDecimal PENALTY_0_5 = new BigDecimal("0.50");
  private static final BigDecimal PENALTY_0_75 = new BigDecimal("0.75");
  private static final BigDecimal PENALTY_1 = new BigDecimal("1.00");
  private static final BigDecimal PENALTY_1_5 = new BigDecimal("1.50");
  private static final BigDecimal PENALTY_2 = new BigDecimal("2.00");
  private static final BigDecimal PENALTY_3 = new BigDecimal("3.00");
  private static final BigDecimal FIVE_LAKH = new BigDecimal("500000");

  private BankPenaltyResolver() {}

  /**
   * Resolve the default penalty in percentage points.
   *
   * @param place institution name as stored on the FD (may be null/blank)
   * @param issueAmount FD principal (may be null)
   * @param actualTenorDays days held before early redemption, or null if unknown
   * @return penalty rate in points (0.00–3.00)
   */
  public static BigDecimal resolve(String place, BigDecimal issueAmount, Long actualTenorDays) {
    BigDecimal amount = issueAmount != null ? issueAmount : BigDecimal.ZERO;
    String n = normalize(place);
    BigDecimal override = override(n, amount, actualTenorDays);
    if (override != null) {
      return override;
    }
    BigDecimal category = category(n);
    if (category != null) {
      return category;
    }
    return amount.compareTo(FIVE_LAKH) > 0 ? PENALTY_1 : PENALTY_0_5;
  }

  private static String normalize(String place) {
    if (place == null) return "";
    return place.trim().toLowerCase(Locale.ROOT);
  }

  /** Curated, sourced overrides — first match wins (most specific listed first). */
  private static BigDecimal override(String n, BigDecimal issueAmount, Long tenorDays) {
    if (containsAny(n, "state bank of india", "sbi")) {
      return issueAmount.compareTo(FIVE_LAKH) > 0 ? PENALTY_1 : PENALTY_0_5;
    }
    if (containsAny(n, "post office", "india post", "general post", "postal", "potd", "gpox")) {
      return PENALTY_2;
    }
    if (containsAny(n, "hdfc bank")) {
      return PENALTY_1;
    }
    if (containsAny(n, "hdfc ltd", "hdfc limited", "housing development finance")) {
      return PENALTY_1_5;
    }
    if (containsAny(n, "icici")) {
      return tenorDays != null && tenorDays < 365 ? PENALTY_0_5 : PENALTY_1;
    }
    if (containsAny(n, "axis bank")) {
      return PENALTY_1;
    }
    if (containsAny(n, "kotak")) {
      if (tenorDays == null) return PENALTY_1;
      if (tenorDays <= 180) return PENALTY_0;
      if (tenorDays <= 364) return PENALTY_0_5;
      return PENALTY_1;
    }
    if (containsAny(n, "yes bank")) {
      return tenorDays != null && tenorDays <= 181 ? PENALTY_0_75 : PENALTY_1;
    }
    if (containsAny(
        n,
        "punjab national",
        "baroda",
        "canara",
        "union bank of india",
        "indian bank",
        "bharatiya mahila",
        "indusind",
        "rbl",
        "idfc",
        "bandhan",
        "federal",
        "city union",
        "dcb",
        "karur vysya",
        "south indian",
        "karnataka bank",
        "dhanlaxmi")) {
      return PENALTY_1;
    }
    if (containsAny(n, "au small finance", "aubl")) {
      return PENALTY_1;
    }
    if (containsAny(n, "ujjivan")) {
      return tenorDays != null && tenorDays < 180 ? PENALTY_1 : PENALTY_0;
    }
    if (containsAny(n, "equitas")) {
      return tenorDays != null && tenorDays <= 180 ? PENALTY_1 : PENALTY_0;
    }
    if (containsAny(n, "bajaj")) {
      return PENALTY_2;
    }
    if (containsAny(n, "mahindra")) {
      return tenorDays != null && tenorDays < 365 ? PENALTY_3 : PENALTY_2;
    }
    if (containsAny(n, "shriram")) {
      return PENALTY_2;
    }
    if (containsAny(n, "lic housing", "lic hfl")) {
      return PENALTY_1_5;
    }
    if (containsAny(n, "pnb housing", "pnb hfl")) {
      return PENALTY_2;
    }
    return null;
  }

  /** Category classifier for the long tail of registry bank names. */
  private static BigDecimal category(String n) {
    if (containsAny(n, "small finance")) {
      return PENALTY_1;
    }
    if (containsAny(n, "gramin", "grameen", "regional rural", "rural")) {
      return PENALTY_1;
    }
    if (containsAny(n, "payments bank")) {
      return PENALTY_0;
    }
    if (containsAny(n, "post", "postal")) {
      return PENALTY_2;
    }
    if (containsAny(
        n,
        "coop",
        "co-",
        "co.",
        "co op",
        "cooperative",
        "sahakari",
        "seva",
        "nagarik",
        "mahila",
        "credit society",
        "zoroastrian",
        "urban",
        "district central",
        "dccb",
        "ldb",
        "ucb")) {
      return PENALTY_0_5;
    }
    if (containsAny(
        n, "finance", "housing", "hfl", "limited", "ltd", "clearing", "company", "corp")) {
      return PENALTY_2;
    }
    if (containsAny(
        n,
        "hsbc",
        "citibank",
        "citi bank",
        "deutsche",
        "standard chartered",
        "bnp",
        "barclays",
        "jpmorgan",
        "morgan stanley",
        "mufg",
        "mitsubishi",
        "societe",
        "credit suisse",
        "emirates",
        "qatar",
        "janata",
        "kuwait",
        "oman",
        "obb")) {
      return PENALTY_1;
    }
    if (containsAny(n, "bank", "society")) {
      return PENALTY_1;
    }
    return null;
  }

  private static boolean containsAny(String n, String... needles) {
    for (String needle : needles) {
      if (n.contains(needle)) return true;
    }
    return false;
  }
}