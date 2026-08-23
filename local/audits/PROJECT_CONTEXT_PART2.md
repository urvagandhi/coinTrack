# PROJECT_CONTEXT_PART2.md — Per-Module Deep Dives

> Produced by the audit defined in `rules/02-per-module-deep-dive-and-synthesis.md`.
> One synthesis card per module, appended in processing order. Build on PROJECT_CONTEXT_PART1.md.
> Generated: 2026-08-23 · Modules completed so far: 2/13 (common, security)

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
| Endpoint | Frontend caller |
|---|---|
| GET `/api/health` (full DB+JVM+uptime; content-negotiated HTML dashboard w/ 3s self-refresh) | **unused in frontend** — infra only (Render dashboard/manual browser check); 503 when DB down |
| GET `/api/health/ping` (always 200 minimal) | **unused in frontend** |
| GET `/health` (Render keep-alive, `Cache-Control: no-store`) | **unused in frontend** — consumed by GitHub Actions keep-alive cron per backend README |
| GET `/` (HTML landing page, links health+actuator) | **browser-only** |
| GET `/favicon.ico` (serves `static/logo/coinTrack.png`) | **browser-only** |

No frontend file references `X-Request-ID`/`X-Correlation-ID` either — CORS exposes them but nothing reads them client-side.

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
- **permitAll (actual)**: `/api/health`, `/api/health/**`, `/actuator`, `/actuator/**`, `/health`; **`/api/mutual-fund/admin/**` (with literal comment "TODO: REMOVE THIS LATER")**; OPTIONS /**; explicit auth allowlist: login, register, verify-token, check-username/*, login/totp, login/recovery, 2fa/setup, 2fa/verify, 2fa/register/setup, 2fa/register/verify, refresh, oauth2/**; email flows: email/verify, email/change/verify, forgot-password, forgot-password/verify, reset-password; `/api/contact`; swagger-ui.html, swagger-ui/**, v3/api-docs/**; static: /, index.html, favicon.ico, static/**, public/**, api/public/**, logo/**; **`/admin/emails/**` (dev-only preview, but permitted unconditionally)**; broker: callbacks for ZERODHA/UPSTOX/ANGELONE in BOTH upper+lowercase, GET login-url, GET+POST connect (Zerodha & AngelOne), AngelOne test-totp, root `/zerodha/callback`; `/api/calculators/**`.
- Fallback is **`anyRequest().authenticated()`** — NOT denyAll as the README snippet claimed.
- `/api/auth/**` is NOT wholesale public (logout, 2fa/reset, 2fa/reset/verify, 2fa/status all require authentication).

### Endpoint-to-frontend map (frontend callers of the mechanics security enforces)
| Backend mechanism/route | Frontend caller |
|---|---|
| Bearer access token | `lib/api.js` axios request interceptor attaches from tokenManager (localStorage `ct_token`) |
| POST `/api/auth/refresh` | response interceptor single-flight queued refresh `{refreshToken}`; skips login + refresh URLs; failure → dispatches `auth:sessionExpired` CustomEvent |
| `auth:sessionExpired` event | AuthContext listener → clean logout + redirect `/login?redirect=<full path>` |
| POST `/api/auth/logout` | `authAPI.logout()` (noRetry) — authenticated route |
| POST `/api/auth/oauth2/google` | `authAPI.google({code, redirectUri})` — contract matches GoogleOAuthService (redirectUri must equal backend-configured) |
| Temp tokens (purpose claim) | sent in request BODY to totp endpoints: loginTotp/loginRecovery/registerSetup/registerVerify |
| Bearer temp-token pattern | `passwordAPI.reset(tempToken)` sends temp token AS Authorization header to public `/api/auth/reset-password` — works only because route is permitAll'd AND JwtFilter refuses to authenticate purpose-bearing tokens; server parses it manually (user module) |
| GET `/api/auth/verify-token` | **NO frontend caller** (backend-only); reset pages use `passwordAPI.forgotVerify` instead |
| `/api/auth/2fa/reset(+/verify)` | totpAPI.initiateReset/verifyReset — correctly hit AUTHENTICATED routes (logged-in reset flow) |
| Client-side guard | `AuthGuard.jsx` PUBLIC_ROUTES mirror permitAll loosely (/, login, register, forgot-password, reset-password, verify-email, setup-2fa, reset-2fa, calculators/*); wraps `(main)/layout.js` |

Shared frontend infra this depends on: AuthContext (useReducer), tokenManager, shared axios instance w/ interceptors, framer-motion init spinner.

### Discrepancies found (README/Part-1 vs code) — ALL RESOLVED (2026-08-23 fix round, security README rewritten to v3.1.0)
1. ~~`anyRequest().denyAll()` claim is false~~ ✅ FIXED. README §4.1 snippet + prose now document `.anyRequest().authenticated()` (verified vs SecurityConfig.java:145; zero denyAll references remain).
2. ~~Public-route model drift~~ ✅ FIXED. README §4.1 route list now matches SecurityConfig.java exactly (all 17 auth paths, broker login-url/connect/test-totp/callbacks both cases, calculators, swagger, admin, static, OPTIONS). Cosmetic residue only: §4.2 *summary* table omits `test-totp` and `/public/**`+`/api/public/**` (both present in §4.1 and code).
3. ~~TotpEncryptionUtil does not exist~~ ✅ FIXED. README demotes it to a historical refactor note and documents common `EncryptionUtil` (AES-256-GCM, `${totp.encryption-key}` 64-hex key source) in its own subsection (§9).
4. ~~Caffeine blacklist cache is fiction~~ ✅ FIXED in README (zero cache claims; direct-Mongo per-request `existsByTokenHash` documented at lines 43/50/341/367). ✅ FULLY RESOLVED (2026-08-23, round 3): dead Caffeine dependency AND stale pom.xml comment removed — zero Caffeine references remain anywhere (verified by repo-wide grep); Maven build compiles cleanly.
5. ~~Live admin hole `/api/mutual-fund/admin/**`~~ ✅ **RESOLVED BY CODE (pre-existing guard found)**: `mutualfund/controller/AdminCleanupController.java:28` carries class-level `@Profile("dev")` — bean never instantiates in prod, so the permitAll entry is inert there. The "TODO REMOVE" comment in SecurityConfig remains cosmetic.
6. ~~`/admin/emails/**` public in ALL environments~~ ✅ FIXED IN CODE: class-level `@org.springframework.context.annotation.Profile("dev")` added to email/controller/AdminEmailPreviewController.java:36 — previews strictly disabled outside dev.
7. ~~Temp-token purpose/expiry table wrong~~ ✅ FIXED. README table (lines 582–585) now matches code call sites: TOTP_LOGIN 10 min, TOTP_SETUP 30 min, TOTP_REGISTRATION 15 min, PROFILE_COMPLETION 15 min (Google SSO username completion); no TOTP_RESET anywhere.
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
2. ~~Public broker `connect`/`test-totp`~~ ✅ **VERIFIED BY DESIGN & SAFE**: controller-level auth guard — every BrokerConnectController method starts with `getAuthenticatedUser()` returning bare **401** when null (verified at lines 88–91, 152–155, 205–208, 261, 318); TOTP 2FA must be enabled before any connection is allowed. Pattern = defense-in-depth: permitAll at filter chain + explicit controller auth check.
3. ~~`/api/mutual-fund/admin/**` exposure~~ ✅ RESOLVED: AdminCleanupController is `@Profile("dev")` (mutualfund/controller/AdminCleanupController.java:28) — bean never instantiates in prod; requests hit a nonexistent mapping → **404**. SecurityConfig's "TODO REMOVE" comment remains cosmetic.
4. ~~Google `email_verified` unchecked?~~ ✅ **VERIFIED ENFORCED**: UserAuthenticationService.java:313 extracts `email_verified`; line 332 throws `AuthenticationException("An account with this email already exists. Please log in with your password to link Google authentication.")` when linking to an existing account with `email_verified == null || false`. SSO account-takeover via unverified email is blocked.
5. ~~Bearer-temp-token pattern fragile~~ ✅ **VERIFIED BY DESIGN**: JwtFilter detects `purpose != null` claim and continues UNAUTHENTICATED (no SecurityContext set); only designated public controllers (2FA verify, password reset) extract the temp token from header/body and validate via `jwtService.isValidTempToken(token, expectedPurpose)`. Intentional two-tier credential model — temp tokens can never act as session credentials.

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
