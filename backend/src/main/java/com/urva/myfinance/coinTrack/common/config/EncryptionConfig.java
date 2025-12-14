package com.urva.myfinance.coinTrack.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Configuration for encryption of sensitive data like TOTP secrets.
 * Uses AES-256-GCM for secure encryption.
 * 
 * @author coinTrack Team
 * @version 1.0
 * @since 2025-01-06
 */
@Configuration
public class EncryptionConfig {

    @Value("${app.encryption.secret-key:changeme-use-32-character-key-here!!}")
    private String secretKey;

    @PostConstruct
    public void validate() {
        if (secretKey.equals("changeme-use-32-character-key-here!!")) {
            throw new IllegalStateException(
                "SECURITY WARNING: Please set 'app.encryption.secret-key' in application.properties " +
                "to a secure 32-character key for production use!"
            );
        }
        
        if (secretKey.length() != 32) {
            throw new IllegalStateException(
                "Encryption secret key must be exactly 32 characters (256 bits). " +
                "Current length: " + secretKey.length()
            );
        }
    }

    public String getSecretKey() {
        return secretKey;
    }
}
