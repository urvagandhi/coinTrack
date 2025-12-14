# 🧩 Component Library (`src/components/`)

Components in CoinTrack are **Presentational**. They focus on UI rendering and interaction, delegating data fetching to parent pages or hooks.

## 📂 Structure

```
src/components/
├── auth/          # Auth guards, login forms
├── brokers/       # Connection dialogs, status cards
├── dashboard/     # Charts, tables, stat cards (Reused across dashboards)
├── layout/        # Sidebar, Header, Global scaffolding
├── ui/            # Generic atomic elements (Buttons, Inputs - if any)
```

---

## 🔑 Key Components

### 1. `AuthGuard` (`components/auth/AuthGuard.jsx`)
- **Role:** Security Gatekeeper.
- **Logic:** Checks `useAuth()`. If `loading`, shows spinner. If `!user`, redirects to `/login`.
- **Usage:** Wrapped around children in `src/app/(main)/layout.js`.

### 2. `BrokerStatusBanner` (`dashboard/BrokerStatusBanner.jsx`)
- **Role:** Visual indicator of broker health.
- **Logic:** Consumes `useBrokerConnection`.
- **Display:** Shows Green/Red indicators for Zerodha/Upstox/AngelOne.

### 3. `HoldingsTable` (`dashboard/HoldingsTable.jsx`)
- **Role:** The standard data grid for assets.
- **Props:** Accepts `data` (array of assets).
- **Features:**
  - Formats currency (₹)
  - Color-codes P&L (Green/Red)
  - Responsive design

### 4. `MainLayout` (`layout/MainLayout.jsx`)
- **Role:** The application shell.
- **Contains:**
  - `<Sidebar />`: Navigation
  - `<Header />`: User profile, Theme toggle, Breadcrumbs
  - `<PageTransition />`: Framer Motion animations

---

## 🎨 Styling Guidelines

- **Tailwind CSS**: Strict usage. No custom CSS classes unless necessary for complex animations.
- **Dark Mode**: All components MUST support `dark:` variants.
  - Example: `bg-white dark:bg-gray-800 text-gray-900 dark:text-white`.
- **Responsiveness**: Mobile-first approach (`block md:flex`).

## ⚠️ Common Pitfalls

- **Data Fetching**: Do NOT fetch data inside these components (except maybe `BrokerStatusBanner` which is self-contained). Pass data down as props from `page.jsx`.
- **State Leakage**: Avoid complex `useState` logic here. Keep components purely reactive to props where possible.
