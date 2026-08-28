package com.urva.myfinance.coinTrack.common.util;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Canonical holder/owner-name normalization shared across modules (fixeddeposit, mutualfund).
 *
 * <p>The only owner signal today is the {@code holderName} string. Normalizing it to a single
 * canonical form at write time (and at read time when used as a filter key) guarantees that one
 * person's deposits/schemes never split into separate grouping buckets just because their name was
 * typed slightly differently. The token set is symmetric so:
 *
 * <pre>
 *   "RAHUL DAS" == "Rahul Das" == "  rahul   das" == "Rahul DAS"
 * </pre>
 *
 * <p>This intentionally has no knowledge of a {@code Member}/{@code OwnerRef} entity — the family
 * architecture can later swap the grouping key from a string to a stable id without re-architecting
 * the callers, because every caller routes through this util.
 */
public final class HolderName {

  private HolderName() {
    // Utility class
  }

  /**
   * Normalize a holder name: trim surrounding whitespace, collapse runs of internal whitespace to a
   * single space, and title-case every whitespace-delimited token.
   *
   * @param raw the raw input (may be {@code null} or blank)
   * @return the canonical form, or the input unchanged when it is {@code null}; blank input is
   *     returned unchanged so callers can decide their own blank/fallback semantics
   */
  public static String normalize(String raw) {
    if (raw == null) {
      return null;
    }
    String collapsed = raw.trim().replaceAll("\\s+", " ");
    if (collapsed.isEmpty()) {
      return collapsed;
    }
    return titleCase(collapsed);
  }

  /**
   * Title-case each whitespace-delimited token: "rahul das" &rarr; "Rahul Das". Words separated by
   * punctuation (e.g. "Kumar-Das") are treated as single tokens to avoid corrupting apostrophes or
   * hyphens; the whole token's first letter is upper-cased and the remainder lower-cased.
   */
  private static String titleCase(String collapsed) {
    return Arrays.stream(collapsed.split(" ", -1))
        .map(HolderName::titleCaseToken)
        .collect(Collectors.joining(" "));
  }

  private static String titleCaseToken(String token) {
    if (token.isEmpty()) {
      return token;
    }
    return Character.toUpperCase(token.charAt(0)) + token.substring(1).toLowerCase();
  }
}
