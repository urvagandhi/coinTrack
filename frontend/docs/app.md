# 📂 App Router Structure (`src/app/`)

The `app` directory follows the **Next.js 16 App Router** pattern, prioritizing logic isolation and URL-based routing.

## 🏗️ high-Level Structure

```
src/app/
├── (access)/          # Public Auth Routes (Login, Register)
├── (main)/            # Protected App Routes (Dashboard, Brokers)
├── calculator/        # Public Tools
├── layout.js          # Root Layout (Providers, Global CSS)
├── not-found.js       # Global 404
└── page.jsx           # Landing / Home
```

---

## 🔐 Route Groups

### 1. `(access)` - Authentication Zone
**Purpose:** Publicly accessible routes for entry.
- **Folder:** `(access)/` (Parenthesis exclude it from URL path)
- **Routes:**
  - `/login`
  - `/register`
  - `/forgot-password`
- **Layout:** Dedicated layout minimizing distractions (no sidebar/header).
- **Behavior:** Redirects logged-in users to `/dashboard`.

### 2. `(main)` - Protected Application Zone
**Purpose:** The core authenticated application.
- **Folder:** `(main)/`
- **Routes:**
  - `/dashboard` (Global Command Center)
  - `/brokers/*` (Broker Integrations)
  - `/portfolio` (Consolidated Analytics)
  - `/notes` (Personal Journal)
  - `/profile` (User Settings)
- **Layout:** Includes `Sidebar`, `Header`, and `AuthGuard`.
- **Security:** `AuthGuard` automatically redirects unauthenticated users to `/login`.

---

## 🧩 Key Routes & Files

### Global Layout (`src/app/layout.js`)
- **Role:** The Root Wrapper.
- **Responsibilities:**
  - Injects `QueryProvider` (React Query)
  - Injects `ThemeProvider` (Dark Mode)
  - Injects `AuthProvider` (User Session)
  - Loads Global Fonts & CSS

### Broker Dashboards (`src/app/(main)/brokers/`)
Each broker has a strict sub-folder structure ensuring isolation:

**Example: Zerodha**
- `zerodha/page.js`: Connection status & Link button.
- `zerodha/callback/page.js`: OAuth return handler (Processing state).
- `zerodha/dashboard/page.js`: Full data view (Holdings, Funds, Orders).

**Why this structure?**
It separates the *lifecycle* of a broker connection:
1.  **Configuration** (Status Page)
2.  **Handshake** (Callback Page)
3.  **Consumption** (Dashboard Page)

---

## ⚠️ Common Pitfalls

1.  **Router Hooks**: Use `useRouter` from `next/navigation`, **NOT** `next/router`.
2.  **Server Components**: By default, pages are Server Components. We mostly use `'use client';` because CoinTrack is a highly interactive, client-side data-heavy SPA.
3.  **Navigating**: Use `<Link>` for internal navigation to avoid full reloads.
