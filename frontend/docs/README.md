# Frontend Documentation

> **Version**: 2.0.0
> **Last Updated**: 2025-12-18
> **Framework**: Next.js 16 (App Router)

---

## Overview

CoinTrack frontend is a modern, production-ready React application built with Next.js 16 App Router. It provides:

- **Portfolio Management** - View aggregated holdings across brokers
- **Broker Integration** - Connect and manage Zerodha, Upstox, AngelOne
- **TOTP 2FA** - Secure authentication with backup codes
- **Notes** - Personal investment journal
- **Dark Mode** - Full theme support

---

## Documentation Index

| Document | Description | Lines |
|----------|-------------|-------|
| [**App Router Structure**](./app.md) | Routes, layouts, groups | 150+ |
| [**Components**](./components.md) | UI component library | 200+ |
| [**Contexts**](./contexts.md) | AuthContext, ThemeContext | 120+ |
| [**Hooks**](./hooks.md) | React Query data hooks | 150+ |
| [**Lib & API**](./lib.md) | API client, logger, utilities | 200+ |
| [**Features**](./features.md) | End-to-end flows | 150+ |
| [**Deployment**](./deployment.md) | Build & deploy guide | 80+ |

---

## Quick Reference

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 18, Tailwind CSS |
| State | React Query (TanStack) |
| Auth | JWT + TOTP 2FA |
| Styling | Tailwind CSS + Dark Mode |
| Animation | Framer Motion |

### Key Directories

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (access)/          # Public auth routes (login, register)
│   ├── (main)/            # Protected routes (dashboard, portfolio)
│   └── calculator/        # Public tools
├── components/            # Reusable UI components
│   ├── dashboard/        # Dashboard widgets
│   ├── portfolio/        # Portfolio components
│   ├── layout/           # Sidebar, Header
│   └── ui/               # Atomic components (Button, Card, Toast)
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities
│   ├── api.js            # Axios instance, API methods
│   ├── logger.js         # Centralized logging
│   └── format.js         # Formatting utilities
├── providers/             # React Query provider
└── utils/                 # Misc utilities
```

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Zero Frontend Math** | All financial calculations done on backend |
| **Data-Hook Pattern** | Components never fetch directly; use hooks |
| **Strict Type Safety** | Validated DTOs from backend |
| **Dark Mode First** | All components support `dark:` variants |
| **Mobile-First** | Responsive design starting from small screens |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE` | Yes | Backend API URL |
| `NODE_ENV` | Yes | Environment mode |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COINTRACK FRONTEND                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  PRESENTATION LAYER                                            │   │
│  │  ├── app/(access)/ - Login, Register, Setup 2FA               │   │
│  │  ├── app/(main)/ - Dashboard, Portfolio, Brokers, Notes       │   │
│  │  └── app/calculator/ - Public tools                           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  COMPONENT LAYER                                               │   │
│  │  ├── components/ui/ - Button, Card, Toast, Alert              │   │
│  │  ├── components/dashboard/ - HoldingsTable, StatsCard         │   │
│  │  ├── components/portfolio/ - Charts, Tables                   │   │
│  │  └── components/layout/ - Sidebar, Header, MainLayout         │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  STATE LAYER                                                   │   │
│  │  ├── contexts/AuthContext.js - Authentication (365 lines)     │   │
│  │  ├── contexts/ThemeContext.js - Dark/Light mode               │   │
│  │  ├── hooks/use*.js - React Query data hooks                   │   │
│  │  └── providers/QueryProvider.jsx - TanStack Query             │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  INFRASTRUCTURE LAYER                                          │   │
│  │  ├── lib/api.js - Axios instance, 40+ API methods (443 lines) │   │
│  │  ├── lib/logger.js - Centralized logging (130 lines)          │   │
│  │  ├── lib/format.js - Currency, date formatters                │   │
│  │  └── lib/stockNameMapping.js - Symbol to name mapping         │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼ HTTPS                                   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  COINTRACK BACKEND API                                         │   │
│  │  http://localhost:8080 (dev) / https://api.cointrack.com      │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Statistics

| Directory | Files | Purpose |
|-----------|-------|---------|
| `app/` | 32 | Pages and layouts |
| `components/` | 26 | UI components |
| `contexts/` | 2 | State management |
| `hooks/` | 4 | Data fetching |
| `lib/` | 5 | Core utilities |
| `providers/` | 1 | React Query |
| `utils/` | 1 | Misc utilities |
| **Total** | **71** | |

---

## Related Documentation

- [Backend Docs](../../backend/docs/README.md) - API documentation
- [Portfolio Module](../../backend/src/main/java/com/urva/myfinance/coinTrack/portfolio/README.md)
- [Security Module](../../backend/src/main/java/com/urva/myfinance/coinTrack/security/README.md)
