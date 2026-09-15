# coinTrack Auth & Design System Knowledge

This document serves as the long-term memory for the architectural, design, and security decisions implemented for the coinTrack authentication flows.

## 1. Design System & Aesthetics
We adopted a highly premium, modern, "bank-grade" aesthetic, utilizing:
- **Split-Screen Layouts**: Presenting a visual showcase (like the `PortfolioMockup`) on the left, and interactive form content on the right.
- **Glassmorphism & Micro-animations**: Extensive use of translucent backgrounds (`bg-muted/40`, `bg-zinc-900/60`), ambient glowing orbs (`blur-[120px]`), and smooth hover translations (`hover:-translate-y-0.5`).
- **Icons & Typography**: Consistently using `lucide-react` icons (size-4, muted-foreground) inside inputs, styled seamlessly into input borders.
- **Dark Mode Support**: Full native support using strict Tailwind `dark:` variants (e.g., `dark:bg-slate-100`, `dark:text-zinc-900`) for high-contrast switching.

## 2. Security Patterns (`/verify-security` Gate)
We successfully passed strict security gates across all auth forms:
- **Hardware Modifier Tracking**: A highly robust `useHardwareState` hook was built inside `security-inputs.jsx`. It tracks Caps Lock and Num Lock globally via `window` event listeners (`keydown`, `keyup`, `mousedown`) with `capture: true`, overcoming inverted state bugs found in standard `onKeyDown` synthetic events.
- **Data Sanitization**: `handleFieldChange` aggressively sanitizes inputs before React state commits (e.g., stripping non-numeric characters for phone numbers, stripping special chars for usernames).
- **Strict Validation Rules**:
  - Email strictly checked against the RFC 5322 regex.
  - Password strength mandates a minimum of 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
  - Age verified mathematically to ensure the user is strictly 18+.

## 3. Code Quality (`/verify-quality` Gate)
- **Memoization**: Static visual subcomponents (like `GoogleIcon`, `RegisterPortfolioMockup`) are wrapped in `React.memo()` to prevent unnecessary re-renders when form states update.
- **Clean Code**: 100% compliant with ESLint, specifically `unused-imports/no-unused-imports` and `unused-imports/no-unused-vars`.
- **Accessibility**: Inputs use `useId()` for rock-solid `htmlFor` label bindings. Handlers are strictly wrapped in `useCallback`.
- **Modularity**: Primitive base components (from `frontend/src/components/ui/primitives`) are composed into complex molecules inside `frontend/src/components/ui/auth/`.

## 4. Current State & Routing
- Built `login-screen.jsx`, `register-screen.jsx`, and `forgot-password-screen.jsx`.
- Verified them interactively in `design-lab/login`, `design-lab/register`, and `design-lab/forgot-password` wrappers using `next/navigation`'s `useRouter()` to seamlessly link the flows.

## 5. Explicit User Preferences & Lessons Learned
- **Country Flags**: Never use native emojis (e.g., 🇮🇳) because they do not render properly on Windows. Always use external SVGs like FlagCDN (e.g., `https://flagcdn.com/in.svg`).
- **Legal/Content UIs**: Prefer flat, smooth, scrollable lists over complex accordions for terms and privacy policies, ensuring a highly polished and straightforward aesthetic.
- **Phone Number Validation**: Any phone number input across the app MUST be strictly validated to exactly 10 digits. Validation errors must be displayed using the native inline local error UI (matching the design system), NEVER using native browser `alert()` popups.
- **Animations**: Animations (like flying paper airplanes) should prioritize buttery-smooth keyframe curves over complexity. Avoid adding over-the-top effects like `tsparticles` sparkles or jarring vapor trails unless explicitly requested; a clean, standalone SVG animation is preferred.
- **Component Reuse**: STRICTLY use components from `frontend/src/components/ui/`. If a component does not exist, build it there. Do not create isolated components elsewhere or rely on heavy external libraries when native UI primitives exist.

## How to Resume
When starting a new chat, refer to this file (`local/memory/auth_design_system.md`) to instantly load the context of our design philosophy, security gates, component structure, and specific user preferences without needing to explain the entire history!
