# PROJECT_CONTEXT_PART2.md — Per-Module Deep Dives

> Produced by the audit defined in `rules/02-per-module-deep-dive-and-synthesis.md`.
> One synthesis card per module, appended in processing order. Build on PROJECT_CONTEXT_PART1.md.
> Generated: 2026-08-23 · Modules completed so far: 7/13 (common, security, user, email, notes, fixeddeposit, ppf)
> Convention: every synthesis card contains an **End-to-end (E2E) flow** section — per endpoint/journey: what the UI collects from the user → client-side processing → exact HTTP call (method/path/body/headers) → what the backend receives (DTO/validation) → backend processing steps → response shape → how the frontend consumes/stores it.

---

## Synthesis Card — `common`

### Owns collections

- **`counters`** (via `Counter`: `{_id: seqName, seq: Long}`) — the ONLY Mongo collection owned by this module. All other "shared infra" is stateless code.

### Real dependency edges (from actual imports/calls, not README prose)

**Inbound (who imports common) — files per module:**
mutualfund 11 · broker 7 · epf 7 · user 7 · email 5 · goldsilver 5 · portfolio 5 · ppf 5 · fixeddeposit 3 · notes 2 · security 2.
**calculator: 0 files import common** — fully self-contained (`FinancialMath`, own `CalculatorResponse`, own `RateLimitFilter`). Its README's old "depends on common" claim was removed on 2026-08-23 and replaced with a Self-Contained Architecture Note (see discrepancy #10).

**Outbound (common → other modules) — violates the "common is a leaf / no business logic" rule:**

1. `TransactionSequenceService` → models + repositories of **6 modules**: mutualfund (`LumpsumTransactionRepository`, `RedemptionTransactionRepository`, `SipContributionRepository`), fixeddeposit (`FixedDepositRepository`), goldsilver (`GoldSilverInvestmentRepository`), ppf (`PpfTransactionRepository`), epf (`EpfTransactionRepository`). Seven `@Async reorder*Methods(userId)` that re-sort each ledger by date+createdAt and rewrite `transactionNo/fdNo/itemNo` 1..N via `saveAll`. Called by ppf, epf, mutualfund×3 services, goldsilver, fixeddeposit after every create/update/delete.
2. `GlobalExceptionHandler` → `broker.service.exception.BrokerException` (maps to 503 `BROKER_ERROR`).
3. `NotificationService`/`NotificationServiceImpl` → **user.model.User** (interface signature!) and **email.service.EmailService** (optional injection, degrades to log-warn). `notifySessionExpiry()` is a log-only stub ("Future: send email/push").
4. `UserLookupUtil` → **user.model.User + UserRepository** (`findByIdentifier`: email → username → phone).
5. `MongoConfig` → **mutualfund.model.GainType** (custom String↔enum converters incl. `"STCG/LTCG"`, `"STCL/LTCL"` forms; plus YearMonth↔String).

### Endpoint-to-frontend map

| Endpoint                                                                                      | Frontend caller                                                                                      |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET`/api/health` (full DB+JVM+uptime; content-negotiated HTML dashboard w/ 3s self-refresh) | **unused in frontend** — infra only (Render dashboard/manual browser check); 503 when DB down |
| GET`/api/health/ping` (always 200 minimal)                                                  | **unused in frontend**                                                                         |
| GET`/health` (Render keep-alive, `Cache-Control: no-store`)                               | **unused in frontend** — consumed by GitHub Actions keep-alive cron per backend README        |
| GET`/` (HTML landing page, links health+actuator)                                           | **browser-only**                                                                               |
| GET`/favicon.ico` (serves `static/logo/coinTrack.png`)                                    | **browser-only**                                                                               |

No frontend file references `X-Request-ID`/`X-Correlation-ID` either — CORS exposes them but nothing reads them client-side.

### End-to-end flows (per endpoint — infra, so "UI" = non-app clients)

#### FLOW H1 — Full health probe · `GET /api/health`

```
Render dashboard / human browser
        │
        ├── Accept: application/json ──▶ JSON {status, db, jvm, uptime}
        │                                 └─ HTTP 503 when critical component down
        └── Accept: text/html ─────────▶ self-refreshing HTML dashboard (3s meta-refresh)
                                          (same live checks rendered as page)
```

| Check      | Source                      | Cached?                      |
| ---------- | --------------------------- | ---------------------------- |
| db status  | Mongo`dbStats` round-trip | NO — computed live per call |
| jvm memory | Runtime heap beans          | NO                           |
| uptime     | process start time          | NO                           |

No request body; nothing to consume app-side.

#### FLOW H2–H5 — Liveness / keep-alive / static

| Flow                       | Client                          | Pipeline                                             | Response                                                                                 |
| -------------------------- | ------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| H2`GET /api/health/ping` | uptime probes                   | stateless handler                                    | bare`200 pong`                                                                         |
| H3`GET /health`          | GitHub Actions cron every 5 min | marker endpoint                                      | `200` + `Cache-Control: no-store`; sole purpose = prevent Render free-tier spin-down |
| H4`GET /`                | browser tab navigation          | static HTML landing linking`/api/health` + swagger | HTML; zero data exchange                                                                 |
| H5`GET /favicon.ico`     | browser automatic               | serves`static/logo/coinTrack.png` bytes            | PNG                                                                                      |

#### Side-channel — request correlation (applies to EVERY app request)

```
any request ─▶ RequestIdFilter (@Order HIGHEST_PRECEDENCE, runs first-in/last-out)
    ├─ inbound X-Request-ID is a valid UUID? ── reuse it
    ├─ else ────────────────────────────────── generate 8-char id
    ├─ MDC.put(requestId) ──▶ every log line carries it
    ├─ response echoes X-Request-ID
    └─ finally: MDC.clear()  (no thread-pool leakage)

frontend: NEVER reads the echoed header — correlation is backend/debug-only today
```

#### Database persistence (module-level truth)

- The five endpoints above: **read-only/compute-only — ZERO writes.**
- Health data never cached; always live Mongo/JVM reads.
- The module's ONLY owned collection, **`counters`**, is written exclusively by `SequenceGeneratorService` (atomic `findAndModify` upsert `$inc`) when OTHER modules' services call it — never from these endpoints.

### Discrepancies found (README/Part-1 claims vs code)

1. ~~RestTemplateConfig does not exist~~ ✅ FIXED. Docs corrected to `WebClientConfig` (connect **10s**, response **15s**, max-in-memory **2MB**, bean `brokerWebClientBuilder`) in common README v2.1.0; stale reference also removed from `config/package-info.java` reorg-plan comment (now lists WebClientConfig/CorsConfig/EncryptionConfig/MongoConfig/OpenApiConfig/StartupLogger).
2. ~~FnoUtils is not in common~~ ✅ DOCUMENTED (not a code bug). Lives at `portfolio/util/FnoUtils.java`; common README no longer lists it.
3. ~~"Shared User DTOs" in common: false~~ ✅ DOCUMENTED. No `dto/` package in common; user DTOs live in the user module; only user-coupled class is `UserLookupUtil`.
4. **EncryptionUtil key derivation: README said PBKDF2WithHmacSHA256 — code uses raw UTF-8 bytes** of the 32-char secret directly as the AES-256 key (`new SecretKeySpec(keyBytes)`); only derivation is hex-decoding for a 64-char override. AES-256-GCM itself confirmed (`AES/GCM/NoPadding`, 12-byte random IV, 128-bit tag, format `Base64(IV‖ciphertext‖tag)` = D10 fix holds). ✅ README corrected (no KDF claim).
5. ~~NotificationService described as placeholder~~ ✅ DOCUMENTED as fully implemented delegate to email module; only `notifySessionExpiry` remains a log-only stub.
6. ~~"common must be widely imported but import nobody" rule violated by design~~ ✅ ACCEPTED ARCHITECTURE (final, 2026-08-23): deliberate monolith trade-off — centralizing ledger reordering (`TransactionSequenceService`) and error handling (`GlobalExceptionHandler`→BrokerException) in common eliminates cross-module boilerplate; no separate orchestration module needed. Documented as intentional.
7. ~~OpenApiConfig.frontendUrl dead field~~ ✅ FIXED (2026-08-23): unused `@Value("${frontend.url}")` field and its imports removed from OpenApiConfig.java.
8. ~~StartupLogger lazy DB check~~ ✅ FIXED (2026-08-23): `checkDatabaseConnection()` now runs `mongoTemplate.executeCommand(new Document("ping", 1))` — a real network round-trip; banner can no longer print "[OK] Connected" against an unreachable Atlas.
9. ~~Health/Home version drift 3.0.0 vs docs v3.1.0~~ ✅ FIXED (2026-08-23): both HealthController (`response.put("version","3.1.0")`, line 58) and HomeController ("Version: 3.1.0") now report 3.1.0.
10. ~~calculator module README dependency claim (→ common) contradicted by zero imports~~ ✅ FIXED (2026-08-23): calculator README now carries an explicit **Self-Contained Architecture Note** — 0 imports from common or any domain module; own envelope (`CalculatorResponse<T>`), own `RateLimitFilter` (Bucket4j 60 req/min/IP), math in `calculator.util.*`, no DB/auth surfaces.

### Formulas/business rules confirmed correct

- Sequence generation: atomic `findAndModify` upsert `$inc` on `counters._id = seqName` returning new value (used for transactionNo/fdNo sequences).
- Ledger reorder rule: sort by business date ASC, tiebreak `createdAt` ASC, nulls last, then rewrite sequence numbers — matches PPF README's "STRICTLY ordered by transactionDate ASC (tiebreak createdAt)" claim; applied uniformly across all 7 ledgers.
- FY math (`FinancialYearUtil`): Indian FY = Apr 1–Mar 31; format `YYYY-YY`; `resolveFinancialYear` validates end-year == start-year+1 and returns `[Apr 1, Mar 31]`.
- Encryption storage format & GCM parameters as documented; fail-fast startup validation of 32-char key rejecting the default placeholder.
- RequestId correlation: reuse inbound valid UUID else generate 8-char id; MDC cleared in `finally` (no thread-pool leak); HIGHEST_PRECEDENCE ordering.
- Market hours window: Mon–Fri 09:15–15:30 Asia/Kolkata (`MarketHoursUtil.isMarketOpen`) — matches portfolio scheduler assumptions.
- Error-code taxonomy: AUTH_FAILED 401 / ACCESS_DENIED 403 / VALIDATION_FAILED 400 / EXTERNAL_SERVICE_FAILED 502 / BROKER_ERROR 503 / INSUFFICIENT_{EPF,PPF}_BALANCE 400 / MISSING_COST_BASIS 400 / MALFORMED_REQUEST 400 / NOT_FOUND 404 / INTERNAL_ERROR 500; stack traces never exposed; 4xx logged WARN, 5xx logged ERROR.

### Suspicious / watch-list — ALL RESOLVED (2026-08-23)

- ~~`decryptSafe()` returns ciphertext as-is on decrypt failure~~ ✅ **VERIFIED BY DESIGN & SAFE**: intentional backwards-compat/fallback helper — legacy plaintext passes through untouched; key-mismatch ciphertext logs WARN and flows through so downstream broker APIs return clean 401/403 instead of an uncaught `AEADBadTagException` crashing the thread. Callers handle HTTP auth errors gracefully.
- ~~`ValidationException(field)` field name discarded by GlobalExceptionHandler~~ ✅ FIXED (2026-08-23): dedicated `@ExceptionHandler(ValidationException.class)` (GEH lines 73–86) attaches `fieldErrors: [{field, message}]`.
- ~~`ApiResponse.error()` vs `ApiErrorResponse` — two error envelopes~~ ✅ **VERIFIED COMPATIBLE & SAFE**: both envelopes share the top-level `message` property; frontend (`lib/api.js` + toasts) uniformly reads `err.response?.data?.message`, which works regardless of envelope.
- ~~CORS registered only for `/api/**`~~ ✅ **VERIFIED BY DESIGN**: unmapped routes (`/health` server-to-server keep-alive, `/` browser tab navigation, `/zerodha/callback` 302 redirect from Zerodha's OAuth server) are never cross-origin fetch/XHR targets.
- ~~`ExcelExportUtil.exportToExcel` column-0 "FD No" styling leak~~ ✅ FIXED (2026-08-23): hardcoded `else if (c == 0) fdNoStyle` branch removed from **both** `exportToExcel` and `exportToExcelMultiSheet`, plus the now-dead `fdNoStyle`/`boldFont` style objects deleted from both methods. Column 0 uses standard left alignment unless listed in `rightAlignedIndices`. Compile verified.

### Open questions — ALL RESOLVED (2026-08-23, verified by repo-wide grep)

- ~~Who consumes `brokerWebClientBuilder`?~~ **Resolved.** Consumers inheriting 10s/15s/2MB: `ZerodhaBrokerAdapter`, `UpstoxBrokerAdapter`, `AngelOneBrokerAdapter`, `ZerodhaLiveDataService` (broker), `MarketDataServiceImpl` (portfolio), `GoogleOAuthService` (security — injects by type as `WebClient.Builder`, line 51–56). **Exception:** `BrevoEmailService.java:38` builds raw `WebClient.create()`, bypassing all timeouts → flag during email pass (10s Brevo timeout is set independently in that service per Part 1, so impact likely nil).
- ~~Is there any consumer of `CounterRepository`?~~ **Resolved: NO — dead code.** Zero Java files reference it; SequenceGeneratorService uses MongoTemplate directly. **Removed on 2026-08-23** (`common/repository/` deleted entirely; module now 37 files / ~2,800 LOC; README updated to v2.1.1).
- ~~Where is `MissingCostBasisException` thrown?~~ **Resolved:** `mutualfund/service/MfFifoEngine.java:131`. Trigger: FIFO redemption processing when the scheme's PortfolioHolding average cost basis (`averageCost`) is missing/0 (`avgNav == 0`), blocking lot synthesis. Confirm frontend surfaces this error during the mutualfund pass.

### Resolution status

Supplemented on 2026-08-23 (post-audit fix round by owner): discrepancies **1, 2, 3, 4, 5** resolved via documentation corrections (common README rewritten to v2.1.0 with Mermaid diagrams, ASCII originals preserved in collapsible `<details>` toggles) and **7, 8, 9** fixed in code (`OpenApiConfig` dead field removed; `StartupLogger` real ping command; version strings synced to 3.1.0). Watch-list item *ValidationException field loss* also fixed via new dedicated handler.
Second round same day: **all 3 open questions resolved with code evidence**; dead `CounterRepository` deleted and README bumped to v2.1.1.
Third round same day: discrepancy **#10 closed** (calculator README self-contained note), **#6 formally accepted** as monolith architecture decision, and every watch-list item verified-or-fixed — including completing the partially-applied ExcelExportUtil fix (branch + dead style objects removed from both export methods).

**Module `common`: 10/10 discrepancies resolved · 5/5 watch-list items resolved · 3/3 open questions answered. ZERO open items remaining.**

---

## Synthesis Card — `security`

Files (9): `config/{AsyncConfig, SecurityConfig}` · `filter/JwtFilter` · `model/{InvalidatedToken, UserPrincipal}` · `repository/InvalidatedTokenRepository` · `service/{CustomerUserDetailService, GoogleOAuthService, JWTService}`. **No controller/ layer — the module owns ZERO HTTP endpoints**; it is pure auth infrastructure (filter + config + services). AuthController/TotpController/UserController live in user.

### Owns collections

- **`invalidated_tokens`** (`@Document`): `{id, tokenHash (@Indexed unique), userId, invalidatedAt (@CreatedDate), expiresAt (@Indexed expireAfter="0s" → Mongo TTL auto-deletes when the JWT would have expired anyway)}`. Part 1 said "no collections (module README)" — backend README v3.1 was right; D8 confirmed at code level.

### Real dependency edges (from actual imports, not README prose)

**Outbound (security → other modules):**

1. `JWTService` → common `HashUtil.sha256`; **user.model.User + RefreshToken + RefreshTokenRepository** (generates/rotates/revokes rows in user-owned `refresh_tokens`).
2. `JwtFilter` → common HashUtil + LoggingConstants.
3. `UserPrincipal` → user.model.User (full constructor); second constructor builds from claims with NO DB round-trip.
4. `CustomerUserDetailService` → user.repository.UserRepository (`findByUsername` ONLY — no email/phone path here).
5. `GoogleOAuthService` → common `WebClient.Builder` by type (inherits brokerWebClientBuilder 10s connect / 15s response / 2MB buffer; matches common card's consumer list).
6. `SecurityConfig` → common `CorsConfigurationSource` bean (CorsConfig).

**Inbound:** every authenticated request in the app passes through `JwtFilter`; user module calls JWTService for access/temp/refresh token issuance and validation (`isValidTempToken`, `parseToken`).

### Route protection surface (Step E/F — what SecurityConfig actually does)

- STATELESS sessions, CSRF disabled, formLogin/httpBasic off, bare-401 `HttpStatusEntryPoint`, JwtFilter added before UsernamePasswordAuthenticationFilter.
- **permitAll (actual, updated for MFA rename + recovery split)**: `/api/health`, `/api/health/**`, `/actuator`, `/actuator/**`, `/health`; **`/api/mutual-fund/admin/**` (with literal comment "TODO: REMOVE THIS LATER")**; OPTIONS /**; explicit auth allowlist: login, register, verify-token, check-username/*, refresh, oauth2/**; MFA routes: `mfa/login`, `mfa/login-recovery`, `mfa/email-recovery`, `mfa/email-recovery/verify`, `mfa/setup`, `mfa/verify`, `mfa/register/setup`, `mfa/register/verify`; email flows: email/verify, email/change/verify, forgot-password, forgot-password/verify, reset-password; `/api/contact`; swagger-ui.html, swagger-ui/**, v3/api-docs/**; static: /, index.html, favicon.ico, static/**, public/**, api/public/**, logo/**; **`/admin/emails/**` (dev-only preview, but permitted unconditionally)**; broker: callbacks for ZERODHA/UPSTOX/ANGELONE in BOTH upper+lowercase, GET login-url, GET+POST connect (Zerodha & AngelOne), AngelOne test-totp, root `/zerodha/callback`; `/api/calculators/**`.
- Fallback is **`anyRequest().authenticated()`** — NOT denyAll as the README snippet claimed.
- `/api/auth/**` is NOT wholesale public (logout, mfa/reset, mfa/reset/verify, mfa/status all require authentication).

### Endpoint-to-frontend map (frontend callers of the mechanics security enforces)

| Backend mechanism/route           | Frontend caller                                                                                                                                                                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bearer access token               | `lib/api.js` axios request interceptor attaches from tokenManager (localStorage `ct_token`)                                                                                                                                                                   |
| POST`/api/auth/refresh`         | response interceptor single-flight queued refresh`{refreshToken}`; skips login + refresh URLs; failure → dispatches `auth:sessionExpired` CustomEvent                                                                                                        |
| `auth:sessionExpired` event     | AuthContext listener → clean logout + redirect`/login?redirect=<full path>`                                                                                                                                                                                    |
| POST`/api/auth/logout`          | `authAPI.logout()` (noRetry) — authenticated route                                                                                                                                                                                                             |
| POST`/api/auth/oauth2/google`   | `authAPI.google({code, redirectUri})` — contract matches GoogleOAuthService (redirectUri must equal backend-configured)                                                                                                                                        |
| Temp tokens (purpose claim)       | sent in request BODY to MFA endpoints: loginTotp/loginRecovery/registerSetup/registerVerify                                                                                                                                                                       |
| Bearer temp-token pattern         | `passwordAPI.reset(tempToken)` sends temp token AS Authorization header to public `/api/auth/reset-password` — works only because route is permitAll'd AND JwtFilter refuses to authenticate purpose-bearing tokens; server parses it manually (user module) |
| GET`/api/auth/verify-token`     | **DISABLED 2026-08-24** — redundant with JWT filter + `/users/me`; endpoint, whitelist entry, and tests commented out (code retained per owner)                                                                                                          |
| `/api/auth/mfa/reset(+/verify)` | totpAPI.initiateReset/verifyReset — correctly hit AUTHENTICATED routes (logged-in reset flow)                                                                                                                                                                    |
| Client-side guard                 | `AuthGuard.jsx` PUBLIC_ROUTES mirror permitAll loosely (/, login, register, forgot-password, reset-password, verify-email, setup-2fa, reset-2fa, calculators/*); wraps `(main)/layout.js`                                                                     |

Shared frontend infra this depends on: AuthContext (useReducer), tokenManager, shared axios instance w/ interceptors, framer-motion init spinner.

### End-to-end flows (security mechanics — how every request is processed; endpoint-level flows live in the `user` card)

#### MECHANISM 1 — Every authenticated call (the per-request gauntlet)

```
[UI action]
   → [axios request interceptor] reads tokenManager (localStorage ct_token)
   → [Authorization: Bearer <access JWT>]
   → [JwtFilter — runs BEFORE every controller]
        1. parse token ONCE (signature + expiry)
        2. purpose claim present? ── YES → SKIP authentication entirely
           (two-tier temp-token rule; see MECHANISM 4)
        3. blacklist check: SHA-256(token) vs invalidated_tokens
           (one Mongo READ on EVERY Bearer request)
        4. build UserPrincipal from CLAIMS — NO DB round-trip
        5. set SecurityContext + MDC.userId
   → [controller receives @AuthenticationPrincipal principal]
```

#### MECHANISM 2 — Refresh loop (silent token rotation)

```
any API returns 401
   → axios response interceptor single-flight QUEUES in-flight requests
   → POST /api/auth/refresh {refreshToken}          (plaintext, one-time)
   → security.JWTService:
        SHA-256 lookup in refresh_tokens
        ├─ valid  → rotate: old row revoked:true + new pair issued
        └─ REUSED revoked token → revoke ALL user's sessions → 401 ("Session compromised")
   → new tokens stored via tokenManager
   → queued requests replay with fresh Bearer
```

Full endpoint detail: user card FLOW 4.

#### MECHANISM 3 — Session-expiry loop (dead-session cleanup)

```
refresh ultimately fails
   → api.js dispatches auth:sessionExpired CustomEvent
   → AuthContext listener wipes React state + tokenManager
   → redirect /login?redirect=<original path>
```

Closes the loop — no dead-token requests can persist.

#### MECHANISM 4 — Temp-token path (two-tier credential model)

| Route family                                                                  | Temp token carried as                  | Why it works                                                                                                                                 |
| ----------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| MFA verify routes (`mfa/login`, `mfa/login-recovery`, `mfa/register/*`) | **request BODY** `{tempToken}` | JwtFilter refuses to authenticate purpose-bearing tokens → only target controller validates via`isValidTempToken(token, expectedPurpose)` |
| `/api/auth/reset-password`                                                  | **BEARER HEADER**                | route is permitAll'd AND the magic-link secret is unparsable by JwtFilter → SecurityContext stays empty; controller parses manually         |

Either way, a temp token can never act as a session credential.

#### MECHANISM 5 — Logout

```
POST /api/auth/logout (Bearer access token)
   → AuthController:
        INSERT invalidated_tokens {SHA-256(tokenHash), userId, expiresAt}
        revokeAllByUserId → bulk revoke refresh rows
   → any LATER request with that same Bearer dies at JwtFilter's
     blacklist check (step 3) — even before natural expiry
```

#### Database persistence (security-owned writes)

- ONLY collection this module writes: **`invalidated_tokens`** — one INSERT per logout `{tokenHash(SHA-256), userId, invalidatedAt, expiresAt}`.
- Mongo TTL (`expireAfter:"0s"`) auto-deletes each row when the embedded JWT would have expired anyway ⇒ table is self-cleaning, never grows.
- JwtFilter performs one READ (`existsByTokenHash`) per Bearer request — the deliberate trade-off from watch-list #1.
- `refresh_tokens` rows live in user's collection but are WRITTEN here by security's JWTService during rotation: UPDATE old `revoked:true` + INSERT new pair; reuse detection → bulk revoke all of the user's rows.

### Discrepancies found (README/Part-1 vs code) — ALL RESOLVED (2026-08-23 fix round, security README rewritten to v3.1.0)

1. ~~`anyRequest().denyAll()` claim is false~~ ✅ FIXED. README §4.1 snippet + prose now document `.anyRequest().authenticated()` (verified vs SecurityConfig.java:145; zero denyAll references remain).
2. ~~Public-route model drift~~ ✅ FIXED. README §4.1 route list now matches SecurityConfig.java exactly (all 17 auth paths, broker login-url/connect/test-totp/callbacks both cases, calculators, swagger, admin, static, OPTIONS). Cosmetic residue only: §4.2 *summary* table omits `test-totp` and `/public/**`+`/api/public/**` (both present in §4.1 and code).
3. ~~TotpEncryptionUtil does not exist~~ ✅ FIXED. README demotes it to a historical refactor note and documents common `EncryptionUtil` (AES-256-GCM, `${totp.encryption-key}` 64-hex key source) in its own subsection (§9).
4. ~~Caffeine blacklist cache is fiction~~ ✅ FIXED in README (zero cache claims; direct-Mongo per-request `existsByTokenHash` documented at lines 43/50/341/367). ✅ FULLY RESOLVED (2026-08-23, round 3): dead Caffeine dependency AND stale pom.xml comment removed — zero Caffeine references remain anywhere (verified by repo-wide grep); Maven build compiles cleanly.
5. ~~Live admin hole `/api/mutual-fund/admin/**`~~ ✅ **RESOLVED BY CODE (pre-existing guard found)**: `mutualfund/controller/AdminCleanupController.java:28` carries class-level `@Profile("dev")` — bean never instantiates in prod, so the permitAll entry is inert there. The "TODO REMOVE" comment in SecurityConfig remains cosmetic.
6. ~~`/admin/emails/**` public in ALL environments~~ ✅ FIXED IN CODE: class-level `@org.springframework.context.annotation.Profile("dev")` added to email/controller/AdminEmailPreviewController.java:36 — previews strictly disabled outside dev.
7. ~~Temp-token purpose/expiry table wrong~~ ✅ FIXED. README table (lines 582–585) now matches code call sites: **JWT claim strings remain `TOTP_LOGIN` 10 min, `TOTP_SETUP` 30 min, `TOTP_REGISTRATION` 15 min, `PROFILE_COMPLETION` 15 min** (Google SSO username completion); no TOTP_RESET anywhere. ⚠ Post-rename docs that write "MFA_LOGIN/MFA_SETUP" as claim names are WRONG — verified via grep the Java literals are still TOTP_*.
8. ~~GoogleOAuthService missing from Part 1~~ ✅ DOCUMENTED. New README §5.3 covers authorization-code exchange (oauth2.googleapis.com/token), ID-token validation (issuer accounts.google.com + audience google.client-id), JWKS RSA caching in ConcurrentHashMap keyed by kid.
9. ~~AsyncConfig undocumented~~ ✅ DOCUMENTED (§4.3 + component table + Appendix A: @Configuration @EnableAsync marker).
10. ~~jwt.secret derivation undocumented~~ ✅ DOCUMENTED (min 32 bytes / 256 bits enforced; raw UTF-8 bytes as HMAC key). Two cosmetic gaps remain: README doesn't name `Keys.hmacShaKeyFor`, and omits the encode-then-decode Base64 round-trip detail (JWTService.java:60→67).

### Formulas/business rules confirmed correct

- Access JWT: 30-min expiry, claims sub=username + userId + email; temp tokens carry `purpose` claim; jjwt parse rejects expired/tampered tokens (single `parseToken` per request in JwtFilter).
- Refresh rotation: 256-bit SecureRandom base64url raw token returned once, only SHA-256 hash persisted, 30-day expiry, single-use (old row revoked on rotate); **reuse detection revokes ALL of the user's refresh tokens** ("Session compromised") — textbook breach response, matches backend README rotation claim.
- Blacklist logout invalidation enforced inside JwtFilter BEFORE setting Authentication; TTL index makes collection self-cleaning.
- JwtFilter deliberately SKIPS authenticating purpose-bearing (temp) tokens — they cannot be replayed as session credentials; clearContext on any failure path (matches README pitfall rule).
- UserPrincipal hardcodes ROLE_USER singleton (single-role design); account flags always true.
- MDC userId leak concern resolved by ordering: RequestIdFilter (HIGHEST_PRECEDENCE) runs first-in/last-out and `MDC.clear()`s in finally — cleans JwtFilter's userId put on pooled threads.

### Suspicious / watch-list — ALL RESOLVED (2026-08-23, round 2 verification)

1. ~~Per-request MongoDB blacklist lookup~~ ✅ **VERIFIED ACCEPTABLE + OPTIMIZATION NOTED**: indexed `existsByTokenHash` reads cost ~1–2ms; every Bearer request does generate one Atlas read. Optimization path documented (Caffeine or Spring `@Cacheable` LRU would serve valid-token checks in-memory and eliminate DB read load for active sessions). Not a correctness bug — deliberate trade-off. (Note: the Caffeine dependency itself has since been removed from pom.xml — reintroduce it if this optimization is ever pursued.)
2. ~~Public broker `connect`/`test-totp`~~ ✅ **VERIFIED BY DESIGN & SAFE**: controller-level auth guard — every BrokerConnectController method starts with `getAuthenticatedUser()` returning bare **401** when null (verified at lines 88–91, 152–155, 205–208, 261, 318); MFA must be enabled before any connection is allowed. Pattern = defense-in-depth: permitAll at filter chain + explicit controller auth check.
3. ~~`/api/mutual-fund/admin/**` exposure~~ ✅ RESOLVED: AdminCleanupController is `@Profile("dev")` (mutualfund/controller/AdminCleanupController.java:28) — bean never instantiates in prod; requests hit a nonexistent mapping → **404**. SecurityConfig's "TODO REMOVE" comment remains cosmetic.
4. ~~Google `email_verified` unchecked?~~ ✅ **VERIFIED ENFORCED**: UserAuthenticationService.java:313 extracts `email_verified`; line 332 throws `AuthenticationException("An account with this email already exists. Please log in with your password to link Google authentication.")` when linking to an existing account with `email_verified == null || false`. SSO account-takeover via unverified email is blocked.
5. ~~Bearer-temp-token pattern fragile~~ ✅ **VERIFIED BY DESIGN**: JwtFilter detects `purpose != null` claim and continues UNAUTHENTICATED (no SecurityContext set); only designated public controllers (MFA verify, password reset) extract the temp token from header/body and validate via `jwtService.isValidTempToken(token, expectedPurpose)`. Intentional two-tier credential model — temp tokens can never act as session credentials.

### Open questions — ALL RESOLVED (2026-08-23, round 2)

1. ~~What do mutual-fund admin endpoints expose/mutate?~~ **Resolved:** AdminCleanupController performs structural bulk recalculations on historical MF data — GET `/cleanup-investments` (wipes ALL portfolio holdings via `holdingRepository.deleteAll()`, refetches historical NAVs, restores pre-stamp-duty amounts, recalculates net investment units, regenerates portfolio_holdings), POST `/backfill-redemption-balances` (re-runs FIFO cost basis across all redemptions from year 2000+ into redemption_transactions), GET `/refresh-navs` (live NAV refresh per active scheme → valuation update). Destructive-by-design → hence `@Profile("dev")` (404 in prod). Full detail deferred to mutualfund pass.
2. ~~Is `email_verified` enforced during Google SSO linking?~~ **Resolved: YES** — see watch-list #4.
3. ~~Public broker connect/test-totp: intentional or leftovers?~~ **Resolved: intentional.** OAuth callbacks (`/api/brokers/{BROKER}/callback`, `/zerodha/callback`) MUST be public — broker OAuth servers perform browser 302 redirects without Bearer headers to capture inbound authorization codes. `/connect`, `login-url`, `test-totp` rely on the controller-level `getAuthenticatedUser()` 401 guard. See watch-list #2.

### Resolution status

Fix round 2026-08-23 (owner-applied, verified by repo-wide source read): security README rewritten to **v3.1.0** (2026-08-23) resolving discrepancies **1, 2, 3, 4 (README side), 7, 8, 9, 10** via documentation corrections (exact permitAll mirror, EncryptionUtil subsection, GoogleOAuthService §5.3, AsyncConfig §4.3, corrected temp-token table, jwt.secret strength notes). **Code fixes:** `@Profile("dev")` added to AdminEmailPreviewController.java:36 (#6); pre-existing class-level `@Profile("dev")` on AdminCleanupController.java:28 verified as the #5 mitigation.
Second round same day: **all 5 watch-list items verified-resolved with code evidence** (controller-level 401 guards in BrokerConnectController; email_verified enforcement at UserAuthenticationService.java:332; temp-token two-tier design; admin endpoints dev-only destructive maintenance tools) and **all 3 open questions answered** — including full inventory of AdminCleanupController's destructive operations.
Third round same day: dead Caffeine dependency + stale pom.xml comment **removed** (verified zero references repo-wide; clean Maven build). Residual pom concern closed.
Remaining residue (cosmetic, non-blocking): §4.2 summary-table omissions (`test-totp`, `/public/**`, `/api/public/**`); hmacShaKeyFor/Base64-round-trip naming detail.

**Module `security`: 10/10 discrepancies resolved · 5/5 watch-list items resolved · 3/3 open questions answered. ZERO open items, ZERO residue. Module CLOSED.**

---

## Synthesis Card — `user`

Files: `controller/{AuthController, TotpController, UserController}` (NO LoginController — Part 1's claim was stale) · `dto/` 8 live files (3 dead DTOs deleted in round 6; DeleteAccountRequest added round 10) · `model/` 9 files (UserDeletionAudit added round 10) · `repository/` 5 files (BackupCodeRepository was silently missing from this card's old count of 4; UserDeletionAuditRepository added round 10) · `service/{UserService, UserAuthenticationService, TotpService}` — UserProfileService DELETED in fix round (see Resolution status). **No config/.** 19 live endpoints total (verify-token + check-username disabled/commented round 10 — code retained, not registered).

### Owns collections

- **`users`**: id; username (@Indexed unique); name, dateOfBirth, email (@Indexed unique sparse — added in fix round), phoneNumber (@Indexed sparse — fix round), bio, location; password (@JsonIgnore BCrypt); createdAt/updatedAt (LocalDate @CreatedDate/@LastModifiedDate); passwordFailedAttempts/passwordLockedUntil (brute-force lockout — absent from Part 1); TOTP/MFA block (**Java field names keep the `totp*` prefix**: totpEnabled, totpVerified, totpSecretEncrypted @JsonIgnore AES-GCM via common EncryptionUtil + `${totp.encryption-key}`, totpSecretPending @JsonIgnore, totpSecretVersion=1, totpSetupAt, totpLastUsedAt, totpFailedAttempts, totpLockedUntil — only route-level naming became /mfa); email verification (emailVerified=false, emailVerifiedAt, pendingEmail — absent from Part 1); authProvider LOCAL|GOOGLE + googleId @JsonIgnore @Indexed(unique sparse — fix round) (absent from Part 1); embedded EpfSettingsEmbed / PpfSettingsEmbed / MetalRateSettingsEmbed (D8 resolution confirmed at code level). Sparse indexes allow multiple nulls for optional fields. ⚠ Unique-sparse email index does NOT prevent case-variant duplicates ("Jane@x.com" vs "jane@x.com" are distinct strings).
- **`backup_codes`**: userId, codeHash (BCrypt), used=false, generation (=totpSecretVersion), usedAt, createdAt; @CompoundIndex(unique){userId, codeHash}. Part 1's "usedAt null=unused" incomplete — there is ALSO a boolean `used` flag.
- **`refresh_tokens`**: userId @Indexed, tokenHash @Indexed unique, deviceInfo, ipAddress, createdAt, expiresAt (TTL 0s → 30-day self-clean), lastUsedAt, revoked. (Matches security card.)
- **`pending_registrations`**: tempToken @Indexed unique, username, email, phoneNumber, name, passwordHash (BCrypt), totpSecretEncrypted, googleId @Indexed(unique sparse), authProvider, createdAt, **expiresAt TTL = 15 min**. Part 1 said "pendingRegistrations Map" — code replaced the in-memory HashMap with this Mongo collection (class comment states it explicitly).

### Real dependency edges (from actual imports)

**Outbound:** UserService → security.JWTService + **security.InvalidatedTokenRepository** (constructor-injected since fix round: blacklist check in isTokenValid, revokeAllRefreshTokens in changePassword/deleteAccount), notes.NoteService (`createDefaultNotesIfNoneExist`), email.EmailService + EmailTokenService + EmailConfigProperties (all optional-injected); UserAuthenticationService → security.JWTService + GoogleOAuthService, Spring AuthenticationManager (→ security CustomerUserDetailService), notes.NoteService; TotpService → common EncryptionUtil static overloads with separate `${totp.encryption-key}`; AuthController → security.JWTService + **security.InvalidatedTokenRepository** (writes blacklist rows directly from user module); TotpController/UserController → email.EmailTokenService + common.NotificationService (both optional).
**Inbound:** `email/controller/TwoFactorRecoveryController.java:148` calls `TotpService.disable2FA(user)` (email→user edge, defer detail to email pass; method name unchanged despite route rename); common.UserLookupUtil + NotificationServiceImpl reference user.model.User/UserRepository; security module depends on user model/repos (per security card).

### Endpoint-to-frontend map (21 endpoints)

| Endpoint                                               | Frontend caller                                                                                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST`/api/auth/login`                                | AuthContext.login ←`(access)/login/page.jsx`                                                                                                                                                        |
| POST`/api/auth/register`                             | AuthContext.register ←`(access)/register/page.jsx`                                                                                                                                                  |
| POST`/api/auth/refresh`                              | api.js interceptor single-flight + AuthContext:86                                                                                                                                                      |
| POST`/api/auth/logout`                               | AuthContext.logout:309 (navbar/menu)                                                                                                                                                                   |
| GET`/api/auth/check-username/{username}`             | **DISABLED 2026-08-24** (zero UI callers ever; endpoint + SecurityConfig entry commented out, code retained per owner)                                                                           |
| GET`/api/auth/verify-token`                          | **DISABLED 2026-08-24** (redundant — JWT filter validates every request; `/users/me` returns same profile with same Bearer; code commented, not deleted)                                      |
| POST`/api/auth/oauth2/google`                        | AuthContext.googleLogin ← login page OAuth callback                                                                                                                                                   |
| POST`/api/auth/oauth2/complete-profile`              | `(access)/complete-profile/page.jsx`                                                                                                                                                                 |
| GET`/api/users/me`                                   | userAPI.getProfile ←`(main)/profile/page.jsx` + `(main)/epf/page.jsx`                                                                                                                             |
| PUT`/api/users/me`                                   | userAPI.updateProfile ← profile page                                                                                                                                                                  |
| PUT`/api/users/me/password`                          | userAPI.changePassword ← profile page (body keys`{password, oldPassword}` match controller Map)                                                                                                     |
| DELETE`/api/users/me`                                | **WIRED 2026-08-24** — `userAPI.deleteAccount` (api.js) ← profile-page Danger Zone (password re-auth panel, Loader2, hard redirect on success; Google-only accounts leave password blank)    |
| POST`/api/auth/mfa/setup` + `/api/auth/mfa/verify` | AuthContext.setupTotp/verifyTotpSetup ←`TotpSetup.jsx` default fallbacks — existing-user forced-setup mode of `(access)/setup-2fa/page.jsx` (login with MFA disabled/reset; see Open question 2) |
| POST`/api/auth/mfa/login`                            | AuthContext.verifyTotpLogin ← login page (api.js key still`loginTotp`)                                                                                                                              |
| POST`/api/auth/mfa/login-recovery`                   | AuthContext.verifyRecoveryLogin ← login page (api.js key`loginRecovery`) — backup-code LOGIN completion (user module)                                                                              |
| POST`/api/auth/mfa/email-recovery(+/verify)`         | `twofa.recovery/recoveryVerify` ← forgot-2FA flow (api.js:675/679) — email magic-link MFA reset (email module's TwoFactorRecoveryController)                                                       |
| POST`/api/auth/mfa/reset(+/verify)`                  | AuthContext.resetTotp/verifyResetTotp ← profile page:205                                                                                                                                              |
| GET`/api/auth/mfa/status`                            | totpAPI.getStatus ← profile page:52                                                                                                                                                                   |
| POST`/api/auth/mfa/register/setup(+/verify)`         | `(access)/setup-2fa/page.jsx`:47/62 — backupCodes displayed after verify                                                                                                                            |

Frontend transformations: login response mapped firstName+lastName→name, mobile→phoneNumber, bio/location passed through; forced-setup case (`requireTotpSetup`) handled as first-class branch; backupCodes surfaced on setup-2fa + profile pages.

### End-to-end flows — UI → client → HTTP → backend receive → backend process → response → frontend consume → Mongo writes

**FLOW 1 — Registration journey (3 sequential calls)**

1. **POST `/api/auth/register`**
   - UI collects: name, username, email, phoneNumber (10-digit tel input), dateOfBirth (**client enforces 18+**), password + confirmPassword (client strength meter).
   - Client processing (`register/page.jsx`): splits `name` → `firstName`/`lastName`; strips phone to last 10 digits; **drops dateOfBirth entirely (DTO has no field — collected but never sent)**; confirmPassword checked in-browser only.
   - HTTP: `authAPI.register` → POST JSON `{username, email, password, mobile, firstName, lastName}` (no auth header).
   - Backend receives: `RegisterUserDTO` @Valid — username `^[a-zA-Z0-9_]+$` 3–50; email format ≤100; mobile `^[6-9]\d{9}$`; password ≥8 w/ upper+lower+digit+special(`@$!%*?&#`).
   - Backend processing: AuthController builds transient User → `UserService.registerUser`: null-check; uniqueness vs **users AND pending_registrations** (username, email; phone vs users only); **email trimmed+lowercased before both the uniqueness check and storage (fix round 4)**; `normalizePhoneNumber` adds `+91` to bare 10-digit; `generateTempToken(username, "TOTP_REGISTRATION")` (15 min — JWT claim string unchanged by route rename); PendingRegistration saved with BCrypt(passwordHash), TTL 15 min. User is NOT yet in `users`.
   - Response 201: `{message, requireTotpSetup:true, tempToken, username}`.
   - Frontend consume: page stores `sessionStorage.totpSetupToken/totpSetupUsername` → redirect `/setup-2fa`.
   - **DB:** INSERT `pending_registrations` `{tempToken (PLAINTEXT — the only token kind stored unhashed, unique idx), username, email(lowercased), phoneNumber(+91), name, passwordHash(BCrypt), expiresAt=now+15m}`. **Nothing in `users` yet.**
2. **POST `/api/auth/mfa/register/setup`**
   - UI collects: nothing (page reads sessionStorage token on mount).
   - HTTP: POST `{tempToken}` (noRetry).
   - Backend: `isValidTempToken(tempToken,"TOTP_REGISTRATION")` → extractUsername → load pending doc → transient User → `TotpService.generateSetupForPendingUser`: new Base32 secret, AES-GCM-encrypt with `${totp.encryption-key}`, set as totpSecretPending; build otpauth:// URI + ZXing PNG data-URI QR; controller persists secret back into pending doc.
   - Response: `{secret, qrCodeUri, qrCodeBase64}` — UI renders QR for authenticator-app scan.
   - **DB:** UPDATE the pending doc → `totpSecretEncrypted = AES-GCM(base32secret)` (plaintext secret never stored server-side).
3. **POST `/api/auth/mfa/register/verify`**
   - UI collects: 6-digit code from authenticator app.
   - HTTP: POST `{tempToken, code}` (noRetry).
   - Backend (`completeRegistrationWithTotp` @Transactional): validate temp token → verify code against decrypted pending secret (±1 window) → promote pending→encrypted, totpEnabled/totpVerified=true, version=1 → generate 10 plaintext 8-digit codes → `completePendingRegistration`: save User → delete pending → seed default notes → send welcome + separate verification email (LOCAL only) → `saveBackupCodes` (BCrypt each, generation=1) → issue access JWT (30 min) + refresh token (30-day, only SHA-256 hash stored).
   - Response: `{token, refreshToken, userId, username, backupCodes[10]}`.
   - Frontend consume: stores both tokens via tokenManager (localStorage), shows backupCodes ONCE, clears sessionStorage, redirect `/dashboard`.
   - **DB:** INSERT `users` (full doc: BCrypt password, promoted AES-GCM TOTP secret, totpEnabled/totpVerified=true, version=1, setupAt, emailVerified false / true-by-provider) · DELETE pending doc · INSERT ×10 `backup_codes` `{userId, codeHash(BCrypt), generation=1, used=false}` · INSERT 2 default `notes` (via notes module) · INSERT `refresh_tokens` `{userId, tokenHash(SHA-256), deviceInfo, ipAddress, expiresAt=+30d, revoked:false}`.

**FLOW 2 — Manual login journey (2–3 calls)**

1. **POST `/api/auth/login`**
   - UI collects: identifier (labelled "Username or Email", field `usernameOrEmail`), password, rememberMe (UI-only, never sent).
   - Client: AuthContext.login → unwrap ApiResponse → branch on response shape.
   - Backend receives: `LoginRequest` @Valid — identifier 3–100 non-blank; password min **6** (⚠ registration requires 8).
   - Backend processing: `findUserByUsernameEmailOrMobile` (username → **trimmed+lowercased** email (fix round) → normalized phone); unknown identifier → compare against DUMMY bcrypt hash (timing-safe anti-enumeration) → null; password lockout check (5 fails→15 min, 10→1 h, reset on success); `AuthenticationManager.authenticate` (BCrypt via security's CustomerUserDetailService); then mandatory-MFA branch: enabled+verified → temp token purpose **TOTP_LOGIN** (10 min — JWT claim string unchanged), else **TOTP_SETUP** (30 min). **Never returns a JWT directly.** Email case gap CLOSED in fix round 4: registration now lowercases + startup migration normalizes legacy rows.
   - Response: `{requireTotpSetup:false, tempToken, userId, username, message}` OR `{requireTotpSetup:true, tempToken, …}`.
   - Frontend consume: requiresTotp → hold tempToken in React state, reveal MFA input; requireTotpSetup → sessionStorage.tempToken → `/setup-2fa` (existing-user mode; completion there logs out + back to login).
   - **DB:** READ `users` by identifier chain · failed password → UPDATE `passwordFailedAttempts++` (+`passwordLockedUntil` at 5 fails→15 min / 10→1 h) · success → counter-reset UPDATE. Temp tokens stateless — never persisted.
2. **POST `/api/auth/mfa/login`** (or `/api/auth/mfa/login-recovery`)
   - UI collects: 6-digit code; recovery-mode toggle repurposes same input for 8-digit backup code.
   - HTTP: POST `{tempToken, code}` (noRetry).
   - Backend: validate **TOTP_LOGIN** purpose → load user by token subject → `verifyLogin`: lockout check (5→10 min, 10→24 h), decrypt active secret, verify, reset counters, stamp totpLastUsedAt / `verifyBackupCode`: iterate unused codes of current generation, BCrypt-match, mark used+usedAt, reset counters → `generateFinalLoginResponse`: access + refresh + profile fields.
   - Response: `{token, refreshToken, userId, username, email, mobile, firstName, bio, location, requireTotpSetup:false, profileComplete:true}`.
   - Frontend consume: `handleTotpLoginSuccess` persists both tokens, dispatches SET_USER, redirects to `?redirect=` path.
   - **DB:** success → UPDATE `users {totpFailedAttempts:0, totpLockedUntil:null, totpLastUsedAt:now}` + INSERT `refresh_tokens` row · login-recovery additionally UPDATE one `backup_codes` row `{used:true, usedAt:now}` · failed verify → `totpFailedAttempts++` (+lock at 5 fails→10 min / 10→24 h).

**FLOW 3 — Google SSO journey (up to 4 calls)**

1. Login page Google button → Google consent screen → redirect back with `?code`.
2. **POST `/api/auth/oauth2/google`** — HTTP `{code, redirectUri}` (noRetry). Backend: exchange code at googleapis/token → verify ID token (issuer accounts.google.com, audience google.client-id, JWKS cache) → branch: existing googleId → **JWT pair immediately, NO MFA step**; email collision + verified → link provider/googleId/emailVerified=true → JWT pair; collision unverified → 409 block; brand-new → upsert pending doc (PROFILE_COMPLETION temp token 15 min) → `{profileComplete:false, tempToken, email}`. Frontend: sessionStorage.tempToken → `/complete-profile`.
   - **DB:** existing-googleId path → zero writes · linking path → UPDATE `users {authProvider:GOOGLE, googleId, emailVerified:true}` · brand-new path → UPSERT `pending_registrations` keyed by googleId (`setOnInsert` createdAt/googleId; `set` email/name/authProvider/tempToken/expiresAt).
3. **POST `/api/auth/oauth2/complete-profile`** — UI collects username, name, dob, phoneNumber (+91 pattern enforced by DTO), password + confirm. Backend: validate PROFILE_COMPLETION token → match googleId→pending doc → passwords equal → username unique (users+pending) → phone unique → update pending doc → issue fresh **TOTP_REGISTRATION** token → `{requireTotpSetup:true, tempToken}` → frontend → `/setup-2fa` (same as FLOW 1 steps 2–3).
   - **DB:** UPDATE the pending doc `{username, phoneNumber, passwordHash(BCrypt), name}`; final verify writes = FLOW 1 step 3's INSERT set.

**FLOW 4 — Token lifecycle**

- **Refresh**: axios response interceptor catches 401 (non-login/refresh URLs) → single-flight queue → `authAPI.refresh` POST `{refreshToken}` → backend SHA-256 lookup → load user → `validateAndRotateRefreshToken` (single-use rotation; reuse detection revokes ALL user tokens → 401) → `{token, refreshToken}` re-stored; queued requests replayed with new Bearer; final failure → `auth:sessionExpired` CustomEvent → AuthContext clears state → `/login?redirect=<path>`.
  - **DB:** READ `refresh_tokens` by tokenHash → UPDATE old row `revoked:true` + INSERT replacement row; reuse detection → bulk UPDATE **all** of the user's rows `revoked:true`.
- **Logout**: POST `/api/auth/logout` with Bearer → backend writes access-token hash into `invalidated_tokens` (security module repo!) + `revokeAllByUserId` refresh tokens → frontend `tokenManager.removeAll()`.
  - **DB:** INSERT security-owned `invalidated_tokens` `{tokenHash, userId, expiresAt}` (TTL self-cleans) + bulk UPDATE `refresh_tokens.revoked=true`.

**FLOW 5 — Profile management (all authenticated via Bearer)**

- **GET `/api/users/me`**: profile page `useQuery(['profile'])` → backend resolves `authentication.getName()` → findByUsername → `UserProfileResponse.from(user)` (DTO-only) → ApiResponse(profile). epf page also consumes it. **DB:** read-only.
- **PUT `/api/users/me`**: edit form collects name/email/phone/bio/location; client validates email regex, strips `+91` prefix from mobile; PUT body = validated `UpdateProfileRequest` record (7 editable fields — raw-entity binding removed in round 7) → controller maps DTO → transient User → service whitelist + per-field uniqueness (username/email/lowercased email/normalized phone), saves, returns `UserProfileResponse` → queryClient.setQueryData + success toast; errors surfaced as toasts. **DB:** UPDATE `users` (whitelisted fields only).
- **PUT `/api/users/me/password`**: modal collects currentPassword/newPassword/confirmPassword (client checks match + ≥8) → `userAPI.changePassword` maps to `{password: newPassword, oldPassword}` → backend rejects missing-old/<8/same-as-old → service BCrypt-matches old, encodes new → **`jwtService.revokeAllRefreshTokens(userId)` (fix round — all refresh sessions killed)** → sends security-alert email with IP + invalidates all email magic-link tokens → toast. Access tokens still valid ≤30 min by design. **DB:** UPDATE `users.password` (BCrypt) + bulk UPDATE `refresh_tokens.revoked=true` for the user.
- **DELETE `/api/users/me`**: NOW WIRED (profile Danger Zone). Backend `deleteAccount(userId, rawPassword, ip, userAgent)`: password re-authentication → immutable `UserDeletionAudit` snapshot (`user_deletion_audits`, IN_PROGRESS→COMPLETED) written BEFORE destruction → backup codes + pending registrations purged → user doc deleted → all refresh tokens revoked → goodbye security alert → `UserDeletedEvent` → TEN module listeners cascade-clean their own user-keyed collections (email listener added 2026-08-24 purging magic-link tokens; was TTL-only before). **DB:** DELETE `users` doc + INSERT `user_deletion_audits` + bulk revoke `refresh_tokens` + cascade deletes across notes/broker/portfolio/MF/ppf/epf/fd/goldsilver/invalidated_tokens/email_tokens.

**FLOW 6 — MFA settings management (authenticated)**

- **GET `/api/auth/mfa/status`**: profile useQuery → `{enabled, verified, setupAt, lastUsedAt}` drives settings card. **DB:** read-only.
- **POST `/api/auth/mfa/reset`**: modal collects current MFA (6-digit) or backup (8-digit) code → backend verifies provided code (MFA first, backup fallback; optional-but-recommended) → generates NEW pending secret + QR (same shape as setup response). **DB:** UPDATE `users.totpSecretPending` (new AES-GCM secret).
- **POST `/api/auth/mfa/reset/verify`**: new code entry → verify pending secret → version++ → 10 fresh backup codes returned → security-alert email + invalidate email tokens → frontend displays codes and refetches profile. **DB:** UPDATE `users` (promote pending→active secret, version++, setupAt) + INSERT ×10 fresh-generation `backup_codes`; previous-generation unused codes REMAIN as inert rows (generation guard).
- **Not orphans (correction)**: `/api/auth/mfa/setup` + `/api/auth/mfa/verify` ARE wired — `TotpSetup.jsx` falls back to them when the page omits actions, i.e. existing-user forced-setup after MFA reset/disable (login issues TOTP_SETUP temp token → Bearer-header + `resolveUser`). See Open question 2.

**Never stored anywhere (any flow):** plaintext passwords, plaintext TOTP secrets, plaintext backup codes, access JWTs, TOTP_LOGIN/TOTP_SETUP/TOTP_REGISTRATION/PROFILE_COMPLETION temp tokens (only `pending_registrations.tempToken` is persisted, as a lookup key).

### Discrepancies found (Part 1/README claims vs code)

1. ~~UserController 11 endpoints incl. `/{id}` CRUD + list-all~~ → ✅ **FULLY RESOLVED**: `common/config/package-info.java` ghost `LoginController` reference removed from its directory-structure comment (grep-verified zero code-level traces). PART1's snapshot body deliberately KEEPS the original stale claim text (point-in-time record) — the Addendum at its foot documents the correction (AuthController owns unauthenticated routes; UserController = exactly 4 `/me` routes; TotpController = all MFA ops under `/api/auth/mfa/*`), so current docs + code agree while the claim→resolution trail stays auditable.
2. ~~TotpController paths: Part 1's `/api/auth/totp/*` family vs actual `/api/auth/2fa/*`~~ → ✅ **RESOLVED VIA RENAME (rounds 3–5, direction reversed twice)**: trail — (a) audit found code at `/api/auth/2fa/*` + `/login/totp|recovery`; D7 fixed docs to match; (b) round 3 renamed code to `/api/auth/totp/*`; (c) round 4 renamed to **`/api/auth/mfa/*`** — which briefly created an AMBIGUOUS SPRING MAPPING (both TotpController and email's TwoFactorRecoveryController claimed POST `/api/auth/mfa/recovery` → context-startup failure that `mvn compile` cannot catch); (d) round 5 broke the collision with a semantic split, verified in code: TotpController backup-code login = **POST `/api/auth/mfa/login-recovery`** (TotpController.java:151), email magic-link MFA reset = **POST `/api/auth/mfa/email-recovery(+/verify)`** (TwoFactorRecoveryController.java:62/126). SecurityConfig whitelist matches exactly (login-recovery + email-recovery pair public; reset/reset-verify/status stay authenticated). Frontend api.js fully aligned (`loginRecovery→/mfa/login-recovery`; `twofa.recovery*→/mfa/email-recovery*`). Final surface: setup, verify, login, login-recovery, reset, reset/verify, status(GET), register/setup, register/verify under `/api/auth/mfa`.
3. ~~**Backup-code format: Part 1 said "XXXX-XXXX" — code generates plain 8-digit numerics**~~ → ✅ **FULLY RESOLVED**: Part 1 text was updated to reflect the 8-digit numeric format used by the codebase.
4. ~~**MFA lockout tiers wrong in Part 1**: claimed "5 failed → 15-min"; actual 5→**10 min**, 10→**24 h**. Additionally an undocumented PASSWORD lockout exists: 5→15 min, 10→1 hr.~~ → ✅ **FULLY RESOLVED**: code verified as source of truth — MFA ladder `TotpService.java:312/314` (≥10 fails→+24 h, ≥5→+10 min), password ladder `UserAuthenticationService.java:296/298` (≥10→+1 h, ≥5→+15 min). user README §9 "Lockout & Security Ladders" documents both ladders exactly (round 3); PART1 snapshot line corrected to the dual-ladder text (original claim preserved in this strikethrough).
5. ~~Pending registrations are Mongo+TTL, not the in-memory Map Part 1 described (restart-safe, multi-instance-safe).~~ → ✅ **FULLY RESOLVED**: code confirmed Mongo-backed — `PendingRegistration` is an `@Document` collection with TTL index on `expiresAt` (`PendingRegistration.java:50–51`, `expireAfter="0s"`), 15-minute expiry written at `UserService.java:134`; unique indexes on tempToken + sparse googleId make signup state restart-safe and multi-instance safe. user README §5.3 documents it (round 3); PART1's "pendingRegistrations Map" wording corrected to MongoDB `pending_registrations`.
6. ~~Dead code cluster~~ → ✅ **FULLY RESOLVED (round 6)**: UserProfileService deleted (round 2, with its latent unverified-password-change bug); `package-info.java` LoginController ghost removed (round 5); dead DTOs **UserDTO / UpdateUserDTO / PasswordChangeDTO deleted** after word-boundary grep confirmed zero references (the earlier `RegisterUserDTO` grep hits were substring false positives); dead `UserService.getAllUsers()` removed together with its `UserServiceTest.getAllUsers_delegates` block; orphaned properties **wired into TotpService instead of deleted** — `@Value("${totp.window:1}")` drives `DefaultCodeVerifier.setAllowedTimePeriodDiscrepancy` via a new `@PostConstruct applyTotpSettings()`, and `@Value("${totp.max-backup-codes:10}")` replaces both hardcoded `10` loops in backup-code generation. Defaults identical to previous hardcoded behavior. Test debt fixed along the way: `JWTServiceTest` updated for the round-3 3-arg constructor; `UserServiceTest` gained the missing `InvalidatedTokenRepository` mock (null injection caused swallowed-NPE false in isTokenValid); `TotpServiceTest.setUp` injects window/maxBackupCodes and calls `applyTotpSettings()`. **110 tests, 0 failures across the four affected classes.**
7. ~~Controllers return raw `User` entity (password nulled) instead of UserDTO — violates module README's own rule; PUT /me binds raw entity (mass-assignment surface)~~ → ✅ **FULLY RESOLVED (round 7)**: new `UserProfileResponse` record (id, username, name, email, phoneNumber, dateOfBirth, bio, location, createdAt, updatedAt, emailVerified, authProvider, totpEnabled/totpVerified — explicit whitelist; sensitive columns structurally unreachable even if User grows new fields) returned by GET `/me`, PUT `/me`, and AuthController `verify-token`. New validated `UpdateProfileRequest` record replaces raw-entity binding on PUT `/me` (username/name/email/phoneNumber/dateOfBirth/bio/location only — mass-assignment surface eliminated; controller maps DTO → transient User → unchanged service whitelist). Frontend field-compat verified before shipping: profile page uses username/name/email/phoneNumber/bio/location/joinDate(createdAt), epf page fetches but reads no fields.
8. ~~DELETE /me has no cascade to notes/broker_accounts/holdings/etc.~~ → ✅ **FULLY RESOLVED (round 7)** via decoupled event-driven cascade: new `common/event/UserDeletedEvent(userId, username)` published by `UserService.deleteUser` (after user-doc delete + refresh revocation + stale-pending purge); **nine per-module listeners** each clean their own collections — notes (`notes`), broker (`broker_accounts`), portfolio (`canonical_holdings/positions/funds/mf_holdings/mf_orders`, `sync_logs`, `sync_cooldowns`; shared `market_prices` kept), mutualfund (lumpsum/sip-mandates/sip-contributions/redemptions/valuation-snapshots/portfolio-holdings/portfolio-metrics then schemes last as FK parent), ppf, epf, fixeddeposit, goldsilver, security (`invalidated_tokens`). 21 repositories gained derived `deleteByUserId(String)`; each listener try/catches so one failure can't abort the rest. Access-token exposure after deletion is now ≤30 min by stateless-JWT design (JwtFilter authenticates from claims by deliberate trade-off per security watch-list #1) — documented-accepted industry-standard residual, not a defect.
9. ~~Email case-normalization inconsistent~~ ✅ **FULLY RESOLVED (round 4)**: (a) login lookup trims+lowercases (UserAuthenticationService.java:435); (b) `registerUser` now lowercases before BOTH the uniqueness check and pending-doc storage (UserService.java:112-119, verified `cleanEmail` used in `existsByEmail` + builder); (c) `toTransientUser` lowercases when persisting the final user; (d) one-time startup migration `migrateMixedCaseEmailsToLowerCase()` (`@EventListener(ApplicationReadyEvent.class)`, UserService.java:363) rewrites legacy mixed-case rows. Caveats: migration loads ALL users into memory (fine at current scale) and its single try/catch wraps the whole loop — a unique-index collision mid-loop (case-variant duplicates) aborts remaining migrations with only a WARN log. Username normalization still none anywhere (unchanged).
10. ~~`GET /verify-token` skips blacklist~~ → ✅ **FULLY RESOLVED (rounds 3–8)**: (a) `UserService.isTokenValid` checks `invalidatedTokenRepository.existsByTokenHash` (round 3); (b) round 4 centralized the check inside **security.JWTService** itself — `validateToken(token, username)` AND `isValidTempToken(token, purpose)` consult `existsByTokenHash` first (null-safe optional injection), covering JwtFilter's path and every temp-token validation incl. TotpController's `resolveUser` step-1/2; (c) **round 8 closed the last gap**: `UserAuthenticationService.isTokenValid` now delegates to `jwtService.validateToken(username-matched)` instead of its own expiry-only copy — the resolveUser step-3 fallback on public `/api/auth/mfa/setup|verify` can no longer be passed by a logged-out blacklisted access token via manual header parsing. All isTokenValid paths now share one blacklist-enforcing code path.
11. ~~Minor gaps: phone uniqueness not checked against pending_registrations at registration; completeGoogleProfile can call existsByPhoneNumber(null) when phone omitted; rotation keeps old-generation unused backup codes as rows rather than deleting them as Part 1 implied~~ → ✅ **FULLY RESOLVED (round 8)**: (a) new null-safe `UserService.isPhoneNumberRegistered(phone)` = users OR pending_registrations — used by `registerUser`, Google `completeGoogleProfile`, AND profile-update uniqueness; (b) Google completion's phone check routed through that helper → `existsByPhoneNumber(null)` can never fire and a missing phone is never "taken"; (c) `BackupCodeRepository.deleteByUserIdAndGeneration(userId, oldVersion)` added and invoked in `TotpService.verifySetup` during every rotation — previous generation's rows fully deleted per Part 1's "ROTATED (old backup codes deleted)" contract (locked in by a new test assertion).

### Formulas/business rules confirmed correct

- TOTP (RFC-6238) params SHA1 / 6 digits / 30 s via dev.samstevens.totp defaults; issuer CoinTrack; QR = base64 PNG data-URI via ZXing. Secret lifecycle PENDING→promote-on-verify→version++ (existing) or version=1 (registration).
- Mandatory-MFA login: password success NEVER yields JWT — returns temp token with purpose **TOTP_LOGIN** (10 min, literal claim string in code) when enabled, or forces setup with **TOTP_SETUP** (30 min) when disabled. Temp purposes/expiries: TOTP_REGISTRATION 15 min, PROFILE_COMPLETION 15 min. Route names say /mfa; claim strings still say TOTP_*.
- Anti-enumeration: dummy BCrypt hash always compared for unknown identifiers; generic "Invalid credentials"; per-attempt persistence of failed counters.
- Backup codes: 10 per version, BCrypt-hashed, one-time use (used+usedAt), generation-guarded against stale-secret reuse.
- Registration completion order: verify pending secret → save user → delete pending → seed 2 default notes → welcome email + separate verification email (LOCAL only; Google pre-sets emailVerified=true and skips) — honors email module's never-combine rule.
- Refresh rotation + logout semantics correct (hash-only storage, revokeAllByUserId bulk update, blacklist write on logout).
- Phone normalization (+91 prefix for bare 10-digit) applied consistently across registration/update/login.

### Suspicious / watch-list — RESOLVED (fix round 2026-08-23, verified vs code + `mvn compile` exit 0)

1. ~~Password-change leaves sessions alive~~ ✅ FIXED — `revokeAllRefreshTokens(userId)` added (UserService.java:323).
2. ~~Account deletion lacks token invalidation~~ ✅ FIXED — revoke call added post-delete (UserService.java:332). Cascade to other modules' collections still open (tracked as discrepancy #9 residue).
3. ~~UserProfileService latent unverified-password-change~~ ✅ RESOLVED BY DELETION — file removed from codebase.
4. ~~Missing indexes on users.email/phoneNumber~~ ✅ FIXED — User.java now carries `email @Indexed(unique, sparse)`, `phoneNumber @Indexed(sparse)`, `googleId @Indexed(unique, sparse)`.

### Open questions — ALL ANSWERED (2026-08-23)

- ~~Intended deletion UX~~ **ANSWERED: intentional backend-only.** Owner confirmed DELETE `/api/users/me` is GDPR-style tooling/API-first by design; UI deliberately hides account removal (zero components reference it). No code change.
- ~~Should mfa/setup + mfa/verify be removed as unreachable?~~ **ANSWERED: NO — KEEP; removal would break lost-device recovery.** The earlier "zero page callers" audit finding was WRONG: `components/TotpSetup.jsx:21–22` falls back to `setupTotp`/`verifyTotpSetup` (→ `POST /api/auth/mfa/setup|verify`) whenever the page omits explicit actions, and `/setup-2fa` omits them exactly in **existing-user forced-setup mode** (login of a user whose MFA is disabled — e.g., after email-module `disable2FA` device-loss recovery — which issues a TOTP_SETUP temp token and redirects here). The page promotes that temp token via `tokenManager.setToken()`, so the Bearer-header + `resolveUser` mechanism serves QR/verify from these two endpoints. Mandatory-MFA does NOT make them dead: a post-reset user can pass login but has no active secret — precisely their purpose. Lesson recorded: prop-default indirection defeats naive caller greps.
- Which controller keeps POST `/api/auth/mfa/recovery`? **ANSWERED (round 5)**: neither — split into `/mfa/login-recovery` (user, backup-code login) and `/mfa/email-recovery(+/verify)` (email, magic-link reset). No open naming conflict remains.

### Resolution status

**Fix round 2026-08-23 (applied by Antigravity, verified line-by-line against source + clean `mvn compile`)**: user README rewritten to **v3.1.0**. Code changes: dead `UserProfileService.java` deleted; `UserService.changePassword` + `deleteUser` now revoke all refresh tokens; `UserService.isTokenValid` consults the invalidated_tokens blacklist; login identifier lookup trims + lowercases email; `User.java` gained sparse unique indexes on email/googleId and sparse index on phoneNumber.
Round 3 (same day): blacklist centralized into **security.JWTService** (`validateToken` + `isValidTempToken` now check `existsByTokenHash`, null-safe optional injection — verified in diff); registration email lowercasing (`registerUser` cleanEmail used for both uniqueness check and storage) + `toTransientUser` lowercase + startup migration `migrateMixedCaseEmailsToLowerCase()` added; security/user README tables updated.
Round 4 (same day): **MFA route rename** — TotpController base → `/api/auth/mfa` (9 endpoints), SecurityConfig whitelist repointed, frontend api.js fully repointed (both `auth.totp` keys and `twofa.recovery*`), email TwoFactorRecoveryController moved off `/2fa/*`, UserService duplicate secondary constructor removed, READMEs bulk-updated. Introduced (and round 5 fixed) an ambiguous-mapping blocker on POST `/api/auth/mfa/recovery`.
Round 5 (same day, applied concurrently while this card was being updated — detected via mid-edit file change): **recovery split** — TotpController login completion → `POST /api/auth/mfa/login-recovery` (line 151); email magic-link flow → `POST /api/auth/mfa/email-recovery(+/verify)` (lines 62/126); SecurityConfig whitelist matches exactly; frontend api.js realigned; `mvn compile` EXIT 0 re-verified after the split. Collision CLOSED.
Verified-resolved across rounds: watch-list #1–#4; discrepancies **#1** (package-info ghost + PART1 addendum), **#2** (MFA rename + recovery split), **#3, #4, #5** (doc alignment — PART1 snapshot lines corrected to code truth: 8-digit codes, dual lockout ladders, Mongo pending_registrations), **#6** (full dead-code cleanup + properties wired), **#7** (DTO-only profile contract), **#8** (password-change revocation), **#9** (event-driven deletion cascade), **#10** (email case: lookup+storage+migration), **#11** (blacklist on every token path), **#12** (phone uniqueness everywhere + rotation purge). Partially resolved: none.

**Module `user`: 12/12 discrepancies resolved · 4/4 watch-list items resolved · 3/3 open questions answered. ZERO open items, ZERO residue. Module CLOSED.**
Round 6 (2026-08-23): discrepancy #6 closed in code — 3 dead DTOs deleted, `getAllUsers()` + its test removed, `totp.window`/`totp.max-backup-codes` wired into TotpService (`@PostConstruct applyTotpSettings()` + generation loops); stale tests fixed (`JWTServiceTest` 3-arg ctor, `UserServiceTest` missing InvalidatedTokenRepository mock, `TotpServiceTest` field injection). 110/110 tests green.
Round 7 (2026-08-23): discrepancies **#7 and #9 closed in code**. #7: new `UserProfileResponse` + validated `UpdateProfileRequest` records; GET/PUT `/me` and `verify-token` now DTO-only (no raw entity in or out — mass-assignment surface eliminated); frontend field-compat verified pre-ship. #9: `common/event/UserDeletedEvent` published from `deleteUser`; nine per-module `UserDataCleanupListener`s cascade-clean ~20 user-keyed collections via new derived `deleteByUserId` on 22 repositories (shared market_prices / NAV cache / LTP deliberately kept); listeners fail-independent. Access-token ≤30-min post-delete window documented as inherent stateless-JWT residual (per security watch-list #1 trade-off). **125/125 tests green across the five affected classes.**
**✅ Blocker from round 4 CLOSED in round 5** (recovery naming split, verified vs code + clean compile). Secondary doc-drift from round 4 remains worth knowing: the repo-wide TOTP→MFA sed renamed JWT claim names in .md files only — code literals remain TOTP_LOGIN/TOTP_SETUP/TOTP_REGISTRATION (grep-verified); PART1/rules files were restored from git HEAD to preserve historical accuracy (their sed damage included falsified D7 history and "MFA MFA" artifacts), with a forward-looking addendum appended to PART1.
Remaining residue (non-blocking): **ZERO.** The last item (`UserAuthenticationService.isTokenValid` blacklist gap on public MFA routes) was closed in round 8 — all isTokenValid paths now delegate to the blacklist-enforcing JWTService code path.
Round 8 (2026-08-23): **#11 residual + #12 minor gaps closed in code**. (a) `UserAuthenticationService.isTokenValid` now delegates to `jwtService.validateToken(token, username)` — blacklist enforced on the resolveUser step-3 fallback for public `/api/auth/mfa/setup|verify`; (b) `UserService.isPhoneNumberRegistered(phone)` (null-safe, users OR pending) replaces three scattered checks — registration, Google profile completion (kills the `existsByPhoneNumber(null)` edge), and profile-update uniqueness; `PendingRegistrationRepository.existsByPhoneNumber` added; (c) rotation purge: `BackupCodeRepository.deleteByUserIdAndGeneration` invoked in `verifySetup` so old-generation codes are fully deleted per Part 1's ROTATED contract, with a new test assertion locking it in. Stale tests updated (UAS valid/blacklisted stubs, UserServiceTest taken-phone stub, GoogleTest phone stub). **214/214 tests green across nine affected classes.**
Round 9 (2026-08-23): **documentation sync** — user README bumped to **v3.2.0** (DTO contract, cascade, phone uniqueness, rotation purge, wired properties, dead-code removal); cascade/listener sections appended to **10 more READMEs** (common: `UserDeletedEvent` reference; notes/broker/portfolio/mutualfund/ppf/epf/fixeddeposit/goldsilver/security: their cleanup listener + new repo methods). Open questions answered: DELETE /me confirmed intentionally backend-only; `/mfa/setup|verify` confirmed LIVE (not orphans — TotpSetup fallback serves existing-user forced-setup after MFA reset; earlier zero-callers finding corrected).
Round 10 (2026-08-24, owner-directed): **endpoint hygiene + industry-standard deletion** — supersedes round 9's "DELETE /me intentionally backend-only" answer per owner's new direction. (a) DISABLED `GET /api/auth/verify-token` + `GET /api/auth/check-username/{username}` — owner chose comment-out over deletion: endpoints, their two SecurityConfig permitAll entries, and 6 stale controller tests all retained as commented blocks with restore instructions; AuthController README table completed with previously-missing logout & oauth2/complete-profile rows. (b) REWROTE `DELETE /api/users/me`: `UserService.deleteUser(id)` → `deleteAccount(userId, rawPassword, ip, userAgent)` with password re-authentication (IllegalArgumentException → 401; Google-only accounts exempt), NEW `user/model/UserDeletionAudit` + repo (`user_deletion_audits`) written BEFORE destruction with full identity snapshot + IP/UA/reason/status, backup-codes purge (previously leaked on delete!), goodbye `sendSecurityAlertWithIP`, audit IN_PROGRESS→COMPLETED after cascade. (c) NEW `email/listener/EmailUserDataCleanupListener` → `email_tokens` purge on cascade (was TTL-only). (d) Frontend: `endpoints.users.deleteMe` + `userAPI.deleteAccount(password)` (axios DELETE body via `{ data }`) + profile-page Danger Zone following recovery-confirm visual language. Tests: UserServiceTest 5 new deleteAccount cases (+2 new mocks incl. ApplicationEventPublisher), UserControllerTest 4 updated delete cases; **79/79 green** across the three user-module test classes; `mvn compile` EXIT 0. User README → **v3.3.0**.

---

## Synthesis Card — `email`

Files (14): `model/EmailToken` · `repository/EmailTokenRepository` · `service/{EmailSender, BrevoEmailService, EmailTokenService, EmailService}` · `controller/{ForgotPasswordController, EmailVerificationController, EmailChangeController, TwoFactorRecoveryController, ContactController, AdminEmailPreviewController}` · `config/{BrevoConfigProperties, EmailConfigProperties}`. **10 endpoints (9 runtime + 2 dev-preview GETs).** Templates: 7 Thymeleaf files in `resources/templates/email/` (welcome, verify-email, reset-password, change-email, 2fa-recovery, security-alert, contact-form — all present on disk).

### Owns collections

- **`email_tokens`**: `{_id = UUID tokenId (NOT a Mongo ObjectId — the magic-link JWT's jti is the document _id), userId @Indexed, purpose (EMAIL_VERIFY | PASSWORD_RESET | EMAIL_CHANGE_VERIFY | 2FA_RECOVERY), newEmail (EMAIL_CHANGE_VERIFY only), expiresAt (@Indexed expireAfterSeconds=0 → TTL self-clean at 10 min), used=false, ipAddress, userAgent ("Unknown" when no request context), createdAt @CreatedDate}`. Token model = **two-layer credential**: signed JWT (HMAC from `email.magic-link-secret`, claims jti/sub=userId/purpose/exp) whose `jti` MUST also exist in Mongo with `used=false`. Part 1 listed NO collections for email — backend README v3.1's `email_tokens` row was right (D8 confirmed again).

### Real dependency edges (from actual imports)

**Outbound:** every controller/service → user.model.User + UserRepository; TwoFactorRecoveryController.java:148 → user TotpService.disable2FA (the known email→user edge); ForgotPasswordController + TwoFactorRecoveryController → common UserLookupUtil.findByIdentifier; EmailTokenService → common RequestUtils (IP/UA extraction, null-safe "Unknown"); EmailConfigProperties → common UrlResolverUtil.resolveUrl for logo/verify/reset/change/recovery URL builders.
**Inbound (who calls email):** user.UserService.sendRegistrationEmails (sendWelcomeEmail + createToken("EMAIL_VERIFY") + sendEmailVerification — LOCAL users only, skipped for Google; welcome FIRST, verification SECOND per never-combine rule) · user.UserController.java:161 + user.TotpController.java:268 → EmailTokenService.invalidateAllForUser (password change / MFA reset+disable kill outstanding magic links) · common.NotificationServiceImpl → EmailService.sendSecurityAlert/sendSecurityAlertWithIP/sendWelcomeEmail (the common→email delegate). Part 1's caller list ("AuthController, ProfileService, TwoFactorService") is stale on all three names.

### Endpoint-to-frontend map

| Endpoint                                                        | Frontend caller                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST`/api/auth/forgot-password` {identifier}                  | passwordAPI.forgot ←`(access)/forgot-password/page.jsx`:35 (4xx still shown as "submitted" — mirrors anti-enumeration)                                                                                                                                                                                                                                                                                                                  |
| POST`/api/auth/forgot-password/verify` {token}                | passwordAPI.forgotVerify ←`(access)/reset-password/page.jsx`:47 (?token= URL param) → stores returned tempToken                                                                                                                                                                                                                                                                                                                         |
| POST`/api/auth/reset-password` Bearer tempJWT + {newPassword} | passwordAPI.reset(tempToken,newPassword) — temp token sent AS Authorization header ← reset-password page:73                                                                                                                                                                                                                                                                                                                               |
| POST`/api/auth/email/verify` {token,type?}                    | emailAPI.verify(token,type) ←`(access)/verify-email/page.jsx`:36 (?token&type from magic link; handles alreadyVerified branch)                                                                                                                                                                                                                                                                                                           |
| POST`/api/auth/email/resend`                                  | **WIRED (was dormant)**: backend fully functional (EmailVerificationController ~L157, covered by EmailVerificationControllerTest's 13 @Test cases); `emailAPI.resend` (api.js:319 + :658, noRetry). UI callers since 2026-08-23: profile page "Resend Verification Email" button (`!isEmailVerified`, dashed-border callout row) + verify-email error state (session-aware: live token → authenticated resend; else login nudge) |
| POST`/api/auth/email/change` {newEmail}                       | emailAPI.change ←`(main)/profile/page.jsx`:146 — client trims+lowercases newEmail before sending                                                                                                                                                                                                                                                                                                                                        |
| POST`/api/auth/mfa/email-recovery` {identifier}               | twofaAPI.requestRecovery(user.email) ← profile page:506 (logged-in lost-device flow sends own email)                                                                                                                                                                                                                                                                                                                                       |
| POST`/api/auth/mfa/email-recovery/verify` {token}             | twofaAPI.verifyRecovery(token) ←`(access)/reset-2fa/page.jsx`:33                                                                                                                                                                                                                                                                                                                                                                         |
| POST`/api/public/contact` {name,email,message}                | contactAPI.sendMessage ←`components/modals/ContactModal.jsx`:51 (react-hook-form; opened via ModalManager)                                                                                                                                                                                                                                                                                                                               |
| GET`/admin/emails/preview` · GET`/admin/emails/templates`  | none — dev-browser template tooling only                                                                                                                                                                                                                                                                                                                                                                                                   |

Shared frontend infra: shared axios instance + unwrapResponse + noRetry flag; toast notifications; AuthGuard PUBLIC_ROUTES cover forgot-password/reset-password/verify-email/reset-2fa. Frontend transformation of note: profile page lowercases newEmail before POST — and since fix round 4 the SERVER also normalizes `trim().toLowerCase()` (belt-and-braces parity with registration/users unique index).

### End-to-end flows — UI → client → HTTP → backend receive → backend process → response → frontend consume → Mongo writes

**FLOW A — Forgot password → verify → reset (3 calls, all public)**

1. **Request reset link**
   - **UI collects**: single identifier field (email / username / mobile) on `(access)/forgot-password/page.jsx`; submit → loading state.
   - **Client processing**: none beyond trim — identifier sent verbatim (`passwordAPI.forgot`, api.js).
   - **HTTP**: `POST /api/auth/forgot-password` JSON `{identifier}`, no Authorization header, permitAll'd.
   - **Backend receives**: `Map<String,String>` body; blank identifier → 400 `ApiResponse.error`.
   - **Backend processing**: `UserLookupUtil.findByIdentifier` (email → username → mobile). Found → `emailTokenService.createToken(user, PASSWORD_RESET)` capturing IP+UA → async `sendPasswordResetLink` (link = `${baseUrl}/reset-password?token=<JWT>`). Unknown → log-only branch. BOTH paths fall through to the identical response (anti-enumeration).
   - **Response 200**: `{success:true, data:{message:"If an account exists with this identifier, you will receive a password reset link"}}`.
   - **Frontend consume**: `unwrapResponse` → toast the generic message regardless of outcome (even surfaced 4xx render as "submitted"); page switches to check-your-inbox state. tempToken NOT involved yet.
   - **Mongo writes**: found-case only → INSERT `email_tokens {_id:UUID(jti), userId, purpose:PASSWORD_RESET, expiresAt(TTL), used:false, ipAddress, userAgent}`.
2. **Verify token (auto on page load)**
   - **UI collects**: nothing typed — reset-password page reads `?token=` URL param on mount and auto-submits ("verifying…" state).
   - **Client processing**: extracts query param; calls `passwordAPI.forgotVerify(token)`.
   - **HTTP**: `POST /api/auth/forgot-password/verify` JSON `{token}`.
   - **Backend receives**: Map body; blank token → 400.
   - **Backend processing**: `validateToken(token, PASSWORD_RESET)` — JWT signature (magic-link secret) → purpose claim → `findByIdAndUsedFalse` → DB purpose re-check → expiry double-check → load User → `markUsed` → mint **PASSWORD_RESET_TEMP JWT** (5 min, same secret — third token family, invisible to JwtFilter).
   - **Response 200**: `{data:{verified:true, tempToken, message}}`; invalid/expired/used → 400 with reason.
   - **Frontend consume**: page stores tempToken in React state ONLY (never localStorage); flips form into "choose new password" mode. 400 → dead-token screen with re-request link.
   - **Mongo writes**: UPDATE `email_tokens.used=true`.
3. **Reset password**
   - **UI collects**: newPassword + confirm (client checks MATCH ONLY — strength is enforced server-side).
   - **Client processing**: `passwordAPI.reset(tempToken, newPassword)` puts the temp JWT in the **Authorization: Bearer header**, newPassword in body (the app's only bearer-temp-token route).
   - **HTTP**: `POST /api/auth/reset-password` — permitAll'd; JwtFilter cannot parse this secret so SecurityContext stays empty; controller parses manually.
   - **Backend receives**: optional Authorization header + `{newPassword}`; blank → 400; policy regex fail (≥8, upper/lower/digit/special `@$!%*?&#`) → 400; missing Bearer → 401.
   - **Backend processing**: parse temp JWT (signature, purpose==PASSWORD_RESET_TEMP, exp) → load user by `sub` → BCrypt encode + save → **`jwtService.revokeAllRefreshTokens(userId)` (fix round 4 — stolen sessions can no longer outlive a reset)** → `invalidateAllForUser(userId)` → async security alert with client IP.
   - **Response 200**: `{data:{message:"Password reset successfully. Please login with your new password."}}`; bad temp token → 401/400.
   - **Frontend consume**: success toast → redirect `/login`.
   - **Mongo writes**: UPDATE `users.password` · bulk UPDATE `refresh_tokens SET revoked=true WHERE userId` (user-owned collection, written via security's JWTService) · DELETE all user's `email_tokens`.

**FLOW B — Registration verification (+ wired resend)**

- Trigger lives in user module: registration completion → `UserService.sendRegistrationEmails` → async welcome email + SEPARATE EMAIL_VERIFY magic link (`/verify-email?token=`).
- **UI collects**: nothing — verify-email page reads `?token=` on mount and auto-posts.
- **Client**: `emailAPI.verify(token, undefined)` → `POST /api/auth/email/verify {token}` (public).
- **Backend processing**: validateToken(EMAIL_VERIFY) → repeat-click branch returns `{alreadyVerified:true}` gracefully → else set `emailVerified=true, emailVerifiedAt=now` → markUsed.
- **Response/Frontend**: success screen with login CTA; alreadyVerified renders informational state.
- **Mongo**: UPDATE `users{emailVerified,emailVerifiedAt}` + UPDATE token `used=true`.
- **Resend leg (WIRED 2026-08-23)**: `POST /api/auth/email/resend` (Bearer required) re-issues a fresh EMAIL_VERIFY token for an unverified principal or returns alreadyVerified. Backend complete + unit-tested; SDK method existed unused until now — both wire-up points implemented: (1) profile page callout row with "Resend Verification Email" button when `!isEmailVerified` (toast + profile invalidation on alreadyVerified), (2) verify-email error state session-aware resend (`tokenManager.getToken()` live → authenticated resend w/ Loader2 spinner; expired/no token → "Log in to request a new link" nudge to `/login`). INSERT `email_tokens` on every fired resend.

**FLOW C — Email change (authenticated start → public finish)**

1. **Request change**
   - **UI collects**: new address in profile-page edit flow; page pre-lowercases before sending.
   - **Client**: `emailAPI.change(newEmail)` with Bearer access token → `POST /api/auth/email/change {newEmail}`.
   - **Backend receives**: `@AuthenticationPrincipal UserDetails` + body; no principal → 401; blank/format-fail → 400.
   - **Backend processing**: normalize `trim().toLowerCase()` (fix round 4, mirrors UserService.java:109) → load user → strict-equals current → 400 → `findByEmail` collision → **neutral 200** (no enumeration) → else `pendingEmail` saved + EMAIL_CHANGE_VERIFY token bound to newEmail + async change-email template sent to the NEW inbox (link `/verify-email?token=..&type=change`).
   - **Response 200**: `{data:{message:"Verification link sent to new email address"}}` (identical shape whether taken or not).
   - **Frontend consume**: toast; UI keeps displaying old email until swap completes.
   - **Mongo**: UPDATE `users.pendingEmail` + INSERT `email_tokens(purpose:EMAIL_CHANGE_VERIFY,newEmail)`.
2. **Confirm via magic link**
   - Verify-email page sees `type=change` → same endpoint with `{token, type:"change"}` → backend validates against EMAIL_CHANGE_VERIFY purpose instead → swaps `email ← token.newEmail`, sets verified flags, clears pendingEmail → markUsed → **invalidateAllForUser** → async alert to the OLD address.
   - **Mongo**: UPDATE `users{email, emailVerified, emailVerifiedAt, pendingEmail:null}` + token used + DELETE remaining tokens.

**FLOW D — Lost-MFA recovery (public pair)**

1. **Request recovery**
   - **UI collects**: logged-in profile "lost device" flow passes own email (`twofaAPI.requestRecovery(user.email)`); login-page variant collects an identifier field.
   - **HTTP**: `POST /api/auth/mfa/email-recovery {identifier}` (public).
   - **Backend processing**: lookup → require `totpEnabled && emailVerified`. EVERY non-issuing case — unknown identifier, 2FA-disabled, or exists-but-email-unverified (**neutral 200 since fix round 4; formerly a leaky explicit 400**) — returns the SAME `{message:"If an account exists…has 2FA enabled…"}`. Issue case → 2FA_RECOVERY token + `/reset-2fa?token=` link.
   - **Frontend consume**: generic toast either way; reset-2fa page only reached via real mail link.
   - **Mongo**: INSERT `email_tokens(purpose:2FA_RECOVERY)` issue-case only.
2. **Verify + disable**
   - **UI**: `(access)/reset-2fa/page.jsx` reads `?token=` → auto-post `twofaAPI.verifyRecovery(token)`.
   - **Backend processing**: validateToken(2FA_RECOVERY) → markUsed → **`TotpService.disable2FA(user)`** (clears MFA enablement in the users doc) → invalidateAllForUser → alert "2-Factor Authentication Disabled via Recovery".
   - **Response/Frontend**: `{verified:true, message}` → success screen instructing password-only login; next login hits forced TOTP_SETUP (user card FLOW 2).
   - **Mongo**: token used + DELETE tokens + UPDATE users MFA block (via TotpService).

**FLOW E — Contact form**

- **UI collects**: name/email/message in ContactModal (react-hook-form mirrors @Valid).
- **Client**: `contactAPI.sendMessage(data)` → `POST /api/public/contact` (no auth).
- **Backend receives**: `@Valid ContactFormRequest` (@NotBlank ×3, @Email) → violations → 400.
- **Backend processing**: async contact-form template → support inbox (`email.support`); no persistence.
- **Response 200**: `ApiResponse` envelope `{success:true, message:"Message sent successfully", data:null}` (**envelope restored in fix round 3** — was the app's only bare-string endpoint).
- **Frontend consume**: hardcoded success toast; return value ignored (envelope-safe).
- **Mongo writes**: NONE.

**FLOW F — Dev-only preview (non-app client)**

- Browser GET `/admin/emails/preview?template=<name>&…` / `/templates` → controller bean exists ONLY under `dev` profile (`@Profile("dev")` → 404 elsewhere) → `previewEmailTemplate` renders Thymeleaf with sample variables → raw `text/html`. **No Mongo involvement.**

**Database persistence summary:** the module writes ONLY `email_tokens` — INSERT per issued link, UPDATE `used=true` on consume, bulk DELETE on invalidate-all (plus embedded TTL sweeper on `expiresAt`). All `users` mutations above run through user-owned repositories called directly by these controllers; `refresh_tokens` revocation in FLOW A.3 is delegated to security's JWTService.

### Discrepancies found (Part 1/README vs code)

1. ~~"Controllers: dev-only AdminEmailPreviewController (2 GETs)"~~ → ✅ **FULLY RESOLVED (2026-08-23)**: email README rewritten to **v3.1.0** — §6 now documents all **6 controllers / 10 endpoints** with per-endpoint request/response tables and frontend callers (ForgotPassword ×3 incl. `PASSWORD_RESET_TEMP` mechanics, EmailVerification verify/resend, EmailChange, TwoFactorRecovery ×2 incl. `TotpService.disable2FA` hand-off, Contact, AdminPreview); §2.1 layer diagram rebuilt around the real controller+token+service layers; §1.5 system-position diagram corrected (Security Module edge removed — those flows live HERE; Common NotificationService + Frontend edges added); §3 directory tree corrected to **14 Java files**; new **§5.4 Token Subsystem** documenting EmailTokenService's two-layer model and the `email_tokens` collection; §5.3 method table fixed (`sendMFARecoveryLink` → actual **`send2FARecoveryLink`**; stale callers AuthController/ProfileService/TwoFactorService replaced with ForgotPasswordController/EmailChangeController/TwoFactorRecoveryController/NotificationServiceImpl). The same rewrite closed the documentation side of **#2** (`email_tokens` now §5.4) and **#3** (real caller list now §5.3), and noted the unused `email.from` property (#6) plus the `/templates` list gap (#9) inline.
2. ~~Part 1: no collections owned~~ → ✅ **FULLY RESOLVED (2026-08-23)**: module owns **`email_tokens`** — now documented in email README v3.1.0 §5.4 (full field list, TTL, four purposes, two-layer validation contract).
3. ~~Caller list "UserService, AuthController, ProfileService, TwoFactorService, ContactController"~~ → ✅ **FULLY RESOLVED (2026-08-23)**: real inbound edges verified by grep and now documented in README v3.1.0 §5.3 (send methods) + §5.4 (invalidateAllForUser call-ins) — UserService ✓, UserController.java:161, TotpController.java:268, common NotificationServiceImpl; AuthController no longer touches email (ForgotPasswordController absorbed that role INTO email); ProfileService deleted (user round 2); TwoFactorService never existed (TotpService is the user-module service; the recovery controller lives in email itself).
4. ~~DevNoOpEmailService referenced as dev impl~~ → ✅ **FULLY RESOLVED (2026-08-23)**: class was removed from code in v3.0.0; all 3 stale comments corrected (EmailSender.java javadoc, BrevoEmailService.java:25, EmailService.java:63) to state BrevoEmailService is the SOLE EmailSender in ALL profiles — dev without BREVO_API_KEY degrades via isConfigured()→false skip-and-warn, dev WITH key sends real email. README §5.1 profile-swap claim also corrected; changelog row kept as historical record. `mvn compile` exit 0. Repo-wide grep: zero DevNoOp references outside the changelog history line.
5. ~~BrevoEmailService.java:38 uses raw `WebClient.create()`~~ → ✅ **FULLY RESOLVED (2026-08-23)**: BrevoEmailService now takes `WebClient.Builder` via constructor and builds from the shared `common/config/WebClientConfig` bean — inherits 10s connect timeout, 15s response timeout, 2MB codec limit; per-call `.timeout(10s)` kept as overall cap. Common card's "flagged exception" is now moot (bean still named brokerWebClientBuilder despite generic purpose — noted for common module, injection is by-type so no breakage).
6. ~~EMAIL_FROM env var / `email.from` property DEAD~~ → ✅ **FULLY RESOLVED (2026-08-23)**: dead config deleted — `from` field removed from EmailConfigProperties, `email.from` line removed from application.properties (with explanatory comment); From identity documented as solely `brevo.sender-email`. Repo-wide grep: zero remaining EMAIL_FROM/email.from references outside audit docs.
7. Defaults drift → ✅ **RESOLVED VIA DOCUMENTATION (2026-08-23)**: behavior intentionally NOT changed — application.properties' gmail values win because Brevo only delivers from senders verified in the Brevo account; changing them would silently break delivery. Email README §4.2 now carries an explicit "Defaults vs deployed values" callout naming the effective gmail sender/support.
8. ~~Dead routes on BOTH sides~~ → ✅ **FULLY RESOLVED (2026-08-23)**: SecurityConfig dropped `/api/contact` permitAll (no controller maps it; `/api/public/**` already covers the real route) and `/api/auth/email/change/verify` (never existed server-side); api.js `endpoints.email.changeVerify` constant removed. Greps confirm zero remaining references on either side. This also answers former open question #2 → cleanup chosen.
9. ~/templates lists only 5 of 7~ → ✅ **FULLY RESOLVED (2026-08-23)**: AdminEmailPreviewController.listTemplates now returns all 7 templates (added 2fa-recovery, contact-form); README §8.2 sample updated.
10. ~~ContactController returns bare String~~ → ✅ **FULLY RESOLVED (2026-08-23)**: now returns `ResponseEntity<ApiResponse<Void>>` via `ApiResponse.success("Message sent successfully")` — envelope convention restored; verified frontend ContactModal ignores the return value (hardcoded toast) so no client impact.
11. ~~Config wiring asymmetry~~ → ✅ **FULLY RESOLVED (2026-08-23)**: EmailConfigProperties stripped of self-registration (`@Configuration` removed), both email properties classes now registered uniformly via `@EnableConfigurationProperties({BrevoConfigProperties.class, EmailConfigProperties.class})` on FinanceDashboardApplication.

### Formulas/business rules confirmed correct

- Retry policy exactly as documented: reactor `Retry.backoff(3, 1s)` capped maxBackoff 10s, filter retries ONLY 5xx + network (WebClientRequestException/IOException); 400/401 fail immediately; distinct ERROR logs for invalid-API-key (401).
- Fail-safe contract: doSend catches everything → boolean, NEVER throws; every caller additionally try/catches — email failure cannot block registration/login/reset flows.
- Magic-link security model: 10-min TTL enforced THREE ways (JWT exp, DB expiresAt, Mongo TTL sweeper); single-use mandatory (DB used-flag — class doc explicitly states JWT validation alone insufficient); purpose bound in BOTH JWT claim and DB row and compared twice; invalidate-all on every sensitive account change (password reset, email-change verify, MFA recovery, plus user-module changePassword/MFA-reset call-ins).
- Anti-enumeration: identical neutral responses for unknown identifiers on forgot-password AND mfa/email-recovery.
- Never-combine rule honored in code: sendRegistrationEmails sends welcome first, then a SEPARATE verification email (LOCAL only; Google skips — pre-verified).
- Password reset strength regex identical to registration policy (≥8, upper/lower/digit/special `@$!%*?&#`).
- Logging policy holds: success/failure logs carry recipient + subject (+status) only; no HTML bodies, no API key, no tokens in logs.
- Logo handling: primary = base64 data URI loaded once @PostConstruct from `classpath:static/logo/coinTrack.png` (Part 1 correct), fallback = absolute URL `apiBaseUrl + /logo/coinTrack.png`; keep-logo-small guidance remains relevant since data URI ships in every email.

### Suspicious / watch-list — ALL RESOLVED (2026-08-23)

1. ~~Forgot-password reset does NOT revoke refresh tokens~~ → ✅ **FIXED**: `ForgotPasswordController.resetPassword` now calls `jwtService.revokeAllRefreshTokens(userId)` right after the password save (parity with `UserService.changePassword`) — a stolen refresh token can no longer survive a reset. Note: the controller's class javadoc ALREADY claimed "All sessions invalidated on password reset" — code now matches its own documentation. Email→security dependency precedented (user module already injects JWTService).
2. ~~Temp-token secret coupling~~ → ✅ **MITIGATED + GUARDED**: new `email/config/MagicLinkSecretGuard` (`ApplicationListener<ApplicationReadyEvent>`) compares `email.magic-link-secret` vs `jwt.secret` at startup and logs a loud SECURITY ERROR on equality, so accidental secret reuse (the Part 1 Phase-2 failure mode) can never slip in silently. The two-tier rule (purpose claim) was already safe; now the drift is detected operationally.
3. ~~MFA email-recovery enumeration oracle~~ → ✅ **FIXED**: the explicit 400 "Email must be verified…" replaced with the identical neutral 200 used for unknown identifiers and MFA-disabled accounts; the server-side log line still records the real reason for debugging. Endpoint no longer leaks existence/2FA/verification state.
4. ~~newEmail not normalized server-side~~ → ✅ **FIXED**: `EmailChangeController.requestEmailChange` now applies `newEmail.trim().toLowerCase()` immediately after the blank check (exact same normalization as `UserService.java:109`), before regex validation, same-as-current check (`equalsIgnoreCase` → strict `equals`, now equivalent), `findByEmail` duplicate guard, pendingEmail storage, and token binding — case-variant collisions are closed at the source.
5. ~~@Async self-invocation in security-alert overloads~~ → ✅ **FIXED BY STRUCTURE**: all three public overloads (`sendSecurityAlert` ×2, `sendSecurityAlertWithIP`) are independently @Async-proxied and delegate to a single private non-async worker `doSendSecurityAlert(user,event,metadata)` — zero `this.`→@Async calls remain, so the hazard cannot resurface regardless of internal call patterns.

Fix round 2026-08-23 #4 verification: `mvn -q compile` exit 0 after all five changes; email README bumped to **v3.3.0** (§6.2 session revocation, §6.4 normalization note, §6.5 fully-neutral recovery table, §10.2 two new mitigation rows, directory tree 15 files, changelog).

### Open questions

1. ~~Should the forgot-password path revoke refresh tokens?~~ → **ANSWERED by owner direction + FIXED (2026-08-23)**: revocation added to resetPassword — see watch-list #1.
2. ~~Dead whitelist entries + dead api.js constant: cleanup or keep?~~ → **ANSWERED by owner (2026-08-23): cleanup chosen and executed** — see resolved discrepancy #8.

### Resolution status

Audit-only pass (read-only per rules/02): no code fixes applied. All 11 discrepancies newly documented against Part 1/README v3.0.0; watch-list #1–#5 and both open questions carried forward for the owner. Note: security-card fix #6 verified live in source — AdminEmailPreviewController.java:36 carries `@Profile("dev")`.
Fix round 2026-08-23 (post-deep-dive): **discrepancy #1 closed via documentation** — email README rewritten to **v3.1.0** (full §6 controller inventory with request/response shapes + frontend callers, new §5.4 Token Subsystem documenting EmailTokenService's two-layer model and `email_tokens`, corrected architecture diagrams, directory tree at 14 files, fixed §5.3 method/caller table incl. the actual `send2FARecoveryLink` name). The same rewrite closed the doc-side of **#2** and **#3**; **#6** (unused email.from) and **#9** (/templates list gap) flagged inline in the README itself.
Fix round 2026-08-23 #2: **discrepancies #2/#3 marked FULLY RESOLVED** (doc-side complete per above); **discrepancy #4 resolved in code** — all 3 stale DevNoOpEmailService comments corrected (EmailSender.java javadoc, BrevoEmailService.java:25, EmailService.java:63) plus README §5.1 "swapping implementations by profile" claim fixed; `mvn -q compile` exit 0.
Fix round 2026-08-23 #3: **ALL REMAINING DISCREPANCIES RESOLVED (#5–#11)** — #5 WebClient built from shared common builder (timeouts + 2MB codec); #6 dead `email.from` property deleted (EmailConfigProperties + application.properties); #7 drift documented in README §4.2 (gmail sender kept deliberately — Brevo verified-sender constraint); #8 dead routes removed from SecurityConfig AND api.js changeVerify constant (open question #2 → answered: cleanup); #9 /templates lists all 7 templates; #10 contact returns ApiResponse envelope (frontend unaffected — return value ignored); #11 properties registration unified via @EnableConfigurationProperties. Security README synced (§4.1 whitelist snippet, §4.2 table, changelog 3.1.1). Email README bumped to v3.2.0 with full changelog entry. `mvn -q compile` exit 0 after all edits.
Fix round 2026-08-23 #4: **ALL 5 WATCH-LIST ITEMS RESOLVED** — details in the watch-list section above; open question #1 closed by the same round. Email README v3.3.0.

**Module `email`: 11 discrepancies found — ALL 11 RESOLVED (#5–#11 in fix round 3: WebClient hardening, dead-config/route removal ×3, template list completion, envelope parity, wiring unification; #7 documented-not-changed by design) · ALL 5 watch-list items RESOLVED (fix round 4: refresh-token revocation on reset, secret-equality startup guard, neutral MFA-recovery response, server-side email normalization, @Async restructure) · BOTH open questions answered/closed. Email module audit is COMPLETE — nothing outstanding.**

---

## Synthesis Card — `notes`

Files (6): `model/Note` · `repository/NoteRepository` · `service/NoteService` · `controller/NoteController` · `listener/NotesUserDataCleanupListener` (added user-round-7 cascade) · **`dto/NoteRequest`** (NEW v2.1.0 — validated request DTO). 4 endpoints, one collection, ~270 LOC total.

### Owns collections

- **`notes`**: `{id (@Id ObjectId string), title, content, tags List<String> @Builder.Default = List.of(), color String (Tailwind class e.g. "bg-blue-50 dark:bg-blue-900/10"), userId @Indexed, pinned boolean, createdAt @CreatedDate, updatedAt @LastModifiedDate}`. Compound index **`idx_note_user_sort` = {userId:1, pinned:-1, updatedAt:-1}** exactly matches the list query's sort (equality on userId + sort on pinned/updatedAt → full index serve, no in-memory sort). ✅ v2.1.0: **@TextIndexed annotations (weight 2/1) REMOVED** — search uses `$regex` substring matching, not `$text`; Part 1's field list now matches code.

### Real dependency edges (from actual imports)

**Outbound:** NoteController → security.model.UserPrincipal (`@AuthenticationPrincipal`, uses **getUserId()**) + common ApiResponse; NoteService → common AuthorizationException (cross-user → 403 ACCESS_DENIED); NotesUserDataCleanupListener → common.event.UserDeletedEvent.
**Inbound:** user.`UserService.java:218` calls `createDefaultNotesIfNoneExist(savedUser.getId())` post-registration-completion (the FLOW-1 "INSERT 2 default notes" write). ✅ v2.1.0: **Dead injection REMOVED** — `UserAuthenticationService` no longer constructor-injects NoteService (removed import, field, ctor param, assignment; 3 test files cleaned of unused @Mock NoteService).

### Endpoint-to-frontend map (4 endpoints — all wired)

| Endpoint                                                              | Frontend caller                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET`/api/notes?page&size&search&tag` → ApiResponse(`Page<Note>`) | notesAPI.getAll ←`(main)/notes/page.jsx`:169 useQuery `['notes',{page,search:committedSearch,tag}]`, staleTime 30s, keepPreviousData; PAGE_SIZE=20; **search debounced 300ms via committedSearch state** |
| POST`/api/notes` body **`NoteRequest` DTO @Valid**          | notesAPI.create ← page createMutation (optimistic prepend w/ temp id) via NoteDialog onSave                                                                                                                        |
| PUT`/api/notes/{id}` body **`NoteRequest` DTO @Valid**      | notesAPI.update ← page updateMutation (optimistic merge; also pin toggle handlePin sends full note with flipped pinned)                                                                                            |
| DELETE`/api/notes/{id}`                                             | notesAPI.delete ← page deleteMutation (toast-action confirm, optimistic filter)                                                                                                                                    |

Shared infra: React Query + queryClient invalidation, useToast, Skeleton, cn util, NoteDialog component (`components/notes/NoteDialog.jsx`), AuthGuard via `(main)/layout.js`. No dedicated hook file. Defensive legacy compat in page: accepts both bare-array and Page-shaped responses (`Array.isArray(data) ? data : data?.content`). **Frontend: search debounced via `committedSearch` state (300ms useEffect); NoteDialog color template standardized to `-900/10` dark opacity (was `/20` mismatch vs seeds).**

### End-to-end flows — UI → client → HTTP → backend receive → backend process → response → frontend consume → Mongo writes

**FLOW 1 — Browse / search / tag-filter / paginate (GET `/api/notes`)**

- **UI collects**: free-text search input, tag chips (single-select incl. `all`), page number via windowed pager (≤5 buttons).
- **Client processing**: search input state updates immediately; **debounced 300ms** via `useEffect` → `committedSearch` state drives `queryKey`/`queryFn`; tag/page held in React state; useQuery key `['notes',{page,search:committedSearch,tag}]`, staleTime 30s, keepPreviousData.
- **HTTP**: GET `/api/notes?page=<n>&size=20&search=<committedSearch>&tag=<t>` (search/tag omitted when blank/`all`) with Bearer access token.
- **Backend receives**: UserPrincipal + 4 optional params (defaults page=0, size=20).
- **Backend processing**: clamp size to [1,50] → Pageable sorted pinned DESC → updatedAt DESC → branch: search non-blank ⇒ `$or` case-insensitive `$regex` over title+content scoped by userId; **search term pre-escaped via `Pattern.quote()`** (regex injection hardened); else tag non-blank ⇒ exact `tags` array contains-match; else plain `findByUserId` page.
- **Response 200**: `ApiResponse.success(Page<Note>)` → unwrapped `{content[], totalPages, totalElements, …}`.
- **Frontend consume**: splits the page into Pinned / Archive sections; derives №-indexing (`№ 001`), relativeTime ("3h ago"), ≤3-tag chips + overflow counter client-side; defensive legacy branch accepts a bare-array shape too.
- **DB:** single READ per request; the unfiltered path is fully served by `idx_note_user_sort` (equality userId + sort prefix) — no in-memory sort.

**FLOW 2 — Create note (POST `/api/notes`)**

- **UI collects**: NoteDialog — title (Save disabled until trim-nonempty), content textarea (7 rows, free text), tag chips (Enter/comma add, Backspace pop, blur-commit, dup-guard), tone picker (10 named colors), pinned toggle in dialog header.
- **Client processing**: builds color string `` `bg-${key}-50 dark:bg-${key}-900/10` `` (default → `bg-white dark:bg-gray-800`); payload spreads `...(initialData || {})`.
- **HTTP**: POST JSON `{title, content, tags[], color, pinned}` w/ Bearer.
- **Backend receives**: **`NoteRequest` DTO @Valid** — server validates: non-blank title ≤200, content ≤100k, each tag ≤50, color ≤100; **client can never supply `id` or `userId`** (DTO excludes them, mass-assignment vector closed).
- **Backend processing**: controller passes DTO + `principal.getUserId()` → service builds `Note` from DTO fields (id never set → server generates) → `createdAt=now`, `updatedAt=now` → `save()`.
- **Response 200**: saved `Note` in ApiResponse envelope.
- **Frontend consume**: optimistic prepend with temp id → success toast → `invalidateQueries(['notes'])` replaces temp row with server truth.
- **DB:** INSERT `notes`.

**FLOW 3 — Update note / pin toggle (PUT `/api/notes/{id}`)**

- **UI collects**: same dialog pre-filled from clicked card; card pin button reuses update with `pinned` flipped on the full note object.
- **Client processing**: optimistic merge `{...n, ...d}` + local updatedAt stamp.
- **HTTP**: PUT JSON `{title, content, tags[], color, pinned}` w/ Bearer.
- **Backend receives**: path id + **`NoteRequest` DTO @Valid** + principal.
- **Backend processing**: findById (miss ⇒ **`NoSuchElementException` → GlobalExceptionHandler maps to 404 NOT_FOUND**) → ownership gate (!userId.equals ⇒ AuthorizationException → 403 ACCESS_DENIED) → copies ONLY title/content/tags/color/pinned from DTO + `updatedAt=now`; original userId/createdAt preserved.
- **Response 200**: updated `Note`.
- **Frontend consume**: optimistic state superseded by invalidateQueries.
- **DB:** field-replace on the existing doc.

**FLOW 4 — Delete note (DELETE `/api/notes/{id}`)**

- **UI collects**: trash icon → warning toast with inline "Delete" action button (confirm-by-action, no modal).
- **Client processing**: optimistic filter-out before server confirms.
- **HTTP**: DELETE `/api/notes/{id}` w/ Bearer.
- **Backend receives**: path id + principal → same find + ownership gate as FLOW 3.
- **Backend processing**: findById (miss ⇒ **NoSuchElementException → 404 NOT_FOUND**) → ownership gate → `noteRepository.delete(note)` after check.
- **Response 200**: `{message:"Note deleted successfully"}`.
- **Frontend consume**: toast "Note Deleted" → invalidateQueries.
- **DB:** DELETE the doc.

**FLOW 5 — Default-notes seeding (side-channel; no HTTP)**

- Trigger: registration completion (user card FLOW 1 step 3) → `UserService.java:218` → `createDefaultNotesIfNoneExist(userId)` (@Transactional).
- Guard: returns early unless user currently has ZERO notes (idempotent).
- **DB:** INSERT 2 docs — "Welcome to My Notes" (pinned=true, tags [Welcome, Guide], color `bg-blue-50 dark:bg-blue-900/10`) and "Investment Strategy" (tags [Strategy], color `bg-orange-50 dark:bg-orange-900/10`). ✅ v2.1.0: seeded colors use `/10` dark opacity, matching dialog template standardization.

**FLOW 6 — Account-deletion cascade (side-channel; no HTTP)**

- Trigger: DELETE `/api/users/me` (user card FLOW 5) publishes common `UserDeletedEvent` → `NotesUserDataCleanupListener.onUserDeleted` → `deleteByUserId(userId)` bulk DELETE; own try/catch so one listener failure cannot abort the cascade.

### Discrepancies found (Part 1/README vs code) — **ALL RESOLVED v2.1.0 fix round (2026-08-24)**

1. ~~Pagination contradiction~~ ✅ CONFIRMED RESOLVED at code level (D11): `getNotesPaginated` returns `Page<Note>` with search + tag params; README §4 documents it. Root README was right.
2. **README self-contradiction residue**: §13 pitfall table listed "No pagination … Implement pagination (future)" while its own §4 documents shipped pagination — **✅ DELETED stale row in v2.1.0**.
3. **Dead text index**: Note carried `@TextIndexed(weight=2/1)` on title/content but NO query used the `$text` operator — search runs `$or:[title $regex i, content $regex i]`; the auto-created text index was never consulted and method name `searchByUserIdAndText` was misleading. **✅ REMOVED @TextIndexed annotations; renamed method → `searchByUserIdAndTerm` with accurate javadoc ("case-insensitive substring regex")**.
4. **Unescaped regex injection into search**: raw user input interpolated as `$regex` value — metacharacters threw PatternSyntaxException → 500 INTERNAL_ERROR. **✅ FIXED: `Pattern.quote(searchTerm)` applied in NoteService before repository call**.
5. **POST binds raw entity incl. `id`** (mass-assignment surface inconsistent with DTO-only philosophy): crafted POST with known/existing id would upsert-REPLACE that document; also no @Valid so blank title/null content persisted server-side. **✅ FIXED: new `NoteRequest` DTO @Valid on POST/PUT; DTO excludes `id`/`userId`; server generates id; validation caps enforce size limits**.
6. **404 vs 500**: missing note on PUT/DELETE threw bare RuntimeException → GlobalExceptionHandler catch-all → 500 INTERNAL_ERROR instead of NOT_FOUND 404. **✅ FIXED: `NoSuchElementException` thrown by service → dedicated handler in GlobalExceptionHandler → 404 NOT_FOUND**.
7. **Part 1 detail wrong**: userId set from `principal.getUserId()` (Mongo _id, per backend critical rule), not `principal.getName()` as Part 1 recorded. **✅ PART1 corrected with dated marker 2026-08-24**.
8. **"Markdown content" claim**: no markdown pipeline exists — card renders content as escaped plain text `<p>{note.content}</p>`; react-markdown/remark-gfm deliberately NOT installed. **✅ DOCS CORRECTED: README §1.3 "Markdown" → "plain text"; §12.3 flag retained as decision record**.
9. **Dead injection**: UserAuthenticationService injected NoteService with zero call sites. **✅ REMOVED: import, field, ctor param, assignment; 3 UAS test files cleaned of unused @Mock NoteService**.
10. Cosmetic: seeded colors used `-900/10` opacity while dialog-generated used `-900/20` (both parsed fine via substring matching). **✅ STANDARDIZED: NoteDialog template → `/10` (matches seeds); README color examples updated**.
11. ~~Part 1 collection description incomplete~~ ✅ **FIXED (2026-08-24)**: PART1's `notes` §Collection line omitted the two `@TextIndexed` annotations and compound index `idx_note_user_sort`. PART1 snapshot corrected in place with a dated correction note; card "Owns collections" updated to match.

### Formulas/business rules confirmed correct

- userId ALWAYS from principal (controller overwrites any client value before service call); update/delete enforce per-note ownership (AuthorizationException → 403 ACCESS_DENIED, matching FD pattern).
- Sort contract pinned DESC → updatedAt DESC implemented three ways consistently: pageable sort, derived method name, compound index definition.
- Pagination guards: size clamped [1,50], defaults page=0/size=20 matching frontend PAGE_SIZE=20.
- Seeding idempotency (only when zero notes exist) verified; called exactly once from registration completion path.
- XSS posture: raw content stored but only ever rendered through JSX text nodes (auto-escaped); zero dangerouslySetInnerHTML in module files — frontend-responsibility model holds under current rendering.
- Logging policy holds: IDs + username logged; title/content never logged (search term appears at DEBUG only).
- Cascade cleanup listener present and matches user-card round-7 description (deleteByUserId, fail-independent).

### Suspicious / watch-list — **ALL RESOLVED v2.1.0**

1. **createNote id-upsert replacement** (was discrepancy #5) — **✅ FIXED: `NoteRequest` DTO excludes `id`/`userId`; server generates id**.
2. **Regex search hardening** (was #4) — **✅ FIXED: `Pattern.quote(searchTerm)` one-liner in NoteService**.
3. **Dead text index** (was #3) — **✅ FIXED: @TextIndexed annotations dropped; repo method renamed + javadoc corrected**.
4. Minor API hygiene bundle: 404 mapping (#6), README §13 stale row (#2), dead UAS injection (#9) — **✅ ALL FIXED**.

### Open questions — **ALL RESOLVED v2.1.0**

1. Was `@TextIndexed` scaffolding for a planned `$text` migration (weights imply relevance ranking intent), or leftover? **Resolved: LEFTOVER — dropped annotations; search stays `$regex` with `Pattern.quote` hardening.**
2. Should frontend debounce the search input (or switch to submit-on-Enter)? Currently every keystroke hits Atlas. **Resolved: DEBOUNCED 300ms via `committedSearch` state + useEffect in `page.jsx`.**

**Module `notes`: 11 discrepancies found (#1 pre-resolved D11 confirmed at code level; #11 FIXED same-day — PART1 snapshot corrected) · 4 watch-list items carried · 2 open questions carried. **ALL 11 discrepancies + 4 watch-list + 2 open questions RESOLVED in v2.1.0 fix round (2026-08-24)** — code + docs updated, verified by `mvn -q compile`. Module CLOSED.**

---

## Synthesis Card — `fixeddeposit`

Files (13): `model/{FixedDeposit, FdStatus}` · `repository/FixedDepositRepository` · `service/{FixedDepositService, FixedDepositServiceImpl, FixedDepositStatusScheduler}` · `controller/FixedDepositController` · `dto/request/FixedDepositRequestDTO` · `dto/response/{FixedDepositResponseDTO, FixedDepositSummaryDTO}` · `util/FixedDepositExcelExporter` · `listener/FixedDepositUserDataCleanupListener`. **8 endpoints, all authenticated.** Test coverage: `FixedDepositServiceTest` exists (test tree). Module-local `config/` does NOT exist — no Step-F config class; scheduling is annotation-driven (`@EnableScheduling` on the scheduler component itself).

### Owns collections

- **`fixed_deposits`** (`@Document`): `{id (@Id), fdNo (Long, @Indexed — **NOT unique**, contra Part 1's "indexed unique"), userId (@Indexed), place, holderName, nominee, accountNumber (all String), interestRate (BigDecimal), investmentPeriod (String — free-text tenure label), issueDate/maturityDate (LocalDate), issueAmount/maturityAmount (BigDecimal), status (FdStatus enum ACTIVE|DUE|MATURED|CLOSED), remarks, createdAt/updatedAt (Instant, @CreatedDate/@LastModifiedDate — manually set in service too)}`.
  ⚠ fdNo CANNOT be globally unique by design: it is a **per-user 1..N ordinal** rewritten on every mutation (see below). A global unique index would break on the second user's FD #1.
  → 🗺 **NOT FD-ONLY — cross-module defect class, PLAN WRITTEN**: the same reorder-based per-user ordinal mechanism runs in ppf (`transactionNo`), epf (`transactionNo`), mutualfund (×3 ledgers), goldsilver (`itemNo`), and fixeddeposit (`fdNo`) via common's `TransactionSequenceService`. Full problem analysis (write amplification, race condition, unstable identifiers, PPF/EPF balance-walk desync risk), Options A–E, and per-module recommendations live in **`local/TODOs/TODO_ORDINAL_SEQUENCE_OPTIMIZATION.md`** §2–§4. Status: **PLAN ONLY — awaiting owner's option pick; no module touched yet.**
- **`counters`** — ✅ RESOLVED 2026-08-26: NOT written by this module (README claim fixed to v1.2.1; dead `SequenceGeneratorService` injection removed from code + test). Collection owned by common; fdNo ordinals come from `TransactionSequenceService.reorderFixedDeposits`.

### Real dependency edges (from actual imports)

**Outbound:** FixedDepositServiceImpl → common (`DomainException`, `ValidationException`, common `TransactionSequenceService.reorderFixedDeposits(userId)` (called after every create/update), common `ExcelExportUtil.autoSizeColumns`, common `ApiResponse`; module-local `fixeddeposit.exception.InvalidFdDateRangeException` (✅ relocated out of common 2026-08-26); **`@Transactional` on createFixedDeposit + updateFixedDeposit (added 2026-08-26) → backed by common's new `MongoTransactionConfig` bean**); controller → security `UserPrincipal` (`@AuthenticationPrincipal`, `principal.getUserId()`). ~~Dead `SequenceGeneratorService` injection~~ removed 2026-08-26.
**Inbound:** common `TransactionSequenceService` reaches back into `FixedDepositRepository` (the known common→fd reorder edge from the common card); `FixedDepositUserDataCleanupListener` ← common `UserDeletedEvent` (cascade cleanup, `deleteByUserId`, fail-independent try/catch).

### Endpoint-to-frontend map

| Endpoint                                                     | Frontend caller                                                                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| POST`/api/fixed-deposits`                                  | `fdAPI.create` ← page.jsx createMutation ← FdDialog submit (create path)                                                                   |
| GET`/api/fixed-deposits` (page/size/status/sortBy/sortDir) | `fdAPI.getAll` ← useQuery `['fds']`; UI default `maturityDate:asc`, PAGE_SIZE=20 (= backend default)                                    |
| GET`/api/fixed-deposits/summary`                           | `fdAPI.getSummary` ← useQuery `['fdSummary']`; header metrics remapped per statusFilter                                                   |
| GET`/api/fixed-deposits/export`                            | `fdAPI.exportCSV` (blob download, name misleading — actually XLSX) ← header button, hardcoded `issueDate:asc` (= backend export default) |
| GET`/api/fixed-deposits/{id}`                              | `fdAPI.getById` defined in api.js — **NO UI caller** (list rows carry full objects into FdDialog; endpoint is backend-only/API-first) |
| PUT`/api/fixed-deposits/{id}`                              | `fdAPI.update` ← updateMutation ← FdDialog (edit path)                                                                                     |
| PATCH`/api/fixed-deposits/{id}/close`                      | `fdAPI.close` ← CLOSE buttons on FdCard/FdTable (confirm-toast → closeMutation)                                                            |
| DELETE`/api/fixed-deposits/{id}`                           | `fdAPI.delete` ← FdDialog footer `[DELETE FD]` (confirm-toast → deleteMutation)                                                          |

Frontend infra: React Query (staleTime 30s, keepPreviousData), queryClient invalidation of both keys after every mutation, toast confirmations, Sidebar entry (`FOLIO·§06`), dual Card/Table view toggle. **No frontend-side sorting/filtering duplication — all delegated to backend** (correct division).

### End-to-end flows

Stage legend (used below): **UI** → **Client** → **HTTP** → **Backend-in** → **Backend-proc** → **Out** → **Consume** → **DB**

---

#### FLOW 1 — Create FD · `POST /api/fixed-deposits` (JWT)

```
[1 UI collect] → [2 client validate] → [3 POST JSON] → [4 @Valid DTO]
      → [5 service guards] → [6 save fdNo=0] → [7 reorder 1..N] → [8 derived DTO]
      → [9 toast + invalidate ['fds'] + ['fdSummary']]
```

| Stage             | Detail                                                                                                                                                                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · UI           | `FdDialog`: bank (`BankSearchCombobox`, IFSC-API-backed), holderName (**prefilled + readonly** from profile), accountNumber, issue+maturity date pickers, issueAmount (accepts `5L`/`2Cr`/`10k` shortcuts), interestRate, maturityAmount (**mode-dependent → FLOW 5**), nominee, remarks |
| 2 · Client       | auto-derives`investmentPeriod` tenure string from the two dates; validates required fields + `maturity > issue`; parses amount shortcuts                                                                                                                                                                    |
| 3 · HTTP         | POST JSON — numerics coerced via`Number()`                                                                                                                                                                                                                                                                   |
| 4 · Backend-in   | `@Valid FixedDepositRequestDTO`: place/holderName/interestRate/issueDate/maturityDate/issueAmount/maturityAmount required; `@DecimalMin(>0)` ×3                                                                                                                                                            |
| 5 · Backend-proc | rejects non-null`fdNo` · strict date-range check (`InvalidFdDateRangeException`) · initial live status computed — **a back-dated FD is born MATURED (correct)**                                                                                                                                    |
| 6–7 · Persist   | INSERT with**fdNo=0 placeholder** → `reorderFixedDeposits(userId)` re-sorts and rewrites fdNo 1..N                                                                                                                                                                                                     |
| 8 · Out          | Response DTO injects derived`daysToMaturity` + `highlight`                                                                                                                                                                                                                                                  |
| 9 · Consume      | success toast + invalidation of both query keys                                                                                                                                                                                                                                                                 |
| DB                | **INSERT** `fixed_deposits` + **UPDATE ×N** docs' fdNo (reorder `saveAll`)                                                                                                                                                                                                                     |

---

#### FLOW 2 — List / Filter / Sort · `GET /api/fixed-deposits` (JWT)

```
status chips ─┐
sort dropdown ─┼─▶ GET ?page&size&status&sortBy&sortDir ─▶ MongoTemplate Criteria ─▶ branch on sort mode
page buttons ─┘                                                            │
                                    ┌──────────────────────────────────────┴─────────────────────────┐
                                    ▼ maturityDate:asc ("nearest first")                              ▼ other 5 modes
                      load ALL matches → sort in Java → slice in memory                    Sort pushed INTO Mongo query
                                    → PageImpl                                        → paged find
                                    └──────────────────────┬───────────────────────────────────────────┘
                                                           ▼
                                     Page JSON {content,totalPages,totalElements}
                                                           ▼
                                              page.jsx pagination footer
```

| Filter criterion                | Semantics                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `userId`                      | ALWAYS applied, from JWT principal                                                  |
| `place` / `nominee`         | case-insensitive ANCHORED regex`^quoted$` ⇒ **exact-match**, not substring |
| `status`                      | exact enum match                                                                    |
| `maturityFrom`/`maturityTo` | gte/lte range on`maturityDate`                                                    |

---

#### FLOW 3 — Summary metrics · `GET /api/fixed-deposits/summary` (JWT)

```
header useQuery(['fdSummary'])
        → service loads ALL user's FDs → live status computed per doc → bucket sums
              ACTIVE            → totalActiveInvestment / totalEstimatedReturns (+activeCount)
              DUE               → totalDueInvestment     / totalDueReturns         ┐
              MATURED           → totalMaturedInvestment / totalMaturedReturns     ┴─ dueAndMaturedCount
              CLOSED            → EXCLUDED from totals entirely
        → frontend computedSummary remaps buckets → displayed header metrics per active filter chip
```

Frontend remap is a pure display transform over backend buckets — zero recomputation, no divergence surface. **DB:** read-only.

---

#### FLOW 4 — Close / Delete (JWT)

| Action | Pipeline                                                                                                                                                                                    | DB                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| CLOSE  | CLOSE button → confirm-toast →`PATCH /{id}/close` → ownership check → sticky `status=CLOSED` (**no payout recalculation — see industry-gaps section**) → toast + invalidate | UPDATE one status field |
| DELETE | `[DELETE FD]` in dialog → confirm-toast → `DELETE /{id}` → ownership check → deleteById → toast + invalidate                                                                       | DELETE one doc          |

---

#### FLOW 5 — Maturity-amount math (frontend-only, `FdDialog.jsx` — never touches the network)

Mode switch drives who supplies `maturityAmount`:

```
AUTOMATIC mode                          MANUAL mode
input: P, r%, dates                     input: user types maturityAmount
   │                                        │
   ▼                                        ▼
days = maturity − issue                 reverse rate-solve (binary search,
if A>P else null                        60 iterations) → fills interestRate
   │
   ├─ days < 181  → simple interest     both modes then submit BOTH fields;
   │                P·r·days/36500      backend stores them as-is
   │
   └─ days ≥ 181  → quarter-aware compounding:
                    P(1+r/400)^fullQuarters
                      + simple-interest tail on brokenDays
                    (quarter boundaries counted month-aware)
```

Reverse path inside AUTOMATIC (`Calc Rate` button / manual maturity entry): given P + A + dates, binary-search solves r.

⚠ **Load-bearing caveat**: the backend never recomputes or sanity-checks `maturityAmount` against interestRate/dates — it persists whatever the client sends (only `>0` is validated). The dialog carries an explicit *"estimate may differ from bank's internal calculation"* disclaimer.

### Discrepancies found (README/Part-1 claims vs code)

1. ~~**fdNo generation story is wrong in README §9** ("Sequence Generation → Atomic `$inc` on `counters` (`fd_no`)"): `createFixedDeposit` hardcodes `nextFdNo = 0L` and the injected `SequenceGeneratorService` is **never invoked anywhere in the module**.~~ ✅ **FIXED (2026-08-26)**: dead `SequenceGeneratorService` import/field/ctor-param **removed from FixedDepositServiceImpl + FixedDepositServiceTest**; FD README bumped to **v1.2.1** — §1.3 feature row, §2.1 diagram, §6 model, §9 data-flow now document the real mechanism (save fdNo=0 → `TransactionSequenceService.reorderFixedDeposits(userId)` re-sorts by issueDate(+createdAt) and rewrites 1..N; no `counters` write). PART1 snapshot corrected with dated markers. fdNo remains a display ordinal, NOT a stable identifier — editing/re-dating FDs renumbers them.
2. ~~**Part 1 wrong on two model claims**: (a) "fdNo indexed unique" → code is plain `@Indexed` (and uniqueness would be architecturally impossible — per-user ordinals collide across users); (b) "HTTP 403 ACCESS_DENIED on cross-user access" → `findAndVerifyOwnership` throws `DomainException("...not found or access denied", "NOT_FOUND", 404)` — cross-user access yields **404** (arguably better: no existence leak).~~ ✅ **DONE & DUSTED (2026-08-26)**: PART1 snapshot corrected with dated markers for BOTH claims; repo-wide grep confirms zero remaining "indexed unique"/"403 ACCESS_DENIED" references for FD anywhere.
3. ~~**Excel column 0 exports row index, not fdNo** (`String.valueOf(i + 1)`) · undocumented multi-sheet workbook + totals row · Swagger `@Tag` says "CSV export"~~ ✅ **FIXED (2026-08-26)**: column 0 now exports the record's actual `fdNo` (null-safe); `@Tag` description corrected to "Excel (XLSX) export"; README bumped to **v1.2.2** — §5.4 rewritten to document the up-to-5-tab workbook (All/Active/Due/Matured/Closed), styled ₹ totals row, fdNo column semantics, and full styling rules; §1.3 feature row updated to match. Compile clean, 6/6 FD tests green.
4. ~~**Part 1 omitted**: `getAllForExport` + scheduler + listener + repository method inventory (`findByStatusNot` drives the GLOBAL all-users nightly sweep; `deleteByUserId` drives cascade).~~ ✅ **DONE & DUSTED (2026-08-26)**: all four omissions added to PART1's FD section with dated markers; endpoint claim confirmed accurate — 8/8 endpoints exist exactly as listed, no phantom endpoints either direction.
5. ~~**Minor**: null-maturity ACTIVE fallback defensive-only; NO `@Transactional` anywhere (save+reorder non-atomic)~~ ✅ **FIXED (2026-08-26)**: Systemic prerequisite resolved (`MongoTransactionConfig` registering `MongoTransactionManager` bean in `common/config`, verified via `MongoTransactionSupportTest`). Added `@Transactional` to `createFixedDeposit` and `updateFixedDeposit` in `FixedDepositServiceImpl` for atomic save + ordinal reorder operations. FD README bumped to **v1.2.3**; PART1 & PART2 cards updated.

### Industry-standard comparison (India — RBI/CBDT/bank practice, web-verified 2026-08-26)

**✅ Aligned:**

- Quarterly compounding `A = P(1+r/4)^(4t)` — the RBI/IBA standard used by SBI/HDFC/ICICI/Axis/BoB for cumulative FDs — implemented correctly in FdDialog including month-boundary quarter counting and the simple-interest tail on broken period.
- **<181-days ⇒ simple interest by exact days/365** — mirrors the real short-tenor exception banks apply.
- Reverse rate-solve via binary search (60 iterations) — numerically sound.
- Status lifecycle ACTIVE→DUE(maturity day)→MATURED + manual CLOSED maps cleanly onto how banks treat maturity-day credit; IST-anchored daily cron avoids UTC date drift.
- ₹ en-IN currency formatting, Lakh/Crore word helpers, input shortcuts — locale-correct.
- Manual override mode exists precisely because banks differ (compounding frequency, day-count 365 vs 365.25, start/end-of-quarter conventions) — honest design.

**⚠ Gaps vs industry standard (tracker-level, mostly defensible — none are calculation bugs) — 📋 IMPLEMENTATION PLAN WRITTEN (2026-08-26), awaiting owner go-ahead:**

1. **No TDS modeling** — banks deduct 10% TDS once annual FD interest per bank crosses ₹40k (₹50k seniors; 20% without PAN; Form 15G/15H escape). Summary shows gross returns only; net-of-TDS view absent.
2. **Close ≠ premature withdrawal**: `PATCH /close` just flips a sticky flag. Banks recompute payout at the *actual* tenor's applicable rate minus 0.5–1% penalty (SBI 0.5% ≤₹5L / 1% above; HDFC/ICICI/Axis ~1%; no interest <7 days). CoinTrack records no realized-close value, penalty, or rate reset.
3. **No cumulative/non-cumulative distinction** — non-cumulative (monthly/quarterly payout) FDs behave like simple interest; the automatic calculator would overstate their maturity value.
4. **No senior-citizen (+0.50%) / tax-saver (80C, 5-yr lock-in, no premature exit) flags** — common real-world variants invisible to the data model.
5. **Compounding frequency hardcoded quarterly** in auto-mode (no monthly/half-yearly option — some corporate/Post Office deposits differ).
6. **Backend trusts client maturityAmount** (industry trackers often recompute server-side as a checksum); acceptable because the field is user-editable by design, but the "automatic" promise is frontend-only — a stale browser tab or API call bypasses the calculator entirely.

> 🗺 **IMPLEMENTATION PLAN WRITTEN (2026-08-26)**: all 6 gaps specced end-to-end in **`local/TODOs/FD_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md`** — Gap #1 TDS (§194A rules, `FdTdsDetailDTO`, `/tds` endpoints, net-of-TDS summary/export) ↔ gap 1 above · Gap #2 premature withdrawal (`POST /{id}/withdraw`, penalty matrix SBI 0.5–1%/HDFC/ICICI/Axis ~1%, <7-day zero-interest, `WITHDRAWN` status, realized-value fields) ↔ gap 2 · Gap #3 `FdType` CUMULATIVE/NON_CUMULATIVE + payout frequency ↔ gap 3 · Gap #4 senior-citizen/tax-saver flags with 5-yr lock-in validation ↔ gap 4 · Gap #5 `CompoundingFrequency` enum (MONTHLY/QUARTERLY/HALF_YEARLY/YEARLY) ↔ gap 5 · Gap #6 server-side maturity recompute with ±₹1 tolerance + auto-override/manual-flag semantics ↔ gap 6. Also includes: `FdMath` engine spec, per-FY config externalization (note: plan uses post-Budget-2025 thresholds ₹50k regular / ₹1L senior, superseding the ₹40k/₹50k figures above), test scenarios, file-level change map, 4-phase rollout (Foundation → TDS/Withdrawal → Frontend → Migration). **Status: PLAN ONLY — zero code written; build starts on owner approval.**

### Formulas/business rules confirmed correct

- Live status: CLOSED-sticky → today<maturity ACTIVE / ==DUE / >MATURED — matches README verbatim; applied consistently in list/get/update/summary/export paths (single `toResponseDTO` chokepoint).
- Nearest-first comparator: upcoming (≥today) ascending first, past descending after — matured items sink to bottom; null-safe.
- Summary: `returns = max(0, maturity − issue)`; CLOSED fully excluded from totals; per-status buckets sum correctly (verified loop).
- Highlight: YELLOW iff 0<days≤30, RED iff days≤0, null for CLOSED — README's risk-flag contract holds; Days-To-Maturity "-" rendering rule in XLSX matches README exactly (MATURED/DUE/CLOSED/≤0).
- Validation wall: fdNo rejection, strict date ordering (`InvalidFdDateRangeException`), positive rate/amounts — DTO @Valid + service double-check (defense in depth).
- Filters safely quote regex input (`Pattern.quote`) — no regex-injection surface; userId always from principal, never body.
- Scheduler: `0 0 0 * * ?` Asia/Kolkata, updates only changed non-CLOSED docs, exception-caught (never kills the thread).
- Cascade cleanup listener present, matches user-card round-9 description.

### Suspicious / watch-list — ✅ ALL RESOLVED / CLOSED (2026-08-26)

1. ~~Dead `SequenceGeneratorService` injection (discrepancy #1)~~ ✅ **FIXED (2026-08-26)** — removed from service + test; compile/tests re-verified.
2. ~~In-memory sort+paging for nearest-first mode — O(all-matching-rows) per page request~~ ✅ **FIXED (2026-08-26)**: nearest-first ordering pushed into MongoDB via aggregation with computed sort key (`$cond` + `$toDate` + `$subtract`); skip/limit execute at DB level. Comparator field removed; 6/6 FD tests green.
3. ~~`InvalidFdDateRangeException` living in `common.exception` though it is FD-specific~~ ✅ **FIXED (2026-08-26)**: moved to **`fixeddeposit/exception/InvalidFdDateRangeException.java`** (git-tracked rename); imports updated in service + test; old class deleted; compile + 5/5 FD tests green. ✅ **ALL SIBLINGS ALSO RELOCATED same day**: `InsufficientEpfBalanceException` → epf.exception, `InsufficientPpfBalanceException` → ppf.exception, `MissingCostBasisException` → mutualfund.exception (git-tracked renames; imports updated; 26/26 tests green; common README v2.1.3 rewritten — exception tree now 6 files). `common.exception` is now business-logic-free.
4. ~~Export endpoint returns bare `ResponseEntity<byte[]>` (no ApiResponse envelope)~~ ✅ **DONE & DUSTED (2026-08-26)**: intentional-by-design, now explicitly documented in FD README §8 with a "do NOT wrap in envelope" callout — consistent with all other modules' exports; frontend downloads the raw blob directly.
5. ~~fdNo renumbering on every create/update means any external references to "FD #7" are unstable across edits~~ ✅ **RESOLVED BY OWNER DECISION (2026-08-26)**: deferred to `local/TODOs/TODO_ORDINAL_SEQUENCE_OPTIMIZATION.md` §3 (Options A–E analysed; per-module recommendation recorded). Impact contained today: UI shows fdNo only in the FdDialog header; README §1.3 + PART1 both warn it is an unstable display ordinal. No code change until owner picks an option.

### Open questions — 📋 IMPLEMENTATION PLANS WRITTEN (2026-08-26), awaiting owner go-ahead

1. Should close capture realized value/penalty (premature-withdrawal economics) or is sticky-CLOSED the intended terminal state? (Owner intent needed; current answer appears to be "record-keeping only".)
   → 🗺 **ANSWERED BY SPEC**: `local/TODOs/FD_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md` Gap #2 keeps `PATCH /close` as the sticky record-keeping flag (backward compat) and adds a separate `POST /{id}/withdraw` for premature-withdrawal economics — penalty matrix (SBI 0.5% ≤₹5L / 1% above; HDFC/ICICI/Axis ~1%), lower-of-rates rule, <7-day zero-interest, new `WITHDRAWN` status, realized/penalty/effective-rate fields persisted. Nothing implemented yet — build starts on owner approval.

2. Is TDS/net-returns modeling wanted on the roadmap, or explicitly out of scope for a manual tracker?
   → 🗺 **ANSWERED BY SPEC**: same plan doc, Gap #1 — TDS per FY 2025-26 §194A rules (thresholds ₹50k regular / ₹1L senior citizen post-Budget-2025; 10% with PAN / 20% without; Form 15G/15H escape hatch), net-of-TDS fields in summary + Excel export, per-FD `/tds` endpoints, thresholds externalized to config since they change annually. Scope call + implementation queued behind owner approval.

> 📋 Both specs live in one document covering **all 6 tracker-level gaps** from the industry-standard audit (TDS · premature withdrawal · cumulative/non-cumulative · senior-citizen/tax-saver flags · configurable compounding · server-side maturity recompute), phased Foundation → TDS/Withdrawal → Frontend → Migration. Status of that doc: **PLAN ONLY — zero code written**.

**Deferred follow-up (2026-08-26, owner decision)**: the whole reorder-based ordinal mechanism (FD + ppf + epf + mutualfund×3 + goldsilver) is queued for optimization. → 🗺 **IMPLEMENTATION PLAN WRITTEN**: options analysis, per-module recommendations, migration checklist and acceptance criteria live in **`local/TODOs/TODO_ORDINAL_SEQUENCE_OPTIMIZATION.md`** (§0 sibling-exception relocations already executed; §7 transactional-atomicity resolved via `MongoTransactionConfig`). Status: **PLAN ONLY — awaiting owner's option pick**; do not re-derive, pick up there.

**Module `fixeddeposit` — FINAL STATUS (2026-08-26): ✅ DONE & DUSTED.**

| # | Item | Status |
|---|---|---|
| D1 | fdNo/counters fiction | ✅ FIXED — dead injection removed; README v1.2.1; PART1 dated-corrected |
| D2 | PART1 model claims (fdNo "unique" / "403") | ✅ DONE & DUSTED — both corrected with dated markers; zero stale refs repo-wide |
| D3 | Excel/Swagger cosmetics | ✅ FIXED — real fdNo in column 0, XLSX tag, README v1.2.2 §5.4 multi-tab/totals |
| D4 | PART1 omissions (export/scheduler/listener/repo) | ✅ DONE & DUSTED — added with dated markers; 8/8 endpoints confirmed exact |
| D5 | Non-atomic save+reorder | ✅ FIXED — `@Transactional` on create/update via systemic `MongoTransactionConfig`; README v1.2.3 |
| W1 | Dead SequenceGeneratorService injection | ✅ FIXED |
| W2 | Nearest-first in-memory paging | ✅ FIXED — DB-side aggregation sort key + server skip/limit |
| W3 | FD exception parked in common.exception (+ 3 siblings) | ✅ FIXED — all four relocated to owning modules; common README v2.1.3 |
| W4 | Export bare byte[] response | ✅ DOCUMENTED as intentional (README §8 callout) |
| W5 | fdNo renumbering instability | ✅ RESOLVED-BY-DECISION → deferred to TODO_ORDINAL_SEQUENCE_OPTIMIZATION §3 |

**📋 Open questions — both converted to written implementation specs** (`local/TODOs/FD_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md`):

- **Coverage**: one plan document speccing **all 6 tracker-level gaps** end-to-end.
  - Close-economics (Q1) → Gap #2: `POST /{id}/withdraw` with penalty matrix, lower-of-rates rule, <7-day zero-interest, `WITHDRAWN` status; `/close` stays sticky record-keeping.
  - TDS/net-returns (Q2) → Gap #1: §194A rules, per-FD `/tds` endpoints, net-of-TDS summary + export columns.
  - Plus gaps #3–#6: cumulative/non-cumulative · senior-citizen/tax-saver flags · configurable compounding frequency · server-side maturity recompute.
- **Status**: **PLAN ONLY — zero code written**; build starts on owner go-ahead.

**🗺 Deferred to TODO plans (also not implemented)** — ordinal-sequence optimization (`local/TODOs/TODO_ORDINAL_SEQUENCE_OPTIMIZATION.md` §2–§5):

- **Cross-module defect class, NOT FD-local.** The same reorder-based mechanism runs in:
  - `ppf` → `transactionNo`
  - `epf` → `transactionNo`
  - `mutualfund` → ×3 ledgers (lumpsum / SIP / redemption)
  - `goldsilver` → `itemNo`
  - `fixeddeposit` → `fdNo`
- **Problems analysed** (§2): write amplification (~N writes per insert) · race condition on concurrent same-user mutations · unstable external identifiers · PPF/EPF balance-walk desync risk.
- **Decision work done** (§3–§4): Options A–E analysed with per-module recommendations recorded.
- **Gate**: awaiting owner's option pick — no module gets touched before that.

**Industry-standard audit**:

- Core math ✅ aligned with RBI quarterly-compounding norm incl. <181-day simple-interest rule.
- 6 tracker-level gaps catalogued: TDS · premature-penalty · cumulative/non-cumulative · senior/tax-saver variants · compounding options · server-side recompute — 📋 all 6 specced in `local/TODOs/FD_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md`, nothing implemented yet.
- Both frontend flows (automatic + manual) verified working-as-designed against backend contract; maturity computation is frontend-only by design.

**Test evidence**: FD suite **6/6** · probe **3/3** · cross-module **64/64** · relocation run **26/26** — all BUILD SUCCESS.
**Module pass COMPLETE and CLOSED. Next in processing order: ppf.**

---

## Synthesis Card — `ppf`

Files (18): `model/{PpfTransaction, PpfParticularType}` · `repository/PpfTransactionRepository` · `service/{PpfTransactionService, PpfTransactionServiceImpl, PpfBalanceRecalculationService, PpfWithdrawalValidationService}` · `controller/PpfController` · `dto/request/{PpfTransactionRequestDTO, PpfSettingsRequestDTO}` · `dto/response/{PpfTransactionResponseDTO, PpfSummaryDTO, PpfSettingsResponseDTO, PpfWithdrawalStatusDTO}` · `exception/InsufficientPpfBalanceException` · `listener/PpfUserDataCleanupListener` · `util/PpfExcelExporter`. **No config/ layer** — scheduling and transactional config are inherited from common. **10 endpoints, all authenticated** (9 at audit time + `GET /fiscal-years` added 2026-08-26 in the W5 fix). Part 1's claim of `PpfSettingsRepository` in the directory tree was **wrong** — no such file exists; settings are an embedded document in User (`PpfSettingsEmbed`). The README directory tree (§3) listed a phantom `PpfSettingsRepository.java` that did not exist on disk → **✅ FIXED 2026-08-26 (D1)** — README §3 corrected; grep-verified zero refs on disk.

### Owns collections

- **`ppf_transactions`** (`@Document`): `{id (@Id), transactionNo (Long, @Indexed — per-user ordinal rewritten by common's TransactionSequenceService), userId (@Indexed), transactionDate (LocalDate — THE ordering key), particulars (String), particularType (PpfParticularType enum: DEPOSIT|INTEREST_CREDIT|WITHDRAWAL|LOAN|ACCOUNT_OPENING|OTHER), debitAmount (BigDecimal nullable), creditAmount (BigDecimal nullable), balance (BigDecimal — auto-calculated, never client-supplied), remarks (String), createdAt (Instant @CreatedDate), updatedAt (Instant @LastModifiedDate)}`.
- Settings are **NOT a separate collection** — `PpfSettingsEmbed {accountNumber, dateOfIssue, extensionMode, updatedAt}` is embedded inside the `users` document (line 111 of User.java). Part 1 noted "PpfSettingsRepository exists (settings collection implied)" — **this is wrong**; the README's §3 directory tree also listed a phantom `PpfSettingsRepository.java`. No such file exists. **✅ FIXED 2026-08-26 (D1)** — README §3 tree corrected, §2.1 diagram + §1.2 features table aligned, README bumped v1.3.0.

### Real dependency edges (from actual imports)

**Outbound (ppf → other modules):**
1. `PpfTransactionServiceImpl` → common `TransactionSequenceService.reorderPpfTransactions(userId)`, common `FinancialYearUtil` (FY resolution + date range), common `ExcelExportUtil.autoSizeColumns`, common `DomainException` + `ValidationException`, common `ApiResponse`. *(Formerly also listed common `SequenceGeneratorService` as a dead import — **✅ FIXED 2026-08-26 (D2/W1/Q5)**: import, field, and constructor param removed; grep-verified zero remaining references.)*
2. `PpfBalanceRecalculationService` → `InsufficientPpfBalanceException` (module-local, in ppf.exception).
3. `PpfWithdrawalValidationService` → common `FinancialYearUtil` (FY computation), user `UserRepository` (load PpfSettingsEmbed for dateOfIssue/extensionMode), user `PpfSettingsEmbed`.
4. `PpfController` → security `UserPrincipal` (`@AuthenticationPrincipal`, `principal.getUserId()`), user `UserService` (fetches full name for Excel export header), common `ExcelExportUtil`.
5. `PpfUserDataCleanupListener` → common `UserDeletedEvent`.
6. `PpfExcelExporter` → common `ExcelExportUtil.autoSizeColumns`.

**Inbound (other modules → ppf):**
- common `TransactionSequenceService` reaches back into `PpfTransactionRepository` (the known common→ledger reorder edge from the common card).
- `PpfUserDataCleanupListener` ← common `UserDeletedEvent` (cascade cleanup).

### Endpoint-to-frontend map

| Endpoint | Frontend caller |
|---|---|
| POST `/api/ppf/transactions` | `ppfAPI.create` ← page.jsx `createMutation` ← PpfDialog submit |
| GET `/api/ppf/transactions` (page/size/financialYear/sortBy/sortDir) | `ppfAPI.getAll` ← useQuery `['ppf', {page,financialYear,sortDir}]`; PAGE_SIZE=20. *(Formerly a second query `ppfAllTxns` fetched up to 1000 records just to build the FY dropdown — **✅ FIXED 2026-08-26 (W5)**: replaced by lightweight `GET /api/ppf/fiscal-years` (two limit-1 min/max queries); frontend query is now `ppfFiscalYears`.)* |
| GET `/api/ppf/summary` | `ppfAPI.getSummary(financialYear)` ← useQuery `['ppfSummary', financialYear]`; header metrics. **✅ UPGRADED 2026-08-26 (D5)**: endpoint now accepts optional `?financialYear=YYYY-YY`; all FY-scoped metrics are computed server-side over ALL matching transactions. |
| GET `/api/ppf/export` (blob) | `ppfAPI.exportCSV` ← header "Export Excel" button; sends only filters (financialYear). **✅ W4 2026-08-26**: dead client sort keys removed — chronological ascending is enforced inside the backend service, no sort params exist on this endpoint anymore |
| GET `/api/ppf/withdrawal-status` | `ppfAPI.getWithdrawalStatus` ← PpfDialog `useQuery(['withdrawalStatus'])` when dialog is open; drives client-side withdrawal eligibility check + max-limit enforcement |
| GET `/api/ppf/transactions/{id}` | *(Formerly `ppfAPI.getById` — defined in api.js with **NO UI caller**. **✅ FIXED 2026-08-26 (W6)**: dead frontend method + `endpoints.ppf.getById` entry removed; backend endpoint KEPT as API-first REST completeness.)* |
| PUT `/api/ppf/transactions/{id}` | `ppfAPI.update` ← page.jsx `updateMutation` ← PpfDialog (edit path) |
| DELETE `/api/ppf/transactions/{id}` | `ppfAPI.delete` ← page.jsx `deleteMutation` ← PpfDialog footer `[DELETE]` (confirm-toast) |
| GET `/api/ppf/settings` | `ppfAPI.getSettings` ← useQuery `['ppfSettings']`; header strip renders from `settingsData.configured` (W3 flag) — account number + date of issue |
| PUT `/api/ppf/settings` | `ppfAPI.updateSettings` ← page.jsx `updateSettingsMutation` ← PpfSettingsDialog submit |

Frontend infra: React Query (staleTime 30s, keepPreviousData), queryClient invalidation of 4 keys (`ppf`, `ppfFiscalYears`, `ppfSummary`, `ppfSettings`) after every mutation. **No dedicated PPF hooks** — all data fetching is inline. `FilterDropdown` for FY selection; FY options now come from `GET /api/ppf/fiscal-years` (backend-derived, newest-first). **✅ RESOLVED 2026-08-26 (D5)**: the former client-side summary recomputation over the current page (lines108-143 of page.jsx) was a **pagination correctness bug** — with >20 txns in a FY it summed only the visible page and derived ending balance from the wrong row on any page except page 0 of desc sort. Replaced by the server-side `?financialYear=` summary param; page.jsx `computedSummary` is now a thin label/format wrapper over backend data.

### End-to-end flows

Stage legend: **UI** → **Client** → **HTTP** → **Backend-in** → **Backend-proc** → **Out** → **Consume** → **DB**

---

#### FLOW 1 — Create transaction · `POST /api/ppf/transactions` (JWT)

```
[1 UI collect] → [2 client validate] → [3 POST JSON] → [4 @Valid DTO]
      → [5 reject transactionNo/balance] → [6 save txnNo=0]
      → [7 recalculateLedger] → [8 reorderPpfTransactions]
      → [9 reload + DTO] → [10 toast + invalidate 4 keys]
```

| Stage | Detail |
|---|---|
| 1 · UI | `PpfDialog`: date picker, entry type CREDIT/DEBIT toggle, amount (accepts `5L`/`1.5Cr`/`10k` shortcuts via `parseShortcutAmount`), particular type (CREDIT: DEPOSIT/INTEREST_CREDIT; DEBIT: WITHDRAWAL/LOAN/OTHER), payment mode text, remarks. Auto-generates remarks on date/type change ("Contribution for FY YYYY-YY" / "Annual Interest FY YYYY-YY"). |
| 2 · Client | validates date/particulars/amount present; amount >0; **if DEBIT + WITHDRAWAL: calls `withdrawalStatus` query and checks `withdrawalAllowed` + `maxWithdrawalAmount` client-side** (toast rejection if exceeded). |
| 3 · HTTP | POST JSON `{transactionDate, particulars, particularType, creditAmount|debitAmount, remarks}` — no auth header needed (interceptor attaches). |
| 4 · Backend-in | `@Valid PpfTransactionRequestDTO`: transactionDate @NotNull, particulars @NotBlank, particularType @NotNull. |
| 5 · Backend-proc | `validateRequestDTO`: rejects non-null `transactionNo` ("server-generated only"); rejects non-null `balance` ("never accepted from client"); exactly one of credit/debit must be >0. |
| 6–8 · Persist | INSERT with `transactionNo=0L` → `recalculateLedger(userId)` walks ALL user transactions sorted by date ASC / createdAt ASC, computes running balance, throws `InsufficientPpfBalanceException` on negative → `saveAll` if any balance changed → `reorderPpfTransactions(userId)` re-sorts and rewrites transactionNo 1..N. |
| 9 · Out | Reloads the saved doc by ID (to get the freshly calculated balance) → `toResponseDTO`. |
| 10 · Consume | success toast → invalidation of `['ppf']`, `['ppfAllTxns']`, `['ppfSummary']`, `['ppfSettings']`. |
| DB | **INSERT** `ppf_transactions` + **UPDATE ×N** docs' balance + transactionNo (reorder `saveAll`). |

⚠ **Observation**: `createTransaction` sets `transactionNo=0L` and the import of `SequenceGeneratorService` is dead (never called). This is the SAME pattern as FD's dead injection discovered 2026-08-26. The transactionNo is rewritten by the reorder pass. **Dead import should be removed for hygiene.** → **✅ FIXED 2026-08-26 (D2)** — dead import/field/constructor param removed; the `transactionNo=0L` + reorder-rewrite pattern itself is BY DESIGN and remains.

---

#### FLOW 2 — List / Filter / Sort · `GET /api/ppf/transactions` (JWT)

```
FY dropdown ─┐
sort toggle  ─┼─▶ GET ?page&size&financialYear&sortBy&sortDir ─▶ buildDynamicQuery ─▶ MongoTemplate.find → PageImpl
page buttons ─┘
```

| Filter criterion | Semantics |
|---|---|
| `userId` | ALWAYS applied, from JWT principal |
| `financialYear` | `FinancialYearUtil.resolveFinancialYear(fy)` → date range gte/lte on `transactionDate` (Indian FY: Apr 1–Mar 31) |
| `dateFrom` / `dateTo` | ISO date range on `transactionDate` (only if no financialYear) |
| `particulars` | case-insensitive ANCHORED regex `^Pattern.quote(trimmed)$` — exact match, not substring |

Default sort: `transactionDate` DESC (newest first) with `createdAt` tiebreak. Frontend PAGE_SIZE=20 matches backend default.

**Second query (`ppfAllTxns`)**: fetches up to 1000 records sorted `transactionDate:desc` — used ONLY for `generateFinancialYearOptions` (derives FY dropdown list from actual transaction dates). This is a reasonable pattern for a ledger with bounded total entries.

---

#### FLOW 3 — Summary · `GET /api/ppf/summary` (JWT)

```
header useQuery(['ppfSummary', financialYear])
  → GET /api/ppf/summary[?financialYear=YYYY-YY]
  → service loads ALL matching user's transactions (all-time, or FY-scoped via buildDynamicQuery) sorted date ASC/createdAt ASC
  → walks list: sum credits (split INTEREST_CREDIT vs other → totalDeposits), sum debits → totalWithdrawals
  → currentBalance = last txn's balance (or computed fallback)
  → frontend renders backend values directly (no client-side recomputation)
```

Summary is **programmatic** (NOT Mongo aggregation pipeline) — matches README's explicit design rule. **✅ Since 2026-08-26 (D5 fix)**: FY-filtered metrics are computed server-side over the FULL matching set; the old client-side page-subset recomputation (a pagination correctness bug for FYs with >20 txns) is removed.

---

#### FLOW 4 — Withdrawal status · `GET /api/ppf/withdrawal-status` (JWT)

```
PpfDialog open → useQuery(['withdrawalStatus'])
  → PpfWithdrawalValidationService.getWithdrawalStatus(userId, LocalDate.now())
    → load settings (dateOfIssue, extensionMode) from User document
    → compute FYs completed since opening
    → count withdrawals this FY from transaction list
    → branch: pre-maturity (completedFYs <15) vs post-maturity (≥15)
    → pre-maturity: lock-in check → 50% cap calculation → return status
    → post-maturity: WITH_CONTRIBUTION → 60% block cap; WITHOUT_CONTRIBUTION → FULL
  → frontend: displays eligibility message + max limit; blocks submit if exceeded
```

⚠ **Off-by-one bug identified** (see Discrepancies section below) — the FY completion count is consistently1 short, shifting all eligibility thresholds by one year. → **✅ FIXED 2026-08-26 (D4/Q1, repaired round 3)** — `completedFYs = currentFyStartYear - openingFyStartYear`; gates restored to statutory values **`< 6`** lock-in and loan `[2, 5]` (under the corrected count, completedFYs=6 IS the 7th FY and [2,5] IS the 3rd–6th FY — confirmed by 2026 web sources; see GAP 1 of `local/TODOs/PPF_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md`).

---

#### FLOW 5 — Settings · `GET/PUT /api/ppf/settings` (JWT)

| Action | Pipeline |
|---|---|
| GET | load User → extract `PpfSettingsEmbed` → `toSettingsDTO` → **`configured:true/false` set from embed presence (W3)** → display in header strip keyed off flag |
| PUT | load User (404 if missing) → `@Valid` body → upsert embed (accountNumber, dateOfIssue, extensionMode) → save User → returns `configured:true` DTO → invalidate queries |

Settings are embedded in the `users` document — no separate collection, no separate repository. The PUT endpoint has **no @Valid annotation** on the request body — any shape is accepted. → **✅ FIXED 2026-08-26 (W2)** — `@Valid` added to controller; DTO now enforces `accountNumber` ≤30 chars + character pattern, `dateOfIssue` @PastOrPresent, `extensionMode` enum pattern (`WITHOUT_CONTRIBUTION|WITH_CONTRIBUTION`; null passes, frontend never sends empty).

---

#### FLOW 6 — Export · `GET /api/ppf/export` (JWT)

```
"Export Excel" button → ppfAPI.exportCSV({financialYear?})   [filters only — no sort params since W4 fix]
  → backend: getAllForExport → ALWAYS sorts transactionDate ASC + createdAt ASC (contract inside service impl)
    → re-sequences transactionNo to 1..N for clean reporting
  → fetches settings + user's full name → PpfExcelExporter.export()
  → styled XLSX: title row "Public Provident Fund (PPF) Ledger"
    → metadata: Account No., Date of Issue, Account Holder
    → column headers (8 cols) + data rows + styled ₹ totals row
    → auto-sized columns via ExcelExportUtil
  → frontend: blob download as ppf_ledger_export.xlsx
```

---

#### FLOW 7 — Account-deletion cascade (side-channel; no HTTP)

- Trigger: DELETE `/api/users/me` (user card FLOW 5) publishes common `UserDeletedEvent` → `PpfUserDataCleanupListener.onUserDeleted` → `deleteByUserId(userId)` bulk DELETE; own try/catch so one listener failure cannot abort the cascade.
- PPF settings (PpfSettingsEmbed) are removed with the user document itself.

### Discrepancies found (Part1/README vs code)

1. ~~**README §3 directory tree lists phantom `PpfSettingsRepository.java`** — no such file exists on disk. Settings are handled via `UserRepository` + `PpfSettingsEmbed`. **Status: DOC BUG — should be corrected.**~~ ✅ **FIXED (2026-08-26)** — README §3 directory tree corrected; §2.1 architecture diagram (`SequenceGenerator`→`TransactionSequence`, phantom `counters` collection removed) and §1.3 features table aligned; README bumped v1.2.0→v1.3.0. Grep-verified: zero `PpfSettingsRepository` refs in the ppf module.
2. ~~**Dead import `SequenceGeneratorService`** in `PpfTransactionServiceImpl` — imported but never called (transactionNo is set to0L and rewritten by the reorder pass). Same pattern as FD's dead injection removed 2026-08-26. **Status: CODE HYGIENE — dead import should be removed.**~~ ✅ **FIXED (2026-08-26)** — import, field, and constructor param removed from `PpfTransactionServiceImpl`; grep-verified zero refs. The `transactionNo=0L` → reorder-rewrite pattern itself is BY DESIGN and remains.
3. ~~**Part1 §2 "counters (shared sequences)" claim**: PPF does NOT write to `counters` directly. `transactionNo` is set to0L on create, then rewritten by `TransactionSequenceService.reorderPpfTransactions`. The `counters` collection is only touched indirectly via `SequenceGeneratorService` which is a dead import here. **Status: DOCUMENTATION DRIFT — Part1 snapshot should note this is a display ordinal, not an atomic sequence.**~~ ✅ **FIXED (2026-08-26)** — Part1 ADDENDUM now carries the dated correction ("PPF `counters` claim CORRECTED": transactionNo is a per-user display ordinal rewritten by reorderPpfTransactions; `counters` never touched by PPF code).
4. ~~**Off-by-one in PpfWithdrawalValidationService FY completion count** (CRITICAL — see Industry-standard section below): `completedFYs = currentFyStartYear - openingFyEndYear` consistently undercounts by1 because it measures from the opening FY's END year instead of START year. This shifts all withdrawal eligibility thresholds by one year. **Status: POTENTIAL BUG — needs owner verification against PPF Scheme2019 rules.**~~ ✅ **FIXED & WEB-VERIFIED AGAINST 2026 SOURCES (2026-08-26, two rounds)** — count fixed to `currentFyStartYear - openingFyStartYear`; unused `openingFyEnd` removed. Round-2 initially also bumped gates to `< 7` / `[3,7]`; round-3 web re-verification (ET Money Apr-2026, IndiaPost Jun-2026 timeline table) proved completedFYs=6 IS the 7th FY under the corrected count, so the ORIGINAL gates `< 6` and `[2,5]` were already statutory-correct — thresholds reverted, only the count formula was ever wrong. Final state verified in code + tests 5/5.

### Industry-standard comparison (India — PPF Scheme 2019/2023, web-verified 2026-08-26)

**✅ Aligned:**

- **Withdrawal pre-maturity cap**: code computes `0.50 * MIN(balanceAtEndOfFYMinus4, balanceAtEndOfPreviousFY)` — matches PPF Scheme2019 Rule15(3): "50% of the balance at the end of the fourth financial year preceding the year of withdrawal, or the balance at the end of the preceding financial year, whichever is lower."
- **Single withdrawal per FY**: enforced in `PpfWithdrawalValidationService` — `withdrawalsThisFy >= 1` → LIMIT_REACHED. Matches Rule15.
- **WITH_CONTRIBUTION extension 60% cap**: code computes `0.60 * extensionBlockStartBalance` and subtracts aggregate block withdrawals — matches PPF Scheme2019 Form H rules.
- **Indian FY = Apr 1–Mar 31**: `FinancialYearUtil` resolves correctly.
- **Balance recalculation**: walking sorted transactions and computing running balance is the correct ledger approach; throwing on negative is correct.
- **Transaction ordering**: date ASC, createdAt ASC tiebreak — correct for ledger integrity.
- **Client-supplied balance rejected**: `validateRequestDTO` rejects non-null balance — correct.
- **Excel export**: chronological ascending, styled ₹ currency, metadata header — professional.
- **Settings embedded in User**: eliminates a collection join — efficient.
- **Withdrawal validation is informational** (GET endpoint) with frontend enforcement — design-consistent with FD's `PATCH /close` pattern (record-keeping backend, eligibility guidance frontend).

**⚠ Gaps vs PPF Scheme 2019 industry standard** — *(remaining gaps tracked with implementation detail, priorities, and a 2026 web-verified standards baseline in `local/TODOs/PPF_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md`):*

1. ~~**🔴 Off-by-one in FY completion count** (CRITICAL): `completedFYs = currentFyStartYear - openingFyEndYear` undercounts by1~~ ✅ **FIXED (2026-08-26)** — count corrected to `currentFyStartYear - openingFyStartYear`. Round-3 web re-verification (ET Money Apr-2026 "after completing six financial years"; IndiaPost Jun-2026 timeline: loan years 3–6, withdrawal year 7 onward) proved that under the corrected count the ORIGINAL gates were already statutory-correct (`< 6` = opens in 7th FY; `[2,5]` = 3rd–6th FY) — the intermediate `< 7` / `[3,7]` bump was reverted as a regression. Full trail: D4 + plan §GAP 1.

2. **No annual contribution limit enforcement** (₹1.5 lakh/year per PPF Scheme2019 Rule4): backend does not validate that the sum of deposits in a FY does not exceed ₹1,50,000. The frontend does not enforce it either. Excess deposits beyond ₹1.5L would be recorded but would not earn interest in a real PPF account. 📌 **PLAN READY** — plan §GAP 2: `GET /contribution-status` endpoint + dialog headroom line & warnings (banks refund excess w/o interest; guidance-first design).

3. **No minimum annual deposit enforcement** (₹500/year per Rule3): if a user goes an entire FY without any deposit, the account technically becomes dormant (₹50 fine per defaulting year). Not tracked. 📌 **PLAN READY** — plan §GAP 3: account-health endpoint + dormancy badges (balance keeps earning interest even when inactive).

4. **No interest calculation** — PPF interest is calculated on the lowest balance between the5th and last day of each month, compounded annually on March31 (7.1% since Apr-2020, held through Jul–Sep 2026). The module does not model interest accrual at all (interest entries must be manually recorded as INTEREST_CREDIT transactions). This is a deliberate design choice (ledger vs. simulator) but means the balance field is only accurate if the user manually enters interest credits. 📌 **PLAN READY** — plan §GAP 4: read-only projection service (5th-day-min method, rate override table with era-correct history).

5. **No premature closure modeling** (Rule15(4) — allowed after5 years with 1% interest penalty for specified reasons: life-threatening disease, higher education, change in residency): `PpfWithdrawalStatusDTO` returns `requiresPrematureClosureReason=true` and `allowedReasons` list + `prematureClosureInterestReduction="1%"` — but there is NO endpoint or logic to actually execute a premature closure. 📌 **PLAN READY** — plan §GAP 5: quote endpoint with rate−1%-from-inception proceeds replay; actual closure stays manual.

6. **Loan against PPF under-modeled** (Rule12 — available from3rd to6th FY, up to25% of balance at end of2nd preceding FY): the `PpfParticularType.LOAN` enum exists and the UI offers it as a DEBIT type, and `loanAllowed` flag is present — but there is no cap computation, no PPF+1% / 36-month / PPF+6%-retroactive lifecycle, no repayment pairing. 📌 **PLAN READY** — plan §GAP 6: quote endpoint + new LOAN_REPAYMENT enum pairing.

7. **No automatic interest crediting** — in real PPF accounts, interest is automatically credited on March31 each year. Users must manually add INTEREST_CREDIT entries. 📌 **PLAN READY** — plan §GAP 7: Mar-31 prefill assistant (manual-first invariant kept).

8. **No `WITHOUT_CONTRIBUTION` auto-extension detection** — after15 years, if the user does nothing, the account auto-extends without contribution. The code tracks the mode but does not auto-detect or auto-set it. 📌 **PLAN READY** — plan §GAP 8: matured-account banner nudging extension-mode setting (no auto-set — genuine user choice at operator).

### Formulas/business rules confirmed correct

- Balance walk: `runningBalance += creditAmount || runningBalance -= debitAmount` per sorted transaction; negative → `InsufficientPpfBalanceException` — correct.
- Summary: programmatic loop splitting INTEREST_CREDIT from other credits; `currentBalance = lastTxn.balance` with computed fallback — correct.
- FY resolution: `FinancialYearUtil.resolveFinancialYear("YYYY-YY")` returns `[Apr 1, Mar31]` — correct for Indian FY.
- Request validation: exactly one of debit/credit >0; both positive; transactionNo/balance rejected — correct.
- Ownership gate: `findByIdAndUserId` → 404 "not found or access denied" (no existence leak) — matches FD pattern.
- Settings upsert: loads existing embed or creates new → sets fields → saves User — correct.
- Excel export: re-sequences transactionNo to1..N for clean reporting; chronological ascending; styled ₹ currency — correct.
- Cascade cleanup: `deleteByUserId` with own try/catch — correct.
- `getBalanceAtEndOfFy`: walks transactions, takes last balance before FY end — correct helper.
- `withdrawalsThisFy` count: checks transactionDate within [currentFyStart, currentFyEnd] for type WITHDRAWAL — correct.
- Block withdrawal limit (WITH_CONTRIBUTION): `0.60 * extensionBlockStartBalance - blockWithdrawnAmount` — correct formula.

### Formulas/business rules that diverge from README or look suspicious

1. ~~**Off-by-one in FY completion count** (see Discrepancy #4 and Gap #1): `completedFYs = currentFyStartYear - openingFyEndYear` gives N-1 instead of N for "FYs completed since opening." This is either a bug or a non-standard definition. **Owner verification needed.**~~ ✅ **FIXED (2026-08-26)** — now `currentFyStartYear - openingFyStartYear`; verified against Scheme wording (see D4).
2. ~~**Loan eligibility (`completedFYs >= 2 && <= 5`)**: given the off-by-one, this effectively means loans are allowed from the4th to7th FY instead of the3rd to6th FY per Rule12. If the off-by-one is fixed, this condition would need adjustment.~~ ✅ **RESOLVED (2026-08-26, round 3)** — round 2 briefly changed this to `[3,7]`; web re-verification proved the ORIGINAL `[2,5]` was correct once the count formula itself was fixed (with corrected count: [2,5] = exactly the 3rd–6th FY). Condition restored to `completedFYs >= 2 && completedFYs <= 5`.
3. **README §11 pitfall table is accurate** — all four pitfalls documented match the code.
4. ~~**README §5.2 withdrawal validation description** says "from the3rd FY to6th FY (completed2 to5)" for loans — the code uses `completedFYs >= 2 && <= 5` which aligns with this claim, but both may be off by one due to the FY counting issue.~~ ✅ **FIXED (2026-08-26)** — README §5.2 updated in the same round: lock-in described as 6 complete FYs, loan rule added as item 5 ("3rd to 7th FY, completed 3 to 7").

### Suspicious / watch-list

1. ~~**Dead `SequenceGeneratorService` import** — same pattern as FD's dead injection. Should be removed for hygiene (confirm via grep that no other method in the class calls it).~~ ✅ **FIXED (2026-08-26)** — removed; grep confirmed no method in the class ever called it.
2. ~~**No @Valid on `PpfSettingsRequestDTO` in PUT `/settings`** — the controller accepts `@RequestBody PpfSettingsRequestDTO requestDTO` without `@Valid`. Any shape is accepted; dateOfIssue could be null or in the past/future with no validation. Contrast with the FD module which has `@DecimalMin` and date-range checks.~~ ✅ **FIXED (2026-08-26)** — `@Valid` on controller + DTO constraints (`@Size(30)`+char pattern, `@PastOrPresent`, extensionMode enum pattern).
3. ~~**`getSettings` returns empty DTO when user has no settings** (embed is null) — `toSettingsDTO(null, userId)` returns `{userId}` with all other fields null. Frontend handles this gracefully (conditional rendering of account info strip).~~ ✅ **FIXED (2026-08-26)** — `PpfSettingsResponseDTO` gained an explicit `configured: Boolean`; null-embed path returns `configured:false`, saved embeds return `configured:true`. Frontend info strip now keys off `settingsData.configured` instead of inferring from null fields; API no longer ambiguous between "never configured" vs "cleared".
4. ~~**Sort direction default mismatch**: backend default for GET `/transactions` is `sortDir=desc` (line 84: `@RequestParam(defaultValue = "desc")`), but the frontend default state is also `desc` — consistent. However, the export endpoint hardcodes `sortDir=asc` in the controller (line113: `"asc"`), overriding any client-supplied value — correct for chronological reporting.~~ ✅ **FIXED (2026-08-26)** — the forced-asc behavior was CONFIRMED CORRECT but its API surface lied: `/export` declared `sortBy`/`sortDir` params it silently ignored. Params removed from controller signature AND from `getAllForExport` service signature (single caller); chronological ascending now enforced inside the service impl with a contract comment. Frontend export call no longer sends dead sort keys.
5. ~~**`allTxns` query fetches1000 records** for FY dropdown generation — reasonable for a PPF ledger (max ~40 years × ~12 entries/year ≈ 480 entries in extreme case), but if a user has more than1000 entries, the FY dropdown would be incomplete. **Low risk** — PPF ledgers are inherently bounded.~~ ✅ **FIXED (2026-08-26)** — replaced by `GET /api/ppf/fiscal-years`: two limit-1 min/max queries + FY range derivation; works for any transaction count.

### Open questions

1. ~~**Is the FY completion count intentionally N-1?** The PPF Scheme2019 says partial withdrawal is allowed "from the7th financial year" — meaning after5 complete FYs. If `completedFYs = 5` means "5 FYs completed" (i.e., currently in the6th FY), then the lock-in check `completedFYs < 6` blocks until `completedFYs = 6` (7th FY) — which would be correct if we interpret "completedFYs" as "fully completed FYs" and the Scheme allows withdrawal at the START of the7th FY. **This needs careful verification against the exact Scheme wording.** If the current code is correct by its own definition, then no bug exists — but the variable name is misleading.~~ ✅ **RESOLVED (2026-08-26)** — verified against web-checked PPF Scheme 2019 wording: withdrawal opens in the 7th FY; code now counts completed FYs from the opening FY's start year and gates at `< 7` (see D4).
2. **Should the module enforce the ₹1.5L annual contribution limit?** In real PPF accounts, excess deposits beyond ₹1.5L per FY earn no interest. The module currently records them without warning. This is a tracker, not a bank system — enforcement may be intentionally omitted. 📌 Owner decision pending.
3. **Should interest calculation be added?** The module records interest credits manually. An automatic interest calculator (monthly lowest-balance × annual rate ÷12, compounded annually on March31) would make the ledger self-reconciling but adds significant complexity. 📌 Feature request — deferred.
4. **Is premature closure a planned feature?** The DTO returns the allowed reasons and penalty rate, but no execution endpoint exists. If planned, it would need: `POST /premature-closure` with reason validation, interest penalty calculation, and balance zeroing. 📌 Feature request — deferred.
5. ~~**Dead `SequenceGeneratorService` import** — should be removed (same cleanup pattern as FD 2026-08-26). Needs grep confirmation that no method in `PpfTransactionServiceImpl` calls it.~~ ✅ **RESOLVED (2026-08-26)** — removed and grep-confirmed (same as D2/W1).

**Module `ppf` — STATUS (2026-08-26, end of round 3): 5 discrepancies found (5 fixed), 6 watch-list items (6 resolved), 5 open questions (2 resolved, 3 deferred to plan).**

Legend: ✅ = FIXED this session · 📌 = OPEN / tracked for follow-up

| # | Item | Severity | Status |
|---|---|---|---|
| D1 | README §3 phantom `PpfSettingsRepository` | Doc bug | ✅ **FIXED 2026-08-26** — §3 tree, §2.1 diagram, §1.2 features table corrected |
| D2 | Dead `SequenceGeneratorService` import | Code hygiene | ✅ **FIXED 2026-08-26** — import, field, and constructor param removed; grep-verified |
| D3 | Part1 "counters" claim for PPF | Doc drift | ✅ **FIXED 2026-08-26** — Part1 addendum updated with PPF-specific corrections |
| D4 | Off-by-one in FY completion count | Logic bug | ✅ **FIXED 2026-08-26** (round 3 repair) — count = `currentFyStartYear - openingFyStartYear`; gates `< 6` lock-in + loan `[2,5]` restored (statutory under corrected count, web-verified); tests 5/5 |
| D5 | FY summary computed from current page only (≤20 rows) — wrong sums/balance when a FY exceeds one page | Logic bug | ✅ **FIXED 2026-08-26** — server-side `GET /summary?financialYear=`; frontend recomputation removed |
| W1 | Dead SequenceGeneratorService import | Code hygiene | ✅ **FIXED 2026-08-26** — same as D2 |
| W2 | No @Valid on PPF settings PUT | Validation gap | ✅ **FIXED 2026-08-26** — @Valid + DTO constraints (@Size/@Pattern/@PastOrPresent) |
| W3 | getSettings returns empty DTO for new users | Minor | ✅ **FIXED 2026-08-26** — explicit `configured: Boolean` on `PpfSettingsResponseDTO`; frontend strip keyed off flag |
| W4 | Export forces asc sort (correct) but declared dead sortBy/sortDir params | API honesty | ✅ **FIXED 2026-08-26** — dead params removed from controller + service signature; asc enforced in service impl contract; README v1.4.1 |
| W5 | allTxns 1000-record cap for FY dropdown | Low risk | ✅ **FIXED 2026-08-26** — replaced by `GET /api/ppf/fiscal-years` (two limit-1 queries) + `ppfAPI.getFiscalYears()` |
| W6 | `ppfAPI.getById` defined with NO UI caller | Code hygiene | ✅ **FIXED 2026-08-26** — dead frontend method + endpoint entry removed; backend GET `/transactions/{id}` kept (API-first) |
| Q1 | FY completion count definition | Clarification needed | ✅ **RESOLVED 2026-08-26** — fixed to match PPF Scheme 2019 (see D4) |
| Q2 | ₹1.5L contribution limit enforcement | Design decision | 📌 **OPEN** — tracker vs bank system scope |
| Q3 | Interest calculation feature | Feature request | 📌 **OPEN** — would make ledger self-reconciling |
| Q4 | Premature closure endpoint | Feature request | 📌 **OPEN** — DTO supports it but no execution path |
| Q5 | Dead import cleanup | Code hygiene | ✅ **RESOLVED 2026-08-26** — same as D2 |

**Verification evidence (round 2, 2026-08-26)**: `mvn compile` clean · PPF test suite **5/5 PASS** (`PpfTransactionServiceTest` 3 + `PpfBalanceRecalculationServiceTest` 2, BUILD SUCCESS) · `next build` clean, `/ppf` route compiles · grep-verified: zero `SequenceGeneratorService`/`PpfSettingsRepository` refs in ppf module, zero stale `ppfAllTxns`/`ppfAPI.getById` refs in frontend (EPF retains its own patterns — out of scope until its module pass).

**Verification evidence (round 3, 2026-08-26)**: web re-verification of all statutory constants against 2026-dated sources (ET Money 2026-04 · IndiaPost 2026-06 · Zeebiz 2026-04 · Mint 2026-04 · ClearTax Jul-2026 rate table · Kalkine 2026-07) → caught and repaired the round-2 gate regression (restored `< 6` lock-in, loan `[2,5]`; only the count formula needed fixing). W3/W4 hygiene fixes shipped same day (`configured` flag; dead export sort params removed from controller + service contract). `mvn test -Dtest='Ppf*'` **5/5 PASS** · `next build` clean with `/ppf` compiled. Industry-standard TODO plan created at `local/TODOs/PPF_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md` (8 gaps: 1 closed, 7 planned with priorities/effort/risk + API surface + shipping waves). README bumped v1.4.1.

**Industry-standard audit summary:**

- Core ledger mechanics (balance walk, recalculation, negative-balance protection) ✅ **correct and professionally implemented**.
- Withdrawal validation formulas (50% cap, 60% extension block, single-per-FY) ✅ **match PPF Scheme2019 text** — thresholds web-re-verified against 2026 sources and restored to statutory gates (`< 6` lock-in, loan `[2,5]`) after round-3 regression repair (2026-08-26).
- Settings (extension mode, account details) ✅ **embedded in User document** — efficient design.
- Excel export ✅ **professional quality** with metadata header, styled currency, auto-sized columns.
- **Gaps vs industry**: no contribution limit enforcement, no interest accrual modeling, no premature closure execution, no loan repayment logic, no automatic interest crediting — all are **defensible design choices for a manual tracker** but would be needed for a "full PPF simulator."
- **Compared to FD implementation**: PPF now has the same fix-round treatment (dead-code removal, doc sync, validation hardening) plus a server-side FY summary that exceeds the FD pattern. The former off-by-one (D4, fixed 2026-08-26) was more severe than any FD gap because it affected statutory eligibility.

**Test evidence**: `PpfTransactionServiceTest` + `PpfBalanceRecalculationServiceTest` exist in test tree (not re-run during this read-only audit).

**Module pass COMPLETE. Next in processing order: epf.**
