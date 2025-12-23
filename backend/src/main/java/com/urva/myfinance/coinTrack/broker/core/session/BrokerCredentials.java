package com.urva.myfinance.coinTrack.broker.core.session;

/**
 * Sealed interface for broker-specific credentials.
 * Each broker has its own authentication model:
 *
 * - Zerodha: API key + request token (Kite Connect OAuth-like flow)
 * - Angel One: client ID + MPIN + TOTP (SmartAPI session token flow)
 * - Upstox: authorization code + redirect URI (standard OAuth 2.0)
 *
 * Adding a new broker (e.g. Groww) requires adding one new record here
 * and updating the permits clause — the only cross-cutting change needed.
 */
public sealed interface BrokerCredentials
    permits ZerodhaCredentials, AngelOneCredentials, UpstoxCredentials {
}
