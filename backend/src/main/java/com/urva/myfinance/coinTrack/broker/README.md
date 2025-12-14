# Broker Module – CoinTrack

> **Domain**: External broker integrations (Zerodha, Angel One, Upstox)
> **Responsibility**: Connect, authenticate, and fetch portfolio data from trading platforms

---

## 1. Overview

### Purpose
The Broker module handles all integrations with external trading platforms. It abstracts the complexity of OAuth flows, token lifecycle management, and broker-specific API quirks into a unified interface.

### Business Problem Solved
Users want to see consolidated portfolio data from multiple brokers in one place. Each broker has:
- Different authentication mechanisms (OAuth, TOTP, API keys)
- Different API structures and data formats
- Different token expiry policies (Zerodha: 6 AM IST daily)

This module normalizes all broker interactions into a consistent internal model.

### System Position
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────>│   Broker     │────>│  External APIs  │
│  (Connect)  │     │   Module     │     │  (Kite, Angel)  │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Portfolio   │
                    │   Module     │
                    └──────────────┘
```

---

## 2. Folder Structure

```
broker/
├── controller/
│   ├── BrokerConnectController.java    # OAuth flows, credential management
│   ├── BrokerStatusController.java     # Connection status endpoints
│   └── ZerodhaBridgeController.java    # Zerodha OAuth callback redirect
├── dto/
│   ├── BrokerAccountDTO.java           # Account summary response
│   ├── BrokerStatusResponse.java       # Connection status response
│   ├── ZerodhaCredentialsDTO.java      # Zerodha API key/secret input
│   ├── AngelOneCredentialsDTO.java     # Angel One credentials
│   └── UpstoxCredentialsDTO.java       # Upstox credentials
├── model/
│   ├── Broker.java                     # Enum: ZERODHA, ANGELONE, UPSTOX
│   ├── BrokerAccount.java              # Entity: user's broker connection
│   └── ExpiryReason.java               # Enum: why token expired
├── provider/                           # Reserved for broker-specific SDKs
├── repository/
│   └── BrokerAccountRepository.java    # MongoDB access for BrokerAccount
└── service/
    ├── BrokerService.java              # Interface: broker operations
    ├── BrokerConnectService.java       # Interface: connection flow
    ├── BrokerStatusService.java        # Interface: status checks
    ├── BrokerServiceFactory.java       # Factory: get broker implementation
    ├── exception/
    │   └── BrokerException.java        # Broker-specific errors
    ├── impl/
    │   ├── ZerodhaBrokerService.java   # Zerodha Kite integration
    │   ├── AngelOneBrokerService.java  # Angel One (stub)
    │   ├── UpstoxBrokerService.java    # Upstox (stub)
    │   ├── BrokerConnectServiceImpl.java
    │   └── BrokerStatusServiceImpl.java
    └── package-info.java               # Extension guide documentation
```

### Why This Structure?
| Folder | Purpose | DDD Alignment |
|--------|---------|---------------|
| `controller/` | HTTP endpoints only | Application layer |
| `service/` | Business logic | Domain layer |
| `service/impl/` | Broker implementations | Infrastructure layer |
| `model/` | Entities and enums | Domain model |
| `dto/` | API contracts | Application layer |
| `repository/` | Data access | Infrastructure layer |

---

## 3. Component Responsibilities

### Controllers
| Class | Responsibility | Must NOT Do |
|-------|---------------|-------------|
| `BrokerConnectController` | Credential save, OAuth URL, callback handling | Business logic, DB queries |
| `BrokerStatusController` | Return connection status | Token manipulation |
| `ZerodhaBridgeController` | **`/zerodha/callback`** | Browser Redirect → Frontend (Port 3000) |

### Services
| Interface | Implementation | Responsibility |
|-----------|---------------|----------------|
| `BrokerService` | `ZerodhaBrokerService` | Fetch holdings, positions, validate tokens |
| `BrokerConnectService` | `BrokerConnectServiceImpl` | OAuth flow, token exchange |
| `BrokerStatusService` | `BrokerStatusServiceImpl` | Check token validity |

### BrokerServiceFactory
```java
BrokerService service = brokerFactory.getService(Broker.ZERODHA);
```
- Returns correct implementation based on `Broker` enum
- Throws `BrokerException` for unsupported brokers
- Singleton pattern via Spring `@Service`

### Models
| Class | Type | Purpose |
|-------|------|---------|
| `Broker` | Enum | Supported broker identifiers |
| `BrokerAccount` | Entity | Stores user's connection, tokens, API keys |
| `ExpiryReason` | Enum | `DAILY_CUTOFF`, `TOKEN_REVOKED`, `MANUAL` |

### Data Integrity & Mapping
The Broker module is responsible for **preserving raw values**.
- `ZerodhaBrokerService` maps `m2m`, `pnl`, `realised` directly from Kite API to `CachedPosition`.
- **Constraint**: Do not apply rounding or logic conversion here. Store exactly what the broker returns.
- **Normalization**: Done only at the DTO layer for frontend consumption.

---

## 4. Execution Flow

### Zerodha Connection Flow
```
┌─────────┐  1. Save credentials   ┌────────────────────┐
│ Frontend│─────────────────────-->│ POST /api/brokers/ │
│         │                        │ zerodha/credentials│
└─────────┘                        └────────────────────┘
     │                                       │
     │ 2. Get login URL                      ▼
     │<────────────────────────────  Save to MongoDB
     │
     │ 3. User logs in at Zerodha
     ▼
┌─────────────────┐  4. Callback    ┌────────────────────┐
│ Zerodha OAuth   │────────────────>│ /api/zerodha/      │
│ (request_token) │                 │ callback           │
└─────────────────┘                 └────────────────────┘
                                            │
                                            ▼
                                    Exchange token via
                                    ZerodhaBrokerService
                                            │
                                            ▼
                                    Store access_token
                                    in BrokerAccount
```

### API Request → Response
```
1. POST /api/brokers/callback
   └── BrokerConnectController.handleBrokerCallback()
       └── brokerConnectService.handleCallback(userId, broker, requestToken)
           └── ZerodhaBrokerService.exchangeToken(account, requestToken)
               └── HTTP POST to api.kite.trade/session/token
               └── Save access_token to BrokerAccount
       └── Return ApiResponse.success("Connected successfully")
```

---

## 5. Diagrams

### Token State Machine
```
┌───────┐
│  NEW  │ ← Account created, no token
└───┬───┘
    │ User connects
    ▼
┌────────┐
│ ACTIVE │ ← Valid token, API calls work
└───┬────┘
    │ 6 AM IST cutoff
    ▼
┌─────────┐
│ EXPIRED │ ← Token invalid
└───┬─────┘
    │
    ▼
┌──────────────────┐
│ REQUIRES_REAUTH  │ ← User must reconnect
└──────────────────┘
```

### Sequence: Fetch Holdings
```text
Controller   Factory   ZerodhaService    Kite API     MongoDB
    │           │            │              │            │
    ├── getService(ZERODHA)->│              │            │
    │           │            │              │            │
    ├── fetchHoldings() ────>│              │            │
    │           │            ├── checkTokenExpiry() ---->│
    │           │            │              │            │
    │           │            ├── GET /holdings --------->│
    │           │            │<--------- JSON Data ------│
    │           │            │              │            │
    │           │            ├── parseToHoldingDTO()     │
    │<-- List<CachedHolding>-│              │            │
```

---

## 6. Logging Strategy

### What IS Logged
| Event | Level | Example |
|-------|-------|---------|
| Connection started | `INFO` | `Broker ZERODHA connection started for user [userId]` |
| Token exchanged | `INFO` | `Token exchanged successfully for ZERODHA` |
| API failure | `ERROR` | `Zerodha API failed: /holdings - 401 Unauthorized` |
| Token expired | `WARN` | `Token expired for ZERODHA: DAILY_CUTOFF` |

### What is NEVER Logged
- API secrets (encrypted in DB)
- Access tokens
- Request tokens
- User credentials

### Log Constants Used
```java
LoggingConstants.BROKER_CONNECT_STARTED
LoggingConstants.BROKER_CONNECT_SUCCESS
LoggingConstants.BROKER_CONNECT_FAILED
LoggingConstants.BROKER_CREDENTIALS_SAVED
```

---

## 7. Security Considerations

### Authentication
- All endpoints require valid JWT in `Authorization` header
- User ID extracted from `SecurityContext` or validated token
- No anonymous broker operations allowed

### Secrets Management
```java
// API secrets are encrypted before storage
account.setEncryptedZerodhaApiSecret(encryptionUtil.encrypt(apiSecret));

// Decrypted only when making API calls
String secret = encryptionUtil.decrypt(account.getEncryptedZerodhaApiSecret());
```

### Common Mistakes to Avoid
| ❌ Don't | ✅ Do |
|---------|-------|
| Log API secrets | Log only masked `****key` |
| Store plaintext secrets | Use `EncryptionUtil` |
| Skip token validation | Always call `isTokenValid()` |
| Trust frontend userId | Extract from JWT token |

---

## 8. Extension Guidelines

### Adding a New Broker

1. **Add enum value**
   ```java
   // Broker.java
   public enum Broker {
       ZERODHA, ANGELONE, UPSTOX, NEW_BROKER  // Add here
   }
   ```

2. **Create service implementation**
   ```java
   @Service
   public class NewBrokerService implements BrokerService {
       @Override
       public List<CachedHolding> fetchHoldings(BrokerAccount account) {
           // Implementation
       }
   }
   ```

3. **Register in factory**
   ```java
   // BrokerServiceFactory.java
   services.put(Broker.NEW_BROKER, newBrokerService);
   ```

4. **Create credentials DTO**
   ```java
   public class NewBrokerCredentialsDTO {
       private String apiKey;
       private String apiSecret;
   }
   ```

5. **Add model fields if needed**
   ```java
   // BrokerAccount.java
   private String newBrokerApiKey;
   private String encryptedNewBrokerSecret;
   ```

### Rules That Must NOT Be Broken
- All broker services must implement `BrokerService` interface
- All tokens must have expiry validation
- All secrets must be encrypted
- All implementations must use `@Transactional` for writes

---

## 9. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Hardcoding broker URLs | Breaks in production | Use `@Value` properties |
| Ignoring token expiry | Causes 401 cascades | Check `isTokenValid()` first |
| Storing raw secrets | Security vulnerability | Use `EncryptionUtil` |
| Using `e.printStackTrace()` | Loses log context | Use `logger.error()` with MDC |
| Duplicate BrokerAccount | Data corruption | Use `findByUserIdAndBroker()` upsert pattern |

---

## 10. Testing & Verification

### Unit Tests
```java
@Test
void shouldExchangeTokenSuccessfully() {
    // Mock Zerodha API response
    // Call ZerodhaBrokerService.exchangeToken()
    // Assert account.getAccessToken() is set
}
```

### Integration Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
class BrokerConnectControllerIT {
    @Test
    void shouldSaveCredentials() {
        mockMvc.perform(post("/api/brokers/zerodha/credentials")
            .header("Authorization", "Bearer " + token)
            .content(credentialsJson))
            .andExpect(status().isOk());
    }
}
```

### Manual Verification Checklist
- [ ] Save Zerodha credentials → Returns 200
- [ ] Get connect URL → Returns valid Kite login URL
- [ ] OAuth callback → Stores access token
- [ ] Fetch holdings → Returns data (requires real token)
- [ ] Token expiry → Returns `REQUIRES_REAUTH` status after 6 AM
