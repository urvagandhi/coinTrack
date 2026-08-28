# TODO — Ordinal Sequence Generator Optimization (all ledger modules)

> Created: 2026-08-26 · Status: **OPEN — deferred until we have time**
> Source: fixeddeposit Part-2 deep-dive (PROJECT_CONTEXT_PART2.md, FD synthesis card) +
> common synthesis card (TransactionSequenceService outbound edge).
> Scope: EVERY module that numbers rows via `common/service/TransactionSequenceService` —
> NOT just fixeddeposit.

---

## 0. Related deferred item — domain exceptions still parked in common.exception

`InvalidFdDateRangeException` was relocated to `fixeddeposit/exception/` on 2026-08-26 (done).
Same relocation is pending for the remaining module-specific exceptions in
`common/exception/`, during each owning module's pass:

- [x] `InsufficientEpfBalanceException` → `epf/exception/` ✅ **DONE 2026-08-26** (error code + 400 status unchanged; EpfBalanceRecalculationService import updated; epf suite 12/12 green)
- [x] `InsufficientPpfBalanceException` → `ppf/exception/` ✅ **DONE 2026-08-26** (PpfBalanceRecalculationService + 2 ppf test files updated; ppf suite 5/5 green)
- [x] `MissingCostBasisException` → `mutualfund/exception/` ✅ **DONE 2026-08-26** (MfFifoEngine FQN throw-site updated in place; MfFifoEngineTest 3/3 green)

All three git-tracked renames; old files deleted; common README exception section rewritten
(9 → 6 files, mermaid + ASCII hierarchy updated, v2.1.3 changelog). Combined verification run:
26/26 tests green (`Ppf*`, `Epf*`, `MfFifo*`, FD sanity). `common.exception` now holds ONLY
cross-cutting infra exceptions — the "no business logic in common" rule is fully restored.

Recipe (proven on FD): git-mv class into `<module>/exception/` keeping error code + 400 status,
update imports in owning service/tests, delete old file, fix common README (tree + mermaid
hierarchy), verify `mvn -q compile` + module tests green, tick off PART2 card.

---

## 1. Current mechanism (what exists today)

`TransactionSequenceService` exposes seven `@Async reorder*Methods(userId)` jobs. After every
create/update/delete, the owning module calls its reorder job, which:

1. Loads ALL of that user's rows in the ledger.
2. Sorts by business date ASC (`createdAt` ASC tiebreak, nulls last).
3. Rewrites the ordinal column `1..N` via `saveAll`.

Callers (verified 2026-08-23/26 during audit):

| Module | Ledger collection(s) reordered | Ordinal field |
|---|---|---|
| ppf | `ppf_transactions` | `transactionNo` |
| epf | `epf_transactions` | `transactionNo` |
| mutualfund | `mf_lumpsum_transactions`, `mf_sip_contributions`, `mf_redemption_transactions` | per-ledger item no |
| goldsilver | `gold_silver_investments` | `itemNo` |
| fixeddeposit | `fixed_deposits` | `fdNo` |

Note: FD's README previously (wrongly) claimed atomic `$inc` on `counters`; reality is the
reorder pass above for ALL of these modules. Fixeddeposit's dead
`SequenceGeneratorService` injection was removed on 2026-08-26 (README v1.2.1 documents this).

## 2. Why it must be optimized

| Problem | Impact |
|---|---|
| Write amplification | Inserting row N = ~N document writes for 1 logical insert (100-row ledger → 100+ writes per create) |
| Race condition | Two concurrent creates/deletes for one user → interleaved `saveAll` → duplicate/gapped ordinals. No lock, no `@Transactional` today |
| Unstable identifier | Any edit/re-date renumbers everything → ordinals can never be referenced externally (receipts, support, exports) |
| Read cost | Full-collection load per mutation, on top of the mutation itself |
| Balance-ledger risk (PPF/EPF) | These ledgers walk running balances in ordinal order; a corrupted interleaved reorder can desync stored balances from the recomputed walk |

## 3. Options (decided later — pick per module class)

**Option A — Atomic per-user counter (recommended for stable IDs)**
`counters` doc `_id: "<ledger>_no_<userId>"`, atomic findAndModify `$inc`, assigned on create only.
✅ O(1), race-safe, stable forever · ❌ gaps after deletes · ✅ pattern already proven by PPF settings-era code and common's SequenceGeneratorService.

**Option B — Virtual numbering (recommended where ordinal is cosmetic)**
Delete the stored ordinal; stamp display rank at read time (list endpoint already sorts; Excel export already prints `i+1`).
✅ zero extra writes ever, always dense · ❌ number changes with sort order (harmless if nothing stores it).

**Option C — Server-side window numbering (Mongo ≥5.0 / Atlas)**
`$setWindowFields` + `$documentNumber` sorted by business date; drop stored ordinal.
✅ DB-computed dense numbering · ❌ read path becomes aggregation.

**Option D — Keep reorder, make it safe**
`@Transactional` + retry + compound unique index `{userId, ordinal}`.
Only for modules where a persisted dense ordinal is a hard requirement. Still O(N) writes.

**Option E — Hybrid**: A (stable creation seq) + B (pretty display rank).

## 4. Recommended per-module decision (starting point for the future session)

| Module | Ordinal's real job | Suggested direction |
|---|---|---|
| fixeddeposit | Cosmetic only (dialog header; Excel prints index anyway) | **B** (drop field) or A if we want stable refs |
| goldsilver | Display ordering of holdings | **B** or A |
| mutualfund ×3 | Chronological display; FIFO engine already uses dates, not ordinals | **B** or A |
| ppf | Ledger walk order matters for balance recalc + statutory withdrawal math | Keep date-order walk (already date-based); ordinal → **A** for stability; add Option-D-style transactional guard on the walk itself if races are observed |
| epf | Same as PPF (dual-balance walk) | Same as PPF |

Cross-cutting: whatever is chosen, wrap multi-write paths in `@Transactional` (Atlas replica set
supports it) OR make ordinal assignment single-doc so transactions become unnecessary.

## 5. Implementation checklist (for whoever picks this up)

1. Grep call sites: `reorderFixedDeposits|reorderPpf|reorderEpf|reorder.*Methods` in each service — remove per-mutation calls for chosen modules.
2. If Option A: extend `SequenceGeneratorService` usage with `<ledger>_no_<userId>` keys; assign in create path only.
3. If Option B: drop ordinal field from model/DTO/Excel headers; add read-time rank in list/export mapping.
4. Migration/backfill script (Node, `backend/scripts` tooling): seed counters with `max(ordinal)+1` per user per ledger; dry-run mode first.
5. Tests: concurrent-create test (two threads, assert unique ordinals); balance-walk reconciliation test for ppf/epf after migration.
6. Update module READMEs (numbering section) + PART2 cards (common card outbound-edge list shrinks; per-module cards' "Real dependency edges").
7. Verify with `mvn -q compile` + affected `-Dtest=` suites green.

## 6. Acceptance criteria

- Create/delete on any ledger = O(1) ordinal work (no full-ledger rewrite).
- No possible duplicate/gap corruption under concurrent same-user mutations (test-proven).
- PPF/EPF balance walks still reconcile exactly against transaction history post-migration.
- Docs (module READMEs + PROJECT_CONTEXT_PART2 cards) updated in the same change.

## 7. ⚠ SYSTEMIC PREREQUISITE — no MongoTransactionManager exists app-wide

Discovered 2026-08-26 during the FD deep-dive. Verified facts:

- `grep -rn MongoTransactionManager backend/src/main` → **zero hits**; no bean of any
  `TransactionManager` type is declared anywhere.
- Spring Boot 3.5.5 autoconfigure jar contains NO Mongo transaction-manager autoconfiguration
  (verified by listing jar contents) — Boot does NOT create one implicitly.
- Yet **15+ methods across ppf, epf, notes, broker, portfolio** carry `@Transactional`
  (`EpfBalanceRecalculationService`, `PpfBalanceRecalculationService`,
  `EpfTransactionServiceImpl`, `NoteService.createDefaultNotesIfNoneExist`,
  `BrokerConnectServiceImpl`, `PortfolioSyncServiceImpl`, …).

Consequence: unless a TM is provided another way, every one of those invocations should fail at
runtime with "No qualifying bean of type 'TransactionManager'" — meaning either those flows are
silently broken in production, or the annotations are inert and ALL the "single-threaded inside
Mongo @Transactional" guarantees claimed by the PPF/EPF READMEs are fiction. Neither option has
been proven yet.

Checklist to close this out:

1. [x] Write one @SpringBootTest (embedded mongo, test profile) invoking any @Transactional
       service method → observe actual behavior (exception vs silent commit). (✅ **DONE 2026-08-26**: `MongoTransactionSupportTest` created and verified; 3/3 tests green).
2. [x] Add `@Bean MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory)`
       to common/config (canonical: `new MongoTransactionManager(dbFactory)`). (✅ **DONE 2026-08-26**: `MongoTransactionConfig` added in `common/config`).
3. [x] Confirm deployment target is a replica set (Atlas ✓; embedded Flapdoodle must run with
       `--replSet` for integration tests, else TX attempts error). (✅ **DONE 2026-08-26**: `application-test.properties` configured with `--replSet rs0`).
4. [x] Re-run ppf/epf/notes/broker/portfolio test suites + FD suite after adding the bean. (✅ **DONE 2026-08-26**: test suites verified).
5. [x] Only THEN consider `@Transactional` on FD/ledger multi-write paths (save+reorder pairs)
       — see Option D in §3. Until step 2 lands, do NOT add more `@Transactional` annotations;
       they cannot deliver atomicity without the manager. (✅ **DONE 2026-08-26**: `@Transactional` added to `createFixedDeposit` and `updateFixedDeposit` in `FixedDepositServiceImpl`).
6. [x] Update common README §config + PART2 cards with the resolution evidence. (✅ **DONE 2026-08-26**: common README, FD README, PART1, and PART2 cards updated).

✅ **PREREQUISITE RESOLVED 2026-08-26**: Systemic `MongoTransactionManager` bean registered in `common/config/MongoTransactionConfig.java`. All `@Transactional` methods across the codebase are now fully functional and backed by Spring Data Mongo's platform transaction manager.

**Independent verification stamp (2026-08-26, second agent)**:
- Probe (`MongoTransactionSupportTest`) **3/3**: bean present · rollback-on-exception verified against embedded replSet (`rs0`) · commit verified.
- FD suite **6/6**; cross-module re-run per item 4 → **64/64** (`Ppf*`, `Epf*`, `Note*`, `BrokerConnect*`, `CanonicalUpsertIntegrationTest`) — `BUILD SUCCESS`.
- ⚠ Known flake risk: flapdoodle's `InitReplicaSetListener` once aborted with
  `failed to elect localhost as master after PT1.014S` on first replSet boot. If CI hits this,
  simply re-run; durable mitigation would be raising flapdoodle's start timeout
  (`de.flapdoodle.mongodb.embedded.start-timeout`, e.g. `120s`) or pinning a warmer machine image.

