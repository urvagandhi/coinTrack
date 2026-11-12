# CoinTrack: MongoDB → PostgreSQL Migration

## Objective

Migrate the entire CoinTrack backend from MongoDB (Spring Data MongoDB) to PostgreSQL (Spring Data JPA + Hibernate). Execute module by module, in the exact order specified below. Do not skip ahead. Do not batch multiple modules into one commit. Each module is a complete, independently mergeable unit of work.

## Global Rules (apply to every module below)

1. Use Spring Data JPA + Hibernate. Remove `spring-boot-starter-data-mongodb` only after the final module is migrated.
2. Use Flyway for schema migrations. One versioned SQL file per module: `V{n}__{module}.sql`.
3. Every entity uses `BigDecimal` for monetary/unit fields, mapped to `NUMERIC(19,4)` (money) or `NUMERIC(19,6)` (units/NAV/rates). Never `DOUBLE` or `FLOAT`.
4. Every entity uses `UUID` primary keys (`@Id @GeneratedValue(strategy = GenerationType.UUID)`), not Mongo ObjectId strings and not auto-increment integers.
5. Every FK relationship becomes a real `@ManyToOne` / `@JoinColumn` with a DB-level `FOREIGN KEY` constraint. Do not keep manual `validateXOwnership()` existence checks as the only enforcement — the constraint is the enforcement. Application-level ownership checks (`userId` match) still apply for authorization, not referential integrity.
6. Any field currently used for delete-block logic (e.g. "cannot delete scheme with transactions") becomes `ON DELETE RESTRICT` at the DB level. Remove the manual repository-scan-based block once the constraint exists.
7. Any field currently storing raw broker JSON (`raw: Map<String, Object>`) becomes a `JSONB` column via Hibernate's `@JdbcTypeCode(SqlTypes.JSON)` (Hibernate 6+). Do not flatten it into columns.
8. Any sequential ID currently generated via `SequenceGeneratorService` / counters collection becomes a Postgres `SERIAL` or a dedicated per-user sequence, whichever preserves current numbering semantics (check per module below).
9. Timestamps: `createdAt` / `updatedAt` via `@CreatedDate` / `@LastModifiedDate` with `@EntityListeners(AuditingEntityListener.class)`, same as today.
10. Preserve every existing REST contract exactly. Controllers and DTOs do not change unless a field's type changes (e.g. Mongo ObjectId string → UUID string). No endpoint renames, no response shape changes.
11. Preserve every existing business rule exactly (listed per module below). These are not being redesigned — only re-platformed.
12. For each module: write the JPA entities, repositories, Flyway migration, update the service layer to use JPA repositories instead of Mongo repositories, write/update unit + integration tests, then write a one-time data migration script (`migration/{module}MigrationRunner.java`, a `CommandLineRunner` gated behind a profile flag `migrate-{module}`) that reads from the existing Mongo collections and writes into the new Postgres tables.
13. After each module's data migration script runs successfully in dev, verify row counts and spot-check monetary sums between Mongo and Postgres before marking the module done. Report the verification numbers.
14. Stop after each module and wait for explicit confirmation before starting the next one.

## Non-Negotiables

- Do not touch modules out of order.
- Do not introduce a hybrid state where one module reads from both Mongo and Postgres at runtime — cut each module over completely, in one PR, before moving to the next.
- Do not drop the Mongo collection for a migrated module until its Postgres counterpart has been verified in production for at least one full cycle (flag this as a manual follow-up, do not automate deletion).
- Do not change any calculation logic (FIFO matching, statutory withdrawal validation, interest accrual formulas, tax slab logic) — port it as-is.
- Do not use `EAGER` fetch by default on any `@OneToMany` — use `LAZY` and add explicit `@EntityGraph` or fetch-join queries where needed.

---

## Module 1: `user` + `security`

**Why first**: everything else has a `userId` FK into this module.

**Tables**: `users`, `backup_codes`, `pending_registrations`, `refresh_tokens`, `invalidated_tokens`

**Preserve exactly**:
- TOTP secret encryption (AES-256-GCM) stays at the application layer — encrypted value stored as a plain `TEXT` column, no change to encryption logic.
- `totpSecretVersion` / backup code versioning relationship: `backup_codes.user_id` FK + `version` column, unique constraint on `(user_id, code_hash)`.
- `pending_registrations` TTL behavior — replicate via a scheduled cleanup job (`@Scheduled`) deleting rows past expiry, since Postgres has no native TTL collection.
- `refresh_tokens` rotation-on-use logic unchanged.
- Username/email uniqueness → `UNIQUE` constraints, not just `@Indexed(unique = true)`.

**FKs to add**: `backup_codes.user_id → users.id`, `refresh_tokens.user_id → users.id`, `invalidated_tokens` keyed by token hash, no FK needed.

---

## Module 2: `broker` + `portfolio` (cache layer)

**Why second**: lowest risk — this data is fully resyncable from broker APIs. Good place to validate JSONB and migration tooling before touching irreplaceable ledger data.

**Tables**: `broker_accounts`, `canonical_holdings`, `canonical_positions`, `canonical_funds`, `canonical_mf_holdings`, `canonical_mf_orders`, `market_prices`, `sync_log`, `sync_cooldown`

**Preserve exactly**:
- `raw` field on every cached entity → `JSONB` column, full fidelity, queryable if needed later.
- Encrypted `zerodhaApiSecret` / `zerodhaAccessToken` stay `TEXT`, encryption logic unchanged.
- Sync replace-on-write pattern (delete old rows for `user_id + broker`, insert fresh) stays identical — this is naturally a `DELETE ... WHERE` + bulk `INSERT`, works the same in Postgres.
- 5-minute sync cooldown logic unchanged.

**FKs to add**: every cached table → `broker_accounts.id` → `users.id`.

**Migration script note**: this module does not strictly need historical data migration — canonical_* and market_prices can be left empty and repopulated by the next scheduled/manual sync after cutover. Confirm this approach before writing a migration script; it may be unnecessary work.

---

## Module 3: `notes`

**Tables**: `notes`

**Preserve exactly**: `findByUserIdOrderByPinnedDescUpdatedAtDesc` sort → `ORDER BY pinned DESC, updated_at DESC`. `tags` (`List<String>`) → Postgres `TEXT[]` or a `note_tags` join table (prefer `TEXT[]`, simpler, no relational value here).

---

## Module 4: `fixeddeposit`

**Tables**: `fixed_deposits`

**Preserve exactly**:
- `fdNo` sequential numbering, currently via shared counter collection → dedicated Postgres `SEQUENCE fd_no_seq`, scoped per-user if the current counter is per-user (check `SequenceGeneratorService` usage — if global, use one sequence; if per-user, use a composite or per-user sequence table).
- Status derivation logic (`ACTIVE`/`DUE`/`MATURED`/`CLOSED`, with `CLOSED` as sticky override) — unchanged, stays in service layer, not a DB computed column.
- 6-mode sort engine, including the "nearest maturity relative to today" comparator — reimplement as SQL `ORDER BY` with a `CASE WHEN maturity_date >= CURRENT_DATE THEN 0 ELSE 1 END, maturity_date ASC` for the nearest-first mode; standard `ORDER BY` for the other 5 modes.
- `maturityDate > issueDate` validation — keep in service layer AND add a `CHECK` constraint at the DB level as a second line of defense.

---

## Module 5: `ppf`

**Tables**: `ppf_transactions`, `ppf_settings`

**Preserve exactly**:
- Cascading balance recalculation on insert/edit/delete, sorted by `transaction_date ASC, created_at ASC`. Re-implement using a window function where practical: `SUM(credit_amount - debit_amount) OVER (ORDER BY transaction_date, created_at)` for computing running balance, but keep the negative-balance abort (`InsufficientPpfBalanceException`) as an application-layer check before commit — do not silently rely on a `CHECK (balance >= 0)` constraint, since the recalculation must fail cleanly with the existing exception type.
- Statutory withdrawal validation (lock-in period, 50% cap, 1-per-FY, post-maturity 60% block cap) — port logic as-is, no change.
- `transactionNo` sequential numbering per user → same sequence approach as `fdNo` in Module 4.
- Financial year filtering (April–March) — port `FinancialYearUtil` logic unchanged; can be expressed as a SQL `CASE` for the FY boundary if used in queries, but keep the Java utility as the single source of truth.

---

## Module 6: `epf`

**Tables**: `epf_settings`, `epf_transactions`, `epf_interest_rates`

**Preserve exactly**:
- Statutory contribution split engine (12%/8.33%/₹1,250 cap/`useActualSalaryForEps` flag) — unchanged.
- **Critical**: the 3-case dual-balance interest accrual simulation (opening balance / withdrawals / new contributions, each with different interest-earning windows) — this MUST remain a monthly running-balance simulation in Java. Do not attempt to replace it with a single SQL aggregate; the README explicitly warns against simplifying this. Port it verbatim.
- `epf_interest_rates` FY-keyed reference table — straightforward table, `UNIQUE(financial_year)`.
- Recalculation cascade on edit/delete, throwing `InsufficientEpfBalanceException` on negative balance — same pattern as PPF Module 5.
- Taxability flag (>₹2,50,000 employee contribution + VPF in current FY) — unchanged, computed in service layer.

---

## Module 7: `goldsilver`

**Tables**: `gold_silver_investments`, `metal_purity_options`, `metal_rate_snapshots`, `metal_rate_settings`

**Preserve exactly**:
- `LIVE` vs `MANUAL` rate mode logic, scheduler-driven updates only affecting `LIVE` rows.
- GoldAPI quota tracking (`GoldApiUsageService`) — this is API-call bookkeeping, not ledger data; can stay as a simple counter table or even remain in-memory/cache if it currently is. Confirm before migrating.
- Purity factor calculation chain (`effectiveBaseRate = baseRatePerGram * (1 + premium%)`, `currentMarketRate = effectiveBaseRate * purityFactor`) — unchanged, service layer.
- Full 9-step calculation chain (metal amount → making charges → GST → net amount → current value → P&L → return %) — unchanged, service layer, not DB computed columns.

**FKs to add**: `gold_silver_investments.purity_option_id → metal_purity_options.id`.

---

## Module 8: `mutualfund`

**Why last**: most complex FK chain, most complex business logic (FIFO engine), real extracted family financial data (`Krishil_MF_investment.xlsx` source data — 9 schemes, 41 lumpsums, 29 redemptions, 3 SIP mandates, 578 SIP contributions, 124 valuation snapshots). Do this only after the JPA/Flyway/migration-script pattern is proven on Modules 1–7.

**Tables**: `mf_schemes`, `mf_lumpsum_transactions`, `mf_sip_mandates`, `mf_sip_contributions`, `mf_redemption_transactions`, `mf_valuation_snapshots`

**Preserve exactly**:
- Full FK chain: `lumpsum/redemption/sip_mandate.scheme_id → mf_schemes.id`, `sip_contribution.sip_mandate_id → mf_sip_mandates.id`, `sip_contribution.scheme_id → mf_schemes.id` (denormalized, must match mandate's scheme — keep the app-layer cross-check even though both are now real FKs, since this checks a business invariant across two FK paths, not referential integrity itself).
- `deleteScheme()` delete-block → `ON DELETE RESTRICT` on all 4 transaction tables' `scheme_id` FK. Remove the manual 4-collection scan.
- `mfCategory` normalization (trim + case-normalize on save) — stays in service layer as a `@PrePersist`/`@PreUpdate` hook, not a DB trigger.
- `MfFifoEngine` — port verbatim, no logic changes. This is the highest-risk piece of this migration; write dedicated regression tests comparing FIFO output before/after on the full Krishil dataset before considering this module done.
- Discrepancy cross-check (holder+platform bucket, latest valuation snapshot vs ledger total, >₹1 tolerance) — reimplement the aggregation as SQL where it simplifies things (`GROUP BY holder_name, platform`), but keep the >₹1 tolerance comparison and flagging logic in the service layer.
- `FULLY_REDEEMED` / `ACTIVE_SIP` / `LUMPSUM_ONLY` status derivation — unchanged, service layer, not a DB column with a trigger.
- 5-sheet Excel export — unchanged, just reads from JPA repositories instead of Mongo repositories.

**Migration script note**: this is the one dataset where a full row-count AND monetary-sum reconciliation against the Krishil Excel source data is mandatory before sign-off, not just Mongo-vs-Postgres row counts.

---

## Module 9: `email`

**Tables**: `email_tokens`

**Preserve exactly**: magic link JWT signing/expiry logic unchanged — this table just stores token metadata, no complex migration risk.

---

## Future Reference (OUT OF SCOPE — not part of this migration)

The following is captured for future planning only. Do NOT implement any of this during the current MongoDB → PostgreSQL migration.

### Calculator module relocation (planned for the future)

The `calculator` module is a candidate to be **moved to / re-implemented in the FRONTEND** at some point in the future. It is explicitly out of scope for this migration — it must remain untouched here.

Why it does not affect the migration:
- `calculator` has **no database dependency** in its current form. It computes from static config YAML files (`calculator/tax-slabs.yml`, `calculator/savings-rates.yml`, `calculator/default-assumptions.yml` under `backend/src/main/resources/configs/`) and is gated by bucket4j rate-limiting — none of which touch Mongo or Postgres.
- Therefore Module 1–9 below never touch it, and the DB layer swap does not alter it.

Where it MAY be affected if / when it moves to the frontend (FOR FUTURE REFERENCE):
- The config YAML files currently bundled in `backend/src/main/resources/configs/` may need to be published as a frontend-side data source (e.g. JSON/TS constants, or a public API endpoint) instead of backend-classpath resources.
- Any calculator endpoint that will remain backend-side would stay as-is; only relocated logic and its DTOs/controllers would change. REST contract changes would be driven by the frontend move, NOT by this Postgres migration.
- No specific DB tables, entities, or repositories are affected.

Action for THIS migration: leave every file under `calculator/` and all `configs/calculator/*.yml` unchanged.

---

## Final Step (after all 9 modules confirmed)

1. Remove `spring-boot-starter-data-mongodb` and all Mongo repository interfaces/annotations from the codebase.
2. Remove `MONGODB_URI` / `MONGODB_DB` from environment config.
3. Update `render.yaml` and `Dockerfile` comments referencing MongoDB.
4. Update all module READMEs' "Data Layer" sections to reflect Postgres tables instead of MongoDB collections.
5. Update root `README.md` tech stack badges and the MongoDB Collections appendix table in `backend/README.md`.

## Execution Protocol

Work one module at a time, in order. For each module: entities → Flyway migration → repositories → service layer swap → tests → data migration script → verification report → stop and wait for confirmation. Do not proceed to the next module without explicit go-ahead.
