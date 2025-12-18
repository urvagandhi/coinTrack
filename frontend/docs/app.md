# 📂 App Router Structure (`src/app/`)

> **Status**: Production-Ready
> **Last Updated**: 2025-12-18

The `app` directory follows the **Next.js 16 App Router** pattern, prioritizing logic isolation and URL-based routing.

---

## Table of Contents

1. [Directory Structure](#1-directory-structure)
2. [Route Groups](#2-route-groups)
3. [Layouts](#3-layouts)
4. [Route Details](#4-route-details)
5. [Navigation Patterns](#5-navigation-patterns)
6. [Common Pitfalls](#6-common-pitfalls)

---

## 1. Directory Structure

```
src/app/
├── (access)/                         # PUBLIC Auth Routes
│   ├── forgot-password/
│   │   └── page.jsx                  # Password recovery
│   ├── login/
│   │   └── page.jsx                  # Login form
│   ├── register/
│   │   └── page.jsx                  # Registration form
│   ├── setup-2fa/
│   │   └── page.jsx                  # Mandatory TOTP setup
│   └── not-found.js                  # 404 for auth routes
│
├── (main)/                           # PROTECTED App Routes
│   ├── brokers/                      # Broker integrations (10 files)
│   │   ├── page.jsx                  # Broker hub
│   │   ├── zerodha/
│   │   │   ├── page.jsx             # Zerodha status
│   │   │   ├── callback/page.jsx    # OAuth callback
│   │   │   └── dashboard/page.jsx   # Holdings view
│   │   ├── upstox/                   # Same structure
│   │   └── angelone/                 # Same structure
│   │
│   ├── dashboard/
│   │   └── page.jsx                  # Main dashboard
│   │
│   ├── portfolio/
│   │   └── page.jsx                  # Consolidated portfolio
│   │
│   ├── notes/
│   │   └── page.jsx                  # Personal notes
│   │
│   ├── profile/
│   │   └── page.jsx                  # User settings
│   │
│   ├── settings/
│   │   └── page.jsx                  # App settings
│   │
│   ├── form/
│   │   └── page.jsx                  # Form examples
│   │
│   └── layout.js                     # Protected layout
│
├── calculator/                        # PUBLIC Tools
│   └── page.jsx                      # Calculator page
│
├── globals.css                        # Global styles (2KB)
├── layout.js                          # Root layout (1.2KB)
├── not-found.js                       # Global 404 (4KB)
└── page.jsx                           # Landing page (30KB)

Total: ~72 files across app directory
```

---

## 2. Route Groups

### 2.1 `(access)` - Authentication Zone

**Purpose**: Publicly accessible routes for authentication
**URL Prefix**: None (parentheses exclude from URL)
**Layout**: Minimal (no sidebar/header)

| Route | File | Purpose |
|-------|------|---------|
| `/login` | `(access)/login/page.jsx` | User login with TOTP support |
| `/register` | `(access)/register/page.jsx` | New user registration |
| `/forgot-password` | `(access)/forgot-password/page.jsx` | Password recovery |
| `/setup-2fa` | `(access)/setup-2fa/page.jsx` | Mandatory TOTP setup |

**Access Control**:
- Redirects logged-in users to `/dashboard`
- No `AuthGuard` (public routes)

### 2.2 `(main)` - Protected Application Zone

**Purpose**: Core authenticated application
**URL Prefix**: None (parentheses exclude from URL)
**Layout**: Full app shell (Sidebar + Header)

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `(main)/dashboard/page.jsx` | Command center |
| `/portfolio` | `(main)/portfolio/page.jsx` | Cross-broker analytics |
| `/brokers` | `(main)/brokers/page.jsx` | Broker hub |
| `/brokers/zerodha` | `(main)/brokers/zerodha/page.jsx` | Zerodha status |
| `/brokers/zerodha/callback` | `(main)/brokers/zerodha/callback/page.jsx` | OAuth handler |
| `/brokers/zerodha/dashboard` | `(main)/brokers/zerodha/dashboard/page.jsx` | Holdings view |
| `/notes` | `(main)/notes/page.jsx` | Personal journal |
| `/profile` | `(main)/profile/page.jsx` | User settings |

**Access Control**:
- `AuthGuard` wraps all children
- Redirects unauthenticated users to `/login`

### 2.3 `calculator` - Public Tools

**Purpose**: Standalone utility pages
**URL Prefix**: `/calculator`
**Layout**: Minimal

---

## 3. Layouts

### 3.1 Root Layout (`src/app/layout.js`)

**Size**: 1.2KB
**Role**: Application root wrapper

```javascript
// Structure
<html>
  <body>
    <QueryProvider>        {/* React Query */}
      <ThemeProvider>      {/* Dark mode */}
        <AuthProvider>     {/* Authentication */}
          {children}
          <Toaster />      {/* Toast notifications */}
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  </body>
</html>
```

**Responsibilities**:
- Font loading (Inter, Outfit)
- Global CSS injection
- Provider hierarchy

### 3.2 Main Layout (`src/app/(main)/layout.js`)

**Size**: 328 bytes
**Role**: Protected routes wrapper

```javascript
// Structure
<AuthGuard>
  <MainLayout>
    {children}
  </MainLayout>
</AuthGuard>
```

**Responsibilities**:
- Authentication enforcement
- Sidebar + Header injection
- Page transitions

---

## 4. Route Details

### 4.1 Broker Routes Architecture

Each broker follows an identical 3-phase structure:

```
brokers/{broker}/
├── page.jsx              # Phase 1: Configuration
├── callback/page.jsx     # Phase 2: OAuth Handshake
└── dashboard/page.jsx    # Phase 3: Data Display
```

**Phase 1 - Configuration** (`/brokers/zerodha`)
- Check connection status
- Display API key form
- "Connect to Zerodha" button

**Phase 2 - Callback** (`/brokers/zerodha/callback`)
- Parse `request_token` from URL
- Call `brokerAPI.handleCallback()`
- Show loading spinner
- Redirect on success/failure

**Phase 3 - Dashboard** (`/brokers/zerodha/dashboard`)
- Fetch holdings, positions, funds
- Display HoldingsTable
- Show P&L summary

### 4.2 Landing Page (`src/app/page.jsx`)

**Size**: 30KB (largest page)
**Route**: `/`

**Features**:
- Hero section
- Feature showcase
- Animated backgrounds
- CTA buttons

---

## 5. Navigation Patterns

### 5.1 Client-Side Navigation

```javascript
// ✅ CORRECT - Use Link component
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>

// ✅ CORRECT - Programmatic navigation
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');

// ❌ WRONG - Never use next/router
import { useRouter } from 'next/router';
```

### 5.2 Auth Redirects

```javascript
// In AuthContext - after successful login
router.push('/dashboard');

// In AuthGuard - if not authenticated
router.push('/login');

// In login page - if already authenticated
router.push('/dashboard');
```

---

## 6. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Using `next/router` | Build error | Use `next/navigation` |
| Forgetting `'use client'` | Server component error | Add directive for interactive pages |
| Direct API calls in pages | Race conditions | Use React Query hooks |
| Missing AuthGuard | Security bypass | Wrap in `(main)` layout |
| Hardcoding routes | Maintenance burden | Use constants file |

---

## Appendix: Route File Sizes

| Route | File | Size |
|-------|------|------|
| Landing | `page.jsx` | 30KB |
| Brokers Hub | `(main)/brokers/page.jsx` | 8.3KB |
| 404 | `not-found.js` | 4KB |
| Access 404 | `(access)/not-found.js` | 4KB |
| Globals CSS | `globals.css` | 2KB |
| Root Layout | `layout.js` | 1.2KB |
