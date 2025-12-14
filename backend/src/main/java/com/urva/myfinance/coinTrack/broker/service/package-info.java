/**
 * BROKER EXTENSION GUIDE
 * ======================
 * This file provides documentation for adding new broker integrations.
 *
 * STEPS TO ADD A NEW BROKER:
 *
 * 1. ADD BROKER ENUM VALUE
 * - File: Model/Broker.java
 * - Add: NEW_BROKER("new_broker")
 *
 * 2. CREATE BROKER SERVICE IMPLEMENTATION
 * - Location: Service/broker/impl/
 * - Filename: NewBrokerService.java
 * - Implements: BrokerService interface
 *
 * @Service
 *          public class NewBrokerService implements BrokerService {
 *
 * @Override
 *           public String getBrokerName() { return "NEW_BROKER"; }
 *
 * @Override
 *           public BrokerCredentialValidationResult
 *           validateCredentials(BrokerAccount account) {
 *           // Verify API key/secret with broker
 *           }
 *
 * @Override
 *           public List<Holding> fetchHoldings(BrokerAccount account) {
 *           // Call broker holdings API
 *           }
 *
 * @Override
 *           public List<Position> fetchPositions(BrokerAccount account) {
 *           // Call broker positions API
 *           }
 *
 * @Override
 *           public boolean testConnection(BrokerAccount account) {
 *           // Verify token is valid
 *           }
 *
 * @Override
 *           public String getLoginUrl(BrokerAccount account, String
 *           redirectUri) {
 *           // Return OAuth login URL
 *           }
 *           }
 *
 *           3. TOKEN LIFECYCLE
 *           - Most brokers use OAuth 2.0 flow
 *           - User authorizes on broker website → receives request_token
 *           - Exchange request_token for access_token using API secret
 *           - Store access_token in BrokerAccount.accessToken
 *           - Track expiry in BrokerAccount.tokenExpiry
 *
 *           STATE MACHINE:
 *           NEW → (credentials saved) → CONFIGURED
 *           CONFIGURED → (user completes OAuth) → ACTIVE
 *           ACTIVE → (time passes) → EXPIRED
 *           EXPIRED → (re-auth) → ACTIVE
 *
 *           4. IDEMPOTENCY REQUIREMENTS
 *           - Never create duplicate BrokerAccount for same user+broker
 *           - Use findByUserIdAndBroker() before creating
 *           - Token refresh should be atomic
 *           - Holdings sync should use replace-all pattern
 *
 *           5. SECURITY
 *           - API secrets MUST be encrypted at rest
 *           - Use EncryptionUtil for storage
 *           - Never log tokens or secrets
 *           - Validate callback URLs strictly
 *
 *           6. ERROR HANDLING
 *           - Throw BrokerException for broker-specific errors
 *           - Include broker name in exception
 *           - Log with correlation ID
 *
 *           7. REGISTRATION
 *           - Service is auto-registered via @Service annotation
 *           - BrokerServiceFactory picks it up automatically
 *           - No manual configuration needed
 *
 *           EXISTING IMPLEMENTATIONS:
 *           - ZerodhaBrokerService: Full implementation with Kite Connect
 *           - AngelOneBrokerService: Stub with TOTP flow documentation
 *           - UpstoxBrokerService: Stub with OAuth V2 documentation
 */
package com.urva.myfinance.coinTrack.broker.service;

// This file is documentation only, no code to execute
