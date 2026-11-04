# Memory: App Shell Architecture, Navigation & Profile/Settings Subsystem

**Domain**: Frontend Architecture, Layout Containers, Navigation, Profile & Security Settings, DTO Synchronization  
**Date Added / Updated**: 2026-11-03  

---

## 1. Elevated Canvas Card App Shell (`MainLayout.jsx`)

### 1.1 Architecture & Visual Hierarchy
- **Canvas Card Pattern**:
  - The authenticated application workspace (`(main)/*`) is contained within a high-elevation floating island canvas card.
  - Outer Viewport: Renders [`CoinTrackSkyBackground`](../../frontend/src/shared/ui/brand/cointrack-sky-background.jsx) (Canvas 2D cloud and celestial simulation) behind the outer margins (`p-2 sm:p-4 md:p-6 lg:p-7`), providing brand identity and depth.
  - Floating Canvas Card: `bg-white/95 dark:bg-[#121316]/95 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border border-white/80 dark:border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)]` encapsulates the full app experience with an internal padding of `p-4 sm:p-6 md:p-8`.

### 1.2 Layout Composition
1. **Top Segmented Pill Header ([`Header.jsx`](../../frontend/src/widgets/app-shell/Header.jsx))**:
   - Asset pill strip: Fast switching between *Overview*, *Stocks*, *Mutual Funds*, *Fixed Deposits*, *PF Ledgers*, and *Gold & Silver*.
   - Global asset search filter combobox.
   - Theme toggle button: Clean Light/Dark mode switcher powered by `useTheme()`.
   - Notification bell with unread status indicator.
   - User avatar bubble linking directly to `/profile`.
   - **Header Deduplication Rule**: The top header is the single canonical source of high-level asset switching. Child views (e.g. `DashboardView.jsx`) must NOT re-render duplicate top navigation strips or secondary headers.
2. **Pending Email Verification Banner**:
   - Conditionally rendered below header if user account is unverified.
   - Interactive resend trigger with instant toast feedback.
3. **Middle Canvas Area**:
   - Left Sidebar Dock ([`Sidebar.jsx`](../../frontend/src/widgets/app-shell/Sidebar.jsx)): Vertical icon dock for primary navigation (Home, Ledgers, Profile, Brokers, Calculators/Tools).
   - Main Content Area (`<main>`): Flexible viewport container hosting active page views.
4. **App Shell Footer ([`Footer.jsx`](../../frontend/src/widgets/app-shell/Footer.jsx))**:
   - Pinned to the bottom of the canvas card.
   - Displays copyright notice, legal links (*Privacy Policy*, *Terms of Service*), and "Bank-Grade Security" status badge.

---

## 2. Dynamic Scrolling & Overflow Management

### 2.1 The Double-Scrollbar & Content Clipping Invariant
- **Problem Context**:
  - When child pages define their own scrolling containers while the parent layout also has an active scrollbar, users experience clunky, competing double scrollbars.
  - Conversely, removing overflow controls entirely causes child content to stretch beyond the canvas card and get clipped behind the footer.
- **Rule of Dynamic Scrolling**:
  1. **Left Navigation Stays Static**: In two-column views like Profile/Settings, the left navigation sub-sidebar (`<aside>`) is docked (`self-start md:w-60 lg:w-64`) and does NOT scroll.
  2. **Right Content Card Handles Vertical Overflow**: The right settings card (`<section aria-label='Settings Content'>`) has `overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] [scrollbar-width:thin]` and `h-full min-h-0`. When content exceeds the card's height, only the card scrolls smoothly.
  3. **No Double Scrollbars**: The layout ensures there is never a secondary scrollbar immediately adjacent to the card's scrollbar.
  4. **Zero Content Truncation**: All form elements, including bottom inputs (Bio, password confirmation, update buttons, balance masking toggles), remain fully accessible.

### 2.2 App Shell Scrollbar Clearance & Stable Gutters (`MainLayout.jsx`)
- **App Shell Content Track**: `<main>` inside [`MainLayout.jsx`](../../frontend/src/widgets/app-shell/MainLayout.jsx) provides `pr-3 sm:pr-4 md:pr-5 [scrollbar-gutter:stable] [scrollbar-width:thin]`.
- **Content Overlap Elimination**: This dedicated clearance guarantees that right-aligned UI elements across the Dashboard (KPI cards, quick sync buttons, time-range selectors, AI bubbles, and Holdings table right columns) never sit directly underneath or get clipped by browser scrollbars.
- **Modal Dialog Pattern**: Dialogs enforce `p-0 overflow-hidden` on the card, with docked Header and Footer, while the scrollable body uses `px-6 sm:px-7 py-5 [scrollbar-gutter:stable]`, pinning the scrollbar cleanly to the card's outer right boundary.

---

## 3. Profile & Settings Subsystem (`ProfileView.jsx`)

### 3.1 Two-Column Experience (Wayline Reference Design)
Rebuilt from the legacy press-credential layout into a modern two-column SaaS settings hub:
- **Left Settings Sub-Sidebar**:
  - Pinned header: "Settings — You can find all settings here."
  - Five tab buttons with icon indicators:
    1. `My Profile` (`User`)
    2. `Security Options` (`ShieldCheck`)
    3. `Preferences` (`SlidersHorizontal`)
    4. `Notifications` (`Bell`)
    5. `Danger Zone` (`AlertTriangle`)

### 3.2 Un-Shrunk Sizing Standards
- Avoid squishing or reducing element dimensions to fit small viewports.
- Spacing & Padding: Card container uses `p-6 sm:p-8`, section spacing `space-y-6 sm:space-y-7`.
- Avatar: Large, crisp avatar `size-16 sm:size-20` with camera upload overlay badge.
- Inputs: Form fields use full `h-11` heights, rounded corners `rounded-xl`, and `text-xs sm:text-sm` typography. Readonly boxes use `min-h-11 px-3.5 py-2.5`.
- Textareas: Multi-line Bio uses `rows={3}` with `p-3.5`.

### 3.3 Permanent Exclusions
- **Portfolio Snapshot**: Invested Capital, Unrealized P&L, and Active Holdings cards are permanently removed from `ProfileView.jsx` per user mandate. Profile focuses purely on identity, security, preferences, and account controls.

### 3.4 Tab Capabilities & Workflows
1. **My Profile**:
   - Header with Edit / Save / Cancel toggles.
   - Dicebear avatar with camera badge and live photo upload simulation.
   - Name, Username (`@username`), Email (with verified badge and pending change alerts), Phone Number (`+91` pre-formatted), City/Location, and Bio.
2. **Security Options**:
   - TOTP 2FA Status Card: "Enabled & Protected" badge, setup description.
   - Interactive 3-Step TOTP Reset Workflow:
     - Step 1: Verification with current 6-digit authenticator code or 8-digit backup code.
     - Step 2: Secret key display with QR code and manual copy string.
     - Step 3: Generation and downloadable text file (`coinTrack_backup-codes_<user>.txt`) of new backup recovery codes.
     - Emergency recovery email link for lost authenticators.
   - Password Change Card: Current Password, New Password with `PasswordStrengthInput` (uppercase, lowercase, number, special char rules), and Confirm New Password.
3. **Preferences**:
   - Interface Appearance: Light, Dark, and System theme selectors powered by `useTheme()`.
   - Base Currency: Selector supporting INR (₹), USD ($), EUR (€), and GBP (£).
   - Privacy Mode: Mask Balances toggle switch (`****` masking across dashboard).
4. **Notifications**:
   - Granular toggles for Price Alerts, Portfolio Updates, Market News, and Weekly Reports.
5. **Danger Zone**:
   - Danger warning card for permanent account deletion.
   - Delete Account confirmation modal requiring password re-verification.

---

## 4. Backend DTO & Field Synchronization

### 4.1 Root Cause & Solution
- **Issue**: Java Jackson JSON serialization produced `isEmailVerified` in some endpoints and `emailVerified` in others, causing frontend user profile state to momentarily misreport email verification status.
- **Backend Fix**:
  - Added `@JsonProperty("isEmailVerified")` and standard `emailVerified` getters/setters in:
    - [`UserProfileResponse.java`](../../backend/src/main/java/com/urva/myfinance/coinTrack/user/dto/UserProfileResponse.java)
    - [`LoginResponse.java`](../../backend/src/main/java/com/urva/myfinance/coinTrack/user/dto/LoginResponse.java)
  - Both fields are serialized and populated across login, register, and profile queries.
- **Frontend Normalization**:
  - [`entities/user/model.js`](../../frontend/src/entities/user/model.js): `isEmailVerified: Boolean(dto.isEmailVerified ?? dto.emailVerified ?? false)`.
  - [`AuthContext.js`](../../frontend/src/shared/auth/AuthContext.js): Normalized `user.isEmailVerified` and `user.emailVerified` so verification badges and pending banners hydrate accurately without discrepancies.

---

## 5. Logical Knowledge Graph Links & Symbols

- `frontend/src/widgets/app-shell/MainLayout.jsx` ➔ Root shell container for authenticated routes; hosts `CoinTrackSkyBackground`, `Header`, `Sidebar`, and `Footer`.
- `frontend/src/widgets/app-shell/Header.jsx` ➔ Segmented navigation strip, theme toggle, and search filter.
- `frontend/src/widgets/app-shell/Footer.jsx` ➔ Bottom status and compliance bar.
- `frontend/src/features/profile/components/ProfileView.jsx` ➔ Two-column Settings hub (Profile, Security, Preferences, Notifications, Danger Zone).
- `frontend/src/shared/ui/data-display/pending-verification-banner.jsx` ➔ Reference banner component defining cooldown timers, resend microcopy, and animated status callouts.
- `backend/src/main/java/com/urva/myfinance/coinTrack/email/controller/EmailChangeController.java` ➔ Manages email change requests, token generation, and `POST /api/auth/email/change/cancel` cancellation endpoint.
- `backend/src/main/java/com/urva/myfinance/coinTrack/email/controller/EmailVerificationController.java` ➔ Validates email change tokens with race-condition collision protection.
- `backend/src/main/java/com/urva/myfinance/coinTrack/email/service/EmailTokenService.java` ➔ Issues and invalidates purpose-specific email tokens (`EMAIL_CHANGE_VERIFY`).
- `backend/src/main/java/com/urva/myfinance/coinTrack/user/model/User.java` ➔ Added `pendingEmail` and `pendingEmailExpiresAt` fields.
- `backend/src/main/java/com/urva/myfinance/coinTrack/user/repository/UserRepository.java` ➔ Added `existsByPendingEmail` and `findOptionalByPendingEmail`.
- `backend/src/main/java/com/urva/myfinance/coinTrack/user/service/UserService.java` ➔ Collision prevention (`isPendingEmailActive`) and registration protection.
- `backend/src/main/java/com/urva/myfinance/coinTrack/user/controller/UserController.java` ➔ Exposes `pendingEmailExpiresAt` and auto-purges stale pending changes older than 24 hours.
- `backend/src/main/java/com/urva/myfinance/coinTrack/user/dto/UserProfileResponse.java` ➔ Primary user profile payload with Jackson `@JsonProperty` mappings.
- `backend/src/main/java/com/urva/myfinance/coinTrack/user/dto/LoginResponse.java` ➔ Authentication response containing tokens and verified state.

---

## 6. Email Change Lifecycle, Expiry, Mutual Exclusion & Cooldown

### 6.1 Backend Expiry & Collision Prevention
- **10-Minute Expiry**: Managed via `magicLinkExpiryMinutes = 10` in `EmailConfigProperties.java`. Timestamp stored in `User.pendingEmailExpiresAt`.
- **System-Wide Locking**:
  - `existsByPendingEmail` and `isPendingEmailActive` in `UserService.java` ensure an actively pending email cannot be claimed by another user for new registration or email change.
  - Expired pending emails automatically release the address for claim.
- **Revocation Endpoint (`POST /api/auth/email/change/cancel`)**:
  - Nulls `pendingEmail` and `pendingEmailExpiresAt` in MongoDB.
  - Revokes all active tokens for purpose `EMAIL_CHANGE_VERIFY` via `emailTokenService.invalidateAllForUserAndPurpose(...)`.
- **Automatic Stale Purge**: `GET /api/users/me` sweeps and purges pending change requests older than 24 hours.

### 6.2 Frontend Interaction & Security Priority
- **Save Changes Button Loading State**:
  - Unified loading indicator: `isSaveLoading = isSaving || updateProfileMutation.isPending`.
  - When saving only an email update, `setIsSaving(true)` activates the `<Loader2 className="animate-spin" /> Saving...` spinner and disables Cancel until resolved.
- **RFC 7009 / OWASP Revocation Priority**:
  - Cancellation strictly overrides Resend. When Cancel is clicked, `cancelledRef.current = true` immediately discards any in-flight resend promises, halts spinners, and zeroes cooldown.
  - Mutual Exclusion: Resend is disabled whenever cancellation or cooldown is active (`disabled={isResendingChange || isCancellingChange || resendCooldown > 0}`).
- **60-Second Cooldown Countdown**:
  - Dynamic countdown timer matching `pending-verification-banner.jsx`.
  - Button states: `Sending...` -> `Resend in {resendCooldown}s` -> `Resend Link` / `Resend Fresh Link` (when expired).

---

## 7. Toast Styling & Feedback Alignment
- Close button (`X`) pinned to the top-right corner via proper flexbox layout without overlapping text.
- Removed opaque white surrounds/borders in favor of hairline theme-aware borders (`border-black/[0.08] dark:border-white/[0.08]`).
- Reused animated SVG status icons from the Design Lab alert banners (`AnimatedSuccessIcon`, `AnimatedWarningIcon`, `AnimatedErrorIcon`).
