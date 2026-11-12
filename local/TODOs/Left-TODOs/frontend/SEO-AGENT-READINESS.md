# SEO + AGENT-READINESS PLAN — coinTrack frontend

> Everything to make coinTrack **findable by humans AND consumable by AI agents**.
> Applies to `frontend/` (Next.js **16.2.6**, **JavaScript** app — files are `.js`/`.jsx`, not `.ts`).
> ⚠️ Per repo `AGENTS.md`: read `frontend/node_modules/next/dist/docs/` before writing any Next code — Next 16 changed APIs.

---

## 1. Current state (audit findings)

| Concern | Status |
|---|---|
| Metadata | Only in root `app/layout.js` (default title, `%s | coinTrack` template, one description). No `keywords`, `openGraph`, `twitter`, `canonical`, `metadataBase`, `robots`. |
| Per-page metadata | **None.** Every page is `'use client'` → can't export `metadata`. Public SEO-heavy surfaces (landing, 40+ calculators, auth) share the root title. |
| `sitemap.xml` | Missing |
| `robots.txt` | Missing (only security headers in `next.config.mjs`) |
| `manifest` / icons | Only `src/app/icon.png` |
| OG / social images | Missing |
| JSON-LD structured data | None |
| `llms.txt` / AI assets | None |
| Indexing control | Private `(main)/*` routes not blocked (no per-route robots) |

**Prod URLs:** frontend `https://cointrack-finance.vercel.app` · backend `https://cointrack-backend-1g44.onrender.com` · `NEXT_PUBLIC_APP_URL` in `.env`.

---

## 2. SEO implementation plan (file-by-file)

### 2.1 Root metadata upgrade — `src/app/layout.js` (server, keep providers intact)

```js
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cointrack-finance.vercel.app'),
  title: { default: 'coinTrack — Track all your investments in one place', template: '%s | coinTrack' },
  description: 'Aggregate Zerodha, Upstox & Angel One portfolios with manual gold, EPF, PPF, FD and mutual-fund ledgers. Unified net-worth, P&L and tax-ready reports.',
  keywords: ['portfolio tracker', 'investments', 'net worth', 'Zerodha', 'Upstox', 'Angel One', 'mutual funds', 'SIP calculator', 'stock portfolio', 'India finance'],
  authors: [{ name: 'coinTrack' }],
  creator: 'coinTrack',
  publisher: 'coinTrack',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/', siteName: 'coinTrack',
    title: 'coinTrack — The personal finance quarterly',
    description: 'Live broker integration + rigorous manual ledgers, rendered with the patience of a printed page.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'coinTrack' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'coinTrack',
    description: 'Your portfolio, set in clear type.',
    images: ['/opengraph-image'],
  },
};
```

Known Next-16 constraints → **verify in `node_modules/next/dist/docs/`** before finalizing any field.

### 2.2 Per-route SEO with layouts (fixes the "all-client" problem)

`metadata` can be exported from a **server `layout.js`** even when the page underneath is a client component — layouts are resolved as part of the route segment. Create/append:

> ⚠️ **Current state (verified 2026-09-19):** `src/app/(main)/layout.js` (AuthGuard + MainLayout), `src/app/(access)/layout.js` (auth redirect), and `src/app/calculators/layout.jsx` are all **`'use client'`** today and cannot export `metadata`/`robots`. Each must be converted to a Server Component (or given a sibling server layout where a client provider wrapper is required) before these exports work. The access routes already have per-route server `layout.js` files (e.g. `login/layout.js`) exporting titles.

| File | Export |
|---|---|
| `src/app/layout.js` (root) | Global metadata + `robots` for whole site |
| `src/app/(main)/layout.js` | `robots: { index: false, follow: false }` — block every private dashboard route from index |
| `src/app/(access)/layout.js` | `robots: { index: false, follow: false }` — login/register/reset/2FA/verify |
| `src/app/calculators/layout.jsx` | Full metadata: title, description, OG, `alternates`, breadcrumb — calculators are the SEO goldmine |
| `src/app/page.jsx` | *Optional:* keep `'use client'`; landing SEO lives in root layout (already private-free) |

### 2.3 `src/app/sitemap.js` (new, server)

Public URLs only (never private/auth routes). Use `NEXT_PUBLIC_APP_URL`.

```js
export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://cointrack-finance.vercel.app';
  const calculators = [ /* derive from the 8 categories × ~4-6 each */ ];
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/calculators`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...calculators.map(p => ({ url: `${base}/calculators/${p}`, changeFrequency: 'monthly', priority: 0.7 })),
  ];
}
```

Calculator routes (from audit): `investment/{sip,step-up-sip,lumpsum,cagr,xirr,stock-average,inflation}` · `savings/{ppf,epf,fd,rd,ssy,nps,nsc,scss,mis,apy}` · `loans/{emi,home-loan-emi,car-loan-emi,simple-interest,compound-interest,flat-vs-reducing}` · `tax/{income-tax,hra,salary,gratuity,gst,tds}` · `trading/{brokerage,margin}` · `planning/retirement`.

### 2.4 `src/app/robots.js` (new, server) — combining SEO + agent policy

```js
export default function robots() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://cointrack-finance.vercel.app';
  return {
    rules: [
      // Everybody (classic SEO)
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/login', '/register', '/dashboard/', '/profile/', '/notes/', '/brokers/', '/mutual-fund/'] },
      // AI crawlers — explicitly welcomed for agent-readiness on public content
      { userAgent: ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot', 'anthropic-ai', 'OAI-SearchBot', 'Applebot-Extended', 'meta-externalagent', 'cohere-ai', 'Bytespider', 'Amazonbot', 'KagiBot'], allow: ['/', '/llms.txt', '/llms-full.txt'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

> Only robots.txt can grant **separate** allowances to AI bots — a global `disallow` applies to everyone. Keep the AI list `allow`-friendly or they inherit the private disallows.

### 2.5 Structured data (JSON-LD) — build `src/components/seo/JsonLd.jsx`

Server component that renders `<script type="application/ld+json">`:

- **Root layout:** `Organization` (name, url, logo `/coinTrack.png`, sameAs) + `WebSite` (name, url, potentialAction SearchAction → calculator search).
- **Landing:** `SoftwareApplication` on the finance category.
- **Calculators:** `BreadcrumbList` + `WebPage` per calculator; a shared `FAQPage` grouped per category (SIP/EMI/FD/TDS) → rich-results juice with zero backend work.

### 2.6 OG image — `src/app/opengraph-image.jsx` (new)

Use Next `ImageResponse` (`next/og`) for a 1200×630 editorial card: warm-paper or obsidian bg, `coinTrack` serif wordmark, `₹14,82,300` hero numeral, gold→violet flare accent, hairline rules. Keep static (`runtime: 'nodejs'` server file). Optionally `twitter-image.jsx` reusing the same art.

### 2.7 `src/app/manifest.js` (new) + favicons

Web app manifest (name, short_name, theme_color `#0f1117`, background_color paper/`#f5f2ea`, icons `icon.png` size). Add `apple-touch-icon` + `favicon` links in root layout `head`.

### 2.8 `public/favicon.ico`, `public/apple-icon.png`, `public/icon-192/512.png`

Resize/derive from the existing `coinTrack.png` (2.2MB — also optimize it; it's heavy).

---

## 3. Agent-readiness plan (AI crawlers + LLM tooling)

"Agent readiness" = making the site **crawlable/parseable by AI agents** so the product shows up correctly in LLM answers, AI search (ChatGPT/Perplexity/Google AI Mode) and future agent tooling.

### 3.1 `public/llms.txt` (llmstxt.org standard, new)

Markdown, <= ~100 technical lines, defines the site for agents:

```
# coinTrack

> Live broker aggregation + manual alternative-asset ledgers (India).
> Your portfolio, set in clear type.

## What coinTrack does
- Aggregates Zerodha / Upstox / Angel One portfolios
- Manual ledgers: Gold & Silver, EPF, PPF, FD, Mutual Funds (FIFO gains engine)
- Unified net-worth, P&L, tax-ready reports; Google SSO + TOTP 2FA

## Public surfaces (included in sitemap)
- /# — landing (features, pricing, brokers)
- /calculators — 40+ SIP/EMI/FD/tax/retirement calculators

## Auth & verified endpoints (React Query keys)
- /dashboard, /portfolio (holdings/positions/orders/trades), /brokers/*, /mutual-fund, /fixed-deposit, /ppf, /epf, /gold-silver, /notes

## Tech / deploy
- Frontend: Next.js 16 (App Router) · Tailwind 3 · shadcn/ui · recharts · TanStack Query
- UI layer: `components/ui/` split into `primitives/`, `feedback/`, `forms/`, `search/`, `data-display/`, `auth/` (design system folder removed)
- Backend: Spring Boot at https://cointrack-backend-1g44.onrender.com/api (JWT, isolated tenants)
- Deploy: Vercel (frontend), Render (backend), Docker compose

## Humans
- Landing: https://cointrack-finance.vercel.app ·
```

**Optional:** `llms-full.txt` — extended version including per-calculator formulas (SIP A = P×[{(1+i)^n −1}/i]×(1+i), etc.) for deep agent answers.

### 3.2 `public/.well-known/security.txt`

Contact + policy URLs (`Contact:<url>`, `Expires:` ISO date). Cheap trust signal crawled by both humans and agents.

### 3.3 Structured data (§2.5) — the agent-understanding backbone

`Organization`, `WebSite`, `SoftwareApplication`, `BreadcrumbList`, `FAQPage` JSON-LD teaches agents what the product is without scraping whole pages.

### 3.4 `frontend/AGENTS.md`

Extend repo-root agent rules with frontend specifics (already present at repo root — ensure the Next-16 docs warning + test commands are mirrored): commands, architecture summary, convention pointers (`lib/motion.js`, `ed-*` classes, `globals.css` token set — the design-system folder was removed; styled components now live in `components/ui/{primitives,feedback,forms,search,data-display,auth}/`), and *"read Next docs before writing code"*.

### 3.5 Optional (phase 2)

- `public/openapi.yaml` mirror of the backend `/api` surface (from `postman/` in repo root or Spring endpoints) → agents can call/test the API.
- `/.well-known/llms.txt` alias for maximal discovery.
- Exposure of the backend OpenAPI URL in `llms.txt` so agent frameworks can auto-tool it.
- IndexNow ping across search engines (Bing/Seznam) on calculator additions — from the 2026 SEO research, Bing indexes within minutes via `api.indexnow.org`.

---

## 4. Rollout checklist

- [ ] 1. Confirm Next-16 metadata API in `node_modules/next/dist/docs/`.
- [ ] 2. Upgrade `layout.js` metadata (§2.1) + inject `Organization`/`WebSite` JSON-LD.
- [ ] 3. Add `(main)` & `(access)` layout `robots.noindex`.
- [ ] 4. Create `sitemap.js` (§2.3), `robots.js` (§2.4 incl. AI bots), `manifest.js` (§2.7).
- [ ] 5. Build `components/seo/JsonLd.jsx` + calculators `FAQPage`/`BreadcrumbList`.
- [ ] 6. Generate OG image via `opengraph-image.jsx` (ImageResponse).
- [ ] 7. `public/llms.txt`, `llms-full.txt`, `.well-known/security.txt`, favicon set.
- [ ] 8. Optimize `coinTrack.png` (2.2MB → ~50–150KB) + add `apple-icon`.
- [ ] 9. Verify: `curl -s <site> | grep -E 'og:|twitter:|canonical|description'`, `curl -s <site>/sitemap.xml | head`, `curl -s <site>/robots.txt`
- [ ] 10. Submit sitemap in Google Search Console; register IndexNow.

**Success bars:** every public route has unique title/description/canonical/OG; private routes are `noindex`; `sitemap.xml` + `robots.txt` serve correctly; AI bots allowed on public content; `llms.txt` renders cleanly as plain text; core-wvitals unchanged (metadata is static/server-side, zero JS cost).