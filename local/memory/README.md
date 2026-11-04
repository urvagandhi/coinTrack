# coinTrack Long-Term Memory Index

This directory stores persistent, curated long-term memories capturing critical architectural decisions, security standards, component conventions, and test setups across the **coinTrack** repository.

When resuming or starting new agent sessions, agents should reference these memory files to instantly inherit project context, guidelines, and user preferences.

---

## Memory Files Index

| Memory File | Domain / Topic | Key Contents & Responsibilities |
| :--- | :--- | :--- |
| [`auth_design_system.md`](./auth_design_system.md) | **Authentication & Frontend Design System** | Split-screen layouts, glassmorphic AMC-grade design tokens, hardware state tracking (Caps/Num lock via `useHardwareState`), strict RFC 5322 validation, 10-digit phone number rules, SVG animations, and design lab routing. |
| [`app_shell_and_profile_settings.md`](./app_shell_and_profile_settings.md) | **App Shell & Profile/Settings Subsystem** | Elevated canvas card layout with atmospheric sky backdrop, header deduplication, theme switcher, docked static sidebar navigation, dynamic right card vertical scrolling with single scrollbar, un-shrunk sizing, TOTP 2FA reset, and email verification DTO synchronization. |
| [`dashboard_and_auth_session_recovery.md`](./dashboard_and_auth_session_recovery.md) | **Dashboard Architecture & Auth Session Recovery** | Modern SaaS card dashboard, elevated canvas card isolation, self-healing `AuthGuard`, 2FA token handoff and hydration via `refreshUser()`. |
| [`postman_api_ecosystem.md`](./postman_api_ecosystem.md) | **Postman API & Automated E2E Testing** | Dual collection architecture (199-request Master Suite + 38-step automated E2E runner), root Bearer auth inheritance, silent token refresh, RFC 6238 TOTP auto-generation in Pre-Request scripts, Terminal Editorial response visualizers, and Newman CI/CD automation. |
| [`notes_subsystem_and_unslop_redesign.md`](./notes_subsystem_and_unslop_redesign.md) | **Notes & Investment Journal Subsystem** | Unslop design craft (no pastel washes or curved left borders), status dot indicator, custom note types with top-right corner `×` deletion, per-user data isolation, elevated neutral modals, three-tier modal scrolling layout, and stable gutter clearance. |
| [`broker_connections_unslop_redesign.md`](./broker_connections_unslop_redesign.md) | **Broker Connections Subsystem** | Docked two-column layout, dynamic telemetry state machine, OAuth callback lifecycle, 6-suite test pyramid, and credential configuration hub. |
| [`dashboard_unslop_and_shared_tables.md`](./dashboard_unslop_and_shared_tables.md) | **Dashboard Architecture & Shared Tables** | Unslopped dashboard view, Net Worth area curve with mirrored delta baseline, shared reusable `data-table.jsx` with self-healing P&L logic, dynamic 6-ledger consolidation, and landing page hero mockup alignment. |

---

## How Agents Should Maintain Memory

1. **Add Domain Memories**: When implementing or significantly refactoring a subsystem (e.g., Mutual Funds, EPF/PPF, Database Migrations, Calculators), add or update the corresponding memory document in this directory.
2. **Preserve User Preferences**: Always capture explicit user directives, UI constraints (e.g., no emojis for flags, no browser alert popups, flat legal lists), and security invariants.
3. **Synchronize Codebase Knowledge**: After code changes, ensure knowledge graphs are kept current via `node scripts/auto-update.mjs` or `graphify update .`.
