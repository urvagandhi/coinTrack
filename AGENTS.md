# AGENTS.md — CoinTrack Engineering & Agent Guidelines

This file provides instructions for AI coding agents (Antigravity, Codex, Cursor, Claude Code, Gemini CLI, OpenCode) working in the **CoinTrack** repository.

---

## 1. Project Overview & Architecture

CoinTrack is a multi-asset financial tracking platform:
- **Backend (`/backend`)**: Java 25, Spring Boot 3.x, Spring Security (JWT + TOTP 2FA), PostgreSQL (JPA/Hibernate), multi-broker hexagonal adapter architecture (Zerodha Kite, Upstox, AngelOne), Docker Alpine containerization.
- **Frontend (`/frontend`)**: Next.js (App Router), React, Tailwind CSS, shadcn/ui ("Terminal Editorial" design system), TanStack Query, Framer Motion, Lucide icons.
- **Key Modules**: Stock Portfolio, Mutual Funds (SIP/Lumpsum/Valuation), EPF, PPF, Fixed Deposits, Gold/Silver, Financial Calculators (32 engines), Notes & Margin Annotations, Broker Connections.

---

## 2. Agent Skills & Development Lifecycle

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

## 3. Codebase Understanding & Knowledge Graphs

CoinTrack integrates a dual-layer knowledge graph architecture for comprehensive codebase comprehension:

### 3.1 Understand-Anything (High-Level Architecture & Business Domains)
- `/understand` — Scans the codebase, analyzes components, layers, and dependencies into `.ua/knowledge-graph.json`.
- `/understand-dashboard` — Opens the interactive visual web dashboard to explore files, layers, and flows.
- `/understand-chat <question>` — Query architecture, relationships, and business flows with graph-grounded answers.
- `/understand-diff` — Impact analysis showing which components and layers your git diff touches before committing.
- `/understand-domain` — Maps code modules to business domain models, process steps, and financial flows.
- `/understand-explain <path>` — Deep-dive architectural explanation of a specific class or module.
- `/understand-onboard` — Generates a guided onboarding tour through core architecture paths.

### 3.2 Graphify (Deep AST Dependency Graph, God Nodes & Path Queries)
- **Skill**: [`graphify`](./.agents/skills/graphify/SKILL.md)
- **Command**: `/graphify` ([`graphify.toml`](./.agents/commands/graphify.toml))
- **Key CLI Tools**:
  - `graphify god-nodes` — Lists top architectural hubs and most-connected symbols.
  - `graphify query "<question>"` — Breadth-first traversal of `graphify-out/graph.json` for targeted questions.
  - `graphify path "<source>" "<target>"` — Computes shortest dependency path between two symbols or classes.
  - `graphify explain "<symbol>"` — Plain-language relationship and inbound/outbound connection breakdown.
  - `graphify update .` — Incremental AST re-extraction without requiring LLM calls (keeps `graphify-out/` current).
  - **Outputs**: `graphify-out/graph.html` (interactive dependency explorer), `graphify-out/GRAPH_REPORT.md`, and `graphify-out/graph.json`.

---

## 4. Stack-Specific Best Practices

When modifying code in specific subsystems, activate the dedicated skill:
- **Java / Spring Boot**: [`java-pro`](./.agents/skills/java-pro/SKILL.md) — Follow hexagonal domain separation, Spring service boundaries, record types, and strict exception handling.
- **Next.js & React**: [`nextjs-best-practices`](./.agents/skills/nextjs-best-practices/SKILL.md) & [`frontend-ui-engineering`](./.agents/skills/frontend-ui-engineering/SKILL.md) — Follow server vs. client boundaries, TanStack Query caching, and zero case-collision imports (`@/components/ui/<component>` lowercase).
- **Styling & Design System**: [`tailwind-patterns`](./.agents/skills/tailwind-patterns/SKILL.md) — Respect the "Terminal Editorial" design tokens (`ed-card`, `ed-input`, `ed-pill`, hairline borders, Instrument Serif + Geist).
- **PostgreSQL**: [`postgres-best-practices`](./.agents/skills/postgres-best-practices/SKILL.md) — Use indexed queries, connection pooling awareness, transaction safety, and schema migrations.
- **Security**: [`security-and-hardening`](./.agents/skills/security-and-hardening/SKILL.md) & [`api-security-best-practices`](./.agents/skills/api-security-best-practices/SKILL.md) — OWASP Top 10 defenses, token encryption at rest, TOTP validation, and CORS/CSRF protections.
- **Docker**: [`docker-expert`](./.agents/skills/docker-expert/SKILL.md) — Multi-stage builds, non-root Alpine execution, and container health checks.

---

## 5. Specialist Review Personas

When running reviews or evaluations, use the personas in [`.agents/agents/`](./.agents/agents/):
- `code-reviewer`: Senior staff engineer standard across architecture, logic, maintainability, tests, and style.
- `security-auditor`: Vulnerability detection, threat modeling, and OWASP assessment.
- `test-engineer`: QA strategy, coverage verification, edge cases, and regressions.
- `web-performance-auditor`: Core Web Vitals, payload size, memory leaks, and render cascades.

---

## 6. Standing Checklists

Refer to detailed guidance in [`.agents/references/`](./.agents/references/):
- [`definition-of-done.md`](./.agents/references/definition-of-done.md) — The baseline bar every commit and PR must clear.
- [`testing-patterns.md`](./.agents/references/testing-patterns.md) — Test sizing, naming conventions, and mocking rules.
- [`security-checklist.md`](./.agents/references/security-checklist.md) — Pre-commit auth, input validation, and header audits.
- [`performance-checklist.md`](./.agents/references/performance-checklist.md) — Target latencies and render budgets.
- [`accessibility-checklist.md`](./.agents/references/accessibility-checklist.md) — Keyboard navigation and WCAG 2.1 AA standards.
- [`observability-checklist.md`](./.agents/references/observability-checklist.md) — Logging conventions, actuator endpoints, and metrics.
