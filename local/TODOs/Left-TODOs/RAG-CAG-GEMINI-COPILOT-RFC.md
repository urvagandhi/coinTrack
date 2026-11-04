# RFC-042: CoinTrack Wealth Copilot — RAG & CAG Architecture Powered by Google Gemini

**Status:** PROPOSED (Targeted for Implementation in Post-UI Redesign Phase)  
**Author:** DeepMind Antigravity Pair  
**Scope:** Backend (`/backend`), Frontend (`/frontend`), AI Engine (Google Gemini API 2.5 Flash/Pro)  
**Tags:** `ai`, `rag`, `cag`, `gemini-api`, `context-caching`, `pgvector`, `fintech-copilot`

---

## 1. Executive Summary & Vision

CoinTrack aggregates high-fidelity financial data across 6 distinct asset classes: Indian Equities (Zerodha, Upstox, Angel One), Mutual Funds (AMFI daily NAVs, SIPs), Statutory Ledgers (EPF, PPF, FDs), and Precious Metals (MCX 24K/22K Gold & Silver).

Currently, portfolio insights and rebalancing signals rely on deterministic heuristics. **CoinTrack Wealth Copilot** introduces a dual-layer **RAG (Retrieval-Augmented Generation)** and **CAG (Cache-Augmented Generation)** architecture powered by the **Google Gemini API** (`gemini-2.5-flash` for real-time streaming queries and `gemini-2.5-pro` for deep tax harvesting audits).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        COINTRACK RAG / CAG DUAL-ENGINE                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌──────────────────────────────────────────┐  ┌────────────────────────────────────┐ │
│   │      CAG (Cache-Augmented Generation)    │  │  RAG (Retrieval-Augmented Gen.)    │ │
│   │  • Indian Income Tax Act (112A, 111A)    │  │  • Real-time Demat Positions       │ │
│   │  • SEBI Mutual Fund Categorization Slabs │  │  • Executed Trades & Order Books   │ │
│   │  • Section 80C Deduction Limits (₹1.5L)  │  │  • EPF Passbooks & FD Maturities   │ │
│   │  • Pre-warmed in Gemini Context Cache    │  │  • Stored in PGVector (PostgreSQL) │ │
│   └────────────────────┬─────────────────────┘  └──────────────────┬─────────────────┘ │
│                        │                                           │                   │
│                        └─────────────────────┬─────────────────────┘                   │
│                                              ▼                                         │
│                        ┌───────────────────────────────────────────┐                   │
│                        │       Google Gemini 2.5 Flash Engine      │                   │
│                        │    (System Prompt + Structured Schemas)   │                   │
│                        └─────────────────────┬─────────────────────┘                   │
│                                              │                                         │
│                 ┌────────────────────────────┴───────────────────────────┐             │
│                 ▼                                                        ▼             │
│    [ Interactive Copilot Drawer ]                         [ Dynamic Dashboard Widgets ]│
│    Natural language portfolio chat,                       Real-time rebalance drift,   │
│    tax scenario modeling, ledger audit                    tax harvesting, SIP triggers │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why CAG (Cache-Augmented Generation) + RAG?

In financial applications, naive RAG often fails due to high latency, chunking fragmentation of legal rules, and high token costs. CoinTrack solves this by combining **CAG** and **RAG**:

### 2.1 Cache-Augmented Generation (CAG)
- **What it caches:** The static, large regulatory corpus:
  1. Indian Union Budget 2024–2026 capital gains tax rules (LTCG threshold ₹1.25 Lakh @ 12.5%, STCG @ 20%).
  2. Section 80C, 80D, 80CCD(1B) NPS rules.
  3. EPF taxable interest thresholds (employee contribution > ₹2.5L/year).
  4. AMFI Riskometer standards and SEBI rebalancing caps.
- **Implementation via Gemini:** Gemini API **Context Caching** (`google-genai` SDK / REST API).
- **Benefits:**
  - **85% cost reduction** on input tokens for regulatory context.
  - **Sub-500ms time-to-first-token (TTFT)** for complex tax questions.
  - Zero retrieval chunking loss on complex statutory tax clauses.

### 2.2 Retrieval-Augmented Generation (RAG)
- **What it retrieves:** Dynamic, user-isolated financial state:
  1. Active equity holdings from Zerodha Kite, Upstox, Angel One.
  2. Realized FIFO capital gains ledgers for the current financial year.
  3. Margin annotations & investment thesis notes (`/notes`).
  4. Daily AMFI NAV crawled prices and MCX bullion spot rates.
- **Storage:** PostgreSQL **PGVector** extension in our existing Supabase/PostgreSQL instance.
- **Embeddings:** `text-embedding-004` (768 dimensions), indexed with HNSW.

---

## 3. System Architecture & Endpoints

### 3.1 Backend Integration (`/backend`)

New Spring Boot module: `com.urva.myfinance.coinTrack.copilot`

```
backend/src/main/java/com/urva/myfinance/coinTrack/copilot/
├── controller/
│   └── CopilotController.java          # POST /api/copilot/chat, POST /api/copilot/insights
├── service/
│   ├── GeminiClientService.java        # HTTP client wrapping Google Gemini API (v1beta)
│   ├── ContextCacheManager.java        # Manages TTL and warming of Gemini Context Caches
│   ├── PortfolioVectorStore.java       # PGVector similarity search scoped by userId
│   └── CopilotSynthesisService.java    # Coordinates RAG retrieval + CAG prompt assembly
├── dto/
│   ├── CopilotChatRequest.java
│   ├── CopilotChatResponse.java
│   └── StructuredRebalanceInsight.java # Typed schema for dashboard hydration
└── config/
    └── GeminiConfigProperties.java     # gemini.api-key, gemini.model, gemini.cache-ttl
```

### 3.2 Function Calling / Tool Declarations

Gemini 2.5 will be equipped with strict tool contracts to query the portfolio without hallucinating balances:

```json
[
  {
    "name": "get_live_holdings",
    "description": "Fetch current stock and mutual fund holdings with real-time valuations and unrealized P&L",
    "parameters": {
      "type": "object",
      "properties": {
        "assetClass": { "type": "string", "enum": ["EQUITY", "MUTUAL_FUND", "GOLD", "ALL"] }
      }
    }
  },
  {
    "name": "calculate_tax_harvesting_opportunity",
    "description": "Calculate remaining tax-exempt LTCG allowance (₹1.25 Lakh limit) and identify candidate stocks to sell and immediately rebuy",
    "parameters": {
      "type": "object",
      "properties": {
        "financialYear": { "type": "string", "description": "e.g. FY 2026-27" }
      }
    }
  },
  {
    "name": "simulate_rebalance_allocation",
    "description": "Simulates allocating fresh capital across debt and equity to reach a 40/30/15/15 target model",
    "parameters": {
      "type": "object",
      "properties": {
        "monthlySipAmount": { "type": "number" },
        "targetEquityWeight": { "type": "number", "default": 0.40 }
      },
      "required": ["monthlySipAmount"]
    }
  }
]
```

---

## 4. Making Dashboard Elements Dynamically Generated

Once the Copilot service is live, the following elements in `DashboardAssetSpread.jsx` and `DashboardView.jsx` can be populated by Gemini in addition to pure deterministic math:

1. **Strategic Rebalance Commentary (`rebalance_insight`)**:
   - *Gemini Output:* "Your equity allocation has drifted to 42% due to a 16.1% rally in Reliance Industries. Under your conservative model, allocate the upcoming ₹30,000 monthly SIP: ₹18,000 into PPFAS Flexi Cap and ₹12,000 into short-duration debt to glide back to 40% equity within 60 days."
2. **Tax Loss/Gain Harvesting Callout (`tax_harvesting`)**:
   - *Gemini Output:* "You have booked ₹42,000 in realized LTCG this FY. You have ₹83,000 in exempt gains remaining before reaching the ₹1.25 Lakh threshold. Consider booking gains in Coal India before March 31."
3. **Statutory 80C Utilization Summary (`statutory_dossier`)**:
   - *Gemini Output:* "You have utilized ₹1,25,000 of your ₹1.5 Lakh Section 80C deduction via EPF contributions. A voluntary PPF top-up of ₹25,000 will maximize your tax savings under the Old Regime."

---

## 5. Security, Privacy & Zero-Data Selling Guarantees

In alignment with CoinTrack's core philosophy:
1. **PII Masking**:
   - PAN numbers, demat account numbers, phone numbers, and email addresses are stripped at the Spring Security filter boundary before being sent to Gemini.
2. **Zero Training Retention**:
   - Gemini API calls utilize enterprise/commercial terms (`data_store_opt_out: true`), guaranteeing prompt and retrieval data are never used for model training.
3. **Strict Tenant Partitioning in PGVector**:
   - Every vector query executes with `WHERE user_id = :authenticatedUserId` to enforce total cryptographic isolation.
4. **Read-Only Capability**:
   - The Copilot engine has strictly zero trade execution privileges. It is purely an intelligence advisor.

---

## 6. Implementation Phasing & Milestones

| Phase | Milestone | Deliverables |
|---|---|---|
| **Phase A (Current)** | **UI Groundwork** | Deterministic calculations for dynamic quarter, broker feed heartbeat, and asset split completed in `DashboardView.jsx` and `DashboardAssetSpread.jsx`. |
| **Phase B** | **Gemini Context Cache (CAG)** | Write `ContextCacheManager.java`, upload Indian Income Tax Act 112A/111A and AMFI taxonomy to Gemini cache, configure hourly refresh. |
| **Phase C** | **PGVector Retrieval Engine** | Enable PGVector extension on PostgreSQL, create `portfolio_vectors` schema, build embedding pipeline for transactions and user notes. |
| **Phase D** | **Spring Boot Copilot Service** | Implement `CopilotController`, `GeminiClientService`, function calling tool definitions, and rate limiting (bucket token algorithm). |
| **Phase E** | **Frontend Copilot Drawer** | Add sliding AI drawer with streaming markdown, suggested prompts (`"What is my LTCG liability?"`, `"How should I rebalance?"`), and dynamic dashboard hydration. |

---

## 7. Approval & Sign-Off

This document serves as the master blueprint for CoinTrack AI Copilot. Implementation will begin immediately following the final approval of the UI redesign.
