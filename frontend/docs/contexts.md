# 🧠 Contexts & Providers

CoinTrack uses Context API for global application state that changes infrequently, and React Query for server state.

## 🌐 Providers (`src/providers/`)

### 1. `QueryProvider`
- **Wraps:** Entire App.
- **Purpose:** Injects the `QueryClient` for React Query.
- **Config:** Sets global default options (cache time, retry policies).

## 🌍 Contexts (`src/contexts/`)

### 1. `AuthContext`
**The most critical context.**
- **State**: `user` (Object | null), `loading` (Boolean).
- **Methods**: `login`, `logout`, `register`.
- **Lifecycle**:
  - On Mount: Checks for existing token in storage.
  - If token exists: Calls `/api/users/me` to hydrate user data.
  - If token invalid/expired: Clears storage.

### 2. `ThemeContext` (If applicable)
- **Role:** Toggles Light/Dark mode.
- **Persistence:** Saves preference in `localStorage`.
- **CSS:** Updates `document.documentElement` class list (`dark`).

---

## 📏 Rules of Context

1.  **Don't Overuse**: Do not put **data** (like stock prices) in Context. Use React Query for that.
2.  **Safety**: Always export a custom hook (e.g., `useAuth`) instead of the raw Context.
    - ✅ `import { useAuth } from '@/contexts/AuthContext'`
    - ❌ `import { AuthContext } from ...; useContext(AuthContext)`
3.  **Guards**: Ensure hooks throw error if used outside provider (optional but recommended).
