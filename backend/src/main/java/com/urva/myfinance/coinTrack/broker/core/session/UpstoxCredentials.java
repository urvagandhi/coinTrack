package com.urva.myfinance.coinTrack.broker.core.session;

/**
 * Upstox OAuth2 credentials.
 *
 * @param apiKey              Upstox client_id (stored plaintext on BrokerAccount).
 * @param encryptedApiSecret  Upstox client_secret, AES-256-GCM encrypted (decrypted in adapter).
 * @param authorizationCode   One-time code returned from the OAuth dialog.
 * @param redirectUri         The redirect URI registered with Upstox.
 */
public record UpstoxCredentials(
    String apiKey,
    String encryptedApiSecret,
    String authorizationCode,
    String redirectUri
) implements BrokerCredentials {}
