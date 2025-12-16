# Broker Module – CoinTrack

> **Domain**: External broker integrations (Zerodha, Angel One, Upstox)
> **Responsibility**: Connect, authenticate, and fetch portfolio data with "Raw Fidelity"

---

## 1. Overview

### Purpose
The Broker module handles all integrations with external trading platforms. It serves as the **Data Transport Layer** that connects to broker APIs, handles authentication constraints (OAuth, TOTP), and fetches financial data without altering its truth.

### Core Philosophies
1.  **"Trust the Broker"**: We prioritize official values (P&L, Margins, Day Change) provided by the broker over local re-calculation. Brokers handle complex corporate actions and settlements that are hard to replicate.
2.  **"Raw Pass-Through"**: We strictly preserve the **entire** JSON response from the broker in a `raw` map for every entity. This ensures zero data loss and future-proofs the application against API changes.

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
│   └── ZerodhaBridgeController.java    # Zerodha OAuth callback redirect (Port 3000 bridge)
├── dto/
│   ├── BrokerAccountDTO.java           # Account summary response
│   ├── BrokerStatusResponse.java       # Connection status response
│   ├── ZerodhaCredentialsDTO.java      # Zerodha API key/secret input
│   ├── MfInstrumentDTO.java            # Mutual Fund Instrument Data
│   ├── MfSipDTO.java                   # SIP Data
│   └── MutualFundOrderDTO.java         # MF Orders Data
├── model/
│   ├── Broker.java                     # Enum: ZERODHA, ANGELONE, UPSTOX
│   ├── BrokerAccount.java              # Entity: user's broker connection
│   └── ExpiryReason.java               # Enum: why token expired
├── service/
│   ├── BrokerService.java              # Interface: broker operations
│   ├── BrokerConnectService.java       # Interface: connection flow
│   ├── BrokerStatusService.java        # Interface: status checks
│   ├── exception/
│   │   └── BrokerException.java        # Broker-specific errors
│   ├── impl/
│   │   ├── ZerodhaBrokerService.java   # Zerodha Kite integration (MAIN)
│   │   └── BrokerConnectServiceImpl.java
│   └── package-info.java
```

---

## 3. Component Responsibilities

### Controllers
| Class | Responsibility | Must NOT Do |
|-------|---------------|-------------|
| `BrokerConnectController` | Credential save, OAuth URL logic | Business logic, DB queries |
| `BrokerStatusController` | Return connection status | Token manipulation |
| `ZerodhaBridgeController` | **`/zerodha/callback`** | Browser Redirect → Frontend |

### Services
| Interface | Implementation | Responsibility |
|-----------|---------------|----------------|
| `BrokerService` | `ZerodhaBrokerService` | Fetch holdings, positions, MF, funds. **Source of Truth** for API interaction. |
| `BrokerConnectService` | `BrokerConnectServiceImpl` | OAuth flow, token exchange, SHA-256 checksums |
| `BrokerStatusService` | `BrokerStatusServiceImpl` | Check token validity (6 AM cutoff) |

### BrokerServiceFactory
```java
BrokerService service = brokerFactory.getService(Broker.ZERODHA);
```
- Returns correct implementation based on `Broker` enum.
- Throws `BrokerException` for unsupported brokers.

---

## 4. Key Integrations (Zerodha)

### 4.1 Holdings (Equity)
*   **Method**: `fetchHoldings`
*   **Logic**: Fetches entire list. Maps `pnl`, `day_change` to DTO but also stores full JSON in `raw`.
*   **Safety**: Validates `quantity` and `average_price`.

### 4.2 Positions (F&O)
*   **Method**: `fetchPositions`
*   **Logic**: extracting `net` positions.
*   **Rule**: Excluded from Portfolio Summary aggregates to avoid double counting or logic mismatches.

### 4.3 Mutual Funds
*   **Holdings**: `fetchMfHoldings` - Captures official NAV (`last_price`) and P&L.
*   **SIPs**: `fetchMfSips` - Maps SIP status, amounts, and dates.
*   **Orders**: `fetchMfOrders` - Captures order history, derives `isSip` and `orderSide`.
*   **Instruments**: `fetchMfInstruments` - Parses massive CSV dump to find fund metadata efficiently.

### 4.4 Funds & Margins
*   **Method**: `fetchFunds`
*   **Logic**: Fetches `equity` and `commodity` margins.
*   **Crucial Step**: Manually extracts the **raw JSON node** for each segment and injects it into the DTO to ensure no margin field (like `adhoc_margin`) is lost.

---

## 5. Execution Flow

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

---

## 6. Security & secrets

### Authentication
- All endpoints require valid JWT in `Authorization` header.
- User ID exacted from SecurityContext.

### Secrets Management
- **Encryption**: API secrets are encrypted using `EncryptionUtil` before storage in `BrokerAccount`.
- **Decryption**: Decrypted ONLY at the moment of Token Exchange.
- **Logging**: Secrets are **NEVER** logged. Codes are masked.

---

## 7. Extension Guidelines

### Adding a New Broker
1.  **Add Enum**: Update `Broker.java`.
2.  **Implement Service**: Create `NewBrokerService` implementing `BrokerService`.
3.  **Register**: Add to `BrokerServiceFactory`.
4.  **Credentials**: Create `NewBrokerCredentialsDTO`.
5.  **Tests**: Add integration tests for OAuth flow.

### Rules That Must NOT Be Broken
1.  **Raw Fidelity**: Always preserve the original JSON from the broker.
2.  **Encryption**: Never store API secrets in plain text.
3.  **Token Validation**: Always check expiry before making calls.

---

## 8. Common Pitfalls
| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Hardcoding URLs | Environment drift | Use `@Value` / `application.properties` |
| Ignoring Token Expiry | 401 Errors | Check `isTokenValid(account)` |
| Rounding in Service | Data mismatch | Store `BigDecimal` exactly as received |
| Dropping Unknown Fields | Audit gaps | Use `Map<String, Object> raw` |

---
