# CoinTrack — MongoDB → PostgreSQL Migration Plan (Industry Standard)

> **Status: APPROVED PLAN — ready for execution**
> Scope: migrate the entire CoinTrack backend from MongoDB (Spring Data MongoDB) to
> PostgreSQL (Spring Data JPA + Hibernate + Flyway). Execution is module-by-module,
> in the exact order specified, one module per PR/commit, stopping for confirmation
> after each module.
>
> Companion doc: `opencode_prompt_postgres_migration.md` (the 9-module source-of-truth
> requirements). This plan operationalizes it with reconciliation, infra, sequencing,
> rollback, and checklists.
>
> ⚠️ **OUT OF SCOPE (future reference, do NOT do now):** the `calculator` module is a
> candidate to move to the **frontend** in a future effort. It is deliberately OUT OF SCOPE
> for this migration and must be left untouched. Details: Decision Log row 11 + Appendix D.

---

## 1. Objective & Guiding Principles

### 1.1 Objective
Move all persistent state from MongoDB Atlas to PostgreSQL while preserving the exact
REST contract, every business rule, every calculation, and the live production data.

### 1.2 Non-Negotiable Rules (carried from source MD)
1. Use Spring Data JPA + Hibernate. Remove `spring-boot-starter-data-mongodb` ONLY after the final module.
2. Flyway for schema migrations; one versioned SQL file per module: `V{n}__{module}.sql`.
3. Money/units: `BigDecimal` → `NUMERIC(19,4)` (money) or `NUMERIC(19,6)` (units/NAV/rates). Never DOUBLE/FLOAT.
4. PKs: `UUID` (`@Id @GeneratedValue(strategy = GenerationType.UUID)`), not ObjectId strings, not auto-increment.
5. Every FK becomes a real `@ManyToOne`/`@JoinColumn` + DB `FOREIGN KEY`. App-level ownership checks remain for authorization only.
6. Delete-block logic → `ON DELETE RESTRICT` at the DB; remove manual repo-scan blocks.
7. `raw: Map<String,Object>` → `JSONB` via `@JdbcTypeCode(SqlTypes.JSON)`.
8. Sequential display IDs → per-user numbering (see §10 — corrected understanding).
9. Timestamps via `@CreatedDate`/`@LastModifiedDate` + `@EntityListeners(AuditingEntityListener.class)`.
10. Preserve every REST contract; controllers/DTOs change only if a field type changes (ObjectId → UUID).
11. Preserve every business rule exactly; re-platform, do not redesign.
12. Per module: entities → Flyway → repos → service swap → tests → one-time data migration runner → verification report → STOP for confirmation.
13. Verify row counts + monetary sums between Mongo and Postgres per module; report numbers.
14. No hybrid run-time state: a module reads from exactly one DB per release.

---

## 2. Decided Architecture Decisions (locked)

| # | Decision | Chosen | Rationale (industry standard) |
|---|----------|--------|-------------------------------|
| 1 | Settings embeds (`ppf_settings`, `epf_settings`, `metal_rate_settings`) | **Separate FK tables** | Embedded JSONB attrs aren't queryable/indexed/constraint-protected; they feed service-layer calc logic. Promote to `user_id`-FK tables, `UNIQUE(user_id)` |
| 2 | EPF interest rates | **DB table** seeded from YAML | Reference data that changes annually belongs in DB; updates without re-deploy; `UNIQUE(financial_year)` |
| 3 | Metal purity options | **DB table** seeded from config | Real FK enforcement per MD; stable static set |
| 4 | Module 2 cache loads | **Skip migration**; migrate `broker_accounts` only | Cache is resyncable from broker APIs; credentials are not |
| 5 | Production Postgres hosting | **Supabase** (managed Postgres) | Free tier, managed, pooling (Supavisor); requires TLS |
| 6 | Tests | **Testcontainers** (Postgres) replacing Flapdoodle | Flapdoodle is Mongo-only; Testcontainers is the industry standard for JPA integration tests |
| 7 | Enums | `VARCHAR` + DB `CHECK` | Zero-friction with Spring Data; keeps special `GainType` string mapping |
| 8 | Global DB concern wiring | Replace `MongoTransactionManager` + `@EnableMongoAuditing` | JPA auto-configures `JpaTransactionManager`; `@EnableJpaAuditing` |
| 9 | GoldApiUsageService storage | **No migration** (in-memory) | Verified: volatile cache + live `/api/stat` fetch; no DB/Mongo persistence to migrate |
| 10 | `metal_rate_snapshots` history | **Migrate** (do not repopulate) | Lossless; preserves historical `fetched_at`; repopulation would rewrite history and burn GoldAPI quota |
| 11 | Calculator module relocation | **NOT now — future reference only** | Possible future move to frontend; OUT OF SCOPE for this migration; untouched here (see Appendix D) |

---

## 3. DISCREPANCY LOG: MD assumptions vs verified reality

These were reconciled during exploration and must be respected during execution:

| # | MD/assumption | Verified reality | Consequence |
|---|---------------|------------------|-------------|
| D1 | Sequence IDs may be global | `SequenceGeneratorService.getNextSequence("epf_txn_no_"+userId)` is **per-user**; `TransactionSequenceService` renumbers `fdNo`/`transactionNo`/`itemNo` **1..N per user** async by date | Do NOT use one global sequence. Preserve per-user reorder semantics. See §10 |
| D2 | Separate `ppf_settings`/`epf_settings`/`metal_rate_settings` collections | Settings are **embedded inside `users`** (`*Embed` classes) | Promote to FK tables (Decision 1) |
| D3 | `epf_interest_rates` DB table | Rates in YAML (`configs/epf-rates.yml`, 2016→2025) | Create + seed table (Decision 2) |
| D4 | `metal_purity_options` DB table | `PurityOption` is in-memory (`PurityOptionConfig` bean, 5 options) | Create + seed table (Decision 3) |
| D5 | `GainType` plain enum | Custom Mongo converters map `STCG_LTCG`↔`"STCG/LTCG"`, `STCL_LTCL`↔`"STCL/LTCL"` | Preserve mapping via JPA `AttributeConverter` or mapper; store VARCHAR |
| D6 | FD status includes `CLOSED` sticky override | Actual enum: `ACTIVE, DUE, MATURED, PREMATURELY_WITHDRAWN` | Port the real enum exactly |
| D7 | `YearMonth` custom converter registered | Registered in MongoConfig; not used on any persisted `@Document` field | No Postgres impact; do not port unless needed later |
| D8 | All `_id` are ObjectId strings; `MutualFundLtp` uses `@Id = schemeCode` natural key | Verified | All table PKs = UUID except `mf_latest_prices` where `scheme_code` becomes PK/unique |
| D9 | `@Aggregation`/`@Query` usage | Only 2 repo custom Mongo queries (`NoteRepository`, `RefreshTokenRepository`) + 1 `$regex` search + several MongoTemplate services | Enumerate and convert each (Module tables below) |
| D10 | Mongo `findAndModify` used in `UserService` | Verified Google OAuth upsert | Convert to JPA upsert/save |

---

## 4. Target Environment & Connection Strategy (Supabase)

### 4.1 Connection
- Postgres **host**: Supabase-managed. Prefer **transaction-mode pooler** host for the running app:
  `jdbc:postgresql://<project-ref>.pooler.supabase.com:6543/postgres?sslmode=require`
- Direct DB host (`db.<ref>.supabase.co:5432`) acceptable for Flyway migrations / CLI, with `?sslmode=require`.
- **TLS is mandatory**: every datasource URL (app + migrations) MUST carry `sslmode=require`.

### 4.2 `application.properties` (base)
```properties
# PostgreSQL / Supabase (replaces spring.data.mongodb.*)
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/cointrack?sslmode=require}
spring.datasource.username=${DB_USERNAME:cointrack}
spring.datasource.password=${DB_PASSWORD:}
spring.datasource.hikari.maximum-pool-size=10

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
spring.jpa.properties.hibernate.jdbc.time_zone=UTC

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
```
- `ddl-auto=validate`: schema is Flyway-owned; Hibernate only validates. Never `create`/`update` in any profile.
- `open-in-view=false`: prevents lazy-loading across HTTP response rendering; forces written fetch-join/`@EntityGraph` patterns.
- Keep `spring.data.mongodb.*` in place ONLY until their module's cutover; remove per Final Step.

### 4.3 Profile overrides
- `application-dev.properties`: local Postgres defaults; dev may use Testcontainers or a local `postgres:16` container.
- `application-prod.properties`: add `spring.datasource.url=${DATABASE_URL}` + `hikari` tuning; remove `spring.data.mongodb.auto-index-creation` line.
- `application-test.properties`: Testcontainers Postgres, Flyway `clean-migrate` per test class, dummy secrets preserved.

### 4.4 Supabase-specific setup
- Create a dedicated DB user/roles if privileges allow; otherwise use the `postgres` role provisioned by Supabase.
- Set `DATABASE_URL` in Render + `render.yaml` as a sensitive (`sync: false`) env var.
- Migrations run via Flyway on deploy; run `mvn flyway:migrate` (or app auto-migrate at startup) against a deploy-drained maintenance slot.

---

## 5. Test Strategy

Replace the Mongo-based test infrastructure:

| Current | Replacement |
|---------|-------------|
| Flapdoodle embedded Mongo (5.0.5 / 7.0.9, rs0) | **Testcontainers** `org.testcontainers:postgresql` + `junit-jupiter` |
| `@DataMongoTest` (`CanonicalUpsertIntegrationTest`) | `@DataJpaTest` + Testcontainers |
| `MongoTransactionSupportTest` (verifies `MongoTransactionManager`) | `@SpringBootTest` verifying `JpaTransactionManager` + `@Transactional` rollback/commit on Postgres |
| `@SpringBootTest` scratch tests (`@Disabled`: `MfDataMigrationRunnerTest`, `RedemptionBackfillTest`, `MutualFundBackfillRunnerTest`, `SipCalculationTest`) | Not ported as tests; superseded by data-migration runners |

Testcontainers dependency additions:
```xml
<dependency>
  <groupId>org.testcontainers</groupId><artifactId>postgresql</artifactId><scope>test</scope>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId><artifactId>spring-boot-testcontainers</artifactId><scope>test</scope>
</dependency>
```

Guidelines:
- Every migrated module gets: entity mapping test, repository query test, service business-rule test, and (where logic changed) before/after regression test.
- FIFO engine in Module 8 gets dedicated regression tests against the full Krishil dataset.
- `spring.jpa.hibernate.ddl-auto=validate` in tests ensures Flyway schema and entities stay in sync.

---

## 6. Phase 0 — Foundation (do once, before Module 1)

This is the only part done outside the per-module cadence. It sets up dependencies,
DB wiring, and removes Mongo transaction/auditing scaffolding — without removing the
MongoDB starter, so nothing else breaks yet.

### 6.1 Build (`backend/pom.xml`)
- [ ] Add `spring-boot-starter-data-jpa`
- [ ] Add `org.postgresql:postgresql` (runtime)
- [ ] Add `org.flywaydb:flyway-core` and `org.flywaydb:flyway-database-postgresql` (version managed by Spring Boot BOM)
- [ ] Add Testcontainers Postgres + `spring-boot-testcontainers` (test)
- [ ] KEEP `spring-boot-starter-data-mongodb` (remove only in Final Step)

### 6.2 DB wiring & config
- [ ] Add datasource/JPA/Flyway props (§4.2) to `application.properties`, `-dev`, `-prod`, and test props
- [ ] Create `backend/src/main/resources/db/migration/` (Flyway home)
- [ ] Set `ddl-auto=validate`, `open-in-view=false`

### 6.3 Remove Mongo scaffolding (global)
- [ ] `FinanceDashboardApplication`: `@EnableMongoAuditing` → `@EnableJpaAuditing`
- [ ] `common/config/MongoTransactionConfig.java`: delete (`MongoTransactionManager`); rely on auto-configured `JpaTransactionManager`
- [ ] `common/MongoConfig.java`: delete `MongoCustomConversions` bean; implement `GainType` mapping as a JPA `AttributeConverter` (or a mapper) in the mutualfund module (Module 8); drop `YearMonth` converters (D7)
- [ ] `common/health/HealthController.java`: replace `MongoTemplate` DB probe with `DataSource`/`JdbcTemplate` (`SELECT 1`) — lines ~277/286
- [ ] `common/config/StartupLogger.java`: replace `mongoTemplate.executeCommand("ping")`-based `checkDatabaseConnection()` with JDBC ping; remove `${spring.data.mongodb.database}` reference

### 6.4 Dev infrastructure
- [ ] `docker-compose.yml`: add `postgres:16` service (keep `mongodb` until Final Step) OR use local Postgres/Testcontainers
- [ ] `.env*`, `render.yaml`, `backend/Dockerfile`, `DOCKER.md`: add `DATABASE_URL`/`DB_USERNAME`/`DB_PASSWORD`; keep Mongo vars until Final Step

### 6.5 Quality gates
- [ ] `./mvnw -q test-compile` compiles green
- [ ] `./mvnw spotless:apply` formatting clean
- [ ] `./mvnw checkstyle:check` no new violations
- [ ] Full context test boot (Testcontainers) green

**Definition of Phase 0 done:** app boots against Postgres (Flyway applies), all existing
Mongo-based tests still pass (they use a Mongo profile), and no business logic changed.

---

## 7. Module 1 — `user` + `security`

**Why first:** every other table has a `user_id` FK into this module.

### 7.1 Tables (Flyway `V2__user_security.sql`)
- `users` — PK uuid; uniques: `email`, `username`, `phone_number`, `google_id` (all nullable, use partial unique index `WHERE x IS NOT NULL` to mirror Mongo sparse unique); all auth/TOTP/verification columns
- `ppf_settings` — `user_id` FK UNIQUE (promoted from `PpfSettingsEmbed`)
- `epf_settings` — `user_id` FK UNIQUE (promoted from `EpfSettingsEmbed`)
- `metal_rate_settings` — `user_id` FK UNIQUE (promoted from `MetalRateSettingsEmbed`)
- `backup_codes` — `user_id` FK; `UNIQUE(user_id, code_hash)`; `generation` int
- `pending_registrations` — self-contained (no user FK yet); `temp_token UNIQUE`, `google_id UNIQUE NULL`; `expires_at`
- `refresh_tokens` — `user_id` FK; `token_hash UNIQUE`; `expires_at`
- `invalidated_tokens` — `token_hash` (PK or unique); `expires_at`; no user FK required (per MD)

### 7.2 TTL → scheduled cleanup (Mongo TTL has no Postgres equivalent)
Create a `@Scheduled` purge component (fixed-delay) deleting:
- `pending_registrations` where `expires_at < now()` (15-min window)
- `refresh_tokens` where `expires_at < now()`
- `invalidated_tokens` where `expires_at < now()`
Preserve the original expiry windows exactly.

### 7.3 Repository conversions
| Mongo repo/method | JPA replacement |
|-------------------|-----------------|
| `RefreshTokenRepository.revokeAllByUserId` (`@Query`+`@Update` `$set`) | `@Modifying @Query("UPDATE RefreshToken t SET t.revoked=true WHERE t.userId=:userId AND t.revoked=false")` |
| `UserRepository` derived finders | identical derived methods on `JpaRepository<User, UUID>` |
| `PendingRegistrationRepository` | identical derived methods |
| `BackupCodeRepository` | identical derived methods |
| `UserDeletionAuditRepository` | identical derived methods |
| `InvalidatedTokenRepository` | identical derived methods |

### 7.4 Service swaps
- `UserService.findAndModify` (Google OAuth `PendingRegistration` upsert) → typed `save`/upsert with existence check (D10)

### 7.5 Data migration: `migration/UserMigrationRunner.java`
- `CommandLineRunner`, gated `@Profile("migrate-user")`
- Reads Mongo `users` → Postgres `users` producing a **UUID mapping**: `old ObjectId string → new UUID` (also needed for all later modules)
- Then migrate dependents in FK order: settings (3), `backup_codes`, `pending_registrations`, `refresh_tokens`, `invalidated_tokens`
- TOTP secrets pass through encrypted (AES-256-GCM) **verbatim** — do not decrypt/re-encrypt
- Preserve username/email/phone normalization as currently applied

### 7.6 Verification
- [ ] Row counts: each new table == Mongo collection count (report numbers)
- [ ] Spot-check a user's TOTP still validates (round-trip with `totpSecretEncrypted`)
- [ ] Unique-constraint violations raise cleanly (tests)
- [ ] Login/register/refresh/logout e2e smoke on Postgres

### 7.7 Checklist
- [ ] Entities (UUID PK + real FKs), settings tables promoted
- [ ] `V2__user_security.sql`
- [ ] JPA repos cover all derived methods
- [ ] `@Scheduled` TTL purges
- [ ] Services read only JPA at runtime
- [ ] Tests green (Testcontainers)
- [ ] `UserMigrationRunner` + `migrate-user` profile; verification report
- [ ] **STOP — await confirmation**

---

## 8. Module 2 — `broker` + `portfolio` (cache layer)

**Why second:** lowest risk (resyncable), validates JSONB + migrate tooling before touching irreplaceable ledger data.

### 8.1 Tables (Flyway `V3__broker_portfolio.sql`)
- `broker_accounts` — `user_id` FK; wide credential table; encrypted secrets as TEXT; `is_active`; many `last_*_sync` timestamps
- `canonical_holdings` — `user_id` FK, `broker_account_id` FK, `raw` JSONB
- `canonical_positions` — `user_id` FK, `broker_account_id` FK, `raw` JSONB
- `canonical_funds` — `user_id` FK, `broker_account_id` FK, `raw` JSONB
- `canonical_mf_holdings` — `user_id` FK, `broker_account_id` FK, `raw` JSONB
- `canonical_mf_orders` — `user_id` FK, `broker_account_id` FK, `raw` JSONB
- `market_prices` — **global**, no user FK; `updated_at` + scheduled purge (15s TTL) for staleness
- `sync_logs` — `user_id` FK; `timestamp` + 14-day purge
- `sync_cooldowns` — `user_id` FK UNIQUE; `expires_at` + purge

### 8.2 Service swaps
- `GoldSilverServiceImpl` / `LiveMetalRateServiceImpl` `BulkOperations` → JPA batch update (`saveAll` or `@Modifying` bulk update)
- Portfolio sync replace-on-write (`DELETE WHERE user_id AND broker` + bulk `INSERT`) → JPA `deleteByUserIdAndBrokerType` + `saveAll` (same semantics)
- `CanonicalUpsertIntegrationTest` → `@DataJpaTest` + Testcontainers

### 8.3 Data migration — SKIP cache (Decision 4)
- 🔴 Confirm with user, then: **do NOT migrate** `canonical_*`, `market_prices`, `sync_logs`, `sync_cooldowns` — repopulate via scheduling after cutover.
- **MUST migrate:** `broker_accounts` (encrypted credentials/tokens are non-reconstructible). Runner `migration/BrokerAccountMigrationRunner.java`, `@Profile("migrate-broker")`, reusing Module 1 UUID mapping.

### 8.4 Checklist
- [ ] Confirm cache-skip approach
- [ ] Entities + JSONB verified round-trip (serialize/deserialize test)
- [ ] `V3__broker_portfolio.sql`
- [ ] Bulk ops → JPA batch
- [ ] `BrokerAccountMigrationRunner` only
- [ ] Tests + verification
- [ ] **STOP — await confirmation**

---

## 9. Module 3 — `notes`

### 9.1 Table (Flyway `V4__notes.sql`)
- `notes` — `user_id` FK; `title`, `content`, `color`, `pinned`, timestamps; `tags TEXT[]`; index on `(user_id, pinned DESC, updated_at DESC)`

### 9.2 Repository conversions
- `findByUserIdOrderByPinnedDescUpdatedAtDesc` → identical derived (native `ORDER BY pinned DESC, updated_at DESC`)
- `searchByUserIdAndTerm` (`$regex` w/ `$or` on title/content) → JPQL:
  ```java
  @Query("SELECT n FROM Note n WHERE n.userId=:uid AND (LOWER(n.title) LIKE LOWER(CONCAT('%',:term,'%')) OR LOWER(n.content) LIKE LOWER(CONCAT('%',:term,'%')))")
  Page<Note> searchByUserIdAndTerm(String uid, String term, Pageable pageable);
  ```
- `findByUserIdAndTagsContaining` — verify exact semantics first (Spring Data Mongo `containing` on list = element match). If array-member equality: JPQL `WHERE :tag MEMBER OF n.tags` (or `= ANY`). Write a test to pin behavior before converting.
- `deleteByUserId` → derived

### 9.3 Data migration: `migration/NoteMigrationRunner.java`
- Read `notes` → Postgres `notes` with UUID mapping for `user_id`; convert `tags` to `TEXT[]`.

### 9.4 Checklist
- [ ] Entity (TEXT[] tags), `V4__notes.sql`
- [ ] Search + tags queries converted with pinned-behavior tests
- [ ] Service swap
- [ ] Tests + migrate-note runner + verification
- [ ] **STOP — await confirmation**

---

## 10. Module 4 — `fixeddeposit`

> 🔴 **Sequence semantics (D1):** `fdNo` is a per-user display number, renumbered 1..N by
> `TransactionSequenceService.reorderFixedDeposits` (async). **Do NOT use a single Postgres
> sequence.** Preserve the reorder algorithm, re-pointed to JPA repositories. This corrects
> MD Global Rule 8 / Module 4 note.

### 10.1 Table (Flyway `V5__fixed_deposit.sql`)
- `fixed_deposits` — `user_id` FK; all monetary fields `NUMERIC(19,4)`/`(19,6)` as applicable; `status` VARCHAR + CHECK; `issue_date`, `maturity_date`, all withdrawal-override fields; `fd_no BIGINT` (per-user display)
- `CHECK (maturity_date >= issue_date)` as second line of defense (service keeps validation too)
- index on `(user_id, issue_date)`

### 10.2 Sort engine conversions
- 6-mode sort; the **nearest-maturity** comparator (relative to today) currently a Mongo `Aggregation` in `FixedDepositServiceImpl` (lines ~721-775: `$match`→`$addFields($cond)`→`$sort`→skip/limit) → SQL:
  ```sql
  ORDER BY CASE WHEN maturity_date >= CURRENT_DATE THEN 0 ELSE 1 END, maturity_date ASC
  ```
  plus `$skip`/`$limit` → `Pageable` offset/limit. Other 5 modes → standard `ORDER BY` on derived/fetch queries.
- Status derivation stays in service layer (not a computed DB column).

### 10.3 Repository conversions
- `findByIdAndUserId`, `findByUserId`, `findByStatusNot`, `deleteByUserId` → derived JPA

### 10.4 Service swaps
- Re-point `TransactionSequenceService.reorderFixedDeposits` to JPA repo; keep `@Async` renumbering.
- Remove Mongo Template `count`/`find`/aggregation usage in `FixedDepositServiceImpl`.

### 10.5 Data migration: `migration/FixedDepositMigrationRunner.java`
- Read `fixed_deposits` → Postgres; map `user_id` UUID; preserve `fd_no` values; recompute nothing (status/amounts copied verbatim).

### 10.6 Verification
- [ ] Row counts equal
- [ ] Sum of `issue_amount`/`maturity_amount` per user matches Mongo
- [ ] Nearest-first ordering matches Mongo output on a known sample

### 10.7 Checklist
- [ ] Entity + `V5__fixed_deposit.sql` + CHECK + index
- [ ] Sort engine (6 modes) → SQL, regression tests on each mode
- [ ] `TransactionSequenceService` re-pointed to JPA
- [ ] Service swap, Tests, migrate-fd runner + verification
- [ ] **STOP — await confirmation**

---

## 11. Module 5 — `ppf`

### 11.1 Tables (Flyway `V6__ppf.sql`)
- `ppf_transactions` — `user_id` FK; `transaction_date`, `particular_type`, `debit_amount`, `credit_amount`, `balance`, `remarks`, `transaction_no` (per-user display), timestamps
- `ppf_settings` — `user_id` FK UNIQUE (promoted): `account_number`, `date_of_issue`, `extension_mode`

### 11.2 Business logic (port as-is)
- **Running balance:** recompute on insert/edit/delete sorted by `transaction_date ASC, created_at ASC`. Use a window function where practical:
  `SUM(credit_amount - debit_amount) OVER (ORDER BY transaction_date, created_at, id)`
  but **keep the app-layer negative-balance abort** (`InsufficientPpfBalanceException`) before commit. Do NOT rely on `CHECK (balance >= 0)`.
- Statutory withdrawal validation (lock-in period, 50% cap, 1-per-FY, post-maturity 60% block cap) — unchanged.
- FY (April–March) filtering — keep `FinancialYearUtil` as single source of truth; SQL `CASE` only if used in a query.
- `transaction_no` per-user → same reorder approach as FD (§10).

### 11.3 Repository conversions
- `findByIdAndUserId`, `findByUserId(uid, Sort)`, `deleteByUserId` → derived JPA; dynamic queries in `PpfTransactionServiceImpl` (count/find/findOne via MongoTemplate) → JPA `Specification`.

### 11.4 Data migration: `migration/PpfTransactionMigrationRunner.java`
- Read `ppf_transactions` → Postgres; preserve `transaction_no` and stored `balance`; migrate settings from embedded `PpfSettingsEmbed`.
- Verify per-user sum of credits/debits and final balance equals Mongo.

### 11.5 Checklist
- [ ] Entities + `V6__ppf.sql`
- [ ] Balance recalc (window fn + app abort), regression tests incl. negative-balance exception
- [ ] Statutory withdrawal validations preserved (tests)
- [ ] JPA `Specification` for dynamic queries
- [ ] migrate-ppf runner + verification of balances
- [ ] **STOP — await confirmation**

---

## 12. Module 6 — `epf`

### 12.1 Tables (Flyway `V7__epf.sql`)
- `epf_settings` — `user_id` FK UNIQUE: `default_basic_da`, `employee_contribution_rate`, `monthly_vpf_amount`, `use_actual_salary_for_eps`
- `epf_transactions` — `user_id` FK; `transaction_date`, `mode`, `basic_da`, `employee_contribution`, `employer_epf_contribution`, `employer_eps_contribution`, `vpf_amount`, `withdrawal_amount`, `epf_balance`, `eps_balance`, `transaction_no` (per-user), timestamps
- `epf_interest_rates` — `financial_year` UNIQUE, `rate_percent`, `effective_date`; **seed from `configs/epf-rates.yml`** (2016→2025, decision D3)

### 12.2 Business logic (port as-is)
- **Statutory contribution split** (12% / 8.33% / ₹1,250 cap / `useActualSalaryForEps`) unchanged.
- 🔴 **Critical — dual-balance interest accrual sim:** the 3-case monthly running-balance simulation (opening balance / withdrawals / new contributions, each with different interest-earning windows) **MUST remain a monthly Java simulation**. Do NOT replace with a single SQL aggregate (README explicitly warns against simplifying). Port verbatim.
- Recalc cascade on edit/delete throwing `InsufficientEpfBalanceException` — same as PPF.
- Taxability flag (>₹2,50,000 employee contribution + VPF in current FY) — computed in service.

### 12.3 Service swaps
- `EpfAnnualCreditScheduler`: `SequenceGeneratorService.getNextSequence("epf_txn_no_"+userId)` → per-user numbering (reorder or per-user sequence); `MongoTemplate.query(...).distinct("userId")` → JPA query `SELECT DISTINCT e.userId FROM EpfTransaction e`.
- `EpfTransactionServiceImpl` / `EpfInterestAccrualService`: MongoTemplate dynamic `count`/`find`/`findOne` → JPA `Specification`.

### 12.4 Data migration: `migration/EpfTransactionMigrationRunner.java`
- Read `epf_transactions` → Postgres; preserve `transaction_no`, `epf_balance`, `eps_balance`; migrate settings + seed `epf_interest_rates` from YAML (idempotent on `financial_year`).
- Verify per-user `epf_balance`/`eps_balance` and sums, FY by FY.

### 12.5 Checklist
- [ ] Entities + `V7__epf.sql` + interest-rate seed
- [ ] Accrual simulation ported verbatim with regression tests (before/after on EPF portfolio)
- [ ] Statutory contribution split preserved (tests)
- [ ] JPA `Specification` for dynamic queries; scheduler sequence swapped
- [ ] migrate-epf runner + FY-by-FY verification
- [ ] **STOP — await confirmation**

---

## 13. Module 7 — `goldsilver`

### 13.1 Tables (Flyway `V8__goldsilver.sql`)
- `gold_silver_investments` — `user_id` FK; `purity_option_id` FK → `metal_purity_options.id`; `metal_type`, `rate_source` (LIVE/MANUAL), all 9-step monetary fields, `item_no` (per-user display), status, timestamps
- `metal_purity_options` — seeded from `PurityOptionConfig` (id `gold-24k`, `gold-22k`, `gold-18k`, `silver-999`, `silver-925`; Decision 3): `id` (natural string PK or UUID + unique code), `metal_type`, `label`, `purity_factor`, `is_system_default`
- `metal_rate_snapshots` — 🔴 `@TimeSeries` (timeField `fetchedAt`, metaField `metalType`) → **plain table**: `metal_type`, `base_rate_per_gram`, `local_premium_percent`, `effective_base_rate`, `source`, `is_stale`, `fetched_at`; index `(metal_type, fetched_at DESC)`; retention purge for stale/old snapshots
- `metal_rate_settings` — `user_id` FK UNIQUE (promoted): `gold_local_premium_percent`, `silver_local_premium_percent`

### 13.2 Service swaps
- `GoldSilverServiceImpl` / `LiveMetalRateServiceImpl` `BulkOperations` → JPA batch update (per Module 2 §8.2)
- `MetalRateSnapshotRepository.findFirstByMetalTypeOrderByFetchedAtDesc` / `findTop10By...` → `Optional<...> findFirstByMetalTypeOrderByFetchedAtDesc` / `List<...> findTop10By...` on `JpaRepository` (identical derived names)
- `GoldApiUsageService` — **DECIDED: no migration needed.** Verified storage is **purely in-memory** (`volatile GoldApiUsageDTO cachedUsage` + `cachedAt`, 30-min TTL cache; stats fetched live from the GoldAPI `/api/stat` endpoint). There is **no DB or Mongo persistence** to migrate — it repopulates itself on each check. No table, no runner, no action for this service.

### 13.3 Purity chain + 9-step calc
- Purity factor chain (`effectiveBaseRate = baseRatePerGram * (1 + premium%)`, `currentMarketRate = effectiveBaseRate * purityFactor`) and the 9-step chain (metal amount → making charges → GST → net amount → current value → P&L → return %) — **service layer, unchanged**.

### 13.4 Data migration: `migration/GoldSilverMigrationRunner.java`
- Seed `metal_purity_options` (idempotent); read `gold_silver_investments` → Postgres mapping `purity_option_id` to the seeded FK; migrate settings from `MetalRateSettingsEmbed`.
- **DECIDED — migrate `metal_rate_snapshots` history** (do the migration, do not repopulate): read existing snapshots from Mongo → Postgres `metal_rate_snapshots`, preserving `metal_type`, rate fields, `source`, `is_stale`, and `fetched_at`. Repopulation was considered but rejected because snapshot history is user-facing (rate trends) and migration is the simpler, lossless path. If the snapshot volume is large, migration still beats repopulation since it preserves historical `fetched_at` timestamps exactly (repopulation via scheduled fetches would rewrite history and burn GoldAPI quota).

### 13.5 Checklist
- [ ] Entities + `V8__goldsilver.sql` (FK to purity options, snapshot indexes, retirement)
- [ ] Purity option seed task
- [ ] Bulk rate update → JPA batch
- [ ] GoldApi — no action (in-memory, verified; nothing to migrate)
- [ ] migrate-gs runner (incl. `metal_rate_snapshots` history) + verification of `net_amount`/`current_value`/snapshot sums
- [ ] **STOP — await confirmation**

---

## 14. Module 8 — `mutualfund` (LAST — highest complexity)

**Why last:** most complex FK chain, most complex business logic (FIFO), real extracted family financial data (Krishil dataset: 9 schemes, 41 lumpsums, 29 redemptions, 3 SIP mandates, 578 SIP contributions, 124 valuation snapshots). Do only after the JPA/Flyway/migration pattern is proven on Modules 1–7.

### 14.1 Tables (Flyway `V9__mutualfund.sql`)
- `mf_schemes` — `user_id` FK; `holder_name`, `scheme_name`, `amfi_code`, `mf_category`, `platform`, `folio_no`, `bank`, `manual_total_units`, `average_nav`, `sip_start_date`, `sip_stop_date`, `statuses VARCHAR[]`, `settlement_type`, timestamps; `UNIQUE(user_id, scheme_name, folio_no, platform)` (mirror `@CompoundIndex`)
- `mf_lumpsum_transactions` — `user_id` FK, `scheme_id` FK, `transaction_no` (per-user), all monetary/unit fields, `is_after_cutoff`, status, retry_count, timestamps
- `mf_sip_mandates` — `user_id` FK, `scheme_id` FK, `amount`, `active`, start/end date, timestamps
- `mf_sip_contributions` — `user_id` FK, `sip_mandate_id` FK, `scheme_id` FK (denormalized), `transaction_no`, monetary/unit/stamp fields, status, retry_count, timestamps
- `mf_redemption_transactions` — `user_id` FK, `scheme_id` FK, `transaction_no`, all FIFO-result fields (units, investment, values, capital_gain, nav, stt, exit_load, net value), `gain_type` (preserve STCG/LTCG mapping via converter), status, retry_count, timestamps
- `mf_valuation_snapshots` — 🔴 `@TimeSeries` (timeField `snapshotDate`, metaField `userId`) → plain table: `user_id`, `holder_name`, `platform`, `snapshot_date`, `investment_value`, `current_value`, `period_pl`, `period_pl_percent`; index `(user_id, holder_name, platform, snapshot_date)`
- `mf_portfolio_holdings` — `user_id` FK, `scheme_id` FK, computed fields; `UNIQUE(user_id, scheme_id)`
- `mf_portfolio_metrics` — `user_id` FK UNIQUE; `overall_xirr`
- `mf_historical_nav_cache` — `scheme_code`, `nav_date`, `nav_value`; `UNIQUE(scheme_code, nav_date)`
- `mf_latest_prices` — `scheme_code` PK (natural key, AMFI), `latest_nav`, `nav_date`, `last_updated_at`

### 14.2 FK chain & delete semantics
- Full FK chain per MD: `lumpsum/redemption/sip_mandate.scheme_id → mf_schemes.id`; `sip_contribution.sip_mandate_id → mf_sip_mandates.id`; `sip_contribution.scheme_id → mf_schemes.id` (denormalized).
- **`ON DELETE RESTRICT`** on all 4 transaction tables' `scheme_id` FK. **Remove** the manual 4-collection scan in `deleteScheme()` — DB FK now blocks deletion.
- Keep the app-layer cross-check that `sip_contribution.scheme_id` matches its mandate's scheme (business invariant across two FKs, not referential integrity).

### 14.3 Business logic (port as-is)
- `mfCategory` normalization (trim + case-normalize on save) → `@PrePersist`/`@PreUpdate` hook (not a DB trigger).
- 🔴 **`MfFifoEngine` — port verbatim, no logic changes. Highest-risk piece.** Dedicated regression tests comparing FIFO output before/after on the full Krishil dataset.
- Discrepancy cross-check (holder+platform bucket, latest valuation snapshot vs ledger total, >₹1 tolerance) → SQL `GROUP BY holder_name, platform` where it simplifies; keep the >₹1 tolerance + flagging logic in service.
- Status derivation (`FULLY_REDEEMED`/`ACTIVE_SIP`/`LUMPSUM_ONLY`) — service layer, not a DB trigger/computed column.
- 5-sheet Excel export — unchanged, reads JPA repos.
- `GainType` string mapping (`STCG/LTCG` etc.) — via JPA `AttributeConverter` or mapper (D5).

### 14.4 Repository conversions
Map every derived method from the catalog (§A list) to `JpaRepository`; dynamic/aggregation queries → JPQL or `Specification`. `findByUserIdAndSchemeIdAndRedemptionDateAfterOrderByRedemptionDateAsc` etc. map directly.

### 14.5 Data migration: `migration/MutualFundMigrationRunner.java`
- Highest-scrutiny module. Two-phase reconciliation is **mandatory**:
  1. **Mongo vs Postgres:** row counts + Monte-Carlo/idempotency (re-run-safe) for every table.
  2. **Postgres vs Krishil Excel source** (`Krishil_MF_investment.xlsx`): row counts + monetary sums (investment, current value, units, gains) per scheme. Mandatory before sign-off.
- Migration order within module: `mf_schemes` → mandates → lumpsums → redemptions → contributions → valuation snapshots → holdings → metrics → NAV cache/latest prices.
- Preserve `transaction_no` per user; preserve all FIFO-derived columns verbatim (do not recompute).

### 14.6 Checklist
- [ ] Entities with full FK graph (UUID PKs, real FKs, RESTRICT)
- [ ] `V9__mutualfund.sql` (FKs, compound-uniques, indexes)
- [ ] `@PrePersist/@PreUpdate` mfCategory hook
- [ ] FIFO regression suite (before/after on full Krishil dataset)
- [ ] Excel reconciliation script/tool
- [ ] Service swaps (delete-block removed, aggregation → SQL GROUP BY)
- [ ] migrate-mf runner + `migrate-mutualfund` profile; two-phase verification report
- [ ] **STOP — await confirmation**

---

## 15. Module 9 — `email`

### 15.1 Table (Flyway `V10__email.sql`)
- `email_tokens` — `user_id` FK; `purpose`, `new_email`, `expires_at`, `used`, `ip_address`, `user_agent`, `created_at`

### 15.2 Business logic
- Magic link JWT signing/expiry logic **unchanged** — table stores token metadata only.
- TTL `expires_at` (deprecated `expireAfterSeconds=0`) → scheduled purge of expired rows.

### 15.3 Repository conversions
- All `EmailTokenRepository` derived finders (`findByIdAndUsedFalse`, `findAllByUserIdAndUsedFalse`, etc.) → derived JPA; `deleteAllByUserIdAndPurpose` → derived.

### 15.4 Data migration: `migration/EmailTokenMigrationRunner.java`
- Read `email_tokens` → Postgres with user UUID mapping.

### 15.5 Checklist
- [ ] Entity + `V10__email.sql`
- [ ] TTL purge job
- [ ] Service swap, tests, migrate-email runner + verification
- [ ] **STOP — await confirmation**

---

## 16. Final Step (after all 9 modules confirmed)

1. **pom.xml:** remove `spring-boot-starter-data-mongodb`; remove `de.flapdoodle` test dep; keep `spring-boot-starter-data-jpa` + `postgresql` + Flyway + Testcontainers.
2. **Remove all Mongo code**: `MongoRepository` interfaces, `@Document` annotations, `MongoTemplate`/`MongoOperations`/`BulkOperations`/`findAndModify`/`Aggregation` usages, `MongoTransactionConfig`, `MongoConfig`, `@EnableMongoAuditing`, `org.bson.*` imports, homegrown `MigrationService`/`MigrationRecord` (`schema_migrations` collection) → superseded by Flyway.
3. **Config:** remove `MONGODB_URI`/`MONGODB_DB`/`spring.data.mongodb.*` from `application*.properties`, `.env*`, `render.yaml`, `docker-compose.yml`, `backend/Dockerfile`; remove `spring.data.mongodb.auto-index-creation` from all profiles.
4. **render.yaml:** replace Mongo env with `DATABASE_URL` (`sync: false`); point region comment to Supabase region close to `singapore` hosting; add `DB_USERNAME`/`DB_PASSWORD` if separate; ensure `sslmode=require`.
5. **docker-compose.yml:** remove `mongodb` service + `mongo-data` volume + Mongo healthcheck + `depends_on: mongodb`; keep `postgres:16` (or document external Supabase).
6. **backend/Dockerfile:** update the env-var comment block (Mongo → `DATABASE_URL`); no DB client binary required in image (Flyway runs at app startup or via `mvn flyway:migrate`).
7. **Scripts cleanup:** remove/rewrite Mongo scripts: `backend/scripts/db.js`, `01-09/12/16*.js`, `local/scripts/migrate-fd-v1.3.0.sh` → replaced by Flyway migrations; add a `psql`-based admin script reference or Flyway-only policy.
8. **Docs:** update `DOCKER.md`, root `README.md` (tech-stack badge line ~328, collection references ~904/920), `backend/README.md` (32-collection appendix → Postgres table list), and all module README "Data Layer" sections.
9. **Homegrown migration system** (`migration/MigrationService`, `IndexMigration`, `HolderNameBackfillMigration`, `EmailVerificationMigration`, `FdV130Migration`, `FdV131Migration`): retire — Flyway owns versioning; ensure any pending data backfills are folded into a final Flyway migration before removal.

---

## 17. Execution Protocol

1. Work one module at a time, in **exact order 1→9**.
2. Per module: entities → Flyway → repositories → service layer swap → tests → data migration script → verification report → **stop and wait for confirmation**.
3. No proceeding without explicit go-ahead.
4. No hybrid run-time state: cut each module over completely in one PR.
5. Do not batch modules into one commit.

---

## 18. Rollback & Cutover Strategy

### 18.1 Per-module cutover (dual-write is NOT used — MD rule)
Each module flips in a single PR: it reads/writes Postgres only from that point. Mongo data for that module remains untouched (read-only source for the one-time migration runner and for verification).

### 18.2 Rollback path
- **Before Final Step:** Mongo starter + Mongo config still present; to roll back a module, restore its previous release (JPA service + Mongo service both can exist but a module reads one DB — rolling back a PR restores Mongo reads) and re-point. The one-time Postgres tables can be dropped via a Flyway rollback migration or `flyway.clean` on that schema if fully rolled back.
- Keep per-module Flyway migrations **backward-naming** (no destructive `DROP` of a still-needed Mongo collection — Mongo is never auto-dropped).

### 18.3 Mongo retention (non-automated follow-up)
- **Do not drop any Mongo collection** until its Postgres counterpart has been verified in production for at least one full cycle (a full month for ledger/financial data; a full sync cycle for cache).
- Document a manual deletion runbook; deletion is a manual operator action, not a code path.

### 18.4 Production cutover sequencing
- Deploy app against Postgres while Mongo still hosts data (read-only source for migration runners run in a maintenance slot).
- Run each module's migration runner (profile `migrate-{module}`) → verify → deactivate Mongo reads for that module.
- Keep `MONGODB_URI` env present (unused) through Final Step; only remove when all modules + one full prod cycle pass.

---

## 19. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| FIFO engine regression (Module 8) | Medium | High | Port verbatim + before/after regression on full Krishil dataset + Excel reconciliation gate |
| Balance/interest calc drift (PPF/EPF) | Medium | High | Window-function + application abort parity tests; FY-by-FY verification |
| TOTP secret mangling during migration | Low | High | Passthrough encrypted TOTP TEXT verbatim; round-trip validation test |
| Loss of `transaction_no`/`fd_no`/`item_no` ordering | Medium | Med | Preserve per-user reorder algorithm; verify sequence values post-migrate |
| Supabase connection/pooling issues | Medium | Med | Use transaction-mode pooler; `sslmode=require`; Hikari tuning; connection tests |
| JSONB round-trip fidelity (broker raw) | Low | Medium | Serialize/deserialize tests on `canonical_*` |
| Mongo native query semantic drift (`$regex`, tags) | Medium | Med | Pin behavior with tests before conversion |
| Time-series semantics lost | Medium | Low-Med | Snapshots → plain tables + indexes + retention purge |
| Stale homegrown migration system | High | Low-Med | Retire in Final Step; fold pending backfills into Flyway |
| Data volume skew on Supabase free tier | Low | Med | Monitor storage; upgrade tier; purge stale snapshots/logs |

---

## 20. Deliverables per module

1. JPA entities (UUID PK, real FKs, LAZY `@OneToMany`, `NUMERIC` precision)
2. Flyway `V{n}__{module}.sql` (include ONLY the indexes specified in **Appendix E** — do not add indexes ad hoc)
3. JPA repositories covering every derived method
4. Service layer re-pointed to JPA (no Mongo at runtime)
5. Unit + integration tests (Testcontainers Postgres)
6. One-time data migration runner (`migration/{Module}MigrationRunner.java`, `@Profile("migrate-{module}")`)
7. Verification report (row counts + monetary sums Mongo vs Postgres)
8. STOP — await confirmation

---

## Appendix A — Mongo-specific features → Postgres mapping (reference)

| Mongo feature | Postgres replacement |
|---------------|----------------------|
| `@TimeSeries` (MetalRateSnapshot, ValuationSnapshot) | plain table + index + retention purge |
| TTL index (`@Indexed(expireAfter=...)`) | `@Scheduled` purge job (per TTL window) |
| `_id` ObjectId (String) | `UUID` PK (+ mapping table old→new) |
| `@CompoundIndex` | DB multi-column index / unique constraint |
| `@Indexed(unique=true, sparse=true)` | nullable column + partial unique index |
| SequenceGeneratorService / counters | per-user reorder (display numbers) — NOT global sequence |
| findAndModify | JPA upsert / `save` |
| BulkOperations | JPA batch `saveAll` / `@Modifying` bulk update |
| Mongo `Aggregation` (FD nearest-first) | SQL `ORDER BY` + `CASE WHEN ...` + `LIMIT/OFFSET` |
| `@Query`/`@Update` `$set` (RefreshToken) | `@Modifying` JPQL update |
| `@Query` `$regex` (Note search) | `LOWER(LIKE CONCAT('%',:t,'%'))` (or `ILIKE`) |
| `$regex`/contains on arrays | `= ANY` / `MEMBER OF` (pin semantics with test) |
| Custom converters (`GainType`, `YearMonth`) | JPA `AttributeConverter` (GainType only; drop YearMonth) |
| `raw: Map<String,Object>` | `JSONB` via `@JdbcTypeCode(SqlTypes.JSON)` |
| Embedded settings docs in User | separate FK tables (`ppf_settings`, `epf_settings`, `metal_rate_settings`) |
| `schema_migrations` collection (homegrown) | Flyway `flyway_schema_history` |
| Enums (incl. special `GainType` string forms) | `VARCHAR` + `CHECK` (+ converter for GainType) |
| `UserDeletionAudit`, `User` numbers | `BIGINT`/plain columns as typed |

## Appendix B — ObjectId → UUID mapping strategy

- Module 1 `UserMigrationRunner` produces the authoritative `old ObjectId string → new UUID` map, persisted to a mapping table (`migration_user_id_map` or an in-memory cache populated at start of each later runner).
- Every later module reuses this map to set correct `user_id`/`scheme_id`/`broker_account_id` FKs.
- Keep the mapping table until all modules migrated; then drop via a Flyway migration.

## Appendix C — Target tables (consolidated)

| Table | Module | FK to |
|-------|--------|-------|
| users, backup_codes, pending_registrations, refresh_tokens | 1 | — |
| invalidated_tokens | 1 | — |
| ppf_settings, epf_settings, metal_rate_settings | 1 | users |
| broker_accounts | 2 | users |
| canonical_holdings, canonical_positions, canonical_funds, canonical_mf_holdings, canonical_mf_orders | 2 | users, broker_accounts |
| market_prices, sync_logs, sync_cooldowns | 2 | (users for sync_*) |
| notes | 3 | users |
| fixed_deposits | 4 | users |
| ppf_transactions | 5 | users |
| epf_transactions, epf_interest_rates | 6 | users |
| gold_silver_investments | 7 | users, metal_purity_options |
| metal_purity_options, metal_rate_snapshots | 7 | — |
| mf_schemes | 8 | users |
| mf_lumpsum_transactions, mf_sip_mandates, mf_redemption_transactions | 8 | users, mf_schemes |
| mf_sip_contributions | 8 | users, mf_sip_mandates, mf_schemes |
| mf_portfolio_holdings, mf_portfolio_metrics | 8 | users, mf_schemes |
| mf_valuation_snapshots, mf_historical_nav_cache, mf_latest_prices | 8 | users (snapshots) |
| email_tokens | 9 | users |

---

## Appendix D — Future Reference (OUT OF SCOPE)

> **Forgot-not list.** These items are NOT part of the MongoDB → PostgreSQL migration. Do **not**
> implement them here. They are captured so no work is lost and so a future task can be triggered
> cleanly. A pointer is also in the Decision Log (row 11).

See the dedicated section added to `opencode_prompt_postgres_migration.md`. Summary:
- The **calculator** module is a candidate to move to the **frontend** in the future — **out of scope** for this migration.
- It has no DB dependency (static config YAML + bucket4j rate-limiting), so it is untouched by Modules 1–9 and the Final Step.
- Leave every file under `calculator/` and `configs/calculator/*.yml` unchanged during this migration.

### Which files "may change in different files" if / when calculator moves (FOR FUTURE REFERENCE)

Moving calculator logic to the frontend is not a single-file change. The touched surface would span:

- **Backend controllers** (to be removed/emptied once frontend takes over, or kept only if a server-side fallback is desired):
  `calculator/controller/` — `InvestmentCalculatorController`, `LoanCalculatorController`,
  `PlanningCalculatorController`, `SavingsCalculatorController`, `TaxCalculatorController`, `TradingCalculatorController`
- **Backend services** (the calculation logic to relocate): `calculator/service/` (+ `service/impl/`)
- **Backend math utilities** (to port to TypeScript): `calculator/util/` — `FinancialMath`, `InvestmentMath`,
  `LoanMath`, `MathUtil`, `SavingsMath`, `SipMath`, `TaxMath`, `XirrCalculator`
- **Backend DTOs** (request/response contracts consumed by the frontend): `calculator/dto/request/*` and `calculator/dto/response/*`
- **Backend rate-limiting** (calculator-only bucket4j): `calculator/config/RateLimitFilter.java` (likely retired or moved to general API guard)
- **Backend config loader** (YAML → typed assumption objects): `calculator/config/CalculatorConfigLoader.java`
- **Config data files** (published to frontend as JSON/TS constants, or exposed via an API endpoint instead of classpath resources):
  `src/main/resources/configs/calculator/` — `default-assumptions.yml`, `savings-rates.yml`, `tax-slabs.yml`
- **Frontend**: new TypeScript math modules + UI wiring (out of the backend repo scope)

**For THIS migration the rule is:** no changes inside any of the above; `calculator/` and `configs/calculator/` are off-limits. REST-contract changes would be driven by the frontend move later, never by this Postgres migration.

---

## Appendix E — Index Strategy (query-first, minimum viable set)

### E.0 Philosophy: we index QUERIES, not every column

**Decision: index only the important subset — not "everything."** Rationale:

1. **Indexes cost writes.** Every `INSERT`/`UPDATE`/`DELETE` must maintain *every* index on the table. CoinTrack is a **transaction-heavy ledger** (PPF/EPF recalc cascades rewrite many rows per edit; broker syncs rewrite whole cache slices per cycle). Over-indexing slows these hot paths directly.
2. **Indexes cost storage + planner complexity.** Redundant indexes confuse the planner and waste space for zero read gain.
3. **Per-user data is small.** Almost every query filters by `user_id` first, collapsing to dozens–hundreds of rows. After that filter, sorts/`LIKE`/aggregations are cheap *without* a dedicated index. The index on `user_id` (or a composite leading with it) does the heavy lifting for almost everything.
4. **The exceptions worth indexing beyond `user_id`:**
   - **FK columns** — Postgres does NOT auto-index FKs; inserts into `child_table` probe the parent, and `DELETE` from parent probes children. Missing FK indexes turn deletes into sequential scans (the exact `ON DELETE RESTRICT` delete-block paths we are adding).
   - **Global, non-user-filtered scheduler scans** — `findByStatus(...)` / `findByStatusNot(...)` (MF settlement, FD/GS active-list), TTL-style purge jobs (`WHERE expires_at < now()`). These scan the whole table; a targeted index prevents table bloat turning into full scans.
   - **Uniqueness constraints** — double as indexes (unique email/token/hash/etc.).
   - **Access-path queries** on hot identity lookups (login: `token_hash`, `temp_token`).

5. **`ORDER BY` direction:** a B-tree scans forward *and* backward, so one index on `(x ASC)` serves `ORDER BY x ASC` and `DESC`. But **mixed-direction composite sorts** (`pinned DESC, updated_at DESC`) need the index built in that exact order — build `(user_id, pinned DESC, updated_at DESC)` (leading equality column can stay ASC).
6. **Categorization used below:** `[REQUIRED]` = hot path / FK / constraint-backed / global scheduler — index it in the module's Flyway file. `[OPTIONAL]` = only add when a measured query justifies it (grows with evidence, not by default). Everything else: **explicitly NOT indexed** (§E.10).

---

### E.1 Module 1 — user + security

| Table | Index | Type | Serves |
|---|---|---|---|
| users | `UNIQUE (email) WHERE email IS NOT NULL` | required | `findByEmail`, `existsByEmail` (sparse-unique mirror; excludes NULLs like Mongo sparse) |
| users | `UNIQUE (username) WHERE username IS NOT NULL` | required | `findByUsername` |
| users | `UNIQUE (phone_number) WHERE phone_number IS NOT NULL` | required | `findByPhoneNumber` |
| users | `UNIQUE (google_id) WHERE google_id IS NOT NULL` | required | `findByGoogleId`, OAuth link |
| backup_codes | `UNIQUE (user_id, code_hash)` | required | constraint + `findByUserId*` prefix; covers the `(user_id)` access path |
| backup_codes | `(user_id) WHERE used = false` | required | `findByUserIdAndUsedFalse` (2FA hot path — index *WITH* the predicate so only unused codes are scanned) |
| backup_codes | `(user_id, generation)` | optional | `deleteByUserIdAndGeneration` (only if code regeneration churn grows) |
| pending_registrations | `UNIQUE (temp_token)` | required | `findByTempToken` (email verify click — hot) |
| pending_registrations | `UNIQUE (google_id) WHERE google_id IS NOT NULL` | required | `findByGoogleId` |
| pending_registrations | `(expires_at)` | required | 15-min TTL purge job (scheduled, table-wide) |
| pending_registrations | `(username)`, `(email)`, `(phone_number)` | optional | duplicate-registration probes; table is small + short-lived (TTL) — skip unless measured |
| refresh_tokens | `UNIQUE (token_hash)` | required | `findByTokenHash` (refresh login) |
| refresh_tokens | `(user_id)` | required | `findByUserId*`, `deleteByUserId`, `revokeAllByUserId` (FK access path) |
| refresh_tokens | `(expires_at)` | required | token purge job |
| invalidated_tokens | `UNIQUE (token_hash)` | required | `existsByTokenHash` (JWT validity — every request) |
| invalidated_tokens | `(user_id)` | optional | `deleteByUserId` (user deletion, rare) |
| invalidated_tokens | `(expires_at)` | required | JWT blacklist purge job |
| user_deletion_audits | `(user_id, deletion_requested_at DESC)` | optional | `findByUserIdOrderByDeletionRequestedAtDesc` (admin/rare) |
| ppf_settings / epf_settings / metal_rate_settings | `UNIQUE (user_id)` | required | 1:1 settings lookup + constraint |

> No other index on `users`: e.g. `date_of_birth`, `created_at`, TOTP fields, `email_verified` are never filtered/sorted/joined on. Indexing them would be pure write overhead.

---

### E.2 Module 2 — broker + portfolio (cache)

| Table | Index | Type | Serves |
|---|---|---|---|
| broker_accounts | `(user_id)` | required | `findByUserId` (every broker screen) |
| broker_accounts | `UNIQUE (user_id, broker)` | optional | `findByUserIdAndBroker` (dedupe per-user-per-broker; also serves the `user_id` prefix) |
| broker_accounts | `(is_active) WHERE is_active = true` | required | `findByIsActiveTrue` — **global paginated sync loop** (PortfolioSyncServiceImpl/Scheduler page over ALL active accounts) |
| canonical_holdings | `(user_id, broker_account_id, isin)` | required | upsert lookup `findByUserIdAndBrokerAccountIdAndIsin` |
| canonical_holdings | `(user_id)` (via leading prefix) | folded | `findByUserId*`, `deleteByUserId*` covered by the composite |
| canonical_positions | `(user_id, broker_account_id, symbol, instrument_type)` | required | upsert lookup |
| canonical_mf_holdings | `(user_id, broker_account_id, isin)` | required | upsert lookup |
| canonical_mf_orders | `(user_id, broker_account_id, order_id)` | required | upsert lookup |
| canonical_funds | `(user_id, broker_account_id)` | required | upsert lookup `findByUserIdAndBrokerAccountId` |
| market_prices | `UNIQUE (symbol)` | required | `findBySymbol`, `findBySymbolIn` (LTP cache lookups) |
| market_prices | `(updated_at)` | required | 15-second stale purge (runs frequently, table-wide) |
| sync_logs | `(user_id, timestamp DESC)` | required | `findByUserIdOrderByTimestampDesc` (history view) |
| sync_logs | `(timestamp)` | required | 14-day retention purge |
| sync_cooldowns | `UNIQUE (user_id)` | required | existence/cooldown check + constraint |

> **Sync replace-on-write:** deletes are `DELETE ... WHERE user_id = ? AND broker_type = ?`. These run per-sync. A matching composite `(user_id, broker_type)` *can* help, but the existing `(user_id, ...)` prefix already narrows per-sync fan-out to a single user — the extra column is residual filtering on a per-user slice. **Do not add** `(user_id, broker_type)` indexes; they duplicate write cost on high-churn cache tables for no measurable gain.
> **JSONB `raw`:** do NOT index (GIN) — nothing queries `raw->>'...'`. Index only when a real query needs it (see E.10).

---

### E.3 Module 3 — notes

| Index | Type | Serves |
|---|---|---|
| `(user_id, pinned DESC, updated_at DESC)` | required | main list `findByUserIdOrderByPinnedDescUpdatedAtDesc` — mixed-direction composite, build in exact sort order |
| `(user_id, tags) GIN` | optional | `findByUserIdAndTagsContaining` — array-contains; only if tag filtering is actually used |
| `pg_trgm GIN (title gin_trgm_ops, content gin_trgm_ops)` | optional | `searchByUserIdAndTerm` `%term%` search — could not be served by B-tree; only if search is hot; requires `CREATE EXTENSION pg_trgm` (Supabase supports it; enable per-database, `RLS`-aware) |

> Do NOT index `title`/`content` with B-tree — infix `%term%` cannot use it. Do NOT add a separate `(user_id)`; the composite's prefix covers it.

---

### E.4 Module 4 — fixeddeposit

| Index | Type | Serves |
|---|---|---|
| `(user_id)` | required | `findByUserId` (list + reorder fetch) |
| `(user_id, status)` | optional | active-filter list (in-service derivation) |
| `(status)` | required | `findByStatusNot(FdStatus.PREMATURELY_WITHDRAWN)` — **global** active-FD scan (FixedDepositServiceImpl:484) |
| `(user_id, maturity_date)` | optional | nearest-first pagination sort; only if measured (see note) |
| `CHECK (maturity_date >= issue_date)` | required (constraint) | not an index; second line of defense |
| `(issue_date)` / `(fd_no)` | **NOT indexed** | `fdNo`/issue-date are reordered **in-memory** by `TransactionSequenceService` (`Sort.unsorted()` + Java comparator); never a DB `ORDER BY` → pure write cost |

> Nearest-first is 1 of 6 user-selectable sort modes; the ORDER BY is dynamic (`CASE WHEN maturity >= today`). Adding one index per sort mode is over-indexing. Per-user FD counts are small — the `(user_id)` filter plus a modest sort is fine. Only if a user has hundreds of FDs and the mode is slow should `(user_id, maturity_date)` be added.

---

### E.5 Module 5 — ppf

| Index | Type | Serves |
|---|---|---|
| `(user_id, transaction_date, created_at)` | required | **balance recalculation** — full per-user ledger re-read ordered by `(transaction_date, created_at)` on every insert/edit/delete (hottest path in PPF) |
| `(user_id)` (folded into above) | folded | `findByUserId(uid, Sort)`, `deleteByUserId` covered by the composite prefix |
| `UNIQUE (user_id)` on ppf_settings | required | settings lookup + constraint |
| `(transaction_type)`, `(balance)`, `(transaction_no)` | **NOT indexed** | display numbers reordered in-memory; no global scans on these |

> Balancing trade-off: the recalc already touches every row of the user's ledger. The composite above is the ONLY index that pays for itself on write — it turns the recalc's ordered full-scan into an index-ordered scan. Do not add more.

---

### E.6 Module 6 — epf

| Index | Type | Serves |
|---|---|---|
| `(user_id, transaction_date, created_at)` | required | running-balance accrual simulation + recalc cascade (same hottest path as PPF) |
| `(user_id)` (folded) | folded | covered by composite prefix |
| `UNIQUE (financial_year)` on epf_interest_rates | required | FY-rate lookup + constraint (accrual sim reads each FY) |
| `UNIQUE (user_id)` on epf_settings | required | settings lookup |
| `(transaction_no)`, per-column monetary fields | **NOT indexed** | display numbers in-memory; money columns never filtered/sorted |

---

### E.7 Module 7 — goldsilver

| Index | Type | Serves |
|---|---|---|
| `(user_id)` | required | `findByUserId` (list + reorder) |
| `(status)` | required | `findByStatusNot(GsStatus)` — **global** active-metals scan |
| `(purity_option_id)` | required | FK to `metal_purity_options` (join + RESTRICT delete probe) |
| `(metal_type, fetched_at DESC)` on metal_rate_snapshots | required | `findFirstByMetalTypeOrderByFetchedAtDesc`, `findTop10By...` (rate trend reads) |
| `(user_id, status)` | optional | active-filtered list per user |
| `(item_no)`, voluminous rate columns | **NOT indexed** | in-memory reorder; snapshot fields only ever selected, never filtered |

> `metal_rate_snapshots` is insert-heavy (scheduled fetches). Keep it to ONE composite index — every extra index triples write cost on each snapshot insert.

---

### E.8 Module 8 — mutualfund (carefully minimal despite complexity)

| Index | Type | Serves |
|---|---|---|
| `UNIQUE (user_id, scheme_name, folio_no, platform)` on mf_schemes | required | dedupe constraint (mirrors `@CompoundIndex`) + all `findByUserId*` prefix queries |
| `(user_id, scheme_name)` | folded | `findByUserIdAndSchemeNameContainingIgnoreCase` = prefix + residual filter; **no extra index** — the unique composite's `user_id` prefix narrows, then `LIKE` filters per-user (small) |
| `(user_id, scheme_id)` on mf_lumpsum_transactions | required | scheme-detail listing (hot: every scheme screen) |
| `(user_id, investment_date DESC)` on mf_lumpsum_transactions | required | `findByUserIdAndInvestmentDateBetween` (year summaries) + paginated list ordering |
| `(status)` on mf_lumpsum_transactions | required | **global** settlement scan `findByStatus(PENDING_NAV)` (PendingTransactionSettlementService:53) |
| `(user_id, scheme_id)` on mf_sip_mandates | required | scheme-detail mandates |
| `(user_id) WHERE active = true` on mf_sip_mandates | required | `findByUserIdAndSchemeIdAndActiveTrue` + active-SIP derivation |
| `(sip_mandate_id, contribution_date DESC)` on mf_sip_contributions | required | `existsBySipMandateIdAndContributionDateBetween`, `deleteBySipMandateIdAndContributionDateAfter` (SIP edits) |
| `(user_id, scheme_id)` on mf_sip_contributions | required | scheme contribution listing |
| `(status)` on mf_sip_contributions | required | settlement scan (PendingTransactionSettlementService:99) |
| `(user_id, scheme_id, redemption_date)` on mf_redemption_transactions | required | `findByUserIdAndSchemeIdAndRedemptionDateAfterOrderByRedemptionDateAsc` (post-cutoff FIFO reads + ordered) |
| `(user_id, redemption_date DESC)` on mf_redemption_transactions | required | `findByUserIdAndRedemptionDateBetween` (year summaries) |
| `(status)` on mf_redemption_transactions | required | settlement scan (PendingTransactionSettlementService:145) |
| `UNIQUE (user_id, scheme_id)` on mf_portfolio_holdings | required | `findByUserIdAndSchemeId` + constraint |
| `UNIQUE (user_id)` on mf_portfolio_metrics | required | metrics lookup |
| `(user_id, holder_name, platform, snapshot_date DESC)` on mf_valuation_snapshots | required | discrepancy cross-check — **SQL `GROUP BY holder_name, platform`** on latest snapshot vs ledger (Module 8 hot analysis path) |
| `UNIQUE (scheme_code, nav_date)` on mf_historical_nav_cache | required | NAV date lookup + constraint |
| `UNIQUE (scheme_code)` (PK) on mf_latest_prices | required | LTP lookup by AMFI code (natural PK) |
| mfCategory-normalized columns, per-transaction money columns | **NOT indexed** | normalized on write (`@PrePersist`), never filtered; money never sorted |

> FIFO is a **service-layer** computation reading full per-user, per-scheme transaction lists — it benefits from the `(user_id, scheme_id)` composites (single index-ordered scan per scheme), not from column-level indexes on FIFO inputs. Keep the set above; do not add per-column money/units indexes.

---

### E.9 Module 9 — email

| Index | Type | Serves |
|---|---|---|
| `(user_id)` | required | `findAllByUserId*`, `deleteAllByUserId*` (FK access path) |
| `(user_id) WHERE used = false` | optional | `findAllByUserIdAndUsedFalse` (pending token checks; small per-user set — skip unless measured) |
| `(expires_at)` | required | token purge job |
| `(purpose)` | optional | `deleteAllByUserIdAndPurpose`; low volume — skip unless measured |
| `UNIQUE (id)` (PK) | required | `findByIdAndUsedFalse` lookup by PK + residual filter |

---

### E.10 Explicitly NOT indexed (and why)

| Column(s) | Why not |
|---|---|
| Display numbers (`fd_no`, `transaction_no`, `item_no`) | Reordered **in-memory** (`TransactionSequenceService` uses `Sort.unsorted()` + Java comparators). A DB index would be maintained per write and never read. **Correction from earlier draft — these were wrongly proposed before.** |
| Money/units columns across ledgers | Ever selected, never filtered/sorted/joined. |
| Description/remarks/notes content | Only the optional `pg_trgm` handles infix search. |
| JSONB `raw` on canonical_* / any JSONB | No query does `raw->>'...'`. Add a GIN index ONLY when a real predicate appears. |
| TOTP/encryption/verification columns | Written and read by exact `user_id`/`token_hash` — served by existing indexes. |
| `users` profile columns (`name`, `date_of_birth`, `location`, `bio`) | No query filters/sorts them. |
| `market_prices` beyond symbol + updated_at | Rewritten constantly; LTP reads only by `symbol`. |
| EAGER-fetched relationship columns | We forbid `EAGER`; no join-drive index beyond FK composites needed. |

### E.11 Operational notes

- **Hibernate `ddl-auto=validate`** means indexes live ONLY in Flyway files — put every index from this appendix into the matching `V{n}__{module}.sql`; never via `@Index` (would desync). 
- **Order of creation** in Flyway: `CREATE TABLE` → UNIQUE/PK/FK constraints → standalone indexes. Postgres can `CREATE INDEX ... CONCURRENTLY` **outside** a Flyway transaction for the very large tables (e.g. `mf_valuation_snapshots`, `metal_rate_snapshots`) to avoid long locks on live data; use non-concurrent form in migration scripts unless volume demands otherwise.
- **Supabase note:** `pg_trgm` extension is available; enabling it on a per-database basis is required before the optional notes-search GIN index works.
- **Enforcement during execution:** Module reviews must diff the Flyway file against this appendix. Any index not found here requires a written justification before being added (the anti-`@Index` and anti-ad-hoc rule in §20 deliverable 2).
