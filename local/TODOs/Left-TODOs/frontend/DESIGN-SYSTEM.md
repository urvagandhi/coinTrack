# coinTrack · System Design & Frontend Architecture (Generalized Blueprint)

> **The single living system-design document for the coinTrack frontend.**
> Covers BOTH layers as one system: (1) the **visual design system** (generalized — not tied to any source project) and (2) the **code architecture** (structural/audited production-grade layout, consolidated from the restructure plan).
> Scope: `frontend/` only. Backend (Spring Boot, Java 21) is out of scope.
> Current state: v3.0.0 "Terminal Editorial" · JS app (Next.js 16.2.6 App Router). Target: a scalable, audited, design-consistent, production-grade architecture.
> ⚠️ Next 16 changed APIs — read `frontend/node_modules/next/dist/docs/` before writing code.

---

## 1. Mission & Principles

1. **Every component lives in exactly one correct location, is reused everywhere applicable, and is never duplicated.**
2. **Business/financial logic is fully separated from presentation.**
3. **Each domain (broker, portfolio, calculators, notes, FD, PPF, EPF, gold/silver, mutual fund, auth/2FA, billing) is an isolated feature module.**
4. **Server Components are the default; Client Components exist only where interactivity or browser APIs require them.**
5. **shadcn/ui is the primitive layer; existing Radix usage consolidates under it — never run both patterns for the same UI concept.**
6. **Restraint is a feature.** Marketing surfaces may shimmer; the transactional core (tables, forms, dashboards, money) stays calm, high-contrast and legible. Trust comes from stability; delight comes from taste.
7. **No behavior change unless required by architecture, security, or an audited bug** — flag separately, never fix silently.

---

## 2. Design Tokens (single source: `frontend/src/app/globals.css`)

Everything is an HSL CSS variable, consumed as `hsl(var(--token))`. Retheming = editing one file. Staff may not hard-code colors in TSX.

### 2.1 Core surfaces — the "Terminal Editorial" foundation (keep)

```css
:root {                 /* Warm paper */
  --background: 38 32% 96%;
  --foreground: 220 14% 11%;
  --card:       38 28% 99%;
  --accent:     36 100% 50%;      /* saffron-gold signature */
  --accent-muted: 36 90% 92%;
  --border:     220 12% 84%;
  --hairline:   220 14% 22%;
  --radius:     0.25rem;           /* editorial near-zero radius */
}
.dark {                 /* Obsidian */
  --background: 220 16% 6%;
  --foreground: 38 28% 92%;
  --card:       220 14% 9%;
  --accent:     36 100% 56%;
  --accent-muted: 36 70% 14%;
  --border:     220 10% 18%;
  --hairline:   38 20% 80%;
}
```

### 2.2 Financial status colors (always token-authorized — never literal hexes)

| Token | Hue | Use for |
|---|---|---|
| `--gain` / `--loss` / their `-muted` | green / red (desaturated, editorial) | P&L, day change, returns |
| `--neutral` (+`-muted`) | slate | no-change, informational |
| `--chart-1..5` | palette | recharts series |
| `--broker-zerodha/-angel/-upstox` | brand hues | broker identity only |

### 2.3 Signature ("flare") accent tokens

```css
:root { --flare-a: 36 100% 50%; --flare-b: 271 55% 42%; }  /* gold → violet */
.dark  { --flare-a: 36 100% 56%; --flare-b: 271 60% 60%; }
```

Reserved for **signature moments only** (hero headline accent, primary CTA, recommended plan) — never the transactional body.

### 2.4 Utility classes owned by the design system

```css
.text-flare  { background: linear-gradient(100deg, hsl(var(--flare-a)), hsl(var(--flare-b)) 55%, hsl(var(--flare-a)));
               -webkit-background-clip: text; background-clip: text;
               -webkit-text-fill-color: transparent; color: transparent; }
.bg-flare    { background: linear-gradient(100deg, hsl(var(--flare-a)), hsl(var(--flare-b))); }
.ed-btn-flare{ background: linear-gradient(100deg, hsl(var(--flare-a)), hsl(var(--flare-b)));
               color: hsl(38 30% 97%); border-color: transparent;
               &:hover { filter: brightness(1.05); box-shadow: 0 6px 24px hsl(var(--flare-b) / .35); } }
.glass-card  { background: hsl(var(--card) / .72); backdrop-filter: blur(16px);
               border: 1px solid hsl(var(--hairline)); }
```

### 2.5 Keyframes / animation utilities owned by the design system

`animate-meteor` + `@keyframes meteor` (uses `var(--angle)`), `animate-spin-slow` (conic ring), `animate-float-dot` (floating dots), `ct-pulse`/`live-dot` (existing), `ct-ticker` marquee (existing), `ct-fade-up`/`.stagger-fade` (existing), view-transition theme-ripple rules. Keep meteors/ticks behind `prefers-reduced-motion: reduce`.

---

## 3. Typography

- **Display/headings:** `Instrument Serif` italic — `.font-serif`, `.display-serif` (`line-height .95`, `ls -0.02em`). Hero numerals use it for editorial drama.
- **UI:** Geist Sans (`--font-geist-sans`).
- **Numbers:** Geist Mono, tabular — `.display-num`, `.hero-amount`, `tnum`. Money is always mono + tabular.
- ⚠️ `--font-serif` is not wired into Tailwind `fontFamily` — keep the `.font-serif` component class as the mechanism; do NOT add a Tailwind `fontFamily.serif` utility (it would override the feature-setting class).

---

## 4. Component Architecture (generalized)

### 4.1 The three layers

```
components/
├─ ui/            # shadcn/ui primitives ONLY — no app logic. Answers "how it looks".
├─ blocks/        # Product-level, brand-consistent compositions (reassembled shadcn).
│                 # Both 'how it looks' AND lightweight 'what it does' — no data fetching.
│                 # e.g. SectionHeading, AnimatedHeading, BorderBeamCard, GradientText,
│                 # GlassCard, PageHeader (index-num + eyebrow + serif title)
├─ layout/        # shell: MainLayout, Sidebar, Header, MobileNav
├─ forms/         # generic reusable form primitives (label, field wrapper, validation msg, submit w/ loading)
├─ data-display/  # StatCard, CurrencyDisplay, DateDisplay, StatusBadge, DataTable
├─ feedback/      # toasts, empty states, error states, skeletons
├─ charts/        # Recharts wrappers (lazy-loaded)
└─ seo/           # JsonLd, metadata helpers
```

**shadcn ground rules:** treat `ui/` as source code **you own** — never blind-`npm update`; `ui/` stays pure and logic-free; extend via props/CVA variants, not copies; always `cn()` for merging; composition over prop-storm (avoid boolean style props); prefer CSS interactions over React state; document every block in `blocks/README.md` (why / when / when-not).

### 4.2 Component Reuse Protocol (before creating ANY component)

1. Check `components/ui/`. → 2. Check `components/{blocks,layout,forms,data-display,feedback,charts}/`. → 3. Check the target `features/<domain>/components/`. → 4. Can it be extended via props/variant (`cva`) instead? → 5. Only create new if reuse would make the abstraction worse — state why in the commit/PR.

Never duplicate: buttons, inputs, modals, dialogs, tables, cards, dropdowns, tabs, selects, form fields, loading/empty/error states, **currency displays, date displays, status badges**.

### 4.3 Signature motif library (generalized — reusable across surfaces)

These are coinTrack's signature "moments", deliberately restricted to marketing/key surfaces:

| Motif | Where it's allowed | Policy |
|---|---|---|
| `BorderBeam` (animated conic border) | hero cards, pricing, feature ranks, recommended plan, healthy-sync dashboard hero | ≤ 2 per viewport; dark-mode-dominant |
| `Meteors` | public landing hero only | `pointer-events-none`, count ≤ 12, dark mode only, reduced-motion off |
| `Particles` (canvas dot-field, mouse-reactive) | landing hero, 404, marketing backdrops | canvas, `pointer-events-none`, `quantity ≤ 120`, color from tokens (`--flare-a/-b`), dark-mode dominant, pause under `prefers-reduced-motion` |
| Theme motion (`View Transition` circular ripple) | theme switch | guard `!document.startViewTransition` |
| `SectionHeading` (gradient underline + floating dots) | section headers across marketing + docs | once-only scroll reveal |
| `AnimatedHeading` (word-stagger reveal) | hero/main headlines only | reduced-motion aware |
| `.text-flare` gradient | headline accents, CTA words | italic serif moments only |

---

## 5. Target Folder Structure

```
frontend/src/
├─ app/
│  ├─ (access)/          # login, register, forgot-password, 2FA, verify — public (noindex)
│  ├─ (main)/            # protected app shell (dashboard, portfolio, brokers, mutual-fund,
│  │                     #  fixed-deposit, ppf, epf, gold-silver, notes, profile)
│  ├─ calculators/       # PUBLIC, unauthenticated, SEO-relevant — 40+ tools; URLs are frozen
│  ├─ api/               # route handlers only if genuinely needed
│  ├─ error.jsx loading.jsx not-found.jsx
│  └─ layout.jsx         # root metadata + providers + Organization/WebSite JSON-LD
├─ components/           # §4.1 layers
├─ features/             # ONE module per domain (isolated)
│  └─ <domain>/
│     ├─ components/  hooks/  services/
│     ├─ schemas/     types.js    index.js
│  ├─ auth/ broker/ portfolio/ calculators/ notes/ fixed-deposit/ ppf/ epf/
│  ├─ gold-silver/ mutual-fund/ billing(scaffold-only)
├─ hooks/                # cross-feature only (useDebounce, useMediaQuery…)
├─ lib/
│  ├─ api/               # axios instance, interceptors, error normalization, refresh-token
│  ├─ auth/              # token storage/refresh helpers (client-safe only)
│  ├─ security/          # masking, sanitization policies
│  ├─ validation/        # schema/primitives
│  ├─ formatters/        # currency (INR en-IN lakh/crore), percentage, date (IST), masking
│  └─ constants/  motion.js
├─ services/             # thin per-domain API clients used by features/*/services
├─ types/                # shared cross-domain shapes (mirror backend DTOs)
├─ config/  providers/   # QueryProvider, ThemeProvider, AuthContext, ModalContext
```

Adapt names only where a real coinTrack domain doesn't fit — never invent generic fintech domains (no fictional "cards"/"beneficiaries").

---

## 6. Server vs Client Components

- Default = Server Components for data-fetching and static presentation.
- `'use client'` only for: event handlers, browser APIs, local interactive state, realtime/polling (TanStack Query), client-only libs (Framer Motion, Recharts interactivity).
- **Never mark a whole page Client because one child needs interactivity** — isolate the client boundary to the smallest component.
- Keep server-side fetching close to the server boundary; don't duplicate client-side fetches of server-available data.
- SEO/public surfaces (landing, calculators): the route stays crawlable — per-route `metadata` lives on server layouts; JSON-LD via server `seo/JsonLd`.

---

## 7. Fintech Data Handling Rules

1. **Currency** → single `lib/formatters/currency.js` (`Intl.NumberFormat('en-IN')`, lakh/crore grouping, sign options).
2. **Dates/timestamps** → single `lib/formatters/date.js`, explicit about IST vs UTC (Asia/Kolkata).
3. **Percentages / XIRR / CAGR / financial-year labels** → dedicated formatters. Never scattered `.toFixed()`.
4. **No floating-point math on money in the frontend.** Backend values are pre-computed and authoritative — the frontend *formats and displays*, it never recomputes financial results ("Trust the Broker", BigDecimal-only rule).
5. **Tier/entitlement gating** (free vs Pro: multi-broker, manual asset suite, exports, CAMS reconciliation, on-demand sync) → one shared `<EntitlementGate>` / `useEntitlement()` in `features/billing/`, never ad-hoc per-page checks.
6. **Discrepancy flags** (MF ledger vs valuation snapshot) → one shared `<DiscrepancyBadge>`.
7. **Secrets:** no API keys, JWTs, broker secrets, or raw broker payloads rendered, logged, or passed to client components beyond display needs.
8. **Client-side validation is UX only** — the backend remains authoritative; never a security boundary.

---

## 8. API & Services Layer

- No component calls `fetch`/`axios` directly — all through `services/` or `features/<domain>/services/`.
- One axios instance in `lib/api/`: auth-header injection, centralized error normalization, retry policy, refresh-token handling.
- React Query owns caching/polling — no hand-rolled fetch-and-setState duplicates. Keep the existing key convention (`['portfolio','summary']` …).
- Response types live in `types/` or `features/<domain>/types.js`, mirroring backend DTOs.
- Preserve every existing env var and API contract (`NEXT_PUBLIC_API_BASE`, …).

---

## 9. Forms & Validation

- React Hook Form + (Zod where adopted) for all forms.
- Reusable `components/forms/` primitives: label, field wrapper, validation message, select, submit button with loading state.
- Every financial form represents idle → loading → success → validation-error → server-error through the same primitive — no per-form bespoke state machines.

---

## 10. Accessibility & Performance

- Keyboard nav, correct labeling, focus management, semantic HTML on every interactive component.
- Prefer shadcn/Radix accessible primitives over hand-rolled interaction logic.
- ARIA only when semantic HTML is insufficient.
- Server Components by default; lazy-load charts; stable component boundaries; no duplicated server/client fetching.
- Motion: centralize in `lib/motion.js` (never inline variants); fade-up language, `[0.22,1,0.36,1]` ease, 0.22–0.4s; honor `prefers-reduced-motion` everywhere.

---

## 11. Migration Sequencing (one verifiable chunk per step)

**Status legend:** ✅ done · ⏳ pending · 🔶 blocked

### 11.1 Blueprint layer (this folder — `coinTrack/local/TODOs/Left-TODOs/frontend/`)

| Status | Item |
|---|---|
| ✅ | `DESIGN-SYSTEM.md` — generalized system design (this file) |
| ✅ | `FINTECH-RESEARCH.md` — fintech trends & aggregator patterns |
| ✅ | `SEO-AGENT-READINESS.md` — SEO + agent-readiness plan |
| ✅ | Signature motif library §4.3 — incl. `Meteors` + `Particles` |
| ⛔ | `frontend-audit.md` — starter template sits beside this file; **hold — fill/run ONLY when explicitly told** |

### 11.2 Code layer (only when we switch to the frontend)

> ⛔ **Phase 0 — Audit is DEFERRED.** Not part of the default flow — it runs only when explicitly requested, and NO code changes happen until its file exists.

1. ⏳ Scaffolding + alias configuration (`jsconfig.json` / shadcn `components.json`).
2. ⏳ shadcn/ui consolidation + design tokens — no feature migration yet.
3. ⏳ `lib/formatters/`, `lib/validation/`, `lib/api/` — centralize, don't migrate features.
4. ⏳ `components/` shared layers (`ui` → `blocks` → `data-display` → `feedback`).
5. ⏳ Migrate features **one at a time, app fully working each step**: `auth` → `broker` → `portfolio` → `notes` → `fixed-deposit` → `ppf` → `epf` → `gold-silver` → `mutual-fund` → `calculators` → `billing` (scaffold).
6. ⏳ Delete dead code + now-unused duplicates.
7. ⏳ Final verification (Definition of Done).

### 11.3 Design/theme track (rides in parallel as approved PRs)

1. ⏳ Token additions (§2.3–2.5) → 2. ⏳ motif-library components (`Meteors`, `Particles`, `BorderBeam`, `SectionHeading`, `AnimatedHeading`, ThemeSwitcher) → 3. ⏳ landing renovation → 4. ⏳ authenticated-shell polish → 5. ⏳ landmine fixes (AuthGuard blue spinner → tokens; drop unused `ct-*` palettes; consolidate duplicate `formatCurrency` → `lib/formatters`; kill dual toast stacks → sonner only).

---

## 12. Definition of Done

- `npm run check` (lint + format + jest) and `npm run build` pass with zero errors.
- Every route in the pre-migration route map still resolves and renders identically (cypress smoke).
- **Zero duplicated components** per the audit's duplicates list — one canonical implementation each.
- **Zero direct `fetch`/`axios`** inside `app/` or `features/*/components/`.
- **Zero inline currency/date/percentage formatting** outside `lib/formatters/`.
- All money/pill/status badges render through their single canonical component (`CurrencyDisplay`, `DateDisplay`, `StatusBadge`, `DiscrepancyBadge`).
- No arbitrary one-off Tailwind colors — anything new is a documented token.

## 13. Non-Goals

- No backend changes.
- No new business features (billing is a scaffold only).
- No route URL changes under `app/calculators/**`.
- No behavior changes except where architecture/security/audit demand them.