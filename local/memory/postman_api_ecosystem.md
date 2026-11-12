# coinTrack Postman & API Ecosystem Knowledge

This document serves as the long-term memory for the architecture, automated testing workflows, and API standards implemented for the **coinTrack** Postman ecosystem.

---

## 1. Architectural Philosophy & Dual Collection Strategy

Rather than forcing a single collection to handle both manual documentation and continuous integration, we adopted a **Dual Collection Architecture** (Postman v2.1.0 schema compliant):

1. **Master Reference & Interactive Suite (`postman/CoinTrack_API_Collection.json`)**:
   - **199 requests** across **29 folders** covering 100% of the backend surface area across 13 distinct business domains.
   - Designed for manual developer exploration, parameter testing, debugging, and comprehensive API documentation.
   - Every single endpoint is documented in rich Markdown (business intent, URL parameters, body contract, valid enums, status codes).

2. **Automated E2E Integration Suite (`postman/CoinTrack_E2E_Workflow.json`)**:
   - **38 sequential, automated test steps** designed for Postman Collection Runner and headless Newman in CI/CD.
   - Executes an end-to-end journey without manual intervention:
     - Health Heartbeat ➔ Dynamic Registration & Login ➔ Profile & Settings ➔ Notes CRUD ➔ Mutual Funds Lifecycle (Scheme, SIP Mandate, Contribution, Lumpsum, FIFO Preview, Redemption, Valuation Dashboard) ➔ EPF Passbook Flow ➔ PPF Passbook & Withdrawal Eligibility Flow ➔ Fixed Deposits (Creation, Premature Withdrawal Penalty Simulation, TDS) ➔ Precious Metals (Live Bullion Rates API, Gold Asset, Valuation) ➔ 32 Financial Calculators Regression (SIP, Loan EMI, Retirement, Tax Regime Comparison, Brokerage) ➔ Unified Portfolio Refresh ➔ Token Refresh Rotation ➔ Session Teardown (Logout).

---

## 2. Advanced Automation & Scripting Standards

### Automated Authentication & Token Inheritance
- **Collection-Level Bearer Token**: Configured with `Bearer {{token}}` at the root collection level. All child requests inherit authentication automatically.
- **Public Route Exemptions**: Public routes (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/health`, and all `/api/calculators/*`) explicitly override auth with `"auth": { "type": "noauth" }`.
- **Silent JWT Auto-Refresh**: The collection Pre-Request script evaluates the `tokenExpiresAt` environment timestamp. If an access token expires or is within 30 seconds of expiration, it issues an asynchronous background `pm.sendRequest` to `/api/auth/refresh` using `{{refreshToken}}` and silently updates `{{token}}` before dispatching the request.

### RFC 6238 TOTP 2FA Auto-Computation
- An RFC 6238 TOTP algorithm written in pure JavaScript is embedded in the collection Pre-Request script using Postman's native `CryptoJS`.
- When `totpSecret` exists in the active environment (stored after running `/api/auth/mfa/setup`), the pre-request hook calculates the live 6-digit TOTP code and sets `{{dynamicTotpCode}}`.
- 2FA verification endpoints (`/api/auth/mfa/verify`, `/api/auth/mfa/login`) consume `{{dynamicTotpCode}}` without requiring Google Authenticator or manual interaction.

### Chai BDD Test Assertions
- **100% Test Coverage**: Every request in both collections includes:
  - Exact HTTP status code check (`pm.response.to.have.status(...)`).
  - Response time SLA check (`pm.expect(pm.response.responseTime).to.be.below(3500)`).
  - Response body JSON validation.
  - JSON property assertions.
  - Dynamic extraction to environment variables for sequential request chaining (`token`, `refreshToken`, `userId`, `noteId`, `mfSchemeId`, `sipMandateId`, `fdId`, `epfTransactionId`, `ppfTransactionId`, `goldSilverId`).

### Terminal Editorial Response Visualizers (`pm.visualizer.set`)
- Nine core endpoints feature custom-styled HTML/CSS response visualizers matching CoinTrack's "Terminal Editorial" design tokens (`#090a0f` background, `#12151e` card surfaces, `#1e2333` hairline borders, emerald `#10b981` gains, rose `#ef4444` losses):
  1. `GET /api/portfolio/summary` (Consolidated Portfolio Overview with KPI metrics)
  2. `GET /api/portfolio/holdings` (Equities ledger table with color-coded P&L)
  3. `GET /api/mutual-fund/dashboard` (Mutual Fund Valuation & Scheme Performance)
  4. `GET /api/epf/summary` (EPF & EPS Account Statement Dashboard)
  5. `GET /api/ppf/summary` (PPF Passbook Summary)
  6. `GET /api/fixed-deposits/summary` (Fixed Deposits Portfolio & TDS Overview)
  7. `GET /api/gold-silver/summary` (Gold & Silver Vault Valuation & Weights)
  8. `POST /api/calculators/investment/sip` (SIP Wealth Accumulation Card)
  9. `POST /api/calculators/loans/emi` (EMI Principal vs Interest Amortization Card)

---

## 3. Backend Domain & Endpoint Mapping

| Domain Index | Module Name | Endpoints Count | Key Controller Mappings |
| :--- | :--- | :--- | :--- |
| `00` | System & Health | 4 | `HealthController`, `HomeController` |
| `01` | Authentication & Security | 8 | `AuthController` (`/api/auth/*`) |
| `02` | Multi-Factor Authentication | 9 | `TotpController` (`/api/auth/mfa/*`) |
| `03` | Email, Password & Recovery | 11 | `ForgotPasswordController`, `EmailChangeController`, `EmailVerificationController`, `TwoFactorRecoveryController`, `ContactController`, `AdminEmailPreviewController` |
| `04` | User Profile & Account | 4 | `UserController` (`/api/users/*`) |
| `05` | Portfolio & Broker Adapters | 28 | `PortfolioController`, `ManualRefreshController`, `SyncStatusController`, `BrokerConnectController`, `BrokerStatusController`, `ZerodhaBridgeController` |
| `06` | Mutual Funds (Self-Managed) | 56 | `MfSchemeController`, `SipMandateController`, `SipContributionController`, `LumpsumTransactionController`, `RedemptionTransactionController`, `ValuationSnapshotController`, `MfSummaryController`, `AdminCleanupController` |
| `07` | Employee Provident Fund | 10 | `EpfController`, `EpfSettingsController` (`/api/epf/*`) |
| `08` | Public Provident Fund | 11 | `PpfController` (`/api/ppf/*`) |
| `09` | Fixed Deposits | 11 | `FixedDepositController` (`/api/fixed-deposits/*`) |
| `10` | Gold & Silver Holdings | 16 | `GoldSilverController` (`/api/gold-silver/*`) |
| `11` | Notes & Annotations | 4 | `NoteController` (`/api/notes/*`) |
| `12` | Financial Calculators | 32 | `InvestmentCalculatorController` (8), `LoanCalculatorController` (6), `PlanningCalculatorController` (1), `SavingsCalculatorController` (10), `TaxCalculatorController` (6), `TradingCalculatorController` (2) |

---

## 4. Deterministic Generation & Maintenance Rule

- **Do NOT manually edit** `CoinTrack_API_Collection.json` or `CoinTrack_E2E_Workflow.json` when adding or modifying API endpoints. Manual edits are error-prone and corrupt formatting.
- **Generator Scripts**:
  - `postman/generate_postman.py`: Core helpers, visualizer CSS/HTML, collection pre-request scripts, and request builders.
  - `postman/build_postman_suite.py`: Orchestrator that compiles all folders, requests, tests, environments, and schemas.
- **To Recompile**:
  ```bash
  python3 postman/build_postman_suite.py
  ```
- **Newman CI Execution**:
  ```bash
  newman run postman/CoinTrack_E2E_Workflow.json \
    -e postman/CoinTrack_Local_Environment.json \
    --bail folder \
    --color on
  ```

---

## 5. Explicit User Preferences & Hard Rules

1. **Complete Coverage**: The Postman collection must contain *everything* — all calculators, all wealth modules (EPF, PPF, FD, Gold/Silver, MF), and all broker hooks. Never omit an endpoint.
2. **Sequential Flow**: Endpoints must be ordered logically (e.g., Auth ➔ Setup ➔ CRUD ➔ Teardown).
3. **Indian Wealth Context**: Sample data must reflect realistic Indian financial instruments (AMFI codes, INR values, Quant Small Cap / Parag Parikh schemes, HDFC / SBI banks, 10-digit mobile numbers).
4. **Environment Scoping**: Secrets (`token`, `apiSecret`, `pin`, `password`) must have `"type": "secret"` in environment files and should never be committed with active production values.
