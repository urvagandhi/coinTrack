package com.urva.myfinance.coinTrack.broker.model;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BrokerAccountTest {

    @Test
    @DisplayName("1. Zerodha hasCredentials returns true when apiKey present")
    void hasCredentials_Zerodha_WithApiKey_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaApiKey("api-key-123")
                .build();
        assertTrue(account.hasCredentials());
    }

    @Test
    @DisplayName("2. Zerodha hasCredentials returns false when apiKey null")
    void hasCredentials_Zerodha_NullApiKey_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .build();
        assertFalse(account.hasCredentials());
    }

    @Test
    @DisplayName("3. Zerodha hasCredentials returns false when apiKey empty")
    void hasCredentials_Zerodha_EmptyApiKey_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaApiKey("")
                .build();
        assertFalse(account.hasCredentials());
    }

    @Test
    @DisplayName("4. Upstox hasCredentials returns true when both apiKey and secret present")
    void hasCredentials_Upstox_BothPresent_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.UPSTOX)
                .upstoxApiKey("up-key")
                .encryptedUpstoxApiSecret("encrypted-secret")
                .build();
        assertTrue(account.hasCredentials());
    }

    @Test
    @DisplayName("5. Upstox hasCredentials returns false when secret missing")
    void hasCredentials_Upstox_MissingSecret_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.UPSTOX)
                .upstoxApiKey("up-key")
                .build();
        assertFalse(account.hasCredentials());
    }

    @Test
    @DisplayName("6. AngelOne hasCredentials returns true when all 4 fields present")
    void hasCredentials_AngelOne_AllPresent_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ANGELONE)
                .angelOneApiKey("key")
                .angelOneClientCode("code")
                .encryptedAngelOnePassword("pwd")
                .encryptedAngelOneTotpSecret("totp")
                .build();
        assertTrue(account.hasCredentials());
    }

    @Test
    @DisplayName("7. AngelOne hasCredentials returns false when totpSecret missing")
    void hasCredentials_AngelOne_MissingTotp_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ANGELONE)
                .angelOneApiKey("key")
                .angelOneClientCode("code")
                .encryptedAngelOnePassword("pwd")
                .build();
        assertFalse(account.hasCredentials());
    }

    @Test
    @DisplayName("8. Zerodha hasValidToken returns true when token present and not expired")
    void hasValidToken_Zerodha_ValidToken_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaAccessToken("token")
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(2))
                .build();
        assertTrue(account.hasValidToken());
    }

    @Test
    @DisplayName("9. Zerodha hasValidToken returns false when token expired")
    void hasValidToken_Zerodha_ExpiredToken_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaAccessToken("token")
                .zerodhaTokenExpiresAt(LocalDateTime.now().minusHours(1))
                .build();
        assertFalse(account.hasValidToken());
    }

    @Test
    @DisplayName("10. Zerodha hasValidToken returns false when token null")
    void hasValidToken_Zerodha_NullToken_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(2))
                .build();
        assertFalse(account.hasValidToken());
    }

    @Test
    @DisplayName("11. AngelOne hasValidToken returns true when JWT present and not expired")
    void hasValidToken_AngelOne_ValidToken_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ANGELONE)
                .encryptedAngelOneJwtToken("jwt-token")
                .angelOneTokenExpiresAt(LocalDateTime.now().plusHours(2))
                .build();
        assertTrue(account.hasValidToken());
    }

    @Test
    @DisplayName("12. AngelOne hasValidToken returns false when JWT null")
    void hasValidToken_AngelOne_NullJwt_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ANGELONE)
                .angelOneTokenExpiresAt(LocalDateTime.now().plusHours(2))
                .build();
        assertFalse(account.hasValidToken());
    }

    @Test
    @DisplayName("13. Generic hasValidToken returns true when accessToken present and not expired")
    void hasValidToken_Generic_ValidToken_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.UPSTOX)
                .accessToken("generic-token")
                .tokenExpiresAt(LocalDateTime.now().plusHours(2))
                .build();
        assertTrue(account.hasValidToken());
    }

    @Test
    @DisplayName("14. isTokenExpired returns true when expiresAt is null (Zerodha)")
    void isTokenExpired_NullExpiry_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .build();
        assertTrue(account.isTokenExpired());
    }

    @Test
    @DisplayName("15. isTokenExpired returns true for expired Zerodha token")
    void isTokenExpired_Zerodha_Expired_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaTokenExpiresAt(LocalDateTime.now().minusMinutes(5))
                .build();
        assertTrue(account.isTokenExpired());
    }

    @Test
    @DisplayName("16. isTokenExpired returns false for valid Zerodha token")
    void isTokenExpired_Zerodha_Valid_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        assertFalse(account.isTokenExpired());
    }

    @Test
    @DisplayName("17. isTokenExpired returns true when AngelOne expiresAt is null")
    void isTokenExpired_AngelOne_NullExpiry_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ANGELONE)
                .build();
        assertTrue(account.isTokenExpired());
    }

    @Test
    @DisplayName("18. isTokenExpired returns true for expired AngelOne token")
    void isTokenExpired_AngelOne_Expired_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ANGELONE)
                .angelOneTokenExpiresAt(LocalDateTime.now().minusMinutes(10))
                .build();
        assertTrue(account.isTokenExpired());
    }

    @Test
    @DisplayName("19. isTokenExpired returns false for valid AngelOne token")
    void isTokenExpired_AngelOne_Valid_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ANGELONE)
                .angelOneTokenExpiresAt(LocalDateTime.now().plusHours(3))
                .build();
        assertFalse(account.isTokenExpired());
    }

    @Test
    @DisplayName("20. isTokenExpired returns true when generic tokenExpiresAt is null")
    void isTokenExpired_Generic_NullExpiry_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.UPSTOX)
                .build();
        assertTrue(account.isTokenExpired());
    }

    @Test
    @DisplayName("21. isTokenExpired returns false for valid generic token")
    void isTokenExpired_Generic_Valid_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.UPSTOX)
                .tokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();
        assertFalse(account.isTokenExpired());
    }

    @Test
    @DisplayName("22. Default isActive is true via builder")
    void builder_DefaultIsActive_ReturnsTrue() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .build();
        assertTrue(account.getIsActive());
    }

    @Test
    @DisplayName("23. hasCredentials with null broker and no accessToken returns false")
    void hasCredentials_NullBroker_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .build();
        assertFalse(account.hasCredentials());
    }

    @Test
    @DisplayName("24. Zerodha hasValidToken returns false when expiresAt is null")
    void hasValidToken_Zerodha_NullExpiry_ReturnsFalse() {
        BrokerAccount account = BrokerAccount.builder()
                .broker(Broker.ZERODHA)
                .zerodhaAccessToken("token")
                .build();
        assertFalse(account.hasValidToken());
    }
}
