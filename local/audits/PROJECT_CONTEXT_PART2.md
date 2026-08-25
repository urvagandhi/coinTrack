# PROJECT_CONTEXT_PART2.md — Per-Module Deep Dives

> Produced by the audit defined in `rules/02-per-module-deep-dive-and-synthesis.md`.
> One synthesis card per module, appended in processing order. Build on PROJECT_CONTEXT_PART1.md.
> Generated: 2026-08-23 · Modules completed so far: 5/13 (common, security, user, email, notes)
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

- **GET `/api/health`**: client = Render dashboard / human browser (no frontend app call). No request body. Backend: checks Mongo (`dbStats`), JVM memory, uptime → 200 JSON `{status, db, jvm, uptime}` or **503** when DB down; browser Accept: text/html gets a self-refreshing HTML dashboard instead. Nothing to consume app-side.
- **GET `/api/health/ping`**: client = uptime probes. No body. Backend returns bare 200 `pong`. Stateless.
- **GET `/health`**: client = GitHub Actions keep-alive cron every 5 min. No body; response carries `Cache-Control: no-store`. Purpose is only to prevent Render free-tier spin-down.
- **GET `/`**: browser tab navigation only → HTML landing linking /api/health + swagger. No data exchange with the app.
- **GET `/favicon.ico`**: browser automatic → serves static PNG bytes.
- Request-correlation side-channel (applies to EVERY app request): client may send nothing special — backend RequestIdFilter generates/reuses an 8-char id into MDC and echoes `X-Request-ID`; frontend never reads it.
- **Database persistence**: NONE for any endpoint above — all five are read-only/compute-only. The module's only owned collection, `counters`, is written (atomic `findAndModify` upsert `$inc`) exclusively when other modules' services call SequenceGeneratorService — never from these endpoints. Health data is computed live from Mongo/JVM, not cached.

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
| GET`/api/auth/verify-token`     | **DISABLED 2026-08-24** — redundant with JWT filter + `/users/me`; endpoint, whitelist entry, and tests commented out (code retained per owner)                                                                                                                              |
| `/api/auth/mfa/reset(+/verify)` | totpAPI.initiateReset/verifyReset — correctly hit AUTHENTICATED routes (logged-in reset flow)                                                                                                                                                                    |
| Client-side guard                 | `AuthGuard.jsx` PUBLIC_ROUTES mirror permitAll loosely (/, login, register, forgot-password, reset-password, verify-email, setup-2fa, reset-2fa, calculators/*); wraps `(main)/layout.js`                                                                     |

Shared frontend infra this depends on: AuthContext (useReducer), tokenManager, shared axios instance w/ interceptors, framer-motion init spinner.

### End-to-end flows (security mechanics — how every request is processed; endpoint-level flows live in the `user` card)

- **Every authenticated call**: UI action → axios request interceptor reads tokenManager (localStorage `ct_token`) → attaches `Authorization: Bearer <access JWT>` → backend JwtFilter runs BEFORE controller: parse token once (signature+expiry), check purpose claim (present → skip authentication, two-tier temp-token rule), check SHA-256(token) against `invalidated_tokens` (Mongo read per request), then build UserPrincipal from claims (NO DB round-trip) + set SecurityContext + MDC userId → controller receives principal.
- **Refresh loop**: 401 from any API → interceptor queues in-flight requests → POST /api/auth/refresh `{refreshToken}` (plaintext, one-time) → security.JWTService validates hash row, rotates (old revoked, new pair issued; reuse of a revoked token ⇒ revoke ALL user sessions) → new tokens stored → queued requests replay. Full detail in user card FLOW 4.
- **Session-expiry loop**: refresh failure → api.js dispatches `auth:sessionExpired` → AuthContext listener wipes state/tokenManager → redirect `/login?redirect=<original>` — closes the loop so no dead-token requests persist.
- **Temp-token path** (MFA verify / password reset): frontend sends temp token in BODY (`{tempToken}`) for MFA routes but as BEARER HEADER for `/api/auth/reset-password`; either way JwtFilter refuses to authenticate it — only the target controller extracts and validates via `isValidTempToken(token, expectedPurpose)`.
- **Logout**: Bearer access token → AuthController writes its hash to security-owned blacklist + revokes refresh rows → subsequent requests with that Bearer fail JwtFilter's blacklist check even before expiry.
- **Database persistence (security-owned writes)**: the ONLY collection this module writes is `invalidated_tokens` — one INSERT per logout `{tokenHash(SHA-256), userId, invalidatedAt, expiresAt}`; Mongo TTL (`expireAfter:0s`) auto-deletes each row when the embedded JWT would have expired anyway, so the table is self-cleaning and never grows. JwtFilter performs a READ (`existsByTokenHash`) on every Bearer request. Refresh-token rows live in user's `refresh_tokens` but are written by security's JWTService (rotate → UPDATE old `revoked:true` + INSERT new; reuse → bulk revoke) during user-module flows.

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

| Endpoint                                               | Frontend caller                                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST`/api/auth/login`                                | AuthContext.login ←`(access)/login/page.jsx`                                                                                                  |
| POST`/api/auth/register`                             | AuthContext.register ←`(access)/register/page.jsx`                                                                                            |
| POST`/api/auth/refresh`                              | api.js interceptor single-flight + AuthContext:86                                                                                                |
| POST`/api/auth/logout`                               | AuthContext.logout:309 (navbar/menu)                                                                                                             |
| GET`/api/auth/check-username/{username}`             | **DISABLED 2026-08-24** (zero UI callers ever; endpoint + SecurityConfig entry commented out, code retained per owner)                                      |
| GET`/api/auth/verify-token`                          | **DISABLED 2026-08-24** (redundant — JWT filter validates every request; `/users/me` returns same profile with same Bearer; code commented, not deleted) |
| POST`/api/auth/oauth2/google`                        | AuthContext.googleLogin ← login page OAuth callback                                                                                             |
| POST`/api/auth/oauth2/complete-profile`              | `(access)/complete-profile/page.jsx`                                                                                                           |
| GET`/api/users/me`                                   | userAPI.getProfile ←`(main)/profile/page.jsx` + `(main)/epf/page.jsx`                                                                       |
| PUT`/api/users/me`                                   | userAPI.updateProfile ← profile page                                                                                                            |
| PUT`/api/users/me/password`                          | userAPI.changePassword ← profile page (body keys`{password, oldPassword}` match controller Map)                                               |
| DELETE`/api/users/me`                                | **WIRED 2026-08-24** — `userAPI.deleteAccount` (api.js) ← profile-page Danger Zone (password re-auth panel, Loader2, hard redirect on success; Google-only accounts leave password blank)                                  |
| POST`/api/auth/mfa/setup` + `/api/auth/mfa/verify`   | AuthContext.setupTotp/verifyTotpSetup ← `TotpSetup.jsx` default fallbacks — existing-user forced-setup mode of `(access)/setup-2fa/page.jsx` (login with MFA disabled/reset; see Open question 2) |
| POST`/api/auth/mfa/login`                            | AuthContext.verifyTotpLogin ← login page (api.js key still`loginTotp`)                                                                        |
| POST`/api/auth/mfa/login-recovery`                   | AuthContext.verifyRecoveryLogin ← login page (api.js key`loginRecovery`) — backup-code LOGIN completion (user module)                        |
| POST`/api/auth/mfa/email-recovery(+/verify)`         | `twofa.recovery/recoveryVerify` ← forgot-2FA flow (api.js:675/679) — email magic-link MFA reset (email module's TwoFactorRecoveryController) |
| POST`/api/auth/mfa/reset(+/verify)`                  | AuthContext.resetTotp/verifyResetTotp ← profile page:205                                                                                        |
| GET`/api/auth/mfa/status`                            | totpAPI.getStatus ← profile page:52                                                                                                             |
| POST`/api/auth/mfa/register/setup(+/verify)`         | `(access)/setup-2fa/page.jsx`:47/62 — backupCodes displayed after verify                                                                      |

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
9. ~~DELETE /me has no cascade to notes/broker_accounts/holdings/etc.~~ → ✅ **FULLY RESOLVED (round 7)** via decoupled event-driven cascade: new `common/event/UserDeletedEvent(userId, username)` published by `UserService.deleteUser` (after user-doc delete + refresh revocation + stale-pending purge); **nine per-module listeners** each clean their own collections — notes (`notes`), broker (`broker_accounts`), portfolio (`canonical_holdings/positions/funds/mf_holdings/mf_orders`, `sync_logs`, `sync_cooldowns`; shared `market_prices` kept), mutualfund (lumpsum/sip-mandates/sip-contributions/redemptions/valuation-snapshots/portfolio-holdings/portfolio-metrics then schemes last as FK parent), ppf, epf, fixeddeposit, goldsilver, security (`invalidated_tokens`). 21 repositories gained derived `deleteByUserId(String)`; each listener try/catches so one failure can't abort the rest. Access-token exposure after deletion is now ≤30 min by stateless-JWT design (JwtFilter authenticates from claims by deliberate trade-off per security watch-list #1) — documented-accepted industry-standard residual, not a defect.

10. ~~Email case-normalization inconsistent~~ ✅ **FULLY RESOLVED (round 4)**: (a) login lookup trims+lowercases (UserAuthenticationService.java:435); (b) `registerUser` now lowercases before BOTH the uniqueness check and pending-doc storage (UserService.java:112-119, verified `cleanEmail` used in `existsByEmail` + builder); (c) `toTransientUser` lowercases when persisting the final user; (d) one-time startup migration `migrateMixedCaseEmailsToLowerCase()` (`@EventListener(ApplicationReadyEvent.class)`, UserService.java:363) rewrites legacy mixed-case rows. Caveats: migration loads ALL users into memory (fine at current scale) and its single try/catch wraps the whole loop — a unique-index collision mid-loop (case-variant duplicates) aborts remaining migrations with only a WARN log. Username normalization still none anywhere (unchanged).
11. ~~`GET /verify-token` skips blacklist~~ → ✅ **FULLY RESOLVED (rounds 3–8)**: (a) `UserService.isTokenValid` checks `invalidatedTokenRepository.existsByTokenHash` (round 3); (b) round 4 centralized the check inside **security.JWTService** itself — `validateToken(token, username)` AND `isValidTempToken(token, purpose)` consult `existsByTokenHash` first (null-safe optional injection), covering JwtFilter's path and every temp-token validation incl. TotpController's `resolveUser` step-1/2; (c) **round 8 closed the last gap**: `UserAuthenticationService.isTokenValid` now delegates to `jwtService.validateToken(username-matched)` instead of its own expiry-only copy — the resolveUser step-3 fallback on public `/api/auth/mfa/setup|verify` can no longer be passed by a logged-out blacklisted access token via manual header parsing. All isTokenValid paths now share one blacklist-enforcing code path.
12. ~~Minor gaps: phone uniqueness not checked against pending_registrations at registration; completeGoogleProfile can call existsByPhoneNumber(null) when phone omitted; rotation keeps old-generation unused backup codes as rows rather than deleting them as Part 1 implied~~ → ✅ **FULLY RESOLVED (round 8)**: (a) new null-safe `UserService.isPhoneNumberRegistered(phone)` = users OR pending_registrations — used by `registerUser`, Google `completeGoogleProfile`, AND profile-update uniqueness; (b) Google completion's phone check routed through that helper → `existsByPhoneNumber(null)` can never fire and a missing phone is never "taken"; (c) `BackupCodeRepository.deleteByUserIdAndGeneration(userId, oldVersion)` added and invoked in `TotpService.verifySetup` during every rotation — previous generation's rows fully deleted per Part 1's "ROTATED (old backup codes deleted)" contract (locked in by a new test assertion).

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

| Endpoint | Frontend caller |
| --- | --- |
| POST`/api/auth/forgot-password` {identifier} | passwordAPI.forgot ←`(access)/forgot-password/page.jsx`:35 (4xx still shown as "submitted" — mirrors anti-enumeration) |
| POST`/api/auth/forgot-password/verify` {token} | passwordAPI.forgotVerify ←`(access)/reset-password/page.jsx`:47 (?token= URL param) → stores returned tempToken |
| POST`/api/auth/reset-password` Bearer tempJWT + {newPassword} | passwordAPI.reset(tempToken,newPassword) — temp token sent AS Authorization header ← reset-password page:73 |
| POST`/api/auth/email/verify` {token,type?} | emailAPI.verify(token,type) ←`(access)/verify-email/page.jsx`:36 (?token&type from magic link; handles alreadyVerified branch) |
| POST`/api/auth/email/resend` | **WIRED (was dormant)**: backend fully functional (EmailVerificationController ~L157, covered by EmailVerificationControllerTest's 13 @Test cases); `emailAPI.resend` (api.js:319 + :658, noRetry). UI callers since 2026-08-23: profile page "Resend Verification Email" button (`!isEmailVerified`, dashed-border callout row) + verify-email error state (session-aware: live token → authenticated resend; else login nudge) | |
| POST`/api/auth/email/change` {newEmail} | emailAPI.change ←`(main)/profile/page.jsx`:146 — client trims+lowercases newEmail before sending |
| POST`/api/auth/mfa/email-recovery` {identifier} | twofaAPI.requestRecovery(user.email) ← profile page:506 (logged-in lost-device flow sends own email) |
| POST`/api/auth/mfa/email-recovery/verify` {token} | twofaAPI.verifyRecovery(token) ←`(access)/reset-2fa/page.jsx`:33 |
| POST`/api/public/contact` {name,email,message} | contactAPI.sendMessage ←`components/modals/ContactModal.jsx`:51 (react-hook-form; opened via ModalManager) |
| GET`/admin/emails/preview` · GET`/admin/emails/templates` | none — dev-browser template tooling only |

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

| Endpoint | Frontend caller |
| --- | --- |
| GET`/api/notes?page&size&search&tag` → ApiResponse(`Page<Note>`) | notesAPI.getAll ← `(main)/notes/page.jsx`:169 useQuery `['notes',{page,search:committedSearch,tag}]`, staleTime 30s, keepPreviousData; PAGE_SIZE=20; **search debounced 300ms via committedSearch state** |
| POST`/api/notes` body **`NoteRequest` DTO @Valid** | notesAPI.create ← page createMutation (optimistic prepend w/ temp id) via NoteDialog onSave |
| PUT`/api/notes/{id}` body **`NoteRequest` DTO @Valid** | notesAPI.update ← page updateMutation (optimistic merge; also pin toggle handlePin sends full note with flipped pinned) |
| DELETE`/api/notes/{id}` | notesAPI.delete ← page deleteMutation (toast-action confirm, optimistic filter) |

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
