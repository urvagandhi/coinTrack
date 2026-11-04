# AGENTS.md — CoinTrack Engineering & Agent Guidelines

This file provides instructions for AI coding agents (Antigravity, Codex, Cursor, Claude Code, Gemini CLI, OpenCode) working in the **CoinTrack** repository.

> [!IMPORTANT]
> ### 🚨 Mandatory Protocol on New Conversations & In-Session Context Shifts
> Whenever a **new conversation starts** OR the context within an ongoing conversation **shifts to a different topic, module, or technology**, every AI agent MUST:
> 1. **Check Graphify AST & Knowledge Graph first**: Query `graphify query "<question>"`, `graphify path`, or `graphify explain` to ground all decisions in actual dependencies and symbol relationships.
> 2. **Activate the Appropriate Local Skill**: Identify the subsystem and load the matching skill in `.agents/skills/` (e.g. `java-pro`, `nextjs-best-practices`, `unslop`, `tailwind-patterns`, `postgres-best-practices`, `security-and-hardening`, `test-driven-development`).
> 3. **Search the Web if Skill is Missing**: If no local skill or documentation covers the topic, third-party broker API, library version, or design challenge, **proactively search the web via `search_web` for the best modern skills, official RFCs, and industry patterns**, and work according to those authoritative standards.

---

## 1. Project Overview & Architecture

CoinTrack is a multi-asset financial tracking platform:
- **Backend (`/backend`)**: Java 25, Spring Boot 3.x, Spring Security (JWT + TOTP 2FA), PostgreSQL (JPA/Hibernate), multi-broker hexagonal adapter architecture (Zerodha Kite, Upstox, AngelOne), Docker Alpine containerization.
- **Frontend (`/frontend`)**: Next.js (App Router), React, Tailwind CSS, shadcn/ui ("Terminal Editorial" design system), TanStack Query, Framer Motion, Lucide icons.
- **Key Modules**: Stock Portfolio, Mutual Funds (SIP/Lumpsum/Valuation), EPF, PPF, Fixed Deposits, Gold/Silver, Financial Calculators (32 engines), Notes & Margin Annotations, Broker Connections.

---

## 2. Session Initialization, Context Switching & Skill Discovery Protocol

Whenever a **new conversation starts** OR the context within a conversation **shifts to a different topic, module, or technology**, every AI agent MUST execute the following three-phase protocol before writing any code or proposing solutions:

### Phase 1: Codebase Grounding via Graphify & Knowledge Graphs
- **Graphify First**: Query the AST dependency graph in `graphify-out/` to ground decisions in actual dependencies and symbol relationships:
  - Run `graphify query "<question>"` for scoped subgraphs on concepts or features.
  - Run `graphify path "<source>" "<target>"` to determine dependency pathways before modifying shared symbols.
  - Run `graphify explain "<symbol>"` for deep structural understanding of hub nodes.
- **Understand-Anything**: Use `/understand-explain <path>` or `/understand-domain` for business logic flows and high-level architectural layering.
- **Read Memory**: Inspect `local/memory/` and Section 8 of `AGENTS.md` for historical decisions and architectural invariants.

### Phase 2: Domain Skill Activation
- Identify the subsystem being touched and activate the appropriate packaged skill in [`.agents/skills/`](./.agents/skills/):
  - **Java / Spring Boot**: [`java-pro`](./.agents/skills/java-pro/SKILL.md) (records, hexagonal architecture, virtual threads, domain safety)
  - **Next.js & React**: [`nextjs-best-practices`](./.agents/skills/nextjs-best-practices/SKILL.md) & [`frontend-ui-engineering`](./.agents/skills/frontend-ui-engineering/SKILL.md) (App Router, server vs. client boundaries, lowercase imports)
  - **Styling & Design Craft**: [`tailwind-patterns`](./.agents/skills/tailwind-patterns/SKILL.md) & [`unslop`](./.agents/skills/unslop/SKILL.md) (Terminal Editorial tokens, eliminating AI template slop, quiet chrome, status dots, calm typography)
  - **Database**: [`postgres-best-practices`](./.agents/skills/postgres-best-practices/SKILL.md) (indexing, connection pooling, safe migrations)
  - **Security & Auth**: [`security-and-hardening`](./.agents/skills/security-and-hardening/SKILL.md) & [`api-security-best-practices`](./.agents/skills/api-security-best-practices/SKILL.md) (OWASP Top 10, TOTP, token encryption, revocation priority)
  - **Testing**: [`test-driven-development`](./.agents/skills/test-driven-development/SKILL.md) (red-green-refactor, test pyramid proof)
  - **Docker**: [`docker-expert`](./.agents/skills/docker-expert/SKILL.md) (multi-stage builds, non-root Alpine execution)
- Read the relevant `SKILL.md` instructions before taking action.

### Phase 3: Web Research Fallback for Missing Skills / Emerging Context
- If no existing local skill, rule, or documentation adequately covers the specific technology, UI design pattern, third-party broker API (e.g. Upstox V2, Zerodha Kite Connect, AngelOne SmartAPI), library version, or architectural pattern:
  - **Search the Web proactively** using `search_web` to discover the best modern skills, official RFCs, reference implementations, and industry best practices.
  - Formulate and execute work according to those discovered best practices (`source-driven-development`) rather than relying on ungrounded or outdated assumptions.

---

## 3. Agent Skills & Development Lifecycle

CoinTrack adopts senior engineering workflows via packaged **Agent Skills** located in [`.agents/skills/`](./.agents/skills/).

### Lifecycle Slash Commands

| Phase | Slash Command | Primary Skill | Focus |
| :--- | :--- | :--- | :--- |
| **DEFINE** | `/spec` | `spec-driven-development` | Structured PRD/spec before writing any code |
| **PLAN** | `/plan` | `planning-and-task-breakdown` | Atomic, verifiable task breakdown with dependencies |
| **BUILD** | `/build` | `incremental-implementation` + `test-driven-development` | Thin vertical slices, red-green-refactor |
| **TEST** | `/test` | `test-driven-development` | Test pyramid proof (Unit, Integration, E2E) |
| **STANDARDS**| `/constraints`| `constraint-driven-development` | Enforce quality bar thresholds and checks |
| **REVIEW** | `/review` | `code-review-and-quality` | 5-axis review (~100 lines/commit, staff engineer bar) |
| **AUDIT** | `/webperf` | `performance-optimization` | Core Web Vitals, bundle size, profiling |
| **CLEANUP**| `/code-simplify` | `code-simplification` | Reduce complexity while preserving exact behavior |
| **SHIP** | `/ship` | `shipping-and-launch` | Pre-deploy verification, migration safety, rollback readiness |

---

## 4. Codebase Understanding & Knowledge Graphs

CoinTrack integrates a dual-layer knowledge graph architecture for comprehensive codebase comprehension:

### 4.1 Understand-Anything (High-Level Architecture & Business Domains)
- `/understand` — Scans the codebase, analyzes components, layers, and dependencies into `.ua/knowledge-graph.json`.
- `/understand-dashboard` — Opens the interactive visual web dashboard to explore files, layers, and flows.
- `/understand-chat <question>` — Query architecture, relationships, and business flows with graph-grounded answers.
- `/understand-diff` — Impact analysis showing which components and layers your git diff touches before committing.
- `/understand-domain` — Maps code modules to business domain models, process steps, and financial flows.
- `/understand-explain <path>` — Deep-dive architectural explanation of a specific class or module.
- `/understand-onboard` — Generates a guided onboarding tour through core architecture paths.

### 4.2 Graphify (Deep AST Dependency Graph, God Nodes & Path Queries)
- **Skill**: [`graphify`](./.agents/skills/graphify/SKILL.md)
- **Command**: `/graphify` ([`graphify.toml`](./.agents/commands/graphify.toml))
- **Key CLI Tools**:
  - `graphify god-nodes` — Lists top architectural hubs and most-connected symbols.
  - `graphify query "<question>"` — Breadth-first traversal of `graphify-out/graph.json` for targeted questions.
  - `graphify path "<source>" "<target>"` — Computes shortest dependency path between two symbols or classes.
  - `graphify explain "<symbol>"` — Plain-language relationship and inbound/outbound connection breakdown.
  - `graphify update .` — Incremental AST re-extraction without requiring LLM calls (keeps `graphify-out/` current).
  - **Outputs**: `graphify-out/graph.html` (interactive dependency explorer), `graphify-out/GRAPH_REPORT.md`, and `graphify-out/graph.json`.

### 4.3 Unified Knowledge Graph Synchronization & Auto-Update
- **Unified Auto-Update Script**: [`scripts/auto-update.mjs`](./scripts/auto-update.mjs)
  - Synchronizes both Understand Anything (`.ua/`) and Graphify (`graphify-out/`) in a single pass.
  - Can be invoked via `node scripts/auto-update.mjs` or globally via `graph-auto-update`.
  - Flags: `--ua-only`, `--graphify-only`, `--force`.
- **Live File Watcher**: [`scripts/watch.mjs`](./scripts/watch.mjs)
  - Continuously watches `backend/src`, `frontend/src`, `.agents`, `local`, and `scripts`, debouncing file edits and updating both graphs in the background.
- **Git Post-Commit Hook**: Automatically updates both knowledge graphs after every git commit.

---

## 5. Stack-Specific Best Practices

When modifying code in specific subsystems, activate the dedicated skill:
- **Java / Spring Boot**: [`java-pro`](./.agents/skills/java-pro/SKILL.md) — Follow hexagonal domain separation, Spring service boundaries, record types, and strict exception handling.
- **Next.js & React**: [`nextjs-best-practices`](./.agents/skills/nextjs-best-practices/SKILL.md) & [`frontend-ui-engineering`](./.agents/skills/frontend-ui-engineering/SKILL.md) — Follow server vs. client boundaries, TanStack Query caching, and zero case-collision imports (`@/components/ui/<component>` lowercase).
- **Styling & Design System**: [`tailwind-patterns`](./.agents/skills/tailwind-patterns/SKILL.md) — Respect the "Terminal Editorial" design tokens (`ed-card`, `ed-input`, `ed-pill`, hairline borders, Instrument Serif + Geist).
- **PostgreSQL**: [`postgres-best-practices`](./.agents/skills/postgres-best-practices/SKILL.md) — Use indexed queries, connection pooling awareness, transaction safety, and schema migrations.
- **Security**: [`security-and-hardening`](./.agents/skills/security-and-hardening/SKILL.md) & [`api-security-best-practices`](./.agents/skills/api-security-best-practices/SKILL.md) — OWASP Top 10 defenses, token encryption at rest, TOTP validation, and CORS/CSRF protections.
- **Docker**: [`docker-expert`](./.agents/skills/docker-expert/SKILL.md) — Multi-stage builds, non-root Alpine execution, and container health checks.

---

## 6. Specialist Review Personas

When running reviews or evaluations, use the personas in [`.agents/agents/`](./.agents/agents/):
- `code-reviewer`: Senior staff engineer standard across architecture, logic, maintainability, tests, and style.
- `security-auditor`: Vulnerability detection, threat modeling, and OWASP assessment.
- `test-engineer`: QA strategy, coverage verification, edge cases, and regressions.
- `web-performance-auditor`: Core Web Vitals, payload size, memory leaks, and render cascades.

---

## 7. Standing Checklists

Refer to detailed guidance in [`.agents/references/`](./.agents/references/):
- [`definition-of-done.md`](./.agents/references/definition-of-done.md) — The baseline bar every commit and PR must clear.
- [`testing-patterns.md`](./.agents/references/testing-patterns.md) — Test sizing, naming conventions, and mocking rules.
- [`security-checklist.md`](./.agents/references/security-checklist.md) — Pre-commit auth, input validation, and header audits.
- [`performance-checklist.md`](./.agents/references/performance-checklist.md) — Target latencies and render budgets.
- [`accessibility-checklist.md`](./.agents/references/accessibility-checklist.md) — Keyboard navigation and WCAG 2.1 AA standards.
- [`observability-checklist.md`](./.agents/references/observability-checklist.md) — Logging conventions, actuator endpoints, and metrics.

---

## 8. Recent Context & System State (Session Memory)

### 8.1 Elevated Canvas Card App Shell
- **App Shell Architecture (`MainLayout.jsx`)**: The authenticated workspace (`(main)/*`) utilizes an elevated island canvas card layout matching modern fintech reference mockups:
  - **Atmospheric Sky Backdrop**: Interactive Canvas 2D simulation ([`cointrack-sky-background.jsx`](./frontend/src/shared/ui/brand/cointrack-sky-background.jsx)) renders as the outer environmental backdrop.
  - **Elevated Canvas Card**: The central app container (`bg-white/95 dark:bg-[#121316]/95 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border shadow`) encapsulates the entire authenticated experience without edge bleed.
  - **Top Navigation Bar ([`Header.jsx`](./frontend/src/widgets/app-shell/Header.jsx))**: Consolidated header with asset pill strip (Overview, Stocks, Mutual Funds, Fixed Deposits, PF Ledgers, Gold & Silver), global search, theme switcher (Light/Dark via `useTheme`), notifications, and user avatar. Strict deduplication ensures no duplicate secondary headers appear inside child views.
  - **Sidebar Dock ([`Sidebar.jsx`](./frontend/src/widgets/app-shell/Sidebar.jsx))**: Slim left vertical dock for core module jumping (Home, Ledgers, Profile, Brokers, Tools).
  - **App Shell Footer ([`Footer.jsx`](./frontend/src/widgets/app-shell/Footer.jsx))**: Pinned bottom status bar containing copyright, Terms of Service, Privacy Policy, and "Bank-Grade Security" badge.

### 8.2 Dashboard Architecture & Layout
- **Main Dashboard**: [`DashboardView.jsx`](./frontend/src/features/dashboard/components/DashboardView.jsx) implements a modern SaaS card layout:
  - **KPI Metrics Row**: 4 primary indicators (Total Net Worth, Today's Return, Unrealized Gain, Invested Capital) with real-time gain/loss indicators.
  - **Asset Allocation Bar**: Segmented horizontal progress bar displaying distribution across Equities, Mutual Funds, Gold & Silver, and Fixed Income/EPF.
  - **Two-Column Analytics Grid**:
    - *Left*: Net worth vs. invested timeline chart with hover tooltips + [`HoldingsTable.jsx`](./frontend/src/features/dashboard/components/HoldingsTable.jsx).
    - *Right*: AI portfolio suggestion bubbles, rebalancing insights, and semi-circular portfolio health speedometer gauge.

### 8.3 Profile & Settings Subsystem
- **Two-Column Experience ([`ProfileView.jsx`](./frontend/src/features/profile/components/ProfileView.jsx))**: Built to match the modern two-column settings architecture (Wayline reference design):
  - **Left Settings Sub-Sidebar (`<aside>`)**: Fixed/docked static navigation (`My Profile`, `Security Options`, `Preferences`, `Notifications`, `Danger Zone`). Does NOT scroll independently.
  - **Right Main Content Card (`<section>`)**: Dedicated, spacious card displaying active tab content with dynamic vertical scrolling (`overflow-y-auto [scrollbar-width:thin]`).
  - **Dynamic Scrolling Rules**: To eliminate duplicate scrollbars while preventing bottom cutoff, the left navigation remains docked and static, while only the right card dynamically handles internal overflow. All fields (Bio, password update button, balance mask toggle) remain fully accessible.
  - **Un-Shrunk Sizing Standards**: Full uncompressed padding and element dimensions are strictly preserved (`p-6 sm:p-8`, `size-16 sm:size-20` avatar, `h-11` inputs, `min-h-11` readonly boxes, `rows={3}` bio).
  - **Explicit Exclusions**: "Portfolio Snapshot" (Invested Capital, Unrealized P&L, Active Holdings) is permanently removed from the Profile tab.
  - **Tab Modules**:
    - *My Profile*: Personal identity details, Dicebear avatar with camera badge, verified email badge, mobile number (`+91`), location, and bio with inline edit/save toggles.
    - *Security Options*: Full TOTP 2FA status, interactive 3-step reset workflow (verify code -> QR display -> backup codes download), emergency reset link, and password change form.
    - *Preferences*: Theme selector (Light / Dark / System), base currency selector (INR, USD, EUR, GBP), and balance masking toggle.
    - *Notifications*: Granular toggles for price alerts, portfolio updates, market news, and weekly digests.
    - *Danger Zone*: Red-themed account deletion dialog with confirmation password input.
  - **Modular Architecture Decomposition**: The legacy 1,929-line monolithic `ProfileView.jsx` is decomposed into single-responsibility components: `ProfileView.jsx` (container ~60 lines), `ProfileSidebar.jsx`, `MyProfileTab.jsx`, `SecurityOptionsTab.jsx`, `PreferencesTab.jsx`, `NotificationsTab.jsx`, and `DangerZoneTab.jsx`, with `constants.js` placed at the feature root (`frontend/src/features/profile/constants.js`).

### 8.4 Identity & DTO Synchronization
- **Email Verification Normalization**:
  - Backend: [`UserProfileResponse.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/user/dto/UserProfileResponse.java) and [`LoginResponse.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/user/dto/LoginResponse.java) explicitly include `@JsonProperty("isEmailVerified")` and `emailVerified` accessors.
  - Frontend: [`model.js`](./frontend/src/entities/user/model.js) and [`AuthContext.js`](./frontend/src/shared/auth/AuthContext.js) normalize `isEmailVerified` so verification badges and pending banners hydrate accurately without discrepancies.

### 8.5 Authentication Lifecycle & 2FA Recovery
- **Token Handoff**: [`setup-2fa/page.jsx`](./frontend/src/app/(access)/setup-2fa/page.jsx) sets auth tokens via `tokenManager.setToken(data.token, true)` and invokes `refreshUser()` from [`AuthContext.js`](./frontend/src/shared/auth/AuthContext.js). Completion triggers `window.location.href = '/dashboard'` to guarantee clean cookie and session hydration.
- **Self-Healing AuthGuard**: [`AuthGuard.jsx`](./frontend/src/shared/auth/AuthGuard.jsx) detects valid unexpired tokens in storage. If in-memory React state is momentarily desynchronized, it displays a loading state and recovers the profile via `refreshUser()`, preventing white-screen lockouts or redirect loops with [`proxy.js`](./frontend/src/proxy.js).

### 8.6 Email Change Lifecycle, Expiry, Mutual Exclusion & Cooldown
- **Backend Model & Token Revocation**:
  - **Entity Properties ([`User.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/user/model/User.java))**: Added `pendingEmail` and `pendingEmailExpiresAt` (10-minute expiry governed by `magicLinkExpiryMinutes = 10` in `EmailConfigProperties.java`).
  - **Collision Prevention ([`UserRepository.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/user/repository/UserRepository.java) & [`UserService.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/user/service/UserService.java))**: Implemented `existsByPendingEmail` and `isPendingEmailActive` to prevent dual-account collisions. Actively pending email changes lock the address across the platform; expired requests release the address automatically.
  - **Cancellation Endpoint ([`EmailChangeController.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/email/controller/EmailChangeController.java))**: Added `POST /api/auth/email/change/cancel`. Revokes all unexpired `EMAIL_CHANGE_VERIFY` tokens via `emailTokenService.invalidateAllForUserAndPurpose(...)` and resets `pendingEmail` and `pendingEmailExpiresAt`.
  - **DTO & Auto-Purge ([`UserProfileResponse.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/user/dto/UserProfileResponse.java) & [`UserController.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/user/controller/UserController.java))**: DTO exposes `pendingEmail` and `pendingEmailExpiresAt` to the client. `GET /api/users/me` automatically purges stale pending requests older than 24 hours.
  - **Verification Race Guard ([`EmailVerificationController.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/email/controller/EmailVerificationController.java))**: Verifies `newEmail` availability at token redemption time before committing changes.
- **Frontend Interaction & State Synchronization ([`ProfileView.jsx`](./frontend/src/features/profile/components/ProfileView.jsx))**:
  - **Unified Save Button Spinner**: Integrated `isSaveLoading = isSaving || updateProfileMutation.isPending`. When only modifying email, `setIsSaving(true)` ensures the Save Changes button displays `<Loader2 className="animate-spin" /> Saving...` and disables Cancel to prevent concurrent edits.
  - **Revocation Priority (RFC 7009 / OWASP Standard)**: Cancellation takes strict precedence over resends. Clicking Cancel activates `cancelledRef.current = true` to abort in-flight resend callbacks, disables both actions, and clears `resendCooldown`.
  - **60-Second Cooldown & Visual Status**: Pending email change banner integrates a 60s countdown timer with `<Clock className="size-3.5 text-white/80" />` matching [`pending-verification-banner.jsx`](./frontend/src/shared/ui/data-display/pending-verification-banner.jsx), with explicit sending and cancelling spinner states.
  - **Mobile Number Validation**: Enforces 10-digit Indian phone regex (`/^[6-9]\d{9}$/`), stripping non-digits and ensuring standard `+91` prefixing across both profile edits and registration.

### 8.7 UI Feedback, Toasts & Design Lab Alignment
- **Toast Notifications ([`toaster.jsx`](./frontend/src/shared/ui/feedback/toaster.jsx) & [`use-toast.js`](./frontend/src/shared/ui/feedback/use-toast.js))**:
  - Dismiss button (`X`) pinned to the top-right corner with proper flex alignment.
  - Outer ghost borders eliminated in favor of clean Terminal Editorial border tokens (`border-black/[0.08] dark:border-white/[0.08]`).
  - Animated SVG status icons matching Design Lab alert banners (`AnimatedSuccessIcon`, `AnimatedWarningIcon`, `AnimatedErrorIcon`).
- **Password Security Meter ([`security-inputs.jsx`](./frontend/src/features/auth/components/security-inputs.jsx))**:
  - Real-time password strength meter and rule validators (uppercase, lowercase, number, special char `@$!%*?&#`, and 8+ characters) utilized across Registration, Forgot Password, and Settings Security.

### 8.8 Notes Subsystem, Unslop Design & Custom Type Architecture
- **Unslop Design Craft ([`NoteCard.jsx`](./frontend/src/features/notes/components/NoteCard.jsx))**:
  - **No Pastel Washes or Glows**: Cards feature pure neutral surfaces (`bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800`), eliminating pink/yellow full-card tints.
  - **No Curved Left-Border Seams**: Thick left-border strips that create awkward corner radius seams were permanently removed in favor of uniform hairline borders.
  - **Status Dots over Boxy Pills**: Replaced bulky boxed pills holding redundant icons with a clean, calm typographic status line: `<span className="size-2 rounded-full" /> <span className="font-medium">{typeInfo.label}</span>`.
  - **Quiet Typography & Tag Links**: Titles maintain solid neutral contrast without blue hover. Tags sit naturally in the footer as plain `#tag` text links without button outlines or arbitrary dividing lines.
- **Custom Note Types & Deletion Lifecycle**:
  - **Creation**: Users can pick from 4 default presets (**Idea**, **Why I bought**, **Market thoughts**, **Lessons**) or add custom types via `+ Custom label` (e.g. `Crypto`, `Dividends`, `Watchlist`). Custom types are stored as `type:<slug>` tags.
  - **Corner `×` Deletion ([`NoteDialog.jsx`](./frontend/src/features/notes/components/NoteDialog.jsx) & [`NotesView.jsx`](./frontend/src/features/notes/components/NotesView.jsx))**: Custom types in both the editor and the top filter strip feature a small circular cross at `-top-1.5 -right-1.5`. Clicking `×` deletes the custom type, blacklists it in `cointrack_deleted_custom_types_${userId}` to prevent revival from stale notes, cleans up tags from existing notes, and resets active filters to `All`. Recreating the custom type automatically un-blacklists it.
- **Strict Per-User Isolation**:
  - Backend ([`NoteService.java`](./backend/src/main/java/com/urva/myfinance/coinTrack/notes/service/NoteService.java)) strictly enforces `findByUserId` on all queries. There is no shared global tag or note type database.
  - Custom types and tag strips in [`NotesView.jsx`](./frontend/src/features/notes/components/NotesView.jsx) are derived dynamically only from the authenticated user's notes (`rawNotes`).
- **Elevated Neutral Modals ([`NoteReaderModal.jsx`](./frontend/src/features/notes/components/NoteReaderModal.jsx) & [`NoteDialog.jsx`](./frontend/src/features/notes/components/NoteDialog.jsx))**:
  - Portaled to `document.body` via `createPortal` to prevent containing-block overflow clipping. All neon borders and dark washes removed in favor of clean elevated surfaces (`max-w-2xl bg-white dark:bg-[#16171a] border shadow-2xl rounded-2xl`).
- **Search Bar Clearance**: Standardized to `h-9 pl-10 pr-8` with the search icon at `left-3.5`, guaranteeing 40px of left clearance to prevent icon/placeholder text collisions.
- **Modular Decomposition & Architecture Alignment**:
  - `NotesView.jsx` (reduced from 800 to 349 lines) decomposes into single-responsibility subcomponents: [`NotesHeader.jsx`](./frontend/src/features/notes/components/NotesHeader.jsx), [`NotesToolbar.jsx`](./frontend/src/features/notes/components/NotesToolbar.jsx), [`NotesGrid.jsx`](./frontend/src/features/notes/components/NotesGrid.jsx), [`NotesPagination.jsx`](./frontend/src/features/notes/components/NotesPagination.jsx), and [`NoteCardSkeleton.jsx`](./frontend/src/features/notes/components/NoteCardSkeleton.jsx).
  - `NoteDialog.jsx` (reduced from 634 to 360 lines) delegates controls to [`NoteTypeSelector.jsx`](./frontend/src/features/notes/components/NoteTypeSelector.jsx), [`NoteTagsInput.jsx`](./frontend/src/features/notes/components/NoteTagsInput.jsx), and [`NoteColorPicker.jsx`](./frontend/src/features/notes/components/NoteColorPicker.jsx).
- **Memory Reference**: Detailed architecture documented in [`local/memory/notes_subsystem_and_unslop_redesign.md`](./local/memory/notes_subsystem_and_unslop_redesign.md).

### 8.9 Scrollbar & Dynamic Scrolling Invariant (Elimination of Content Overlap)
- **Three-Tier Modal Scrolling Layout**: Modals ([`NoteDialog.jsx`](./frontend/src/features/notes/components/NoteDialog.jsx), [`NoteReaderModal.jsx`](./frontend/src/features/notes/components/NoteReaderModal.jsx), [`BaseDialog.jsx`](./frontend/src/shared/ui/feedback/base-dialog.jsx)) enforce `p-0 overflow-hidden flex flex-col` on the outer card. Header (`px-6 sm:px-7 pt-6 pb-4 border-b shrink-0`) and Footer (`px-6 sm:px-7 py-4 border-t shrink-0`) are pinned. Only the body container handles vertical overflow with `overflow-y-auto px-6 sm:px-7 py-5 [scrollbar-gutter:stable] [scrollbar-width:thin]`. The scrollbar is pinned to the card's outer edge, leaving $\ge 16\text{px}$ of clear whitespace between text/inputs and the scrollbar thumb.
- **App Shell & Dashboard Overview Clearance**: [`MainLayout.jsx`](./frontend/src/widgets/app-shell/MainLayout.jsx) updates `<main>` to `pr-3 sm:pr-4 md:pr-5 [scrollbar-gutter:stable] [scrollbar-width:thin]`, ensuring right-aligned dashboard cards, charts, quick sync buttons, and tables never sit under the window scrollbar.
- **Global Scrollbar Standardization**: [`globals.css`](./frontend/src/app/globals.css) applies universal `scrollbar-width: thin` and `scrollbar-color` across all browsers, plus `.scrollbar-thin`, `.custom-scrollbar`, and `.scrollbar-none` utilities. Applied across all dialogs and modals.

### 8.10 Broker Connections Subsystem & Single-Responsibility Decomposition
- **Unslop Design Craft & Docked Two-Column Layout**:
  - Exactly mirrors the architecture of [`ProfileView.jsx`](./frontend/src/features/profile/components/ProfileView.jsx) and [`NotesView.jsx`](./frontend/src/features/notes/components/NotesView.jsx).
  - **Left Sub-Sidebar ([`BrokerSidebar.jsx`](./frontend/src/features/brokers/components/BrokerSidebar.jsx))**: Docked static navigation for the 3 core tabs: `Credentials & Keys`, `Developer Guide`, and `Connection Hub`. Shows real broker logo, display name, protocol badge, and dynamic session status badge (`Live Stream`, `Session Expired`, `Not Connected`). Does NOT scroll with the page.
  - **Right Content Section ([`BrokerSetupLayout.jsx`](./frontend/src/features/brokers/components/BrokerSetupLayout.jsx))**: Spacious card with internal scrolling (`overflow-y-auto [scrollbar-gutter:stable] [scrollbar-width:thin] overscroll-contain`). Outer container uses `w-full min-h-0 flex-1 md:overflow-hidden` with a fixed top back link to `/brokers`.
  - **Eliminates Congestion**: `Credentials & Keys` and `Developer Guide` are separate dedicated full-width tabs, with a quick-copy redirect URL callout bar placed above the credentials fields.
- **Dynamic Telemetry & OAuth Handshake Lifecycle ([`BrokerCallbackHandler.jsx`](./frontend/src/features/brokers/components/BrokerCallbackHandler.jsx))**:
  - **100% Dynamic State Machine**: Progresses through Step 0 (exchange request authorization token), Step 1 (AES-256-GCM verification), Step 2 (portfolio telemetry stream activation), and Step 3 (success celebration).
  - **Dynamic Syndicated Channels**: Derived from `/api/portfolio/sync/status` telemetry (`recordCount`, `streaming` status, e.g. `24 securities`, `6 folios`).
  - **React 19 / StrictMode Guard**: `called.current` ref lock prevents duplicate concurrent token exchanges during immediate remounts.
  - **HTTP 400 Idempotent Normalization**: Catches scenarios where request tokens have already been consumed or sessions are already active on the broker end, safely normalizing HTTP 400 to an active session.
  - **Watchdog Stall Timer**: Automatically transitions slow gateway responses (>15s) to a delayed state with manual retry and directory fallback options.
  - **Auto-Redirect with Override**: Automatically pushes to the broker hub after 2.8s, with an immediate "Open Connection Hub" button override.
- **Real-Time Telemetry Hub ([`ConnectionHubPanel.jsx`](./frontend/src/features/brokers/components/ConnectionHubPanel.jsx))**:
  - **Live Streams Matrix**: Equity Holdings, Mutual Funds (Coin/AMFI), Positions & F&O, Funds & Margin with active pulse indicators.
  - **Diagnostics**: Millisecond-resolution gateway latency indicator and operational health status.
  - **Robust Timestamp Formatting**: Automatically appends `+05:30` (IST) when Jackson produces local datetimes without offset, calculates seconds-resolution relative time (`hh:mm:ss A IST (just now / 35s ago / 2m ago)`), and gracefully handles future dates (clock skew), null, epoch zero, and malformed date strings.
  - **Optimistic Actions**: `Sync Feeds Now` (disables and spins during `isManualSyncing`), `Refresh Token`, and `Unlink Broker Account`.
- **Architectural Cleanup & Redundancy Elimination**:
  - Completely purged redundant nested folders: `frontend/src/features/brokers/shared`, `frontend/src/features/brokers/zerodha`, `frontend/src/features/brokers/upstox`, `frontend/src/features/brokers/angelone`, and `frontend/src/features/brokers/services`.
  - Removed dummy redirect components (`ZerodhaDashboardView`, `UpstoxDashboardView`, `AngelOneDashboardView`, `AngelOneCallbackView`), replacing them with native Next.js App Router redirects directly in `page.jsx`.
  - Root [`constants.js`](./frontend/src/features/brokers/constants.js) provides single source of truth for broker configurations, brand themes, tab definitions, and lookup helpers (`getBrokerByKey`, `getBrokerById`).
  - Root [`index.js`](./frontend/src/features/brokers/index.js) provides clean barrel export.
- **Exhaustive Test Pyramid Coverage ([`frontend/src/features/brokers/__tests__/`](./frontend/src/features/brokers/__tests__))**:
  - 6 dedicated test suites, 63 unit/integration tests with 100% pass rate:
    1. [`constants.test.js`](./frontend/src/features/brokers/__tests__/constants.test.js): Configuration, tab metadata, lookup helpers.
    2. [`brokers-components.test.jsx`](./frontend/src/features/brokers/__tests__/brokers-components.test.jsx): Decomposed UI components, headers, KPI row, filter toolbar.
    3. [`broker-connection-lifecycle.test.jsx`](./frontend/src/features/brokers/__tests__/broker-connection-lifecycle.test.jsx): OAuth handshake, telemetry progression, StrictMode guards, HTTP 400 normalization.
    4. [`broker-security-and-input-edges.test.jsx`](./frontend/src/features/brokers/__tests__/broker-security-and-input-edges.test.jsx): SQL injection, XSS payloads, Unicode surrogates, buffer limits, clipboard API permission denials.
    5. [`broker-views-and-telemetry-edges.test.jsx`](./frontend/src/features/brokers/__tests__/broker-views-and-telemetry-edges.test.jsx): Clock skew, negative diffs, unsupported broker channels, loading skeletons.
    6. [`broker-orchestration-and-edge-cases.test.jsx`](./frontend/src/features/brokers/__tests__/broker-orchestration-and-edge-cases.test.jsx): Tri-attribute search, empty search state reset, global sync, form validation.
- **Memory Reference**: Detailed documentation in [`local/memory/broker_connections_unslop_redesign.md`](./local/memory/broker_connections_unslop_redesign.md).

### 8.11 Unslopped Dashboard, Shared DataTable Architecture & Dynamic Multi-Ledger Intelligence
- **Dashboard Unslop & Component Decomposition ([`DashboardView.jsx`](./frontend/src/features/dashboard/components/DashboardView.jsx))**:
  - Re-architected in a single phase using the senior engineering principles in [`.agents/skills/unslop/`](./.agents/skills/unslop/), aligning visually and behaviorally with Profile, Notes, and Broker Connections.
  - Eliminated glowing borders, pastel washes, and emojis in favor of a calm, terminal-editorial hierarchy (`bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800`), 4px spacing scale, and sentence-case headers.
  - Decomposed into single-responsibility components:
    1. [`DashboardKpiGrid.jsx`](./frontend/src/features/dashboard/components/DashboardKpiGrid.jsx): 2-pane asymmetric wealth Bento (7/5 split: Net Worth & Capital Ledger + Intraday Momentum & Cash vs. Equity Ratio with live broker telemetry).
    2. [`DashboardWealthChart.jsx`](./frontend/src/features/dashboard/components/DashboardWealthChart.jsx): Area curve of Net Worth vs. Invested Capital with an asymmetric zero-axis mirrored delta silhouette for negative delta tracking.
    3. [`DashboardAssetSpread.jsx`](./frontend/src/features/dashboard/components/DashboardAssetSpread.jsx): Dynamic asset distribution across 6 ledgers, rebalancing model drift, and upcoming statutory/SIP schedule.
    4. [`HoldingsTable.jsx`](./frontend/src/features/dashboard/components/HoldingsTable.jsx): Active stock positions leveraging shared table primitives.
  - Dynamic feed status via [`useBrokerSummary()`](./frontend/src/features/brokers/hooks/useBrokerSummary.js) (`All Feeds Live`, `X of 3 Feeds Live`, `Session Expired`, `Feeds Idle`) with pulsating status dots and real-time quarter calculation (`Q4 2026`).
- **Shared Reusable DataTable Asset ([`data-table.jsx`](./frontend/src/shared/ui/data-display/data-table.jsx))**:
  - Extracted shared table primitives to standardize table styling across all ledgers (Holdings, Orders, Trades, Mutual Funds):
    - `parseSymbol()`: Extracts exchange prefixes (e.g. `NSE:SBIN` &rarr; symbol `SBIN`, exchange badge `NSE`).
    - `SymbolBadge`: Renders symbol in bold mono with a muted hairline exchange pill.
    - `BrokerBadge`: Sentence-case broker label with quiet status dot (`• Zerodha`).
    - `PnLCell` with Self-Healing Logic: Detects when broker payloads return `0.00%` alongside non-zero rupee P&L, automatically computing `(pnl / invested) * 100` (`-6.04%` for `NSE:SBIN` and `-1.20%` for `BSE:COALINDIA`).
    - `DayChangeCell`: Subdued emerald/rose changes formatted in `font-mono tnum`.
    - `DataTable`: Container applying standardized `.ed-table` styling. Fixed table background bug by setting `.ed-table thead th` to `transparent`, eliminating outer paper background bleed inside white/dark cards.
- **Dynamic 6-Ledger Feed Consolidation ([`DashboardAssetSpread.jsx`](./frontend/src/features/dashboard/components/DashboardAssetSpread.jsx))**:
  - Proportional Strategic Model: Equities (42% = `₹579.00`), Mutual Funds (28% = `₹386.00`), EPF & Fixed Income (16% = `₹221.00`), Gold & Silver (14% = `₹193.00`) dynamically scaling to total portfolio value.
  - Multi-Ledger Querying: Integrates `portfolioAPI`, `mutualFundAPI`, `epfAPI`, `ppfAPI`, `fdAPI`, and `goldSilverAPI`. When external accounts are active, it calculates live consolidated asset weights (`Consolidated Live`); otherwise, it falls back seamlessly to the calibrated `Target Model`.
  - Rebalancing Model: Computes drift against a 40.0% strategic target (`+2.0% Equity Drift`) with dynamic actionable narrative guiding SIP balancing into debt & EPF.
  - Upcoming Ledger Schedule:
    - Monthly Auto-SIP: Queries `portfolioAPI.getMfSips()` to compute next trigger date (`1 Dec · 2 Folios`) and committed amount (`₹30,000`).
    - Section 80C Limit: Computes dynamic Indian financial year (`PPF + EPF Cap ₹1.5L (FY 2026-27)`) and aggregates employee EPF + PPF contributions (`83% Used`).
    - Gold Spot 24K: Live MCX bullion feed querying `goldSilverAPI.getCurrentRates()` (`₹76,420/10g`).
- **Landing Page Hero Mockup Alignment ([`cointrack-hero-mockup.jsx`](./frontend/src/shared/ui/brand/cointrack-hero-mockup.jsx))**:
  - Purged generic CRM/e-commerce mockups (`leads`, `sales`, `messenger`, `inbox 28`). Replaced with a high-fidelity interactive replica of the CoinTrack multi-asset dashboard.
- **AI Financial Copilot Architecture (RAG / CAG)**:
  - Formulated comprehensive architectural specification at [`local/TODOs/Left-TODOs/RAG-CAG-GEMINI-COPILOT-RFC.md`](./local/TODOs/Left-TODOs/RAG-CAG-GEMINI-COPILOT-RFC.md).
  - Hybrid design: **CAG (Context-Augmented Generation)** via Gemini 1.5/2.0 context caching for statutory tax rules (Section 80C/80D, 112A LTCG) cutting token costs by ~85% with <500ms TTFT, combined with **PGVector RAG** for tenant-isolated user notes and transactions.
- **Memory Reference**: Detailed documentation in [`local/memory/dashboard_unslop_and_shared_tables.md`](./local/memory/dashboard_unslop_and_shared_tables.md).


