# Broker Connections Subsystem & Single-Responsibility Decomposition

**Date**: 2026-11-04  
**Subsystem**: Broker Integrations (`/brokers`, `/brokers/[broker]`, `/brokers/[broker]/callback`, `/brokers/[broker]/dashboard`)  
**Design System**: Terminal Editorial & Unslop Standard (100% unified with Notes, Profile Settings, and Dashboard)

---

## 1. Architectural Summary & Scope

The Broker Connections subsystem orchestrates read-only portfolio synchronization across India's primary retail stockbrokers:
- **Zerodha**: Kite Connect API v3 (OAuth redirect flow)
- **Upstox**: Upstox Pro OAuth2 (Daily-expiring token flow)
- **Angel One**: SmartAPI Direct (Server-side TOTP generation from Base32 seed)

### Cleaned Architecture & Full Consistency
The entire Broker Connections experience is aligned with the design language established in **Notes** (`frontend/src/features/notes`), **Profile & Settings** (`frontend/src/features/profile`), and the **Dashboard** (`frontend/src/features/dashboard`):
- **100% Sans-Serif Typography**: Eliminated all obsolete `font-serif`, `display-serif`, `FOLIO · §03`, and faux-legalistic stamps.
- **Unified Backgrounds & Card Surfaces**: Standardized to `bg-white dark:bg-[#16171a]` and `bg-white dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08]` (or `border-neutral-200/80 dark:border-neutral-800 rounded-2xl`).
- **Standardized Header & Toolbar**:
  - Title: `Broker Connections` (`text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100`)
  - Subtitle: `Authorise your brokerage accounts to syndicate holdings, positions, and funds. CoinTrack reads only — it cannot trade on your behalf.`
  - Filter Tabs: `All`, `Connected`, `Available` (matching `NotesToolbar.jsx`)
  - Live Search Box: `Search brokers...` with left search icon and right clear `X` button
  - Action Button: `Sync All Feeds`
- **Dashboard-Style 4-KPI Row**:
  - Active Feeds (`X of 3`)
  - Session Health (All Synchronized / Needs Reconnect)
  - Security Mode (Read-Only Sync)
  - Storage Standard (AES-256-GCM Envelope Encryption)
- **Two-Column Subpage Layout (Wayline reference architecture matching `ProfileView.jsx`)**:
  - **Left Docked Sidebar (`BrokerSidebar.jsx`)**:
    - Back navigation (`← Back to Broker Directory`)
    - Broker Identity Card with brand emblem and protocol badge
    - Sub-navigation Tabs: `Credentials & Keys`, `Developer Guide`, `Connection Hub`
    - Dynamic Session Status Badge (`Live Stream`, `Session Expired`, `Not Connected`)
    - Security Guarantee badge
    - Static and docked: does NOT scroll independently.
  - **Right Main Content Card (`BrokerSetupLayout.jsx`)**:
    - Dedicated, spacious card displaying active tab content with dynamic vertical scrolling (`overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:thin] overscroll-contain`).
    - Outer container uses `w-full min-h-0 flex-1 md:overflow-hidden` with a fixed top back link to `/brokers`.
    - Tab 1: **Credentials & Keys** — Quick-copy redirect URL callout bar, stored masked keys (`••••••••${last4}`), full credential editing form, and "Save & Authenticate" primary button.
    - Tab 2: **Developer Guide** — Dedicated full-width walkthrough with sequenced 3-step setup instructions, 1-click clipboard copy on callback URLs, and direct developer portal links.
    - Tab 3: **Connection Hub** — Real-time telemetry panel, Last Synced timestamp with IST offset and seconds-resolution relative time, manual "Sync Feeds Now" button, "Refresh Token", and "Unlink Broker Account".

---

## 2. Dynamic Telemetry & OAuth Handshake Lifecycle (`BrokerCallbackHandler.jsx`)

1. **Dynamic Verification Steps**:
   - Step 0: "Exchanging [Broker] request authorization token"
   - Step 1: "Verifying AES-256-GCM encrypted signature"
   - Step 2: "Establishing read-only portfolio telemetry"
   - Step 3: Success state with syndicated channels
2. **Dynamic Syndicated Feeds**:
   - Derived from `/api/portfolio/sync/status` telemetry (`recordCount`, `streaming` status, e.g. `24 securities`, `6 folios`).
3. **Resilience & Invariants**:
   - **React 19 / StrictMode Double-Mount**: `called.current` ref lock prevents duplicate concurrent token exchanges during immediate remounts.
   - **HTTP 400 Idempotent Normalization**: Catches scenarios where request tokens have already been consumed or sessions are already active on the broker end, safely normalizing HTTP 400 to an active session.
   - **Watchdog Stall Timer**: Automatically transitions slow gateway responses (>15s) to a delayed state with manual retry and directory fallback options.
   - **Auto-Redirect with Override**: Automatically pushes to the broker hub after 2.8s, with an immediate "Open Connection Hub" button override.

---

## 3. Modular Feature Decomposition (Profile & Notes Standard Alignment)

Aligned `frontend/src/features/brokers` strictly with `features/profile` and `features/notes`:
- **Single Source of Truth (`constants.js`)**: Rooted at `features/brokers/constants.js`, containing `BROKERS`, `BROKER_LIST`, `BROKER_SETTINGS_TABS`, `BROKER_BRAND_THEMES`, `BROKER_FILTER_TABS`, and helper accessors.
- **Decomposed Components (`components/`)**:
  - `BrokersView.jsx`: Lean top-level container (~80 lines).
  - `BrokersHeader.jsx`: Title, subtitle, and global sync trigger.
  - `BrokersKpiGrid.jsx`: 4-KPI status metrics row.
  - `BrokersFilterToolbar.jsx`: Status filter pills + search box with instant clear.
  - `BrokersSecurityNotice.jsx`: Institutional read-only banner.
  - `BrokerCard.jsx`, `BrokerSidebar.jsx`, `BrokerSetupLayout.jsx`, `BrokerGuideTab.jsx`, `ConnectionHubPanel.jsx`, `CredentialField.jsx`, `BrokerCallbackHandler.jsx`.
  - Specific broker views: `ZerodhaSetupView`, `UpstoxSetupView`, `AngelOneSetupView`, `ZerodhaCallbackView`, `UpstoxCallbackView`.
- **Eliminated Dead Folders & Dummy Files**:
  - Purged `shared/`, `zerodha/`, `upstox/`, `angelone/`, and `services/` folders.
  - Purged dummy redirect views (`ZerodhaDashboardView`, `UpstoxDashboardView`, `AngelOneDashboardView`, `AngelOneCallbackView`), replacing them with native Next.js server-level `redirect()` inside route `page.jsx`.
- **Central Barrel Export (`index.js`)**: Comprehensive exports of components, constants, and hooks.
- **Page Container (`app/(main)/brokers/page.jsx`)**: Decomposed to an ultra-clean 7-line wrapper mounting `<BrokersView />`.

---

## 4. Exhaustive Test Pyramid Coverage (`__tests__/`)

A comprehensive 6-suite test pyramid covering 63 unit and integration tests (100% green):
1. `constants.test.js`: Registry, tabs, brand tokens & resolver invariants (8 tests)
2. `brokers-components.test.jsx`: Component smoke & prop contract coverage (6 tests)
3. `broker-connection-lifecycle.test.jsx`: State machine, telemetry handshake, StrictMode guards, HTTP 400 normalization & timing edges (12 tests)
4. `broker-security-and-input-edges.test.jsx`: SQL injections, XSS payloads, Unicode, buffer limits & clipboard API permission denials (15 tests)
5. `broker-views-and-telemetry-edges.test.jsx`: Telemetry streams, timestamp skew & layout contracts (13 tests)
6. `broker-orchestration-and-edge-cases.test.jsx`: Tri-attribute search, empty search state reset, global sync & form validation (9 tests)

---

## 5. Verification

- **Frontend Tests**: 149/149 tests passed across all 14 test suites in `profile`, `notes`, and `brokers`.
- **Frontend Production Build**: `npm run build` compiled all 79 static routes with 0 errors.
- **AST Knowledge Graph**: Graphify synchronized (10,748 nodes, 32,612 edges, 483 communities).
