# CoinTrack Postman API Ecosystem & Automation Guide

Welcome to the official, production-grade Postman suite for **CoinTrack** — the multi-asset personal wealth tracking and financial planning platform.

---

## 1. Ecosystem Overview

This directory provides a **Dual Collection Architecture** engineered according to modern Postman (v2.1.0) and Newman CI/CD standards:

```
postman/
├── CoinTrack_API_Collection.json      # Master Reference & Interactive Suite (199 requests, 13 domains)
├── CoinTrack_E2E_Workflow.json        # 38-Step Automated Integration Suite for CI/CD & Runners
├── CoinTrack_Local_Environment.json   # Local development environment (http://localhost:8080)
├── CoinTrack_Staging_Environment.json # Staging / Cloud template environment
├── build_postman_suite.py             # Deterministic Python build & generation engine
├── generate_postman.py                # Visualizer templates & helper primitives
└── README.md                          # Comprehensive documentation & execution guide
```

---

## 2. Collections Breakdown

### 2.1 Master Reference & Interactive Suite (`CoinTrack_API_Collection.json`)
Contains **199 fully documented endpoints** across 29 modular folders covering 100% of CoinTrack's backend capabilities:

| Folder | Scope & Capabilities | Key Endpoints |
| :--- | :--- | :--- |
| **00. System & Health** | Service probes, heartbeat ping, keep-alives | `GET /api/health`, `GET /api/health/ping` |
| **01. Authentication & Security** | User registration, credential login, token verification, refresh, Google SSO, logout | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` |
| **02. Multi-Factor Authentication (MFA / TOTP)** | RFC 6238 TOTP setup, verify, login with code, backup recovery, key reset | `POST /api/auth/mfa/setup`, `POST /api/auth/mfa/verify`, `POST /api/auth/mfa/login` |
| **03. Email, Password & Recovery** | Password reset tokens, email verification magic links, emergency MFA recovery, contact form, admin email template previews | `POST /api/auth/forgot-password`, `POST /api/auth/email/change`, `GET /admin/emails/preview` |
| **04. User Profile & Account** | Profile CRUD, password change, account deletion | `GET /api/users/me`, `PUT /api/users/me`, `PUT /api/users/me/password` |
| **05. Portfolio & Broker Integrations** | Unified stock holdings, positions, trades, orders, funds, manual refresh, and hexagonal broker adapters (Zerodha Kite, Upstox, AngelOne SmartAPI) | `GET /api/portfolio/summary`, `GET /api/portfolio/holdings`, `POST /api/portfolio/refresh`, `GET /api/brokers/:broker/status` |
| **06. Mutual Funds (Self-Managed)** | Scheme catalog, AMFI NAV sync, monthly SIP mandates, contribution logs, lumpsum purchases, FIFO redemption calculator with capital gains preview, and valuations | `GET /api/mutual-fund/dashboard`, `POST /api/mutual-fund/schemes`, `POST /api/mutual-fund/sip-mandate`, `GET /api/mutual-fund/redemption/preview-fifo` |
| **07. Employee Provident Fund (EPF)** | Passbook ledger, monthly salary contributions, employer EPF/EPS split, VPF, statutory interest credits, settings, Excel export | `GET /api/epf/summary`, `POST /api/epf/transactions`, `PUT /api/epf/settings`, `GET /api/epf/export` |
| **08. Public Provident Fund (PPF)** | 15-year statutory ledger, annual interest compounding, partial withdrawal eligibility check (from 7th FY), settings, passbook export | `GET /api/ppf/summary`, `POST /api/ppf/transactions`, `GET /api/ppf/withdrawal-status`, `GET /api/ppf/export` |
| **09. Fixed Deposits (FD)** | Cumulative & non-cumulative FDs, premature withdrawal simulator with penalty calculation, Section 194A TDS summaries, CSV export | `GET /api/fixed-deposits/summary`, `POST /api/fixed-deposits`, `POST /api/fixed-deposits/:id/withdraw/preview` |
| **10. Gold & Silver Holdings** | Bullion vault (coins/bars/jewelry), live spot rates API integration, manual overrides, purity factors (24K, 22K, 999), and net return valuation | `GET /api/gold-silver/summary`, `POST /api/gold-silver`, `GET /api/gold-silver/rates/current`, `PATCH /api/gold-silver/:id/rate-mode` |
| **11. Notes & Annotations** | Trade journaling, thesis tracking, rich tags, pinned annotations | `GET /api/notes`, `POST /api/notes`, `PUT /api/notes/:id`, `DELETE /api/notes/:id` |
| **12. Financial Calculators (32 Engines)** | 32 Indian financial engines: Investment (8), Loans (6), Planning (1), Savings (10), Tax (6), Trading (2). Publicly accessible with rate limiting | `POST /api/calculators/investment/sip`, `POST /api/calculators/loans/emi`, `POST /api/calculators/planning/retirement`, `POST /api/calculators/tax/income-tax` |

---

### 2.2 Automated E2E Integration Suite (`CoinTrack_E2E_Workflow.json`)
A **38-step sequential integration test runner** designed specifically for Postman Collection Runner and Newman CI/CD:

```
[01. System Health Probe] 
      ↓
[02. Register Isolated Test User] ➔ Extracts testUser, testPassword
      ↓
[03. Login & Extract JWT Access & Refresh Tokens] ➔ Populates {{token}}, {{refreshToken}}
      ↓
[04. Verify JWT Authenticity] ➔ Asserts valid === true
      ↓
[05. Fetch User Profile] ➔ Asserts username matches
      ↓
[06. Update Profile] ➔ Tests mutation endpoint
      ↓
[07-09. Notes CRUD Lifecycle] ➔ Create Note ➔ Update Note ➔ Delete Note
      ↓
[10-16. Mutual Funds Full Flow] ➔ Create Scheme ➔ Setup SIP Mandate ➔ Record Contribution ➔ Record Lumpsum ➔ Preview FIFO Gains ➔ Execute Redemption ➔ Assert Dashboard
      ↓
[17-19. EPF Ledger Flow] ➔ Configure Settings ➔ Record Salary Contribution ➔ Assert Passbook Balance
      ↓
[20-23. PPF Ledger Flow] ➔ Configure Settings ➔ Record Deposit ➔ Evaluate Withdrawal Eligibility ➔ Assert Balance
      ↓
[24-26. Fixed Deposit Flow] ➔ Create FD ➔ Simulate Premature Withdrawal Penalty ➔ Assert Active Investment Total
      ↓
[27-29. Precious Metals Flow] ➔ Fetch Live Spot Rates ➔ Add Gold Asset ➔ Assert Bullion Valuation
      ↓
[30-34. Financial Calculators Regression] ➔ Run SIP, Home Loan EMI, Retirement, Income Tax, and Brokerage Engines
      ↓
[35-36. Unified Portfolio View] ➔ Trigger Broker Sync ➔ Assert Consolidated Net Worth
      ↓
[37-38. Teardown & Clean Session] ➔ Rotate Token via Refresh ➔ Logout & Invalidate Session
```

---

## 3. Advanced Automation & Scripting Features

### 3.1 Token Inheritance & Auto-Refresh
* **Root Auth**: The collection defines `Bearer {{token}}` at the root. All child requests inherit authentication automatically.
* **Public Endpoints**: Public routes (`/auth/login`, `/auth/register`, `/health`, `/calculators/*`) explicitly use `"auth": { "type": "noauth" }`.
* **Silent Token Refresh**: The collection-level Pre-Request script tracks token expiration timestamp (`{{tokenExpiresAt}}`). When an access token expires, it silently issues `pm.sendRequest` to `/api/auth/refresh` using `{{refreshToken}}` and updates `{{token}}` in place before sending the original request.

### 3.2 Automated RFC 6238 TOTP 2FA Generation
In standard setups, testing 2FA requires manual interaction with Google Authenticator. In CoinTrack's Postman suite:
* A pure JavaScript RFC 6238 TOTP generator is embedded in the collection Pre-Request script using Postman's built-in `CryptoJS`.
* When `totpSecret` exists in your environment (automatically stored after running `POST /api/auth/mfa/setup`), the pre-request hook calculates the live 6-digit TOTP code and stores it in `{{dynamicTotpCode}}`.
* Verification requests (`/api/auth/mfa/verify`, `/api/auth/mfa/login`) consume `{{dynamicTotpCode}}` without requiring any manual interaction.

### 3.3 Terminal Editorial Response Visualizers
CoinTrack includes responsive, dark-mode visualizers styled to mirror the frontend design system (dark `#090a0f` background, `#12151e` card surfaces, emerald `#10b981` gains, and rose `#ef4444` losses). 

To view them:
1. Send the request in Postman.
2. Click the **Visualize** tab in the response pane (next to Pretty, Raw, Preview).

Visualizers are embedded in:
* `GET /api/portfolio/summary` (Consolidated Portfolio Overview with KPI cards)
* `GET /api/portfolio/holdings` (Equities ledger table with color-coded P&L)
* `GET /api/mutual-fund/dashboard` (Mutual Fund Valuation & Scheme Performance)
* `GET /api/epf/summary` (EPF & EPS Account Statement Dashboard)
* `GET /api/ppf/summary` (PPF Passbook Summary)
* `GET /api/fixed-deposits/summary` (Fixed Deposits Portfolio & TDS Overview)
* `GET /api/gold-silver/summary` (Gold & Silver Vault Valuation & Weights)
* `POST /api/calculators/investment/sip` (SIP Wealth Accumulation Card)
* `POST /api/calculators/loans/emi` (EMI Principal vs Interest Amortization Card)

---

## 4. Quick Start Guide

### Step 1: Import Files into Postman
1. Open Postman.
2. Click **Import** (top left).
3. Select the `postman/` directory or drag-and-drop:
   * `CoinTrack_API_Collection.json`
   * `CoinTrack_E2E_Workflow.json`
   * `CoinTrack_Local_Environment.json`
   * `CoinTrack_Staging_Environment.json`

### Step 2: Select Environment
In the top-right environment dropdown, select **CoinTrack Local Environment**.

### Step 3: Run Requests
* To run manually: Navigate to `01. Authentication & Security > 03. Login (Credentials)` and click **Send**. The test script automatically stores `{{token}}` and `{{refreshToken}}`. All downstream requests will now execute authenticated.
* To run the automated workflow: Right-click `CoinTrack E2E Integration Suite` -> **Run collection** -> Click **Run CoinTrack E2E Integration Suite**.

---

## 5. Newman CLI & CI/CD Integration

### 5.1 Local CLI Execution
Install Newman and the HTML reporter:
```bash
npm install -g newman newman-reporter-htmlextra
```

Run the automated integration suite:
```bash
newman run postman/CoinTrack_E2E_Workflow.json \
  -e postman/CoinTrack_Local_Environment.json \
  --bail folder \
  --color on \
  --timeout-request 10000 \
  --delay-request 50
```

Generate rich HTML & JUnit reports:
```bash
mkdir -p reports/newman

newman run postman/CoinTrack_E2E_Workflow.json \
  -e postman/CoinTrack_Local_Environment.json \
  --reporters cli,junit,htmlextra \
  --reporter-junit-export reports/newman/junit-report.xml \
  --reporter-htmlextra-export reports/newman/summary-report.html \
  --reporter-htmlextra-title "CoinTrack E2E Regression Report"
```

### 5.2 GitHub Actions CI Pipeline
Add this workflow to `.github/workflows/api-regression.yml`:

```yaml
name: API Regression Suite (Newman)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  newman-tests:
    name: Run Postman Regression
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: cointrack
          POSTGRES_USER: cointrack
          POSTGRES_PASSWORD: password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 25
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '25'
          cache: 'maven'

      - name: Start CoinTrack Backend
        run: |
          cd backend
          mvn spring-boot:start -Dspring-boot.run.profiles=test &
          npx wait-on http://localhost:8080/api/health --timeout 60000

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Newman
        run: npm install -g newman newman-reporter-htmlextra

      - name: Run E2E Test Suite
        run: |
          mkdir -p reports/newman
          newman run postman/CoinTrack_E2E_Workflow.json \
            -e postman/CoinTrack_Local_Environment.json \
            --reporters cli,junit,htmlextra \
            --reporter-junit-export reports/newman/junit.xml \
            --reporter-htmlextra-export reports/newman/index.html

      - name: Publish Test Results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: reports/newman/junit.xml

      - name: Upload HTML Test Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: newman-report
          path: reports/newman/index.html
```

---

## 6. Environment Variable Reference

| Variable | Scope | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `baseUrl` | Environment | URL | Backend root (e.g. `http://localhost:8080`) |
| `token` | Environment | Secret | Dynamic JWT access token |
| `refreshToken` | Environment | Secret | Token used for session refresh rotation |
| `tokenExpiresAt` | Environment | Timestamp | Epoch time when active JWT token expires |
| `userId` | Environment | UUID | Active user ID |
| `username` | Environment | String | Default username handle |
| `totpSecret` | Environment | Secret | Base32 shared key for automatic 2FA code generation |
| `tempToken` | Environment | Secret | Pre-2FA verification session token |
| `noteId` | Environment | ID | Downstream note ID for update/delete operations |
| `mfSchemeId` | Environment | ID | Downstream mutual fund scheme ID |
| `sipMandateId` | Environment | ID | Downstream mutual fund SIP mandate ID |
| `sipContributionId`| Environment | ID | Downstream SIP contribution ID |
| `lumpsumId` | Environment | ID | Downstream lumpsum transaction ID |
| `redemptionId` | Environment | ID | Downstream redemption transaction ID |
| `epfTransactionId` | Environment | ID | Downstream EPF passbook transaction ID |
| `ppfTransactionId` | Environment | ID | Downstream PPF passbook transaction ID |
| `fdId` | Environment | ID | Downstream fixed deposit certificate ID |
| `goldSilverId` | Environment | ID | Downstream gold/silver bullion holding ID |
| `zerodhaApiKey` | Environment | Secret | Zerodha Kite Connect API Key |
| `zerodhaApiSecret`| Environment | Secret | Zerodha Kite Connect API Secret |
| `zerodhaClientId` | Environment | String | Zerodha Kite Client ID |
| `upstoxApiKey` | Environment | Secret | Upstox Developer API Key |
| `upstoxApiSecret` | Environment | Secret | Upstox Developer API Secret |
| `upstoxClientId` | Environment | String | Upstox Client ID |
| `angeloneApiKey` | Environment | Secret | AngelOne SmartAPI Key |
| `angeloneClientId`| Environment | String | AngelOne Client ID |
| `angelonePin` | Environment | Secret | AngelOne SmartAPI MPIN |
| `angeloneTotp` | Environment | Secret | AngelOne SmartAPI TOTP Base32 Key |

---

## 7. Re-generating Collections

If new Spring Boot controllers or endpoints are added to the backend in the future, simply run:
```bash
python3 postman/build_postman_suite.py
```
This re-compiles the entire suite deterministically, maintaining strict adherence to the Postman v2.1.0 schema, test standards, and visualizer styling.
