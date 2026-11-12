# Frontend Audit — Phase 0 (cointrack-frontend)

> **STATUS: ✅ COMPLETE — filled report (unlocked on explicit request).**
> This is the filled-in audit, living HERE in `local/TODOs/Left-TODOs/frontend/`.
> Legend: ☐ pending · ✅ verified clean · ⚠️ action needed (fix noted under "Evidence / Notes").
> Gate: this report feeds the **Definition of Done** and may gate migration step 2 (`scaffolding`).

## 0. Scan metadata

| Field | Value |
|---|---|
| Frontend root | `coinTrack/frontend` (Next.js 16.2.6 App Router, JS) |
| Next version | 16.2.6 (`next dev --webpack`) |
| Backend base | `https://cointrack-backend-1g44.onrender.com` |
| Prod frontend | `https://cointrack-finance.vercel.app` |
| Date scanned | 2026-08-30 |
| Auditor | opencode (big-pickle) — multi-agent scout + soldier review |
| Method | 4 parallel explorers (routing / components / formatting+fetch / styling+dead+radix) + read-only grep/glob |

---

## 1. Routing map (public vs protected)

Sections: `(access)` public-login/noindex · `(main)` protected shell · `app/calculators/**` public + SEO (URLs frozen) · landing `/`.

> **Global notes (findings that apply to every row):**
> - **Every `page.jsx` in the app is a Client Component.** No Server pages exist.
> - **Only 4 files export `metadata`:** root `layout.js` + `(access)/login/layout.js`, `register/layout.js`, `forgot-password/layout.js`.
> - **`robots` is exported nowhere.** No `sitemap.js`/`robots.js`/`manifest.js`. → feeds SEO-AGENT-READINESS plan.
> - Protected `(main)/*` routes are **NOT blocked from indexing** (no robots directive).

| Route | Public / Protected | Renders as (Server / Client) | Notes |
|---|---|---|---|
| `/` (landing) | Public (SEO) | Client | `page.jsx` `'use client'`; no sibling layout; SEO lives in root layout |
| `/login` | Public (noindex) | Client page + **Server layout** | layout exports `title: 'Login'` |
| `/register` | Public (noindex) | Client page + **Server layout** | layout exports `title: 'Register'` |
| `/forgot-password` | Public (noindex) | Client page + **Server layout** | layout exports `title: 'Forget Password'` |
| `/complete-profile` | Public (noindex) | Client | no layout/metadata → root title · **CORRECTION (verified 2026-09-19):** no such route exists — `complete-profile` is a **mode** of `src/components/ui/auth/register-screen.jsx`, triggered by `tempToken` on `app/(access)/register/page.jsx` |
| `/reset-password` | Public (noindex) | Client | no layout/metadata → root title |
| `/reset-2fa` | Public (noindex) | Client | no layout/metadata → root title |
| `/setup-2fa` | Public (noindex) | Client | no layout/metadata → root title |
| `/verify-email` | Public (noindex) | Client | no layout/metadata → root title |
| `/dashboard` | Protected | Client | no metadata; (main)/layout is Client, no SEO |
| `/portfolio` | Protected | Client | " (no metadata) |
| `/brokers{/zerodha,/angelone,/upstox}` + `/dashboard` + `/callback` (×3) | Protected | Client | 9 routes; all no metadata; blue spinner at `zerodha/callback/page.jsx:34` |
| `/mutual-fund` | Protected | Client | dual toast import (see §2/§3) |
| `/notes` | Protected | Client | no metadata |
| `/epf` | Protected | Client | no metadata |
| `/ppf` | Protected | Client | no metadata |
| `/fixed-deposit` | Protected | Client | no metadata |
| `/gold-silver` | Protected | Client | no metadata |
| `/profile` | Protected | Client | mixed date locales (see §3) |
| `/calculators` + 32 sub-pages | **Public SEO** | **All Client** | `calculators/layout.jsx` is Client, **no metadata/robots** — SEO goldmine shares root generic title |
| `/api/ifsc`, `/api/mf-search` | Server route handlers | Node | legit server `fetch` (proxy scrapers) |

**Section 1 verdict:** ⚠️ Public SEO surfaces (calculators + landing) have **no unique titles/descriptions/canonical/OG** and no per-route robots control for private routes. Fix per `SEO-AGENT-READINESS.md` §2 (server `layout.js` metadata + `robots` + `sitemap` + `manifest`).

---

## 2. Component inventory + duplicates

> **Update (2026-09-14):** UI components reorganized into logical subfolders under `components/ui/`:
> - `primitives/` (21 files): button, card, dialog, input, badge, tabs, table, label, tooltip, separator, scroll-area, etc.
> - `feedback/` (7 files): sonner, use-toast, Skeleton, animated-icons, confirm-dialog, PageTransition, toast-card
> - `forms/` (5 files): dropdown-select, currency-stepper, CategoryDropdown, FilterDropdown, utility-inputs
> - `search/` (3 files): BankSearchCombobox, SchemeSearchCombobox, search-combobox
> - `data-display/` (2 files): announcement-card, chart
> - `auth/` (2 files): login-screen, security-inputs
> - Root: `inset-form-card.jsx` (ambiguous placement)
>
> All 54+ call sites updated with new import paths (e.g., `@/components/ui/primitives/button`). **Design system folder deleted.**

**Key structural fact:** the `ui/primitives/` components exist but are **massively under-consumed**; feature code hand-rolls parallel implementations. Fully 12 `ui/primitives/` components have **zero importers**: `badge`, `select`, `tabs`, `table`, `label`, `command`, `progress`, `tooltip`, `separator`, `scroll-area`, `chart`, `PageTransition`.

| Component | Canonical in | Duplicates found at | Action |
|---|---|---|---|
| Dialog / Modal | `ui/primitives/dialog.jsx` | **23 bespoke `fixed inset-0` overlays**: `goldsilver/{GoldSilverDialog,RateSettingsDialog}`, `fixeddeposit/{FdDialog,WithdrawDialog}`, `epf/{EpfTransactionDialog,EpfSettingsDialog,EpfInterestRateDialog}`, `ppf/{PpfDialog,PpfSettingsDialog}`, `notes/NoteDialog`, `brokers/ConnectBrokerDialog`, `modals/{ContactModal,LegalModals}`, `mutual-fund/{RedemptionModal,LumpsumTransactionModal,SipContributionModal,SipMandateModal,NewSchemeModal}`, `mutual-fund/components/{ValuationSnapshotModal,UpdateValuationModal,OverrideUnitsModal,SipTab(inline)}` | Retarget all → thin form-wrappers over `ui/primitives/dialog` |
| Status badge / pill | `ui/primitives/badge.jsx` (never used) | gold-silver `StatusBadge`+`RateModeBadge`, fixed-deposit `StatusBadge`, SchemeSummaryTab `StatusBadge`, BrokerCard/ProfileTab `StatusPill`, LumpsumTab/RedemptionTab `getStatusBadge`, `.ed-pill*` CSS, inline `bg-green-500/10` pills | One `StatusBadge` + `DiscrepancyBadge`; drop `.ed-pill` |
| Table | `ui/primitives/table.jsx` (never used) | `.ed-table` CSS (8 components), 20+ bespoke `<table>` (epf/fd/gs/ppf pages, all MF tabs, TdsSummary, CalculatorComponents) | Compose `.ed-table` → `ui/primitives/table` variants |
| Toast | `sonner` + `ui/feedback/sonner.jsx` (mounted `layout.js`) | legacy `ui/feedback/use-toast.js` adapter (24 files) + direct `import {toast}` (~9 files); **`mutual-fund/page.jsx` imports both** | Delete `use-toast.js`; single sonner API |
| Button | `ui/primitives/button.jsx` (6 importers) | `.ed-btn*` CSS (56 files); `AuthSubmitButton`, CalculatorComponents, `RefreshButton`, `BrokerCard`, MF modal footers | Fold `.ed-btn*` into `ui/primitives/button` CVA |
| Card | `ui/primitives/card.jsx` (1 importer) | `.ed-card*` CSS (~60 files); `StatsCard`, `PortfolioSummary`, `BrokerCard` | Fold `.ed-card` → `ui/primitives/card` variants |
| Currency display | `lib/formatters/currency` (planned) | ~22 `formatCurrency`-family defs (see §3) | Single `CurrencyDisplay` + `lib/formatters` |
| Date display | `lib/formatters/date` (planned) | ~20 inline sites, 9× clock-line copy, wrong locales (see §3) | Single `DateDisplay` + `lib/formatters` |
| Select | `ui/primitives/select.jsx` (never used) | 13+ native `<select>` (FdDialog, EpfDialog, PpfDialog, TDS calc, SIP modals, SchemeSummaryTab) | Retarget → `ui/primitives/select` |
| Tabs | `ui/primitives/tabs.jsx` (never used) | `PortfolioTabBar` (framer), MF query-string tabs, profile bespoke | Retarget → `ui/primitives/tabs` |
| Skeleton | `ui/feedback/Skeleton.jsx` (16 importers) | local `Skeleton` ×2 (dashboard), `EpfTableSkeleton`, `PpfTableSkeleton`, `NoteCardSkeleton`, `TabLoadingSkeleton`, `ResultSkeleton` | Single `Skeleton`; one `EmptyState`/`ErrorState` |
| Form field / input | `ui/primitives/input-group.jsx`/`ui/primitives/input.jsx` | `AuthFormField`, framework `FormField`, 44 direct `<input>`, `.ed-input` CSS (26 files) | One `Field` wrapper in `components/forms/` |
| Alert / banner | `ui/primitives/alert.jsx` (1 importer) | AuthAlert, DisclaimerBanner, DataAccuracyWarning, BrokerStatusBanner, BrokerInfoBanner, RateDisclosureBanner, inline banners | Compose alert variants into one |

---

## 3. Duplicated formatting / business logic

**Top finding:** a proper `src/lib/formatters/` module **does not exist.** Three competing "canonical" modules have **different rounding + null handling**, plus ~18 local copies.

| Logic | Found at | Consolidates to |
|---|---|---|
| `formatCurrency` (₹ en-IN) | Defs: `lib/format.js:15` (2dp, em-dash) · `lib/calculator.service.js:381` (**0dp** — different!) · `utils/formatters.js:7` (**orphaned**) · **18 local copies** (WithdrawDialog, TdsSummary, FdDialog `formatIndianCurrency`, PpfDialog, EpfTransactionDialog, GoldSilverDialog, gs/ppf/fd/epf/MF pages ×7 MF tabs) | `lib/formatters/currency.js`; expose `{dp:0\|2}` option |
| `formatInIndianWords` | `PpfDialog:28`, `WithdrawDialog:21`, `FdDialog:82` (3 copies) | `lib/formatters/currency.js` |
| `formatPercent` / `%` | `lib/format.js:34` · `calculator.service.js:393` (string-concat, ignores en-IN) · `CalculatorComponents:121,204` · DashboardTab/ValuationTab/ValuationSnapshotTab `%` · `TdsSummary`/`WithdrawDialog` `fmtPercent` | `lib/formatters/percent.js` |
| `formatDate` / `formatDateTime` (IST) | canonical `lib/format.js:41` (only `Asia/Kolkata`) · local dup: `ProfileTab:67` (IST), `ppf/page:33`, `ValuationTab:17`, `ValuationSnapshotTab:26`, `SipTab:19` | `lib/formatters/date.js` |
| Locale-inconsistent dates | `profile/page:467` `en-US`; `TotopSetup:89` `en-US`; default-locale `.toLocaleString()`: profile:94, gold-silver:886, brokers pages:115/166/171, SipTab:251 | `lib/formatters/date.js` (force `en-IN` + IST) |
| Masthead clock line (`useNow` + long date + time) | copy-pasted ×9: `layout/Header:61-96`, `auth/AuthPageShell:40-48`, `app/page:112-118`, `app/not-found:46-52`, `(access)/not-found:37-45`, `calculators/layout:31-37`, `calculators/page:236`, `ContactModal:50-57`, `LegalModals:115` | one `useNow`/`LiveClock` hook |
| `getFinancialYear` / FY labels | canonical `lib/format.js:56` · re-impl `LumpsumTab:9`, `RedemptionTab:9` · inline `FY ${fy}` in `ppf/page:117,215` | `lib/formatters/date.js` |
| XIRR / CAGR | computed server-side `calculator.service.js` (`calculateXIRR/CAGR`); display via the inconsistent `formatPercentage` | keep compute; unify display |
| `.toFixed(` (63 total) | inline in components/pages: RateSettingsDialog (10), GoldSilverDialog, FdDialog (Cr/Lakh/k), PpfDialog, gs/page (₹…/g), MF modals (units/stamp-duty), SIP modals, ValuationTab/DashboardTab `%`, MfTimeline/MfOrdersTab/MfHoldingsTab `units.toFixed(3)`, sip calc chart tick | all → `lib/formatters` (no raw `toFixed` in TSX) |
| Hardcoded `₹` mock strings (lampshade money) | `app/page.jsx:319-354` (`₹14,82,300`…), gs/page ₹…/g, RateSettingsDialog ₹…/g, `profile/page:592-611` `toLocaleString('en-IN')` | marketing-only; keep but document; profile → `formatCurrency` |

---

## 4. Client components convertible to Server

> Scope note: **every** page is Client today. Full conversion is step-5-of-migration territory; this section flags the *cheap, high-value* wins (they align with the migration plan §6 "Server Components are the default").

| File | Currently | Convertible to | Why |
|---|---|---|---|
| `app/(access)/{complete-profile,reset-password,reset-2fa,setup-2fa,verify-email}` | Client, no metadata | Client page + **Server layout exporting metadata** | matches login/register pattern; gives per-route SEO |
| `app/(main)/layout.js` | Client (AuthGuard+MainLayout) | **Server layout** (keep Client children) | can export `robots.noindex` → blocks protected routes from index |
| `calculators/layout.jsx` | Client | **Server layout** (keep Client page children) | can export per-calculator metadata/OG; masthead breadcrumb could stay Client |
| `app/(access)/layout.js` | Client wrapper (auth-redirect) | keep Client (needs state) | N/A — interactivity required |
| Individual calculator pages | Client | Keep Client (interactive forms) but add Server layout metadata | isolates SEO without rewriting interactivity |

---

## 5. Components fetching data directly

> Design-system §8: no `fetch`/`axios` in `app/` or feature components; all through `services/`/hooks. `axios` is clean (only `lib/api.js`). `fetch` violations are limited but real. Bigger structural gap: **no `services/` directory exists** — `lib/api.js` (1401 lines) is the de-facto service layer and most features inline `useQuery`+service rather than using the 8 `hooks/`.

| File | Fetches | Should go through |
|---|---|---|
| `ui/search/SchemeSearchCombobox.jsx:55,81,98` | direct `fetch` to **external** `api.mfapi.in` + `/api/mf-search` | `mutualFundAPI`/service + React Query; **never external domain from client** |
| `ui/search/BankSearchCombobox.jsx:37` | direct `fetch('/api/ifsc')` + own sessionStorage cache | service + query cache |
| `dashboard/HoldingsTable.jsx` | inline `useQuery`+`portfolioAPI` despite `usePortfolioHoldings` existing | `usePortfolioHoldings` hook |
| `dashboard/RefreshButton.jsx`, `BrokerStatusBanner.jsx` | inline `portfolioAPI`/`brokerAPI` useMutation/useQuery | existing hook (`useBrokerSummary`, `useBrokerConnection`) |
| `portfolio/tabs/{TradesTab,ProfileTab,MfTimelineTab,MfSipsTab,MfOrdersTab,MfInstrumentsTab,MfHoldingsTab}` | inline `useQuery`+`portfolioAPI` | portfolio-tab hooks (extend `usePortfolio*` set) |
| `fixeddeposit/TdsSummary.jsx`, `ppf/PpfDialog.jsx`, `goldsilver/{GoldSilverDialog,RateSettingsDialog}`, `mutual-fund/RedemptionModal.jsx` | inline `useQuery`/`useMutation`+`*API` | feature `services/` + hooks |
| Tier-3 **pages** with all data inlined: `profile`, `ppf`, `fixed-deposit`, `gold-silver`, `epf`, `notes`, `mutual-fund` (+ modals/tabs) | inline `useQuery`+multi-`*API` imports | migrate to feature `services/`+hooks over time |
| ✅ Model citizens | `PortfolioSummary`, `portfolio/page`, `HoldingsTab`, `PositionsTab`, `OrdersTab`, `Sidebar`, `BrokerCard` use hooks | — |

**Also flagged:** `hooks/useZerodhaDashboard.js` is a **deprecated stub** — delete.

---

## 6. Inconsistent styling

> Baseline: `globals.css` + `tailwind.config.js` define full HSL token set (`--background`…`--chart-5`, `--gain/--loss/--neutral`, `--broker-*`, `--sidebar-*`) plus mapped utilities `text-gain`/`text-loss`/`bg-gain`/`bg-loss`/`border-hairline`.

| Location | Usage | Token fix |
|---|---|---|
| `app/page.jsx`, `not-found.js`, epf/fd/gs/notes/profile, CalculatorComponents, MF tabs | `text-[hsl(var(--gain))]`, `bg-[hsl(var(--loss))]`, `border-[hsl(var(--accent))]` — **~50 arbitrary-value hacks** | use mapped utilities `text-gain`/`bg-loss`/… |
| `goldsilver/*` (GoldSilverDialog, RateDisclosureBanner, MarketRateDialog) | raw `bg-amber-500`, `bg-slate-500`, `bg-blue-500`, `bg-emerald-500` | → `--gain/--loss/--neutral/--accent/--chart-*` |
| `mutual-fund/components/*` (SipTab, SchemeSummaryTab, LumpsumTab, RedemptionTab, DashboardTab) | raw `bg-amber-500`, `text-red-500`, `text-yellow-500`, `text-amber-*` status chips | → status tokens |
| **~20 calculator pages** (salary/hra/gratuity/gst/tds/apy/nps/mis/scss/ssy/stock-average/…) | `bg-green-50 dark:bg-green-900` + `text-green-600`… result bands | → `--gain-muted`/`--gain-foreground` tokens |
| `portfolio/tabs/DataAccuracyWarning.jsx` | `bg-yellow-500`, `border-yellow-500` | → `--warning`/`--neutral` token |
| `notes/NoteDialog.jsx:75` | dynamic `bg-${color}-50 dark:bg-${color}-900` | → tokenized note palette |
| **Broken classes** | `bg-hairline` used in **16 files but NOT defined** (only `.border-hairline` exists); `ed-muted-text` used (RedemptionModal:738, LumpsumTransactionModal:547) but **not defined** | define `bg-hairline` utility (or `bg-[hsl(var(--hairline))]`) + remove/replace `ed-muted-text` |
| Legacy blue overrides | `AuthGuard.jsx:52` `border-blue-200 border-t-blue-600` (blue AI spinner), `zerodha/callback/page.jsx:34` same | → `border-hairline border-t-foreground` (matches verify-email) |
| tailwind.config.js | dead `ct-primary/ct-success/ct-warning/ct-error` palettes (0 usages) | delete |
| globals.css | dead `.ticker-track`+`ct-ticker`, `.ed-card-flat`, `.ed-pill-accent` | delete |
| `app/page.jsx:307` | `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` one-off | token shadow utility |

---

## 7. Dead code

| Item | Reason dead | Action |
|---|---|---|
| `components/auth/AuthDivider.jsx` | never imported | delete |
| `components/brokers/ConnectBrokerDialog.jsx` | legacy; broker setup lives in `app/(main)/brokers/*/page.jsx` | delete (also removes ~50 raw-palette colors) |
| `components/calculators/CalculatorComponents.jsx` | 0 importers (all 33 pages use `framework/`) | delete |
| `components/ui/primitives/{command,input-group,PageTransition,progress,scroll-area}.jsx` | 0 importers | delete (command/input-group only feed each other) |
| `components/ui/primitives/{chart,badge,tabs,table,label,tooltip,separator}.jsx` | 0 importers | keep-or-activate per §2 retarget |
| `components/ui/feedback/PageTransition.jsx` | 0 importers | delete |
| `components/ui/feedback/toast-card.jsx` | 0 importers | delete |
| `utils/formatters.js` (257 lines) | **entire module orphaned** (0 importers) despite being most complete; holds dead `#22c55e` hex colors | fold `currency/date/percentage` into `lib/formatters/`, then delete |
| `hooks/useZerodhaDashboard.js` | deprecated stub, never imported | delete |
| blue AuthGuard spinner + duplicate | hardcoded `border-blue-200 border-t-blue-600` | tokenize (see §6) |
| `tailwind.config.js` `ct-*` palettes | 0 usages | delete |
| `globals.css` `.ticker-track`/`ct-ticker`, `.ed-card-flat`, `.ed-pill-accent` | unused | delete |
| `@radix-ui/react-*` ×6 + `cmdk` deps in package.json | nothing imports directly (all via umbrella `radix-ui`; `cmdk` only for dead `command.jsx`) | remove from package.json |

---

## 8. Circular imports / domain-boundary violations

> ✅ **No circular imports** — import graph is a clean DAG (`lib/logger ← lib/api ← lib/calculator.service`, `contexts/AuthContext → lib/api`).

| Pattern | Violates | Fix |
|---|---|---|
| `DataAccuracyWarning` (in `portfolio/tabs/`) imported by 3 mutual-fund modals (`RedemptionModal:6`, `SipContributionModal:5`, `LumpsumTransactionModal:6`) | cross-domain: MF → portfolio internals | hoist `DataAccuracyWarning` (and `BrokerInfoBanner`) to shared `components/feedback` or `ui/` |
| MF feature split between `app/(main)/mutual-fund/**` and `components/portfolio/{MfTimeline,MfSipList,MfInstrumentList}` | feature not isolated in one home | consolidate MF display components under one MF feature dir |
| Feature pickers in shared `ui/`: `ui/search/SchemeSearchCombobox` (only MF), `ui/search/BankSearchCombobox` (fd+MF), `ui/forms/FilterDropdown` (ppf/epf/MF), `ui/forms/CategoryDropdown` | shared-layer pollution | move to owning feature `components/` |
| Broker brand-accent map (`hsl(var(--broker-*))`) copy-pasted ~7 places: `BrokerStatusBanner:14-16`, `HoldingsTable:22-24`, `HoldingsTab:19-21`, `PositionsTab:18-20`, `ProfileTab:31,45,52`, `BrokerCard:20-22`, `BrokerSetupLayout:7-9` | duplicated business lookup | use `lib/brokerConfig.js` (exists, bypassed) |

---

## 9. Radix vs shadcn overlap

> ✅ **Zero direct `@radix-ui/*` imports in `src/`** — all 14 `ui/primitives/` wrappers import the umbrella `radix-ui` (1.4.3). No component bypasses shadcn wrappers. This section is about **redundant deps + unused wrappers**, not overlap.

| Primitive | Sources found at | Canonical pick |
|---|---|---|
| All radix-backed primitives (dialog, dropdown, select, tabs, tooltip, sheet, separator, scroll-area, progress, avatar, popover, label, button Slot, badge Slot) | only `ui/primitives/*` (via umbrella `radix-ui`) | `ui/primitives/*` wrappers (keep) |
| Direct `@radix-ui/react-{dialog,dropdown-menu,select,switch,tabs,tooltip}` + `cmdk` | **declared but nothing imports directly** | remove from package.json (transitively covered by umbrella) |
| `ui/primitives/{select,tabs,tooltip}.jsx` | exist but 0 consumers (native `<select>`, bespoke PortfolioTabBar/profile toggle) | activate via §2 retarget, then `react-select`/`react-tabs`/`react-switch`/`react-tooltip` deps become removable |

---

## 10. Gate sign-off

- ✅ Every section above scanned and filled.
- ✅ Routing map verified against `app/` tree (4 explorers + read-only traversal).
- ✅ Duplicates list finalized → feeds **Definition of Done** (replacing the deleted `DESIGN-SYSTEM.md`).
- ✅ **UI components reorganized into subfolders** (`primitives/`, `feedback/`, `forms/`, `search/`, `data-display/`, `auth/`) — import paths fully migrated, design-system folder deleted.
- ✅ **Master Implementation Plan Ready:** Complete step-by-step roadmap available in [`FRONTEND_REFACTORING_IMPLEMENTATION.md`](./FRONTEND_REFACTORING_IMPLEMENTATION.md) (bridged with [`INPUT_OUTPUT_NORMALIZATION`](../INPUT_OUTPUT_NORMALIZATION/06_FRONTEND_INTEGRATION_SPEC.md)).
- ✅ **Signed off** → ready for OpenCode step-by-step implementation.

> **Recommended immediate (low-risk) landmine fixes in Phase 1** (see `FRONTEND_REFACTORING_IMPLEMENTATION.md`):
> 1. AuthGuard + zerodha-callback blue spinner → tokens.
> 2. Define `bg-hairline`; remove undefined `ed-muted-text`.
> 3. Delete confirmed orphans (AuthDivider, ConnectBrokerDialog, legacy CalculatorComponents, PageTransition, dead `ui/` wrappers, `useZerodhaDashboard`, `utils/formatters.js` after fold, `ct-*` palettes, dead CSS).
> 4. Remove redundant `@radix-ui/react-*` + `cmdk` deps.
