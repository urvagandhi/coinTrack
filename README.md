<p align="center">
  <img src="frontend/public/coinTrack.png" alt="coinTrack Logo" width="80" height="80" />
</p>

<h1 align="center">coinTrack</h1>

<p align="center">
  <strong>Multi-broker portfolio tracker for the Indian stock market</strong><br/>
  Aggregate holdings across Zerodha, Angel One & Upstox — with mandatory 2FA, encrypted credential storage, and 41+ financial calculators.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen?logo=springboot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI_3-85EA2D?logo=swagger" alt="Swagger" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Design](#system-design)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [API Reference](#api-reference)
- [Security Model](#security-model)
- [Data Flow](#data-flow)
- [Calculator Suite](#calculator-suite)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

coinTrack is a production-grade personal finance platform built for Indian retail investors. It connects to multiple stock brokers via OAuth, aggregates portfolio data into a unified view, and provides real-time P&L tracking — all while keeping credentials encrypted at rest with AES-256-GCM.

### Why coinTrack?

| Problem | Solution |
|---------|----------|
| Portfolio split across multiple brokers | Unified dashboard aggregating Zerodha + Angel One + Upstox |
| Broker sessions expire daily | Auto-detection + one-click reconnect flow |
| No free tool for MF + equity in one view | Holdings, positions, mutual funds, SIPs — all in one screen |
| Manual P&L tracking in spreadsheets | Real-time day gain, unrealized P&L, cost basis from broker APIs |
| Financial planning scattered across sites | 41 built-in calculators (SIP, EMI, tax, NPS, retirement, etc.) |

---

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        FE["Next.js 16<br/>(Vercel Edge)"]
        RQ["React Query<br/>Cache + Polling"]
        AX["Axios HTTP"]
        FE --> RQ --> AX
    end

    subgraph API["API Layer (Spring Boot 3.5.5 — Render.com)"]
        direction TB
        FC["Security Filter Chain<br/>CORS → RequestId → JWT → RateLimit"]

        subgraph Controllers
            AC["Auth<br/>Controller"]
            PC["Portfolio<br/>Controller"]
            BC["Broker<br/>Controller"]
            EC["Email<br/>Controller"]
            NC["Notes<br/>Controller"]
            CC["Calculator<br/>Controller"]
        end

        subgraph Services
            AS["UserAuth<br/>Service"]
            PS["Portfolio<br/>Summary"]
            PA["Portfolio<br/>Aggregation"]
            SS["Sync<br/>Scheduler"]
            TS["TOTP<br/>Service"]
            JS["JWT<br/>Service"]
        end

        subgraph Brokers["Broker Adapter Layer (Hexagonal)"]
            ZA["Zerodha<br/>Adapter"]
            AA["AngelOne<br/>Adapter"]
            UA["Upstox<br/>Adapter"]
            CM["Canonical<br/>Models"]
            ZA & AA & UA --> CM
        end

        FC --> Controllers
        Controllers --> Services
        Services --> Brokers
    end

    subgraph Data["Data Layer"]
        MDB[("MongoDB Atlas<br/>AP_SOUTH_1<br/>3-Node Replica")]
        BR["Brevo<br/>Email API"]
        KA["Kite Connect<br/>API"]
        SA["SmartAPI"]
        UPA["Upstox v2<br/>API"]
    end

    AX -->|"HTTPS + JWT Bearer"| FC
    Services --> MDB
    Services --> BR
    ZA --> KA
    AA --> SA
    UA --> UPA

    style Client fill:#e8f4fd,stroke:#2196F3
    style API fill:#fff3e0,stroke:#FF9800
    style Data fill:#e8f5e9,stroke:#4CAF50
    style Brokers fill:#fce4ec,stroke:#E91E63
```

### Module Dependency Graph

```mermaid
graph TD
    COMMON["common/<br/>utils, exceptions, config"]

    COMMON --> SECURITY["security/<br/>JWT, filters, config"]
    COMMON --> USER["user/<br/>auth, profile, TOTP"]
    COMMON --> EMAIL["email/<br/>Brevo, templates"]
    COMMON --> CALC["calculator/<br/>41 financial tools"]

    SECURITY --> BROKER["broker/<br/>hexagonal adapters"]
    USER --> NOTES["notes/<br/>journal CRUD"]

    BROKER --> PORTFOLIO["portfolio/<br/>aggregation, sync, summary"]

    style COMMON fill:#fff9c4,stroke:#FFC107
    style SECURITY fill:#ffcdd2,stroke:#F44336
    style BROKER fill:#e1bee7,stroke:#9C27B0
    style PORTFOLIO fill:#c8e6c9,stroke:#4CAF50
    style USER fill:#bbdefb,stroke:#2196F3
    style EMAIL fill:#ffe0b2,stroke:#FF9800
    style CALC fill:#d1c4e9,stroke:#673AB7
    style NOTES fill:#b2dfdb,stroke:#009688
```

---

## System Design

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend
    participant DB as MongoDB
    participant E as Brevo Email

    Note over C,E: Registration
    C->>B: POST /api/auth/register
    B->>DB: Save to pending_registrations
    B->>E: Send verification email
    B-->>C: 201 "Check your email"

    C->>B: GET /api/auth/verify?token=xxx
    B->>DB: Move to users collection
    B-->>C: 200 "Email verified"

    Note over C,E: Login (2FA Mandatory)
    C->>B: POST /api/auth/login {email, password}
    B->>DB: Verify credentials
    B-->>C: 200 {totpRequired: true}

    C->>B: POST /api/auth/login {email, password, totpCode}
    B->>B: Verify TOTP code
    B->>DB: Create refresh token
    B-->>C: 200 {accessToken, refreshToken}

    Note over C,B: Authenticated Requests
    C->>B: GET /api/portfolio/summary (Bearer token)
    B->>B: JwtFilter validates token
    B-->>C: 200 {portfolio data}

    Note over C,B: Token Refresh
    C->>B: POST /api/auth/refresh {refreshToken}
    B->>DB: Validate & rotate refresh token
    B-->>C: 200 {newAccessToken, newRefreshToken}
```

### Broker Connection Flow (Zerodha)

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend
    participant Z as Zerodha API
    participant DB as MongoDB

    Note over C,DB: Step 1 — Save Credentials
    C->>B: POST /api/broker/zerodha/credentials<br/>{apiKey, apiSecret}
    B->>B: encrypt(apiSecret) with AES-256-GCM
    B->>DB: Save BrokerAccount
    B-->>C: 200 "Credentials saved"

    Note over C,DB: Step 2 — OAuth Connect
    C->>B: GET /api/broker/zerodha/connect
    B-->>C: 302 Redirect to kite.zerodha.com/connect/login

    C->>Z: User logs in on Zerodha
    Z-->>C: Redirect to callback?request_token=xxx

    C->>B: POST /api/broker/callback {requestToken}
    B->>Z: POST /session/token (exchange)
    Z-->>B: {access_token}
    B->>B: encrypt(access_token)
    B->>DB: Update BrokerAccount (encrypted token)

    Note over C,DB: Step 3 — Initial Sync
    B->>Z: GET /portfolio/holdings
    Z-->>B: Raw holdings data
    B->>B: Normalize to CanonicalHolding
    B->>DB: Persist canonical data
    B-->>C: 200 "Connected & synced"
```

### Portfolio Sync Pipeline

```mermaid
flowchart LR
    subgraph Trigger
        SCHED["Scheduler<br/>(every 15min)"]
        MANUAL["Manual Refresh<br/>POST /api/portfolio/refresh"]
        CONNECT["On Broker<br/>Connect"]
    end

    subgraph Aggregation["Aggregation Layer"]
        direction TB
        BUILD["Build broker<br/>sessions"]
        CHECK["Check<br/>capabilities"]
        FETCH["Fetch via<br/>adapters"]
        NORM["Normalize to<br/>canonical models"]
        BUILD --> CHECK --> FETCH --> NORM
    end

    subgraph Persist["Data Store"]
        MDB[("MongoDB<br/>canonical_*")]
    end

    subgraph Enrich["Summary Service"]
        direction TB
        MERGE["Merge holdings<br/>across brokers"]
        LTP["Enrich with<br/>live prices (LTP)"]
        PNL["Calculate P&L<br/>day gain"]
        SORT["Sort by value<br/>DESC"]
        MERGE --> LTP --> PNL --> SORT
    end

    subgraph Output
        DASH["Dashboard<br/>(Frontend)"]
    end

    Trigger --> BUILD
    NORM --> MDB
    MDB --> MERGE
    SORT --> DASH

    style Trigger fill:#fff3e0,stroke:#FF9800
    style Aggregation fill:#e8f5e9,stroke:#4CAF50
    style Persist fill:#e3f2fd,stroke:#2196F3
    style Enrich fill:#fce4ec,stroke:#E91E63
    style Output fill:#f3e5f5,stroke:#9C27B0
```

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 21 (LTS) | Runtime |
| Spring Boot | 3.5.5 | Application framework |
| Spring Security | 6.5.x | Authentication & authorization |
| Spring Data MongoDB | 4.x | Database access |
| Spring WebFlux | 6.x | Non-blocking HTTP client (broker APIs) |
| SpringDoc OpenAPI | 2.x | **Swagger UI** — interactive API docs |
| JJWT | 0.12.5 | JWT token signing & validation |
| TOTP (dev.samstevens) | 1.7.1 | Time-based One-Time Password |
| BouncyCastle | 1.78 | AES-256-GCM encryption |
| Bucket4j | 8.x | Rate limiting |
| Caffeine | 3.x | In-memory cache (JWT blacklist) |
| ZXing | 3.5.3 | QR code generation for 2FA setup |
| Brevo API | REST | Transactional email delivery |
| Maven | 3.9.9 | Build & dependency management |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.0.10 | React framework (App Router) |
| React | 18.3.1 | UI library |
| Tailwind CSS | 3.4.14 | Utility-first styling |
| React Query | 5.90.12 | Server state management + caching |
| Axios | 1.7.0 | HTTP client |
| Framer Motion | 11.0.0 | Animations & transitions |
| Radix UI | latest | Accessible UI primitives |
| React Hook Form | 7.52.0 | Form handling |
| Recharts | 2.9.0 | Charts & data visualization |
| Lucide React | 0.545.0 | Icon library |

### Infrastructure

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Database (3-node replica set, AP_SOUTH_1) |
| Render.com | Backend hosting (Docker container) |
| Vercel | Frontend hosting (Edge network) |
| Brevo | Transactional email (300/day free tier) |
| GitHub Actions | CI/CD + keep-alive cron pings |

---

## Features

### Portfolio Management
- **Multi-broker aggregation** — View holdings from Zerodha, Angel One, and Upstox in a single dashboard
- **Real-time P&L** — Day gain, unrealized P&L with percentage change
- **Holdings tracking** — Equity, ETFs with cost basis, current value, and broker tags
- **Positions monitoring** — Intraday and F&O derivative positions
- **Mutual funds** — MF holdings, SIP schedules, order history, timeline (Zerodha)
- **Auto-sync** — Background portfolio refresh every 15 minutes during market hours
- **Manual sync** — One-click refresh with optimistic UI updates

### Broker Integration

```mermaid
graph LR
    subgraph Brokers
        Z["Zerodha<br/>Kite Connect"]
        A["Angel One<br/>SmartAPI"]
        U["Upstox<br/>v2 API"]
    end

    subgraph Capabilities
        H["Holdings"]
        P["Positions"]
        F["Funds"]
        MF["Mutual Funds"]
        WS["Live WebSocket"]
        ORD["Order History"]
    end

    Z -->|"Full"| H & P & F & MF & WS & ORD
    A -->|"Partial"| H & P & F
    U -->|"Partial"| H & P & F

    style Z fill:#ff6b35,color:#fff
    style A fill:#1976d2,color:#fff
    style U fill:#7b1fa2,color:#fff
```

| Capability | Zerodha | Angel One | Upstox |
|-----------|---------|-----------|--------|
| OAuth Connection | Yes | Yes | Yes |
| Holdings | Yes | Yes | Yes |
| Positions | Yes | Yes | Yes |
| Funds/Margins | Yes | Yes | Yes |
| MF Holdings | Yes | — | — |
| MF SIPs | Yes | — | — |
| MF Orders | Yes | — | — |
| Order History | Yes | — | — |
| Live WebSocket | Yes | — | — |

### Security
- **Mandatory 2FA** — TOTP-based (Google Authenticator, Authy)
- **10 backup codes** — One-time recovery codes generated at setup
- **AES-256-GCM encryption** — All broker API secrets and access tokens encrypted at rest
- **JWT authentication** — Stateless auth with refresh token rotation
- **Rate limiting** — Brute-force protection on login and sensitive endpoints
- **Request correlation** — Every request tagged with a unique ID (MDC logging)

### Financial Calculators (41 tools)

| Category | Calculators |
|----------|------------|
| **Investment** | SIP, Lumpsum, Step-up SIP, XIRR, CAGR, Inflation, Stock Average |
| **Loans** | EMI, Home Loan, Car Loan, Compound Interest, Simple Interest, Flat vs Reducing |
| **Savings** | PPF, NPS, FD, RD, SSY, NSC, SCSS, MIS, APY, EPF |
| **Tax** | Income Tax, Salary, HRA, Gratuity, TDS, GST |
| **Trading** | Brokerage, Margin |
| **Planning** | Retirement |

### User Experience
- **Dark mode** — System-aware theme with manual toggle
- **Mobile responsive** — Works on all screen sizes
- **Skeleton loading** — Smooth loading states
- **Toast notifications** — Contextual alerts for broker status, errors
- **Personal notes** — Investment journal with CRUD operations

---

## Project Structure

```
coinTrack/
│
├── backend/                                    # Spring Boot API
│   ├── src/main/java/com/urva/myfinance/coinTrack/
│   │   ├── broker/                             # Multi-broker integration
│   │   │   ├── adapters/                       #   Hexagonal adapter implementations
│   │   │   │   ├── zerodha/                    #     Zerodha Kite Connect
│   │   │   │   ├── angelone/                   #     Angel One SmartAPI
│   │   │   │   └── upstox/                     #     Upstox v2 API
│   │   │   ├── core/                           #   Ports, canonical models, capabilities
│   │   │   ├── controller/                     #   Connect, status, disconnect endpoints
│   │   │   ├── normalization/                  #   Symbol, exchange, price normalizers
│   │   │   ├── registry/                       #   Auto-discovery of adapters
│   │   │   └── service/                        #   ZerodhaLiveDataService, BrokerConnectService
│   │   │
│   │   ├── portfolio/                          # Portfolio aggregation & sync
│   │   │   ├── aggregation/                    #   Cross-broker data merger
│   │   │   ├── controller/                     #   Portfolio, holdings, sync endpoints
│   │   │   ├── enrichment/                     #   P&L calculation, LTP enrichment
│   │   │   ├── market/                         #   Market data service (Zerodha LTP API)
│   │   │   ├── repository/                     #   Canonical data repositories
│   │   │   ├── service/                        #   Summary, net position services
│   │   │   └── sync/                           #   Sync scheduler & sync service
│   │   │
│   │   ├── security/                           # Auth infrastructure
│   │   │   ├── config/                         #   SecurityConfig, filter chain
│   │   │   ├── filter/                         #   JwtFilter (OncePerRequest)
│   │   │   └── service/                        #   JWTService
│   │   │
│   │   ├── user/                               # User management
│   │   │   ├── controller/                     #   AuthController, UserController, TotpController
│   │   │   ├── model/                          #   User, RefreshToken, PendingRegistration
│   │   │   └── service/                        #   AuthService, TotpService (361 lines)
│   │   │
│   │   ├── email/                              # Brevo email integration
│   │   │   ├── controller/                     #   Verification, password reset, contact
│   │   │   └── service/                        #   BrevoEmailService, EmailSender
│   │   │
│   │   ├── notes/                              # Personal investment journal
│   │   ├── calculator/                         # 41 financial calculators (6 controllers)
│   │   └── common/                             # Shared: EncryptionUtil, GlobalExceptionHandler
│   │
│   ├── src/main/resources/
│   │   ├── templates/email/                    # 7 Thymeleaf email templates
│   │   ├── application.properties
│   │   ├── application-dev.properties
│   │   └── application-prod.properties
│   │
│   ├── Dockerfile                              # Multi-stage Alpine build
│   └── pom.xml
│
├── frontend/                                   # Next.js 16 App
│   ├── src/app/
│   │   ├── (access)/                           # Public: login, register, forgot-password, 2FA
│   │   ├── (main)/                             # Protected: dashboard, portfolio, brokers, notes
│   │   │   ├── dashboard/                      #   Portfolio overview with P&L cards
│   │   │   ├── portfolio/                      #   Tabbed view: holdings, positions, MF, orders
│   │   │   ├── brokers/                        #   Zerodha, AngelOne, Upstox setup & dashboards
│   │   │   ├── notes/                          #   Investment journal
│   │   │   ├── profile/                        #   User profile
│   │   │   └── settings/                       #   2FA settings
│   │   └── calculators/                        # 41 calculator pages (public, no auth)
│   │       ├── investment/                     #   SIP, lumpsum, CAGR, XIRR, etc.
│   │       ├── loans/                          #   EMI, compound interest, etc.
│   │       ├── savings/                        #   PPF, NPS, FD, RD, SSY, etc.
│   │       ├── tax/                            #   Income tax, HRA, gratuity, etc.
│   │       ├── trading/                        #   Brokerage, margin
│   │       └── planning/                       #   Retirement
│   │
│   ├── src/components/                         # Reusable UI (auth, dashboard, layout, portfolio)
│   ├── src/contexts/                           # AuthContext, ThemeContext
│   ├── src/hooks/                              # Portfolio, broker, tab hooks
│   ├── src/lib/                                # API client (40+ methods), formatters, broker config
│   └── src/providers/                          # React Query provider
│
├── .github/workflows/keep-alive.yml            # Cron job to prevent Render spindown
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 21+ | [Eclipse Temurin](https://adoptium.net/) |
| Node.js | 18.17+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Included with Node.js |
| MongoDB | 7+ (or Atlas) | [mongodb.com](https://www.mongodb.com/atlas) |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |

### Option A: Run Locally (Recommended for Development)

#### 1. Clone the repository

```bash
git clone https://github.com/urvagandhi/coinTrack.git
cd coinTrack
```

#### 2. Backend setup

```bash
cd backend

# Create environment config
cat > src/main/resources/application-secret.properties << 'EOF'
spring.data.mongodb.uri=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=Finance
spring.data.mongodb.database=Finance

jwt.secret=<your-256-bit-hex-secret>
app.encryption.secret-key=<exactly-32-characters>
totp.encryption-key=<64-character-hex-key>

brevo.api-key=<your-brevo-api-key>

zerodha.redirect.url=http://localhost:3000/brokers/zerodha/callback
frontend.url=http://localhost:3000
app.cors.allowed-origins=http://localhost:3000
EOF

# Build and run
./mvnw clean install -DskipTests
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The API starts at **http://localhost:8080**.

#### 3. Frontend setup

```bash
cd frontend

# Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Install and run
npm install
npm run dev
```

The app starts at **http://localhost:3000**.

### Option B: Run with Docker

```bash
# Backend
cd backend
docker build -t cointrack-api .
docker run -p 8080:8080 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="..." \
  -e ENCRYPTION_SECRET_KEY="..." \
  -e TOTP_ENCRYPTION_KEY="..." \
  -e BREVO_API_KEY="..." \
  -e FRONTEND_URL="http://localhost:3000" \
  -e CORS_ALLOWED_ORIGINS="http://localhost:3000" \
  cointrack-api

# Frontend
cd frontend
npm run build && npm start
```

### Option C: Use Live Production

| Service | URL |
|---------|-----|
| Frontend | https://cointrack-finance.vercel.app |
| Backend API | https://cointrack-15gt.onrender.com |
| Swagger UI | https://cointrack-15gt.onrender.com/swagger-ui.html |

> **Note:** The Render free tier spins down after inactivity. First request may take 30-60 seconds. A GitHub Actions cron pings the health endpoint every 5 minutes to keep it warm.

### Generating Secret Keys

```bash
# JWT Secret (256-bit hex)
openssl rand -hex 32

# Encryption Key (32 characters)
openssl rand -base64 24

# TOTP Encryption Key (64 hex characters)
openssl rand -hex 32
```

---

## Environment Variables

### Backend (`application-secret.properties` or system env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster/` |
| `MONGODB_DB` | No | Database name (default: `Finance`) | `Finance` |
| `JWT_SECRET` | Yes | 256-bit signing key (hex) | `a1b2c3d4...` (64 chars) |
| `ENCRYPTION_SECRET_KEY` | Yes | AES-256 key (exactly 32 chars) | `mySecretKey12345678901234567890` |
| `TOTP_ENCRYPTION_KEY` | Yes | TOTP encryption key (64 hex chars) | `a1b2c3...` |
| `BREVO_API_KEY` | Yes | Brevo email API key | `xkeysib-...` |
| `FRONTEND_URL` | Yes | Frontend origin for emails/links | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | Yes | Allowed CORS origins | `http://localhost:3000` |
| `ZERODHA_REDIRECT_URL` | No | Zerodha OAuth callback | `.../brokers/zerodha/callback` |
| `ANGELONE_REDIRECT_URL` | No | Angel One OAuth callback | `.../brokers/angelone/callback` |
| `UPSTOX_REDIRECT_URL` | No | Upstox OAuth callback | `.../brokers/upstox/callback` |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE` | Yes | Backend API URL |
| `NEXT_PUBLIC_APP_URL` | No | Frontend URL (for OAuth callbacks) |

---

## Deployment

### Production Architecture

```mermaid
graph LR
    subgraph GitHub
        GA["GitHub Actions<br/>keep-alive cron<br/>(every 5 min)"]
    end

    subgraph Vercel["Vercel (Frontend)"]
        NX["Next.js SSR<br/>Edge Network<br/>Auto-deploy on push"]
    end

    subgraph Render["Render.com (Backend)"]
        SB["Spring Boot<br/>Docker Alpine<br/>Health checks"]
    end

    subgraph Atlas["MongoDB Atlas"]
        DB[("3-Node Replica Set<br/>AP_SOUTH_1<br/>Encrypted at Rest")]
    end

    subgraph Brevo
        EM["Transactional<br/>Email API"]
    end

    GA -->|"ping /health"| SB
    NX -->|"HTTPS"| SB
    SB --> DB
    SB --> EM

    style Vercel fill:#000,color:#fff
    style Render fill:#46E3B7,color:#000
    style Atlas fill:#00684A,color:#fff
```

### Deploy Backend to Render

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repository, select `backend/` as root
4. Set environment to **Docker**
5. Add all environment variables from the table above
6. Deploy — health checks are built into the Dockerfile

### Deploy Frontend to Vercel

1. Import repository on [vercel.com](https://vercel.com)
2. Set framework: **Next.js**, root directory: `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_BASE` = your Render URL
4. Deploy — auto-deploys on every push to `main`

---

## API Documentation (Swagger)

coinTrack includes **SpringDoc OpenAPI 3** with full Swagger UI for interactive API exploration.

### Access Swagger UI

| Environment | URL |
|------------|-----|
| Local | http://localhost:8080/swagger-ui.html |
| Production | https://cointrack-15gt.onrender.com/swagger-ui.html |

### OpenAPI JSON Spec

| Environment | URL |
|------------|-----|
| Local | http://localhost:8080/v3/api-docs |
| Production | https://cointrack-15gt.onrender.com/v3/api-docs |

### What's Documented

Swagger UI provides interactive documentation for **all 40+ API endpoints**:

- **Try it out** — Execute API calls directly from the browser
- **Request/Response schemas** — Full DTO definitions with field types
- **Authentication** — Add your JWT token via the "Authorize" button
- **Grouped by module** — Auth, User, Broker, Portfolio, Notes, Calculators
- **Error responses** — Documented error codes and formats

```mermaid
graph LR
    DEV["Developer"] -->|"Opens browser"| SW["Swagger UI<br/>/swagger-ui.html"]
    SW -->|"Try it out"| API["Spring Boot API"]
    API -->|"JSON response"| SW
    SW -->|"Download"| SPEC["OpenAPI 3 Spec<br/>/v3/api-docs"]
    SPEC -->|"Import"| POSTMAN["Postman /<br/>Insomnia"]

    style SW fill:#85EA2D,color:#000
    style API fill:#6DB33F,color:#fff
```

> **Tip:** You can import the OpenAPI spec (`/v3/api-docs`) into Postman or Insomnia for offline API testing.

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register new user |
| `GET` | `/api/auth/verify` | Public | Verify email token |
| `POST` | `/api/auth/login` | Public | Login (returns JWT or TOTP prompt) |
| `POST` | `/api/auth/refresh` | Public | Refresh JWT token |
| `POST` | `/api/auth/logout` | JWT | Invalidate token |
| `POST` | `/api/auth/forgot-password` | Public | Send reset email |
| `POST` | `/api/auth/reset-password` | Public | Reset with token |

### User & 2FA

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/user/profile` | JWT | Get user profile |
| `PUT` | `/api/user/profile` | JWT | Update profile |
| `POST` | `/api/totp/setup` | JWT | Generate TOTP secret + QR code |
| `POST` | `/api/totp/verify` | JWT | Verify TOTP code |
| `POST` | `/api/totp/backup-codes/verify` | JWT | Verify backup code |
| `GET` | `/api/totp/backup-codes` | JWT | Get remaining backup codes |

### Broker

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/broker/{broker}/credentials` | JWT | Save API key/secret |
| `GET` | `/api/broker/{broker}/connect` | JWT | Get OAuth login URL |
| `POST` | `/api/broker/callback` | JWT | Handle OAuth callback |
| `GET` | `/api/broker/status` | JWT | All broker statuses |
| `DELETE` | `/api/broker/{broker}/disconnect` | JWT | Disconnect broker |

### Portfolio

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/portfolio/summary` | JWT | Full portfolio summary with P&L |
| `GET` | `/api/portfolio/holdings` | JWT | All holdings across brokers |
| `GET` | `/api/portfolio/positions` | JWT | All positions across brokers |
| `GET` | `/api/portfolio/funds` | JWT | Funds/margins per broker |
| `POST` | `/api/portfolio/refresh` | JWT | Trigger manual sync |

### Notes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/notes` | JWT | List all notes (paginated) |
| `POST` | `/api/notes` | JWT | Create note |
| `PUT` | `/api/notes/{id}` | JWT | Update note |
| `DELETE` | `/api/notes/{id}` | JWT | Delete note |

### Calculators (Public — No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/calculators/investment/sip` | SIP returns calculator |
| `POST` | `/api/calculators/investment/lumpsum` | Lumpsum returns |
| `POST` | `/api/calculators/investment/cagr` | CAGR calculator |
| `POST` | `/api/calculators/loans/emi` | EMI calculator |
| `POST` | `/api/calculators/savings/ppf` | PPF maturity |
| `POST` | `/api/calculators/savings/nps` | NPS projection |
| `POST` | `/api/calculators/tax/income-tax` | Income tax estimator |
| ... | `/api/calculators/**` | **41 calculators total** |

> Full interactive docs with request/response schemas available at **[Swagger UI](#api-documentation-swagger)**.

---

## Security Model

### Encryption at Rest

```mermaid
graph LR
    PT["Plaintext<br/>(API Secret / Token)"]
    ENC["EncryptionUtil<br/>AES-256-GCM"]
    CT["Base64 Ciphertext<br/>[IV₁₂ | CT | Tag₁₆]"]
    DB[("MongoDB")]

    PT -->|"encrypt()"| ENC
    ENC -->|"Store"| CT
    CT --> DB

    DB -->|"Read"| CT2["Ciphertext"]
    CT2 -->|"decryptSafe()"| ENC2["EncryptionUtil"]
    ENC2 --> PT2["Plaintext"]

    style ENC fill:#ffcdd2,stroke:#F44336
    style ENC2 fill:#c8e6c9,stroke:#4CAF50
```

**What's encrypted:**
- Broker API secrets (`encryptedZerodhaApiSecret`)
- Broker access tokens (`zerodhaAccessToken`)
- TOTP secrets (separate key via `TOTP_ENCRYPTION_KEY`)

**What's hashed (irreversible):**
- User passwords (BCrypt with salt)

### JWT Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Active: Login + 2FA
    Active --> Expired: Token TTL expires
    Active --> Blacklisted: Logout
    Expired --> Active: Refresh token
    Expired --> Unauthenticated: Refresh expired
    Blacklisted --> Unauthenticated: Must re-login

    note right of Active: JWT in Authorization header
    note right of Blacklisted: Caffeine cache (in-memory)
```

### Request Filter Chain

```mermaid
graph LR
    REQ["HTTP<br/>Request"]
    RID["RequestId<br/>Filter"]
    CORS["CORS<br/>Filter"]
    JWT["JWT<br/>Filter"]
    RATE["Rate Limit<br/>Filter"]
    CTRL["Controller"]
    SVC["Service"]
    RES["HTTP<br/>Response"]

    REQ --> RID --> CORS --> JWT --> RATE --> CTRL --> SVC --> RES

    style JWT fill:#ffcdd2,stroke:#F44336
    style RATE fill:#fff3e0,stroke:#FF9800
```

---

## Data Flow

### How Portfolio Data Moves Through the System

```mermaid
graph TD
    subgraph External["Broker APIs"]
        ZK["Zerodha<br/>Kite Connect"]
        AO["Angel One<br/>SmartAPI"]
        UP["Upstox v2"]
    end

    subgraph Adapters["Adapter Layer"]
        ZA["Zerodha<br/>Adapter"]
        AA["AngelOne<br/>Adapter"]
        UA["Upstox<br/>Adapter"]
    end

    subgraph Mappers["Normalization"]
        ZM["Zerodha<br/>Mapper"]
        AM["AngelOne<br/>Mapper"]
        UM["Upstox<br/>Mapper"]
    end

    subgraph Canonical["Canonical Models"]
        CH["CanonicalHolding"]
        CP["CanonicalPosition"]
        CF["CanonicalFunds"]
        CMF["CanonicalMfHolding"]
    end

    subgraph Storage
        DB[("MongoDB")]
    end

    subgraph Summary["Summary Service"]
        MERGE["Merge across<br/>brokers"]
        LTP["Enrich with<br/>live LTP"]
        PNL["Calculate<br/>P&L"]
    end

    subgraph UI["Frontend"]
        DASH["Dashboard"]
        PORT["Portfolio"]
    end

    ZK --> ZA --> ZM --> CH & CP & CF & CMF
    AO --> AA --> AM --> CH & CP & CF
    UP --> UA --> UM --> CH & CP & CF

    CH & CP & CF & CMF --> DB
    DB --> MERGE --> LTP --> PNL --> DASH & PORT

    style External fill:#fff3e0
    style Canonical fill:#e8f5e9
    style Storage fill:#e3f2fd
    style UI fill:#f3e5f5
```

---

## Calculator Suite

All 41 calculators are **publicly accessible** (no login required) and **rate-limited** to prevent abuse.

### Investment Calculators
- **SIP Calculator** — Monthly investment returns over time
- **Lumpsum Calculator** — One-time investment growth
- **Step-up SIP** — SIP with annual increment
- **XIRR Calculator** — Internal rate of return for irregular cash flows
- **CAGR Calculator** — Compound annual growth rate
- **Inflation Calculator** — Future value adjusted for inflation
- **Stock Average Calculator** — Average buy price across multiple purchases

### Loan Calculators
- **EMI Calculator** — Equated monthly installment
- **Home Loan EMI** — With down payment and tenure
- **Car Loan EMI** — Auto loan specific
- **Compound Interest** — Growth with compounding
- **Simple Interest** — Linear growth
- **Flat vs Reducing Rate** — Compare loan structures

### Savings Calculators
- **PPF** — Public Provident Fund maturity
- **NPS** — National Pension System projection
- **FD / RD** — Fixed & Recurring Deposit returns
- **SSY** — Sukanya Samriddhi Yojana
- **NSC / SCSS / MIS / APY / EPF** — Government scheme calculators

### Tax Calculators
- **Income Tax** — Old vs new regime comparison
- **Salary Calculator** — Net take-home from CTC
- **HRA Exemption** — House Rent Allowance calculation
- **Gratuity** — End-of-service benefit
- **TDS / GST** — Tax deduction and goods & services tax

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
refactor: Code restructuring (no behavior change)
docs:     Documentation only
style:    Formatting (no code change)
test:     Adding tests
chore:    Build, CI, tooling
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with Java 21, Spring Boot, Next.js, and MongoDB<br/>
  <sub>Designed for Indian retail investors</sub>
</p>
