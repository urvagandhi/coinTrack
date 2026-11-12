# Memory: Dashboard Architecture, Sky Background Boundaries & Auth Session Recovery

**Domain**: Frontend Architecture, UI Standards, Authentication Handshake, Knowledge Graph Sync  
**Date Added / Updated**: 2026-11-03

---

## 1. UI Boundary Rules & Background Isolation

### 1.1 Separation of Backgrounds & Elevated Canvas Card
- **Interactive Sky Background (`CoinTrackSkyBackground`)**:
  - Located at: `frontend/src/shared/ui/brand/cointrack-sky-background.jsx`.
  - Driven by interactive 60-120 FPS Canvas 2D particle simulation (volumetric clouds, cursor wind repulsion, celestial particles, click ripples).
  - **Usage Pattern**:
    - **Public & Auth Routes**: Full-screen atmospheric backdrop for Landing Page (`frontend/src/app/page.jsx`), `(access)` routes (`Login`, `Register`, `Forgot Password`, `Reset Password`, `Verify Email`, `Setup 2FA`, `Reset 2FA`), 404 page, and Design Lab.
    - **Authenticated Shell (`MainLayout.jsx`)**: Renders in the outer environmental viewport behind the floating elevated canvas card (`bg-white/95 dark:bg-[#121316]/95 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] md:rounded-[40px]`), providing brand atmosphere while keeping the internal application workspace distraction-free and legible.

### 1.2 Authenticated Application Workspace (`(main)`)
- Located at: `frontend/src/widgets/app-shell/MainLayout.jsx`.
- Uses an elevated canvas card with neutral interior background (`bg-white dark:bg-[#121316]`), fixed docked sidebar, top segmented navigation bar, and bottom footer.

---

## 2. Dashboard UI Architecture (`DashboardView.jsx`)

- Re-engineered to the modern card-container layout matching reference mockup (`frontend/src/features/dashboard/components/DashboardView.jsx`):
  1. **Top Pill Navigation Bar**:
     - Fast links: Overview (active dark pill), Holdings (live count badge), Mutual Funds, Gold & Silver, Calculators.
     - Integrated search filter input, notification bell with status indicator, and user initials avatar bubble.
  2. **Overview Masthead**:
     - Modern bold typography with dynamic investor greeting.
     - Controls: Time range pill switcher (`30D`, `7D`, `1Y`), print/export trigger, and quick asset sync action.
  3. **4 Key KPI Stat Indicators**:
     - Total Net Worth (with all-time % return badge).
     - Today's Return (with change since open badge).
     - Unrealized Gain (with benchmark comparison).
     - Invested Capital (across tracked asset classes).
  4. **Multi-Asset Allocation Progress Bar**:
     - Segmented colored distribution: Equities (blue), Mutual Funds (orange), Gold & Silver (emerald), Fixed Income / EPF (striped pattern).
  5. **Two-Column Analytics Grid**:
     - **Left (2/3)**: Monthly Net Worth vs. Invested chart (interactive hover tooltip showing sales/valuations) + live `HoldingsTable`.
     - **Right (1/3)**: AI portfolio notification bubbles, automated allocation advice, and semi-circular portfolio health speedometer gauge.

---

## 3. Auth Session Lifecycle & 2FA Recovery

### 3.1 The 2FA White-Screen Trap & Resolution
- **Root Cause**:
  - In `frontend/src/app/(access)/setup-2fa/page.jsx`, `totpAPI.verify` stores tokens via `tokenManager.setToken`, but Next.js soft navigation `router.push('/dashboard')` left `AuthContext`'s in-memory React state unhydrated (`isAuthenticated: false`).
  - `AuthGuard` evaluated `!isAuthenticated && !isPublic` and returned `null`.
  - Redirecting to `/login` caused `proxy.js` (which saw the token cookie) to redirect back to `/dashboard`, trapping the screen in an empty white render.
- **Permanent Solution**:
  1. **Setup 2FA Handoff**: `setup-2fa/page.jsx` awaits `refreshUser()` from `AuthContext` upon successful TOTP verification, and uses `window.location.href = '/dashboard'` on completion for hard cookie/state hydration.
  2. **Self-Healing `AuthGuard.jsx`**:
     - Added fallback detection: If `!isAuthenticated` but `tokenManager.getToken()` contains a valid unexpired token, `AuthGuard` displays the loading spinner and automatically invokes `refreshUser()` to reconstruct session state.
     - Prevents unwanted redirects to `/login` when token cookies exist.
  3. **Exposed Session Methods**: `AuthContext.js` exports `refreshUser: fetchUserProfile` and `handleTotpLoginSuccess` in `contextValue`.

---

## 4. Logical Knowledge Graph Links

- `frontend/src/widgets/app-shell/MainLayout.jsx` ➔ App container for all `(main)` routes.
- `frontend/src/features/dashboard/components/DashboardView.jsx` ➔ Renders primary portfolio overview within `MainLayout`.
- `frontend/src/shared/auth/AuthGuard.jsx` ➔ Guards private routes in `MainShell.jsx`, self-heals via `tokenManager` and `refreshUser`.
- `frontend/src/shared/auth/AuthContext.js` ➔ Central auth state manager, JWT decode, refresh token rotation, user profile sync.
- `frontend/src/app/(access)/setup-2fa/page.jsx` ➔ Coordinates 2FA onboarding, backup codes generation, and profile hydration.
