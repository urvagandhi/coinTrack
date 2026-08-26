# PROJECT_CONTEXT_PART1.md — CoinTrack Inventory, READMEs, Config

> Produced by the audit defined in `rules/01-inventory-readmes-config.md`.
> Scope: inventory + README deep-reads + config/env surfaces. **No Java/TS source read.**
> Generated: 2026-08-23

---

## 1. Full File Inventory (Phase 0)

Patterns searched at any depth (excluding `node_modules/`, `.git/`, `target/`):
`README.md`, `*.env`, `*.env.example`, `*.env.local`, `application*.properties`,
`application*.yml`, `render.yaml`, `Dockerfile`, `docker-compose.yml`,
`pom.xml`, `package.json`, `next.config.*`, `tsconfig.json`.

### Depth 0 — repo root
| File | Category |
|---|---|
| `README.md` | README |

### Depth 1
| File | Category |
|---|---|
| `backend/README.md` | README |
| `backend/.env` | env (gitignored, untracked) |
| `backend/Dockerfile` | Dockerfile |
| `backend/pom.xml` | pom.xml |
| `backend/render.yaml` | render.yaml |
| `frontend/README.md` | README |
| `frontend/.env` | env (gitignored, untracked) |
| `frontend/next.config.mjs` | next.config |
| `frontend/package.json` | package.json |

### Depth 2
| File | Category |
|---|---|
| `backend/scripts/package.json` | package.json |

### Depth 3+ — module READMEs
Base: `backend/src/main/java/com/urva/myfinance/coinTrack/<module>/README.md`

broker · calculator · common · email · epf · fixeddeposit · goldsilver · mutualfund · notes · portfolio · ppf · security · user

### Spring config files
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/test/resources/application.properties`
- `backend/src/test/resources/application-test.properties`

### Out-of-project tree (`skills/`)
`skills/README.md` + 12 `skills/skills/claude-api/**/README.md` — Anthropic's third-party
"claude-api" skills repo vendored into the workspace. **Not CoinTrack modules**;
excluded from module analysis.

### Counts
- READMEs found: 19 total = 1 root + backend + frontend + 13 modules + 3 in `skills/`
  (16 in scope excluding skills tree)
- Config files found: 14 (2 `.env`, 5 application*.properties, 1 render.yaml,
  1 Dockerfile, 1 pom.xml, 2 package.json, 1 next.config.mjs)
- **Not present anywhere:** `docker-compose.yml`, `tsconfig.json` (frontend is plain JS),
  `*.env.example` (a comment in `application-dev.properties` says "Copy .env.example"
  but no such file exists), `application*.yml`

### Module-set cross-check
Known set from rules: broker, calculator, common, email, fixeddeposit, notes, portfolio,
ppf, epf, goldsilver, security, user, mutualfund — **all 13 found, no mismatch**.
(Backend README §4 table lists only 12 — see Discrepancy D1.)

---

## 2. Per-Module Extraction (Phase 1)

### ppf (v1.2.0, 2026-07-25)
- **Responsibility**: PPF ledger — transaction CRUD, cascading balance recalculation, XLSX export.
- **Collections**: `ppf_transactions` (id, transactionNo, userId, transactionDate, particulars,
  particularType, debitAmount, creditAmount, balance, remarks); `counters` (shared sequences);
  `PpfSettingsRepository` exists (settings collection implied).
- **Endpoints** (base `/api/ppf`, JWT): POST `/transactions`; GET `/transactions` (paginated,
  filters incl. `financialYear`); GET `/summary` (programmatic aggregation); GET `/export`
  (XLSX); GET `/withdrawal-status` (live statutory eligibility); GET/PUT/DELETE
  `/transactions/{id}` (each triggers recalculation); GET/PUT `/settings` (incl. Post-Maturity
  Extension Mode).
- **Cross-module deps**: common (SequenceGeneratorService `ppf_txn_no_<userId>`,
  ExcelExportUtil, FinancialYearUtil).
- **Formulas/rules (exact)**: ledger STRICTLY ordered by `transactionDate` ASC (tiebreak
  `createdAt` ASC); running-balance walk; negative balance → `InsufficientPpfBalanceException`
  rollback. Withdrawal validation (PPF Scheme 2019/2023): no partial withdrawal before the 7th
  FY (5 complete FYs after opening); max 1 withdrawal per FY; pre-maturity cap = 50% of the
  lower of (balance at end of 4th preceding FY) and (previous FY balance); WITH_CONTRIBUTION
  extension (Form H) caps aggregate withdrawals over a 5-year block at 60% of block opening
  balance. Indian FY = Apr 1–Mar 31.
- **Pitfalls/gotchas**: never order by `transactionNo`; client-supplied `balance` rejected;
  summaries computed programmatically from transactions (NOT Mongo aggregation pipeline) to
  guarantee reconciliation; recalculation single-threaded inside Mongo `@Transactional`.

### fixeddeposit (v1.2.0, 2026-07-25)
- **Responsibility**: manual FD CRUD, live status derivation, risk highlighting, metrics, XLSX export.
- **Collections**: `fixed_deposits` (fdNo indexed — ✅ Corrected 2026-08-26 (FD deep-dive): **NOT unique**; it is a per-user `1..N` display ordinal rewritten by common's TransactionSequenceService after every create/update, so a global unique index is impossible by design; userId indexed; place, holderName,
  nominee, accountNumber, interestRate, investmentPeriod, issueDate, maturityDate, issueAmount,
  maturityAmount, status, remarks, createdAt, updatedAt). ✅ Corrected 2026-08-26: this module does
  NOT write `counters` (the old "`counters` (`fd_no`)" claim was wrong — fdNo comes from the
  reorder pass, not an atomic `$inc`).
- **Endpoints** (base `/api/fixed-deposits`, JWT): POST create; GET list (MongoTemplate Criteria
  filters: place/status/nominee/maturityFrom/maturityTo); GET `/summary`; GET `/export` (XLSX,
  default sort `issueDate:asc`, 14 columns); GET/PUT/DELETE `/{id}`; PATCH `/{id}/close`.
  ✅ Added 2026-08-26 (FD deep-dive — previously omitted): module also owns
  `FixedDepositExcelExporter` util (multi-tab workbook All/Active/Due/Matured/Closed + ₹ totals row),
  nightly scheduler `FixedDepositStatusScheduler` (whose `findByStatusNot(CLOSED)` sweep runs
  GLOBALLY across ALL users — not per-user), account-deletion listener
  `FixedDepositUserDataCleanupListener` (`UserDeletedEvent` → `deleteByUserId` cascade),
  and full repository inventory `findByIdAndUserId` / `findByUserId` / `findByStatusNot` /
  `deleteByUserId`.
- **Status derivation**: stored CLOSED is sticky override → else today<maturity ACTIVE,
  ==DUE, >MATURED. Daily cron `FixedDepositStatusScheduler` `0 0 0 * * ?` Asia/Kolkata.
- **Sorting engine**: 6 modes; `maturityDate:asc` ("Nearest First") evaluated relative to
  `LocalDate.now()`. ✅ Corrected 2026-08-26: no longer a Java comparator — nearest-first ordering
  is computed server-side via MongoDB aggregation with a computed sort key (`$cond`+`$toDate`),
  so skip/limit page at DB level (upcoming ascending first, past descending after, `_id` tiebreak).
  Excel export defaults to `issueDate:asc`. `Days To Maturity` renders as `-` for MATURED/DUE/CLOSED or <=0.
- **Pitfalls**: BigDecimal only for money/rates; userId always from JWT Principal; ✅ Corrected
  2026-08-26: cross-user access returns **404 NOT_FOUND** ("not found or access denied" — no
  existence leak), NOT "403 ACCESS_DENIED" as originally claimed; `maturityDate` strictly after
  `issueDate` (`InvalidFdDateRangeException` — relocated to fixeddeposit.exception same day);
  DTO field renamed `totalEstReturns`→`totalEstimatedReturns` to fix frontend reporting zero returns.
  ✅ Updated 2026-08-26: `@Transactional` added to `createFixedDeposit` and `updateFixedDeposit`
  in `FixedDepositServiceImpl`, backed by `common.config.MongoTransactionConfig` (`MongoTransactionManager`),
  guaranteeing transactional atomicity across document save + `TransactionSequenceService.reorderFixedDeposits(userId)`
  ledger reordering operations.

### email (v3.0.0, 2026-03-19)
- **Responsibility**: transactional email via Brevo REST API + Thymeleaf rendering.
- **Controllers**: dev-only `AdminEmailPreviewController`: GET `/admin/emails/preview`,
  GET `/admin/emails/templates`.
- **Services**: `EmailSender` interface (`sendEmail(...)→boolean`, `isConfigured()`);
  `BrevoEmailService` (WebClient, 10s timeout; retry 3x exponential backoff 1s/2s/4s on 5xx &
  network errors; 4xx fails immediately; fail-safe: catches everything, returns false, never
  throws); `EmailService` orchestrator — all public methods `@Async`.
- **7 templates** (`resources/templates/email/`): welcome, verify-email, reset-password,
  change-email, 2fa-recovery, security-alert, contact-form. Magic-link emails expire in 10 min.
  Common injected vars: logoUrl (base64 data URI from `classpath:static/logo/coinTrack.png`,
  keep logo <50KB), supportEmail, year.
- **Config properties**: prefix `brevo.*` (apiKey, senderEmail default `no-reply@cointrack.app`,
  senderName `CoinTrack`, apiUrl `https://api.brevo.com/v3/smtp/email`); prefix `email.*`
  (from, support, baseUrl, magicLinkExpiryMinutes=10, magicLinkSecret, apiBaseUrl).
- **Required env (prod per README)**: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME,
  EMAIL_BASE_URL, EMAIL_MAGIC_LINK_SECRET, EMAIL_SUPPORT.
- **Design rule (load-bearing)**: "Welcome email and verification email are always sent
  separately, never combined into one message."
- **Logging policy**: recipient email + subject logged; HTML content and API key NEVER logged.
- **Callers**: UserService (registration), AuthController (forgot password), ProfileService,
  TwoFactorService, ContactController.

### mutualfund (v1.0.0, 2026-07-26)
- **Responsibility**: household multi-holder MF tracking — scheme master CRUD, lumpsum/SIP/
  redemption ledgers, automatic aggregation, cross-check discrepancy detection, 5-sheet XLSX export.
- **Collections**: `mf_schemes`, `mf_lumpsum_transactions`, `mf_sip_mandates`,
  `mf_sip_contributions`, `mf_redemption_transactions`, `mf_valuation_snapshots`.
- **Controllers** (base `/api/mutual-fund`, JWT): `/schemes`, `/lumpsum`, `/sip-mandates`,
  `/sip-contributions`, `/redemptions`, `/valuation-snapshots` (CRUD + filters), plus
  `/scheme-summary`, `/summary`, `/export`.
- **Aggregation formulas (exact)**:
  ```
  lumpsumInvestment   = SUM(LumpsumTransaction.lumpsumInvestment)
  sipInvestment       = SUM(SipContribution.amount)
  totalInvestment     = lumpsumInvestment + sipInvestment
  totalTradedValue    = SUM(RedemptionTransaction.tradeInvestmentValue)
  currentInvestment   = totalInvestment - totalTradedValue
  totalUnit           = SUM(Lumpsum.totalUnit) - SUM(Redemption.redemptionUnit)
  capitalGain         = redemptionValue - tradeInvestmentValue   (auto-computed on every save)
  ```
- **Status derivation**:
  ```java
  if (any active SipMandate for scheme)            -> ACTIVE_SIP
  else if (currentInvestment <= 0 && totalTradedValue > 0) -> FULLY_REDEEMED
  else                                             -> LUMPSUM_ONLY
  ```
- **Discrepancy check**: group schemes by `holderName + "|" + platform` bucket; compare latest
  `ValuationSnapshot.investmentValue` vs ledger-derived total per bucket; if difference
  > ₹1 tolerance → `discrepancyFlag=true` with signed `discrepancyAmount`.
- **FK integrity rules**: every create validates `schemeId` ownership (`validateSchemeOwnership`);
  SipContribution additionally validates `sipMandateId` ownership AND that
  `mandate.schemeId == contribution.schemeId`; `deleteScheme()` throws
  `RuntimeException("Cannot delete scheme because it has associated transactions.")` if any of
  the 4 transaction collections reference the scheme (delete-block, no orphaned FKs).
- **Normalization**: `mfCategory` trimmed + case-normalized on every save.
- **Pitfalls/gotchas**: BigDecimal everywhere; never free-type scheme names (use schemeId);
  LTCG/STCG fields are reference-tracking only — NOT authoritative for tax filing;
  ValuationSnapshots are independent cross-checks, never merged into ledger data;
  FULLY_REDEEMED excluded from default views — use `?includeRedeemed=true`;
  manual edits to `capitalGain` are overwritten on save; `holderName` is plain field under one
  userId (multi-holder within single login).
- **Services noted but not detailed in README's dir tree**: `MfFifoEngine` (FIFO lots,
  1-year holding period STCG/LTCG), `PortfolioHoldingService` (averageCost, realizedGain,
  unrealizedGain, marketGain, absoluteReturnPercentage via latest NAV), `MfNavService`,
  `PortfolioDashboardService`, `SipContributionScheduler` (cron backfills missing monthly SIP
  contributions on due dates).

### calculator (v3.0.0, 2026-03-19)
- **Responsibility**: stateless financial calculators for Indian investors. Public (no auth),
  rate-limited 60 req/min/IP.
- **Collections**: NONE (pure computation, no DB).
- **Controllers/endpoints** (all POST, base `/api/calculators/<category>`):
  - investment (8): sip, step-up-sip, lumpsum, cagr, mutual-fund-returns, xirr, stock-average, inflation
  - loans (6): emi, home-loan-emi, car-loan-emi, simple-interest, compound-interest, flat-vs-reducing
  - savings (10): ppf, epf, fd, rd, ssy, nps, nsc, scss, mis, apy
  - tax (6): income-tax, hra, salary, gratuity, gst, tds
  - trading (2): brokerage, margin
  - planning (1): retirement
  - README Appendix A totals: **33 endpoints**, 30 request DTO records, 31 response records
- **Response wrapper**: `CalculatorResponse<T>` { success, metadata(calculator, category,
  assumptions), result, breakdown(yearly table, nullable), debug(only when `?debug=true`) }.
- **Rate limiting**: Bucket4j `RateLimitFilter` scoped ONLY to `/api/calculators/**`;
  in-memory ConcurrentHashMap keyed by client IP (X-Forwarded-For first entry fallback
  remoteAddr); map flushed when >10,000 entries; HTTP 429 with Retry-After header.
- **Math layer**: `FinancialMath` facade delegating to SipMath, LoanMath, InvestmentMath,
  SavingsMath, TaxMath, MathUtil; `XirrCalculator` = Newton-Raphson with bisection fallback
  (requires ≥1 positive & ≥1 negative cash flow).
- **External config**: `calculator-config/tax-slabs.yml`, `savings-rates.yml`,
  `default-assumptions.yml` loaded at startup via dot-notation access.
- **Pitfalls**: BigDecimal only (no double/float); stale tax slabs must be updated annually;
  in-memory rate limiter not shared across instances — migrate to Redis for multi-instance;
  missing `@Valid` on controller params = unvalidated input.
- **Deps on other modules**: common (shared utilities), security (SecurityConfig excludes these
  paths from auth).

### security (v2.0.0, 2025-12-17)
- **Responsibility**: stateless JWT auth gatekeeper; TOTP secret encryption.
- **Collections**: none listed in this module's own README (backend README v3.1 lists
  `invalidated_tokens` here — drift, see D8).
- **Public routes (per SecurityConfig snippet in README)**: `/`, `/api/health/**`,
  `/api/auth/**`, `/api/broker/*/callback`, OPTIONS /**. Everything under `/api/**` requires
  auth; anyRequest().denyAll().
- **JWT config**: HMAC-SHA256 via jjwt; expiry 30 min standard; temp tokens 15 min (README §5)
  with purposes TOTP_LOGIN (5 min), TOTP_SETUP (15), TOTP_RESET (15); claims sub/purpose/userId;
  secret `${jwt.secret}` Base64/min 32 chars.
- **Components**: JwtFilter (OncePerRequestFilter; does NOT skip any path; adds userId to MDC),
  JWTService, CustomerUserDetailService (loads by username), UserPrincipal (single ROLE_USER),
  TotpEncryptionUtil (AES-256-GCM, 128-bit tag, 12-byte IV, key = 64 hex chars from
  `${totp.encryption-key}`, storage format `Base64(IV ‖ ciphertext ‖ tag)`).
- **Env vars**: `jwt.secret`, `totp.encryption-key`.
- **Pitfalls**: never hardcode secrets / log tokens / long expiry; review SecurityConfig for
  permitAll bypasses; clear SecurityContext on validation failure; never store plain TOTP secrets.
- **Drift flag**: this README (v2.0.0) does NOT mention refresh tokens or JWT blacklist, while
  backend README v3.1 describes InvalidatedToken blacklist + refresh-token rotation. See D8/D9.

### notes (v2.1.0, 2026-08-24)
- **Responsibility**: personal notes CRUD (plain text content, tags, Tailwind color classes, pinning).
- **Collection**: `notes` (userId @Indexed, title, content no size limit, tags List<String>,
  color e.g. `bg-blue-50 dark:bg-blue-900/10`, pinned bool, createdAt, updatedAt LocalDateTime).
  ✅ Corrected 2026-08-24 (notes deep-dive): title/content **no longer carry `@TextIndexed`**
  (dead annotations removed in v2.1.0), and the collection defines compound index
  `idx_note_user_sort` = `{userId: 1, pinned: -1, updatedAt: -1}` backing the
  pinned→updatedAt list sort.
- **Endpoints** (base `/api/notes`, JWT): GET list (paginated, sorted pinned DESC then updatedAt DESC,
  supports `?search=` substring regex + `?tag=` filter), POST create, PUT `/{id}`, DELETE `/{id}`.
  userId ALWAYS set from `principal.getUserId()` (✅ Corrected 2026-08-24: was `getName()`),
  never request body. Request bodies for POST/PUT are `NoteRequest` DTOs validated via `@Valid`
  — client can never supply `id` or `userId`.
- **Default seeding**: on registration UserService calls
  `noteService.createDefaultNotesIfNoneExist(userId)` — seeds 2 welcome notes idempotently
  (only if user has zero notes).
- **Security posture**: plain text content stored (XSS sanitization is frontend responsibility);
  log note IDs only, never title/content/search.
- **TODOs (Appendix B)**: ~~pagination (High priority — currently unpaginated)~~, search,
  attachments, sharing, reminders, archive.
  ✅ Corrected 2026-08-24: pagination + search are IMPLEMENTED (`Page<Note>` + `searchByUserIdAndTerm`).
- **Drift flags**: root README says notes list is "(paginated)" — module README now matches;
  backend README mentions Note had text search indexes — module README updated: removed.

### broker (v2.0.0, 2025-12-17)
- **Responsibility**: external broker integrations (Zerodha Kite production-ready; Angel One &
  Upstox partial) with "Raw Fidelity" pass-through.
- **Core philosophies (load-bearing)**:
  - "**Trust the Broker**": use official computed values (P&L, margins, day change) rather than
    recalculating locally.
  - "**Raw Pass-Through**": every DTO includes a `raw` Map preserving the ENTIRE original JSON.
  - Uniform `BrokerService` interface (16 methods incl. fetchHoldings/fetchPositions/fetchOrders/
    fetchTrades/fetchFunds/fetchMf*/fetchProfile/testConnection/refreshToken/detectExpiry).
  - Fail gracefully; use cached data when API unavailable.
- **Collection**: `broker_accounts` (userId, brokerUserId, broker enum ZERODHA/ANGELONE/UPSTOX,
  zerodhaApiKey plaintext, encryptedZerodhaApiSecret AES, zerodhaAccessToken encrypted,
  zerodhaTokenExpiresAt typically next 6 AM IST, lastSuccessfulSync + granular
  lastHoldingsSync/lastPositionsSync/lastMfHoldingsSync, isActive). ExpiryReason enum:
  NONE, SESSION_EXPIRED, INVALID_TOKEN, USER_LOGOUT, PASSWORD_CHANGE, FORCED_LOGOUT, UNKNOWN.
- **Endpoints**:
  - POST/GET `/{broker}/credentials` (save / get masked) — base `/api/brokers`
  - GET `/{broker}/connect` (OAuth login URL)
  - POST `/callback` (exchange request_token → access_token)
  - DELETE `/{broker}/disconnect`
  - GET `/{broker}/status`, GET `/connected`
  - GET `/api/zerodha/callback` — PUBLIC redirect bridge to frontend
    (hardcoded `http://localhost:3000/broker/callback?broker=zerodha&token=...`)- **Auth flows**: credentials saved encrypted → GET login URL → user logs in at Zerodha →
  callback bridge redirects to frontend with request_token → frontend POSTs `/api/brokers/callback`
  → backend calls Kite `/session/token` (checksum = SHA256(apiKey+requestToken+apiSecret)) →
  access_token encrypted & saved. Token valid until ~6 AM IST next day.
- **Secrets policy**: API keys plaintext (not sensitive), API secrets & access tokens AES
  encrypted via common EncryptionUtil; logs NEVER contain api key/secret/token; request token
  masked to last 4 chars.
- **Non-negotiable rules**: preserve raw JSON always; never store secrets plaintext; check token
  expiry before API calls; BigDecimal exact-as-received (no rounding in service layer).
- **Note**: backend README v3.1 documents a NEWER hexagonal structure (BrokerAdapter port,
  adapters/{zerodha,angelone,upstox}/{mapper,raw}, BrokerAdapterRegistry auto-discovery,
  BrokerCapability enum, normalization layer) that supersedes this module README's
  service-factory description. See D8.

### portfolio (v2.0.0, 2025-12-17)
- **Responsibility**: consolidate multi-broker assets into unified "Source of Truth" dashboard;
  sync engine; market data; F&O handling.
- **Collections**: `cached_holdings`, `cached_positions`, `cached_funds`, `cached_mf_orders`,
  `market_prices` (symbol, ltp, updatedAt), `sync_logs` (userId, broker, status, timestamp,
  details). All cached entities carry full original broker JSON in a `raw` field.
  (Backend README v3.1 instead lists canonical_* collections + `sync_cooldown` — drift, D8.)
- **Endpoints** (base `/api/portfolio`, JWT): GET summary / holdings / positions / orders /
  trades / funds / mf-holdings / mf-orders / mf-sips / mf-instruments / mf-timeline / profile;
  POST `/refresh` (ManualRefreshController).
- **Aggregation formulas (exact)**:
  ```
  totalCurrentValue   = Σ (quantity × currentPrice)
  totalInvestedValue  = Σ (quantity × averageBuyPrice)
  totalDayGain        = Σ ((currentPrice - previousClose) × quantity)
  totalDayGainPercent = totalDayGain / (totalCurrentValue - totalDayGain) × 100
  ```
- **CRITICAL ARCHITECTURAL RULE**: "Portfolio summary aggregates **equity holdings only**.
  Positions (F&O) are **excluded**." Rationale: holdings have stable previousClose; positions'
  MTM doesn't fit the DayGain formula; including them creates mathematical inconsistencies.
- **Trust the Broker fallbacks**: pnl ← raw.pnl else (currentPrice−avgPrice)×qty; dayChange ←
  raw.day_change else (currentPrice−previousClose)×qty; currentValue ← raw.current_value else
  qty×currentPrice.
- **Sync engine**: rate-limit check (SyncSafetyService: min **5 minutes** between manual syncs
  per user/broker) → lock → fetch → DELETE old + SAVE new cached docs per user/broker → update
  BrokerAccount.lastSuccessfulSync → SyncLog entry.
- **Schedulers**: market hours `0 */15 9-16 * * MON-FRI`; off-hours `0 0 6,20 * * *`.
- **Enums**: SyncStatus(SUCCESS/FAILED/SKIPPED), PositionType(DAY/OVERNIGHT),
  AssetType(EQUITY/FUTURES/OPTIONS/MF), OrderStatus(PENDING/COMPLETED/CANCELLED/REJECTED).
- **Pitfalls**: never include CachedPosition in summary loop; prefer raw.pnl over local math;
  missing rate limit → broker API ban (429); BigDecimal everywhere; userId filter always;
  concurrent-sync race → locks; surface lastSyncedAt/isStale to UI.

### common (v2.0.0, 2025-12-17)
- **Responsibility**: cross-cutting infra only — NO business logic. Rule: "common is the only
  module that should be widely imported."
- **Components**: CorsConfig (origins localhost:3000 + cointrack.app); EncryptionConfig (env:
  ENCRYPTION_KEY 32-char AES key, ENCRYPTION_SALT — naming differs from application.properties
  which uses app.encryption.secret-key ← ENCRYPTION_SECRET_KEY; see D12); RestTemplateConfig
  (5s connect / 30s read); DomainException hierarchy (AuthenticationException→401 AUTH_FAILED,
  AuthorizationException→403 ACCESS_DENIED, ValidationException→400 VALIDATION_FAILED,
  ExternalServiceException→502 EXTERNAL_SERVICE_FAILED; GlobalExceptionHandler also maps
  BrokerException→503 BROKER_ERROR and catch-all RuntimeException→500); RequestIdFilter (UUID →
  MDC requestId, HIGHEST_PRECEDENCE); HealthController (`/api/health` full DB+JVM+uptime,
  503 when critical component down; `/api/health/ping`); ApiResponse/ApiErrorResponse wrappers
  (requestId from MDC); shared User DTOs; EncryptionUtil (**AES-256-CBC**, PBKDF2WithHmacSHA256
  key derivation, random IV); HashUtil (SHA-256 checksums, e.g.
  `sha256(apiKey+requestToken+apiSecret)`); FnoUtils (expiry/strike/option-type parsing);
  SequenceGeneratorService + DatabaseSequence (`counters` collection); NotificationService
  interface (placeholder); Excel export utilities.
- **Usage rules**: always throw DomainException subclasses; use LoggingConstants patterns;
  wrap responses in ApiResponse; never log secrets.
- **Drift flag**: root README says EncryptionUtil is AES-256-GCM; this README says AES-256-CBC
  (D10).

### user (v2.0.0, 2025-12-17)
- **Responsibility**: registration, login (+Google SSO), TOTP 2FA lifecycle, backup codes,
  profile CRUD, password change.
- **Collections**: `users` (username unique-indexed; name/email/phoneNumber/password BCrypt;
  provider LOCAL|GOOGLE; TOTP fields: totpEnabled, totpVerified, totpSecretEncrypted AES-GCM,
  totpSecretPending, totpSecretVersion=1, totpSetupAt, totpLastUsedAt, totpFailedAttempts,
  totpLockedUntil); `backup_codes` (userId, codeHash BCrypt, version tied to TOTP version,
  usedAt null=unused). Backend README additionally lists `pending_registrations` and
  `refresh_tokens` under user (drift D8/D9).
- **Endpoints**:
  - UserController (11): POST `/api/auth/login` / `/api/auth/google` / `/api/auth/register` /
    `/api/auth/verify-token`; GET `/api/users/check/{username}` | `/api/users` |
    `/api/users/{id}` | `/api/users/me`; PUT `/api/users/{id}` | `/api/users/{id}/password`;
    DELETE `/api/users/{id}`
  - TotpController (9): GET `/api/auth/totp/setup`; POST verify-setup / verify /
    verify-recovery / reset / verify-reset / setup-registration / verify-registration;
    GET `/api/auth/totp/status`
  - LoginController (simple login)
- **Registration flow (mandatory TOTP)**: register → MongoDB `pending_registrations`
  (TTL 15 min — restart-safe, multi-instance safe) + TOTP_REGISTRATION temp token →
  setup-registration returns QR (base64 PNG) + secret →
  verify-registration verifies code, encrypts+saves secret, generates 10 backup codes, saves
  user, returns JWT + backupCodes.
- **Login flow**: identifier (username/email/phone) + password → if TOTP on: `{requiresOtp,
  tempToken}` → verify via TOTP or backup code → JWT.
- **TOTP config**: SHA1, 6 digits, 30s period, lib dev.samstevens.totp. Secret lifecycle
  PENDING → ACTIVE → ROTATION (version++) → ROTATED (old backup codes deleted).
  Dual lockout ladders — MFA codes: 5 failed → 10-min lock, 10 failed → 24-h lock;
  passwords: 5 failed → 15-min lock, 10 failed → 1-h lock; counters reset on success.
- **Backup codes**: 10/user/version, 8-digit numeric format, BCrypt hashed, one-time use.
- **Pitfalls**: never return User entity (hash exposure); lowercase-normalize usernames;
  verify old password before change; clear pending secrets on failure.
- **Drift flag**: backend README v3.1 flow uses `/api/auth/2fa/register/setup`,
  `/api/auth/login/totp`, `/api/auth/login/recovery`; root README shows `/api/totp/*`;
  this README says `/api/auth/totp/*`. See D7.

### epf (v1.2.0, 2026-07-25)
- **Responsibility**: EPF & EPS dual-balance ledger; statutory contribution split; interest engine.
- **Collections**: `epf_settings` (defaultBasicDA, employeeContributionRate,
  useActualSalaryForEps, monthlyVpfAmount), `epf_transactions`, `epf_interest_rates`
  (FY→rate%, user-maintained, NOT hardcoded).
- **Endpoints** (base `/api/epf`, JWT): GET/PUT `/settings`; GET/POST `/interest-rates`;
  POST `/transactions` (AUTO_SALARY split or MANUAL_OVERRIDE); GET `/transactions` (filters
  dateFrom/dateTo/financialYear/mode); GET/PUT/DELETE `/transactions/{id}` (trigger
  recalculation); GET `/summary`; GET `/export`.
- **Contribution split formulas (exact)**:
  - Employee EPF = 12% (or configured 10%/8%) of Basic+DA
  - Employer EPS = 8.33% of min(Basic+DA, ₹15,000), capped ₹1,250/month — unless
    `useActualSalaryForEps` opted in (post-Nov 2022 Supreme Court ruling)
  - Employer EPF = remainder of employer's 12% after EPS (0.12×Basic+DA − EPS)
  - VPF = 100% to EPF (0% to EPS)
- **Interest engine — EPFO official 3-case formula per FY**: (1) opening balance less FY
  withdrawals earns interest all 12 months; (2) withdrawals stop earning from month of
  withdrawal; (3) new contributions earn from month AFTER contribution through FY-end.
- **CRITICAL ARCHITECTURAL NOTE (near-verbatim)**: "Do **NOT** replace this calculation with a
  simplified 'monthly interest on opening balance' approximation. The 3-case monthly running
  balance simulation accurately mirrors EPFO's official annual crediting rules."
- **Cascade**: edits/deletes recompute both epfBalance & epsBalance; negative balance →
  `InsufficientEpfBalanceException` (400). Taxability flag when employee contributions + VPF in
  current FY exceed ₹2,50,000.

### goldsilver (v2.0.0 — Live Purity-Based Rates)
- **Collections**: `gold_silver_investments`, `metal_purity_options`, `metal_rate_snapshots`,
  `metal_rate_settings`.
- **Endpoints**: GET `/rates/current`; POST `/rates/refresh` (min **30-min gap**, deployment-wide);
  GET `/rates/usage`, `/rates/health`; GET/PUT `/rate-settings` (per-user premium %, default
  15.00); PATCH `/{id}/rate-mode` (LIVE↔MANUAL); GET/POST `/purity-options`;
  PATCH `/market-rate` (MANUAL-mode bulk). Root README also documents CRUD `/api/gold-silver`,
  `/summary`, `/export` not present in this module README (D13).
- **Formulas (exact)**:
  ```
  effectiveBaseRate  = baseRatePerGram × (1 + localPremiumPercent/100)
  currentMarketRate  = effectiveBaseRate × purityFactor        (LIVE mode)
  metalAmount        = ratePerGram × netWeight
  makingChargeAmount = metalAmount × (makingChargePercent/100)
  totalAmount        = metalAmount + makingChargeAmount + stoneOtherCharges
  gstAmount          = totalAmount × (gstPercent/100)
  netAmount          = totalAmount + gstAmount
  currentValue       = currentMarketRate × netWeight
  profitLoss         = currentValue − netAmount
  returnPercent      = profitLoss/netAmount × 100
  ```
- **Purity seeds**: Gold 24K(0.999)/22K(0.916)/18K(0.750); Silver 999(0.999)/925(0.925);
  custom purities allowed.
- **Quota mgmt**: GoldAPI.io 100 req/month; `goldapi.monthly-limit`, `goldapi.safety-buffer`
  (default 5); scheduled fetch cron default `0 0 10 * * *`; pre-flight quota guard (/api/stat)
  and health check (/api/status); usage cached 30 min; refresh blocked when usage >
  limit − buffer; stale fallback retains previous snapshot with isStale/rateStale/rateAsOf flags.
- **Provider abstraction**: `MetalPriceProvider` interface decouples from `GoldApiIoProvider`.

### frontend (v3.0.0, 2026-03-19)
- **Stack**: Next.js 16 App Router / React 18.3.1 / Tailwind 3 / React Query 5 / Axios; Vercel.
- **Route groups**: `(access)` public auth pages (login, register, forgot-password, verify-email,
  setup-2fa, reset-2fa, reset-password); `(main)` authenticated (dashboard, portfolio 13 tabs,
  brokers {zerodha,angelone,upstox}/{setup,callback,dashboard}, notes, profile,
  settings/2fa-settings); `calculators/*` public (README says 32+ calculators).
- **Auth mechanics**: JWT + refresh token in localStorage; Axios interceptor attaches Bearer;
  401 → queued silent refresh via `POST /api/auth/refresh`; failure dispatches
  `auth:sessionExpired` → redirect /login. AuthGuard wraps (main) routes.
- **State**: AuthContext (useReducer), ThemeContext, ModalContext; React Query staleTime
  30s–5min; hooks: useBrokerConnection, usePortfolio{Funds,Holdings,Orders,Positions,Summary,Tab},
  useZerodhaDashboard.
- **lib/api.js**: authAPI/userAPI/totpAPI/brokerAPI/portfolioAPI/notesAPI + tokenManager;
  "40+ API methods".
- **Env vars**: NEXT_PUBLIC_API_BASE (required), NEXT_PUBLIC_APP_URL (required per README);
  dev rewrite `/api/*` → backend :8080 via next.config.mjs.
- **next.config.mjs extras**: transpilePackages lucide-react; poweredByHeader off; secure headers
  (X-Frame-Options DENY, nosniff, strict-origin-when-cross-origin); removeConsole in prod;
  redirect /home→/; images remotePatterns localhost + api.cointrack.app; Webpack over Turbopack
  (custom chunk logic currently commented out).
- **Testing/scripts**: Jest + Testing Library; Cypress E2E; Husky pre-commit lint;
  scripts include check (lint+format+test) and verify (check+build).

### backend README (v3.1.0, 2026-07-25)
- **Stack**: Java 21, Spring Boot 3.5.5, MongoDB Atlas, Spring Security JWT+TOTP.
- **Critical rules**: manual Authorization-header parsing FORBIDDEN — use
  `@AuthenticationPrincipal UserPrincipal.getUserId()` (MongoDB _id); public routes whitelisted
  only in SecurityConfig; deny-by-default.
- **Zerodha guardrails (CRITICAL)**: no recomputation of m2m/pnl; NEVER `quantity×price` for
  derivatives; Current Value = Invested + Total P&L; Day Gain = broker m2m directly.
- **Hexagonal broker architecture** (supersedes broker module README's factory description):
  `BrokerAdapter` port returning `CompletableFuture<Canonical*>`; adapters
  zerodha/angelone/upstox with mapper/ + raw/ subpackages; BrokerAdapterRegistry auto-discovery;
  BrokerCapability enum (HOLDINGS…LIVE_MARKET_DATA); BrokerCapabilityChecker before every fetch;
  normalization layer (Symbol/Exchange/Price/Date). Capability matrix per backend README:
  Angel One & Upstox "Complete" for holdings/positions/funds, no MF/orders/live data.
- **Anti-patterns forbidden**: business logic in controllers; manual JWT parsing; printStackTrace;
  god services; hardcoded secrets; frontend math; direct broker API outside the port;
  double/float in finance.
- **Stats claimed**: "8 modules", ~200 files, ~15k LOC, ~50+ endpoints, 17+ collections, 80+
  DTOs, 41 calculators — several of these conflict with other docs (see D1–D4).
- **Collection inventory (28 listed)** incl. canonical_* family, sync_cooldown, invalidated_tokens,
  email_tokens, pending_registrations, refresh_tokens — partially inconsistent with older module
  READMEs' cached_* naming (D8).
- **Deployment**: Render Docker Alpine; GitHub Actions keep-alive cron pings health endpoint every
  5 min; Atlas AP_SOUTH_1; Brevo; Swagger UI at /swagger-ui.html.

### root README.md (read LAST)
- Confirms: multi-broker tracker, mandatory TOTP 2FA, AES-256-GCM at rest, refresh-token
  rotation, Google SSO, rate limiting on login/sensitive endpoints, 41 calculators,
  alternative assets modules, Swagger UI, keep-alive cron.
- Documents env vars incl. ZERODHA/ANGELONE/UPSTOX redirect URLs and broker base paths as
  `/api/broker/{broker}/...` (singular) vs broker README's `/api/brokers/...` (plural) — D5.
- Keep-alive pings `/health` (root README) vs render.yaml healthCheckPath `/actuator/health`
  vs common README's documented `/api/health` — D6.
- Root README does NOT list GOOGLE_CLIENT_ID/SECRET in its env table though render.yaml requires
  them — D14.

---

## 3. Consolidated Config / Env Reference (Phase 2 — names & purpose only, NO values)

### Backend runtime (Spring Boot) — application*.properties + Dockerfile + render.yaml

| Variable | Purpose | Consumer | Required? | In render.yaml? |
|---|---|---|---|---|
| SPRING_PROFILES_ACTIVE | profile (prod in deploy) | Spring Boot | No (properties default dev; Dockerfile sets prod) | Yes (prod) |
| PORT | server port | Spring Boot | No (fallback 8080) | Render injects |
| MONGODB_URI | Atlas connection string | Spring Data MongoDB | Yes | sync:false (dashboard) |
| MONGODB_DB | database name (default Finance) | Spring Data MongoDB | No | not listed |
| JWT_SECRET | HMAC-SHA256 signing key (weak dev fallback exists in properties) | security/JWTService | Yes | sync:false |
| ENCRYPTION_SECRET_KEY | AES-256 key for app secrets (exactly 32 chars) → app.encryption.secret-key | common EncryptionUtil | Yes | sync:false |
| TOTP_ENCRYPTION_KEY | 64-hex AES key encrypting TOTP secrets | TotpEncryptionUtil | Yes (dev fallback exists) | sync:false |
| EMAIL_MAGIC_LINK_SECRET | JWT secret signing magic links → email.magic-link-secret | email module | Yes (dev fallback exists) | NOT listed |
| BREVO_API_KEY | Brevo transactional email API key | BrevoEmailService | Yes (prod) | sync:false |
| BREVO_SENDER_EMAIL / _NAME | verified sender identity | Brevo config props | No (defaults exist) | not listed |
| EMAIL_FROM / EMAIL_SUPPORT | From / support addresses in templates | EmailConfigProperties | No (defaults) | not listed |
| EMAIL_BASE_URL | frontend URL used inside magic links | email templates | Yes (prod) | Yes |
| EMAIL_API_BASE_URL | backend URL for static email assets | email templates | No (default localhost:8080) | Yes |
| FRONTEND_URL | frontend origin(s), comma-separated | redirect/link building | Yes | Yes |
| CORS_ALLOWED_ORIGINS | allowed origins → app.cors.allowed-origins | CorsConfig | Yes | Yes |
| ZERODHA_REDIRECT_URL | Zerodha OAuth callback (must match Zerodha console) | broker connect | Conditional | NOT listed |
| ANGELONE_REDIRECT_URL | Angel One OAuth callback | broker connect | Conditional | NOT listed |
| UPSTOX_REDIRECT_URL | Upstox OAuth callback | broker connect | Conditional | NOT listed |
| GOLDAPI_KEY / GOLD_API_KEY | GoldAPI.io provider key (either name accepted) | goldsilver MetalPriceProvider | Yes (LIVE rates) | NOT listed |
| GOLDAPI_MONTHLY_LIMIT / _SAFETY_BUFFER | quota tuning (defaults 100 / 5) | GoldApiUsageService | No | not listed |
| GOOGLE_CLIENT_ID / _SECRET | Google SSO OAuth client | Google login | For SSO | sync:false |
| GOOGLE_REDIRECT_URI | Google OAuth redirect | Google login | For SSO | Yes |

Non-secret properties of note: auto-index-creation=true; totp.issuer=CoinTrack,
totp.window=1 (wired to TotpService code-verification drift), totp.max-backup-codes=10
(wired to backup-code generation); magic link expiry 10 min; Thymeleaf cache off in
dev/on in prod; actuator exposure `*` in base properties but narrowed to `health` in prod
profile; throw-exception-if-no-handler-found=true.

### Test configs
- test `application.properties`: Flapdoodle embedded Mongo 5.0.5 + dummy 32-char encryption key.
- `application-test.properties`: embedded Mongo 7.0.9; clearly-marked dummy jwt/totp/magic-link
  secrets; excludes MailSenderAutoConfiguration.

### Frontend (.env / Vercel)

| Variable | Purpose | Required? |
|---|---|---|
| NEXT_PUBLIC_API_BASE | backend base URL (also drives next.config rewrites) | Yes |
| NEXT_PUBLIC_APP_URL | frontend public URL for OAuth callbacks | README: yes; root README: optional (drift) |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | Google SSO client id (public by design) | For SSO |
| IFSC_API_KEY | "Bank Name and IFSC Provider API Key" — secret-looking value present in file; no README documents it | undocumented |
| NEXT_PUBLIC_APP_NAME / _APP_VERSION | display metadata | No |
| NEXT_PUBLIC_ENABLE_WEBSOCKETS / _NOTIFICATIONS / _DEBUG | feature flags | No — no README explains them |

### pom.xml dependency → capability map
Spring Boot 3.5.5 parent, Java 21. Starters: web, security, data-mongodb, webflux,
validation, thymeleaf (+springsecurity6 extras), actuator.
- jjwt 0.12.5 → JWT sign/validate
- spring-dotenv 4.0 → loads backend/.env locally
- dev.samstevens.totp 1.7.1 → TOTP code generation/verification
- ZXing 3.5.3 → QR codes for 2FA setup
- BouncyCastle bcprov-jdk18on 1.78 → AES crypto provider
- Bucket4j core 8.7 → calculator rate limiting
- ~~Caffeine → in-memory JWT blacklist cache~~ REMOVED 2026-08-23 (was never used in code; JwtFilter queries MongoDB directly)
- SpringDoc OpenAPI 2.8.6 → Swagger UI
- Apache POI 5.3.0 → XLSX exports (FD/PPF/EPF/MF/GoldSilver)
- Lombok 1.18.40; Flapdoodle embedded Mongo (tests)
- Explicitly REMOVED per comments: Kite Connect SDK (WebClient used directly),
  spring-boot-starter-mail (Brevo API replaces SMTP)
- spring-boot-maven-plugin with layered JARs enabled.

### package.json files
- frontend/package.json v3.0.0: Next ^16.2.6, React 18.3.1, React Query ^5.90.12, Axios,
  Framer Motion, Radix UI set, react-hook-form, Recharts ^3.8.0, sonner, tailwind-merge;
  dev: Jest 29 + Testing Library, Cypress 13, ESLint ^8.57, Prettier, Husky, Tailwind 3.4.14.
  Engines node>=18.17 / npm>=9. Scripts incl. `check` and `verify` gates.
- backend/scripts/package.json: standalone Node utility deps (bcryptjs, dotenv, inquirer,
  mongodb driver) — DB maintenance scripts; not part of runtime build.

### Dockerfile & render.yaml structure
- Multi-stage build: Maven 3.9.9 Temurin 21 Alpine builder w/ BuildKit m2 cache +
  dependency-layer caching → layertools extract → JRE 21 Alpine runtime, non-root appuser,
  curl HEALTHCHECK against `/actuator/health`, container-aware JVM flags (G1,
  MaxRAMPercentage=75), exec-form entrypoint honoring PORT.
- render.yaml: docker runtime, region oregon (comment notes singapore option), plan free,
  healthCheckPath `/actuator/health`, autoDeploy main. Secrets as sync:false; non-secret URLs
  hardcoded to localhost+prod pairs.

### Security concerns found (Phase 2 — values never reproduced)
- `backend/.env` and `frontend/.env` are gitignored/untracked (verified), BUT both contain
  **live-looking secret values**: Atlas URI with embedded username/password, JWT secret,
  Brevo API key, GoldAPI key, Google client secret (backend), IFSC API key + Google client ID
  (frontend). Anyone with workspace/file access has production-grade credentials. Recommend
  rotation if ever committed historically, and moving to a secrets manager.
- In `backend/.env`, `EMAIL_MAGIC_LINK_SECRET` is set to the SAME value as the Brevo API key
  (secret reuse across two unrelated purposes — bad practice; a distinct random secret exists
  in the commented prod block).
- Weak dev fallback defaults exist in `application.properties` for `jwt.secret`,
  `totp.encryption-key`, and `email.magic-link-secret` — safe only if env vars always set in prod.
- Base `application.properties` exposes all actuator endpoints (`*`); only the prod profile
  narrows it to health. Devtools enabled by default in base properties.

---

## 4. Discrepancies Found So Far

**D1. Module count drift.** ✅ FIXED (2026-08-23). backend/README.md updated:
§3 "8 domain modules" → **13**; mermaid diagram "Backend Core (8 Modules)" → **(13 Modules)**;
§20 stats "Total Modules 8" → **13**; §4 Module Directory table gained the missing
**mutualfund** row (now 13 rows, consistent with folder structure & collection list);
§21 Documentation Index also gained the missing Mutual Fund entry.
(Original finding: §1/§3 said 8 modules and §4 listed 12, omitting mutualfund.)

**D2. Calculator count drift.** ✅ FIXED (verified against source 2026-08-23).
Actual: backend has **33 endpoints** across 6 controllers (8 investment + 6 loans + 10 savings +
6 tax + 2 trading + 1 planning); **29 request / 30 response DTO files** on disk; frontend has
**32 calculator pages** (no `mutual-fund-returns` page, so Investment=7 in UI vs 8 endpoints).
Updated: root README (7 spots), backend README (6 spots incl. §20 stats), calculator module
README (29/30 DTO counts), frontend README ("32 pages"). All "41" claims removed.

**D3. Broker architecture drift.** ✅ FIXED. Source confirms the hexagonal architecture is
current: `BrokerAdapter` port, `adapters/{zerodha,angelone,upstox}` with mapper/+raw/,
`BrokerAdapterRegistry`, canonical models in `broker/core/canonical/`. No `BrokerService`
interface or `BrokerServiceFactory` exists. Broker module README rewritten to v3.0.0
(architecture diagram, directory structure, services section). Capability matrix corrected:
Angel One & Upstox DO have ORDER_HISTORY + TRADE_HISTORY (verified from each adapter's
`getCapabilities()` EnumSet); only MF_* and LIVE_QUOTES are Zerodha-only.

**D4. Portfolio storage naming drift.** ✅ FIXED. Source uses canonical_* collections
(`@Document(collection = "canonical_holdings")` etc. in broker/core/canonical/) +
`sync_cooldowns` (plural) + `market_prices` + `sync_logs`. Portfolio README renamed throughout
(Cached→Canonical), added CanonicalMfHolding + SyncCooldown rows and a location note that the
entity classes live under broker/core/canonical/. Backend README: sync_cooldown → sync_cooldowns.

**D5. Broker endpoint base path drift.** ✅ FIXED. Verified truth: base `/api/brokers`
(plural); Zerodha bridge at root-level `/zerodha/callback` (no /api prefix) redirecting to
`${frontend.url}/brokers/zerodha/callback`; no GET /connected; disconnect exists only for
AngelOne (POST). Updated broker README (§4, §9, flow diagram), security README SecurityConfig
snippet + route tables. Also removed the dead `zerodha|angelone|upstox.redirect.url` properties
from application*.properties — zero source references, defaults pointed at non-existent
endpoints (/api/kite/callback).

**D6. Health endpoint drift.** ✅ RESOLVED (not a bug). All three paths exist and are permitted:
`/api/health` + `/api/health/ping` + `/health` are real HealthController mappings;
`/actuator/**` also exposed (prod limits to health) and used by Docker HEALTHCHECK /
render.yaml healthCheckPath. Common README now documents all of them.

**D7. TOTP endpoint drift.** ✅ FIXED. Actual mappings (TotpController, base `/api/auth`):
POST `/2fa/setup`, `/2fa/verify`, `/login/totp`, `/login/recovery`, `/2fa/reset`,
`/2fa/reset/verify`, GET `/2fa/status`, `/2fa/register/setup`, `/2fa/register/verify`.
UserController actually serves `/api/users/me` (+ /me/password, DELETE /me) — not /{id} paths.
AuthController has /refresh, /logout, /oauth2/google, /oauth2/complete-profile.
User README §4 rewritten with stale-path note.

**D8. Collections per module inconsistent.** ✅ FIXED via full `@Document` scan (33 collections).
Key truths: `epf_settings`/`ppf_settings`/`metal_rate_settings` are EMBEDDED in users docs
(EpfSettingsEmbed etc.); EPF interest rates come from YAML `configs/epf-rates.yml`; purity
options are an in-memory bean list; mutualfund owns 5 extra collections (mf_portfolio_holdings,
mf_portfolio_metrics, mf_latest_prices, mf_historical_nav_cache); `counters` belongs to common;
sync cooldown collection is plural. Backend README master table rebuilt (32 collections);
epf/goldsilver/ppf module READMEs corrected.

**D9. Refresh-token feature undocumented in module READMEs.** ✅ FIXED. user README gained
§6.3 RefreshToken (`refresh_tokens`, rotated on POST /api/auth/refresh) + §6.4
PendingRegistration; security README components table now documents InvalidatedToken
blacklist (TTL-indexed) + Caffeine first-pass check + refresh-token cross-reference.

**D10. Encryption algorithm contradiction.** ✅ FIXED. EncryptionUtil source = AES-256-GCM
(`AES/GCM/NoPadding`, 12-byte IV, 128-bit tag). common README's AES-256-CBC claim replaced.

**D11. Notes pagination contradiction.** ✅ FIXED. Root README was right: source returns
`Page<Note>` via getNotesPaginated(userId, page, size, search, tag) incl. text search + tag
filter. notes README endpoints section updated; pagination/search marked implemented in
Future Enhancements.

**D12. Encryption env var naming inconsistency inside common.** ✅ FIXED. Source reads only
`app.encryption.secret-key` ← ENCRYPTION_SECRET_KEY (32 chars, fail-fast validation); there is
no ENCRYPTION_KEY/SALT pair. common README §4.2 rewritten.

**D13. GoldSilver endpoint coverage gap (README↔README).** ✅ FIXED. GoldSilverController
verified: full surface is CRUD `/api/gold-silver` (+/{id}), `/summary`, all rates/purity/
rate-settings/rate-mode/market-rate endpoints, and `/export`. Module README endpoint table
replaced with the verified 15-endpoint list. Also: `POST /purity-options` does NOT exist
(GET only) — noted in module README; root README was right to list CRUD/summary/export.

**D14. Env-var cross-check gaps.**
✅ FIXED:
- render.yaml now includes EMAIL_MAGIC_LINK_SECRET (sync:false), GOLDAPI_KEY (sync:false),
  GOLDAPI_MONTHLY_LIMIT=100, GOLDAPI_SAFETY_BUFFER=5, MONGODB_DB=Finance.
- Root README env table gained GOOGLE_CLIENT_ID/_SECRET/_REDIRECT_URI,
  EMAIL_MAGIC_LINK_SECRET, GOLDAPI_KEY rows.
- Dead ZERODHA/ANGELONE/UPSTOX_REDIRECT_URL vars removed from application.properties,
  application-dev.properties and root README (zero source references).
- Frontend README env table now documents NEXT_PUBLIC_GOOGLE_CLIENT_ID, IFSC_API_KEY,
  APP_NAME/VERSION and the three feature flags.

**D15. Version drift (docs vs package.json).**
✅ FIXED. frontend README tech table aligned to package.json: Next ^16.2.6, Recharts ^3.8.0,
ESLint ^8.57.0; Yup marked "not currently a dependency". notes README §12.3 flagged that
react-markdown/remark-gfm are referenced but not installed (add before use).

**D16. Region mismatch.**
✅ FIXED. render.yaml region oregon → **singapore** (closest Render region to Atlas
AP_SOUTH_1/Mumbai), with an explanatory comment. NOTE: this changes where the Render
blueprint will deploy next time it's applied — revert if oregon was intentional.

**D17. Missing referenced files.**
✅ FIXED.
- Created `backend/.env.example` (placeholders only, no real values) — the file
  application-dev.properties told users to copy.
- Stale `../../docs/*` architecture-guide links in broker/portfolio READMEs struck through
  with "no longer exists" notes (the docs/ directory does not exist anywhere in the repo).
- Created root `LICENSE` (MIT, per the badge + license claim in both READMEs; copyright
  "Urva Gandhi" — adjust if a different holder/name is wanted).

**D18. CORS oddity.**
✅ FIXED. CorsConfig source reads origins exclusively from `app.cors.allowed-origins`
(← CORS_ALLOWED_ORIGINS) via setAllowedOriginPatterns; there are no hardcoded origins.
common README §4.1 snippet replaced with the property-driven version + note. The inclusion of
the backend's own onrender.com URL in allowed origins remains harmless copy-paste residue in
.env/render.yaml values (left as-is; no functional issue).

---

## Resolution status

~~Per rules/01, Part 1 originally stopped before reading source code, deferring D3/D4-style
ambiguities to Part 2.~~ Superseded on 2026-08-23: **all 18 discrepancies (D1–D18) were
resolved** by verifying each against actual module source (controllers, models, adapters,
configs) and fixing the docs/configs accordingly — including the previously deferred
D3 (broker architecture) and D4 (portfolio storage naming). No discrepancies remain open;
Part 2 (per-module deep source review) can proceed with a clean baseline.

---

## ADDENDUM (2026-08-23, post-snapshot — Part 2 supersedes where they differ)

This file is a point-in-time Phase-1 record; later fix rounds changed reality after it was
written. Key evolutions tracked authoritatively in PROJECT_CONTEXT_PART2.md:

- **MFA route rename (post-user-module-audit)**: all TOTP/2FA HTTP endpoints moved twice —
  `/api/auth/2fa/*` + `/login/totp|recovery` → `/api/auth/totp/*` → final
  **`/api/auth/mfa/*`** (setup, verify, login, **login-recovery**, reset, reset/verify,
  status(GET), register/setup, register/verify). Email module's TwoFactorRecoveryController
  moved to `/api/auth/mfa/email-recovery(+/verify)`.
  ⚠→✅ **Collision found and FIXED**: round 4 briefly mapped POST `/api/auth/mfa/recovery` in
  BOTH TotpController (`base /api/auth/mfa` + `@PostMapping("/recovery")`) and
  TwoFactorRecoveryController (`base /api/auth` + `@PostMapping("/mfa/recovery")`) — an
  ambiguous Spring mapping that `mvn compile` cannot catch and that would have failed
  context startup. Round 5 split it semantically: TotpController backup-code login =
  `POST /api/auth/mfa/login-recovery`; email magic-link reset =
  `POST /api/auth/mfa/email-recovery(+/verify)`; SecurityConfig whitelist matches exactly;
  frontend api.js realigned; compile re-verified clean. No conflict remains.
- **JWT purpose claims UNCHANGED in code**: still `TOTP_LOGIN`, `TOTP_SETUP`,
  `TOTP_REGISTRATION`, `PROFILE_COMPLETION` (grep-verified). Any doc saying `MFA_LOGIN`
  etc. describes aspiration, not code. Field names (`totpEnabled`, `totpSecretVersion`, …),
  class names (TotpController, TotpService), properties (`totp.*`) also unchanged.
  Known residual gap: `UserAuthenticationService.isTokenValid` (separate copy used by
  TotpController.resolveUser's access-token fallback) still skips the blacklist check —
  see Part 2 user-card discrepancy #11.
- D7's "final" resolution flipped direction twice during these rounds; see Part 2 user-card
  discrepancy #2 for the full trail.
- **PPF `counters` claim CORRECTED**: Part 1 §2 "counters (shared sequences)" implied PPF
  writes to the `counters` collection directly. It does NOT — `transactionNo` is set to `0L`
  on create, then rewritten by `TransactionSequenceService.reorderPpfTransactions`. The
  `counters` collection is never touched by PPF code. The dead `SequenceGeneratorService`
  import in `PpfTransactionServiceImpl` was removed 2026-08-26 (same cleanup as FD).
  Settings (`PpfSettingsEmbed`) are embedded in the `users` document — no separate
  `PpfSettingsRepository` exists (the README §3 directory tree listed a phantom file that
  was corrected in README v1.3.0).
- **PPF off-by-one FIX applied** (2026-08-26): `PpfWithdrawalValidationService` previously
  computed `completedFYs = currentFyStartYear - openingFyEndYear` which undercounted by 1.
  Fixed to `currentFyStartYear - openingFyStartYear`. Lock-in check updated from
  `completedFYs < 6` to `completedFYs < 7`. Loan eligibility updated from
  `completedFYs >= 2 && <= 5` to `completedFYs >= 3 && <= 7`. See Part 2 ppf-card
  discrepancy D4 for the full analysis.

