package com.urva.myfinance.coinTrack.common.util;

/**
 * Shared owner-grouping key builder for places that group records by (place-or-platform, holder).
 *
 * <p>Every site that groups by owner must route through {@link #groupKey(String, String)} (or the
 * module-specific variants below) rather than inlining {@code a + "|" + b}, so the grouping rule
 * can never drift between, for example,
 * <!-- [DEPRECATED-TDS] the FD TDS summary consumer below has been deprecated (commented out of the
 *      codebase). It is retained here so a future reader can re-enable it. -->
 * the FD TDS summary, the FD Excel export, and the MF cross-check aggregation.
 *
 * <p>Key rule: {@code groupKey(placeOrPlatform, holder) = placeOrPlatform + "|" +
 * HolderName.normalize(holder)}. Blank place/platform and blank holder collapse to the display
 * fallback {@code "Unknown"} so a missing value never silently becomes a bucket of its own.
 */
public final class OwnerGrouping {

  private static final String UNKNOWN = "Unknown";
  private static final String SEPARATOR = "|";

  private OwnerGrouping() {
    // Utility class
  }

  /**
   * Build a canonical owner-group key from a place or platform and a holder name. The holder is
   * normalized via {@link HolderName} and the place/platform is whitespace-collapsed, so case and
   * whitespace variants of the same holder never split into different buckets. Blank values fall
   * back to {@code "Unknown"}.
   */
  public static String groupKey(String placeOrPlatform, String holderName) {
    String place = clean(placeOrPlatform, UNKNOWN);
    String holder = clean(holderName, UNKNOWN);
    return place + SEPARATOR + HolderName.normalize(holder);
  }

  /** Trim surrounding/duplicate whitespace, falling back to the supplied label when blank. */
  private static String clean(String raw, String fallback) {
    if (raw == null || raw.isBlank()) {
      return fallback;
    }
    return raw.trim().replaceAll("\\s+", " ");
  }
}
