package com.urva.myfinance.coinTrack.fixeddeposit.model;

/**
 * How the client entered the maturity amount.
 *
 * <p>{@code AUTOMATIC} means the client did not provide a certificate value and the server should
 * treat its own {code FdMath} computation as authoritative (overriding the client estimate when it
 * deviates beyond the maturity tolerance). {@code MANUAL} means the client supplied an exact value
 * (from the deposit certificate) that must be preserved; the server only records the discrepancy.
 *
 * <p>{@code null} on a request is treated as {@code AUTOMATIC} for backward compatibility.
 */
public enum MaturityMode {
  AUTOMATIC,
  MANUAL
}