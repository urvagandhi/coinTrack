package com.urva.myfinance.coinTrack.user.dto;

/**
 * Body for DELETE /api/users/me — password re-authentication.
 *
 * Accounts with a local password MUST confirm it; a live session alone is
 * never sufficient to destroy an account. Google-only accounts (no local
 * password) may omit the field since there is no local secret to match.
 */
public record DeleteAccountRequest(String password) {
}
