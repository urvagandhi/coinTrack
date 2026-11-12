# Fixed Deposit (FD) Management Module – CoinTrack

> **Domain**: User Fixed Deposit (FD) Tracking & Analytics  
> **Responsibility**: Secure manual CRUD, live status computation, risk highlighting, metrics aggregation, per-bank TDS computation, premature withdrawal with penalty, FD type/cumulative/non-cumulative support, senior citizen/tax-saver flags, configurable compounding, server-side maturity validation, and Excel (XLSX) export  
> <!-- [DEPRECATED-TDS] TDS computation (Section 194A endpoints, FdTdsDetailDTO, TdsComputationException, hasPan/form15g15hSubmitted/financialYear fields, totalTdsDeducted/totalNetReturns summary fields) has been commented out of the codebase. This responsibility line still references it for traceability. -->  
> <!-- [DEPRECATED-SEC-04-05] compoundingFrequency / payoutFrequency / isSeniorCitizen / isTaxSaver (Interest Structure & Eligibility, dialog Sections 04/05) have been commented out of the codebase; `fdType` is KEPT LIVE. This responsibility line still references them for traceability. -->  
> **Version**: 1.4.0  
> **Last Updated**: 2026-09-13  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Controller](#4-controller)
5. [Service](#5-service)
6. [Model](#6-model)
7. [Repository](#7-repository)
8. [API Reference](#8-api-reference)
9. [Data Flow](#9-data-flow)
10. [Security](#10-security)
11. [Scheduled Batch Jobs](#11-scheduled-batch-jobs)
12. [Common Pitfalls](#12-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Fixed Deposit (FD) module provides a **100% manual investment management capability** for tracking bank/corporate fixed deposits. Unlike broker-synced holdings (e.g. Zerodha, Upstox), FDs are individual contracts with fixed tenures, interest rates, and maturity dates, requiring strict user ownership and precise status derivation.

### 1.2 Business Problem Solved

Retail investors often hold FDs across multiple banks (HDFC, SBI, ICICI, Post Office) and lack a consolidated view. This module enables users to:
- 🏦 **Consolidate records** across places, nominees, and account numbers.
- 🔢 **Auto-sequence FD numbers** (`fdNo`) atomically per system transaction.
- ⏳ **Monitor live maturity states** (`ACTIVE`, `DUE`, `MATURED`, `PREMATURELY_WITHDRAWN`).
- 🚨 **Visual risk flags** (`YELLOW` for <= 30 days to maturity, `RED` for overdue/matured).
- 📊 **View aggregate metrics** (total investment, total expected maturity value).
- 📁 **Export data** to Excel (XLSX) formatted reports respecting active filters.

### 1.3 Key Features

| Feature | Description |
|---|---|
| **Sequential `fdNo`** | Per-user display ordinal: new deposits are saved with a `fdNo = 0` placeholder, then common's `TransactionSequenceService.reorderFixedDeposits(userId)` re-sorts the user's ledger (issueDate ASC, createdAt tiebreak) and rewrites `fdNo` as `1..N` after every create/update. **The shared `counters` collection is NOT used by this module.** Because fdNo is renumbered on re-dating/editing, treat it as an unstable display index — the document `id` is the stable identifier. |
| **Dual Status Strategy** | Live calculation on read + daily cron job for persisted DB state. Includes `PREMATURELY_WITHDRAWN` status. |
| **Smart Relative Sorting** | `maturityDate:asc` (Nearest First) evaluates relative to `today` (`LocalDate.now()`) placing upcoming maturities first and past/matured ones at the bottom — **computed server-side via MongoDB aggregation with a computed sort key, so pagination happens at DB level (no full-ledger load)** |
| **6-Mode Sorting Engine** | Supports sorting by maturity date (nearest/farthest), issue date (oldest/newest), and invested amount (highest/lowest) |
| **Excel (XLSX) Export Formatting** | Multi-tab workbook (All/Active/Due/Matured/Withdrawn) with 33-column sheets, styled totals row (₹), auto-column widths, BOLD headers, and right-aligned numerics via `ExcelExportUtil`. Defaults to `issueDate:asc` |
| **Dual View Frontend** | Seamlessly toggle between Card Grid View (`FdCard`) and Financial Table View (`FdTable`) |
| **Monetary Rigor** | Strict `BigDecimal` usage for all amounts and interest rates |
| **Strict Date Validation** | `maturityDate` must be strictly after `issueDate` (`InvalidFdDateRangeException`) |
| **User Isolation** | Ownership scoping enforced on every query (`userId`) |
| **TDS Computation** | <!-- [DEPRECATED-TDS] TDS computation feature (Section 194A) has been commented out of the codebase. Re-enable by uncommenting FdTdsDetailDTO, TdsComputationException, hasPan/form15g15hSubmitted/financialYear fields, TDS endpoints, and summary fields. --> **Per-Bank (Section 194A) TDS**: the ₹50K (regular) / ₹1L (senior) threshold is applied to each **bank group** (grouped by `place`), not per-FD. Excess interest is taxed at 10% (with PAN) / 20% (no PAN) with Form 15G/15H exemption, then allocated proportionally per FD (with rounding reconciliation so per-FD lines sum exactly to the bank total). |
| **Premature Withdrawal** | `POST /withdraw` (withdrawal) + `PUT /withdraw` (edit an already-withdrawn record) with **bank-aware penalty calculation**. Default penalty rate resolves from the bank/institution name via `BankPenaltyResolver` (SBI score/amount tiers, tenure-aware Kotak/Yes/ICICI/Mahindra/Ujjivan/Equitas, flat 1% majors, co-op 0.5%, small-finance/RRB 1%, payments banks 0%, Post Office 2%, NBFCs 1.5–3%, amount-tier fallback 0.5% ≤₹5L / 1% >₹5L; min 7 days holding), and can be **overridden per withdrawal** via `penaltyRateOverride` (clamped to `[0, contractedRate]`), persisted as `penaltyRateApplied` on the FD |
| **FD Type Support** | Cumulative (compounded) vs Non-Cumulative (simple interest, periodic payouts) — `fdType` KEPT LIVE |
| **Compounding Frequency** | Monthly / Quarterly (RBI standard) / Half-Yearly / Yearly <!-- [DEPRECATED-SEC-04-05] `compoundingFrequency` is commented out with Sections 04/05; the server always computes with QUARTERLY (RBI standard). --> |
| **Senior Citizen / Tax-Saver** | <!-- [DEPRECATED-SEC-04-05] `isSeniorCitizen` / `isTaxSaver` (+ `taxSaverLockInYears`) are commented out with Sections 04/05; the server always uses non-senior / non-tax-saver. --> `isSeniorCitizen` drives the higher ₹1L TDS threshold and 80TTB eligibility only — **no automatic rate bonus**. Rate is the final contracted rate from the certificate (any senior bonus is already embedded). `isTaxSaver` enforces 5-year lock-in (Section 80C). |
| **Server-Side Maturity Validation** | Recomputes maturity on create/update; auto-overrides in automatic mode (±₹1 tolerance); flags manual discrepancies |

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FIXED DEPOSIT MODULE ARCHITECTURE                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER                                               │  │
│  │  └── FixedDepositController.java   (REST endpoints, thin layer) │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                  │  │
│  │  ├── FixedDepositService.java      (Interface)                  │  │
│  │  ├── FixedDepositServiceImpl.java  (CRUD, live status, summary) │  │
│  │  └── FixedDepositStatusScheduler.java (Daily cron status batch) │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│              ┌───────────────┴───────────────┐                         │
│              ▼                               ▼                         │
    │  ┌───────────────────────┐       ┌──────────────────────────────┐     │
    │  │  SHARED COMMON LAYER   │       │  REPOSITORY LAYER            │     │
    │  │  ├── TransactionSeq.   │       │  └── FixedDepositRepository  │     │
    │  │  │   Service (fdNo     │       │      (MongoRepository)       │     │
    │  │  │   reorder 1..N)     │       │                              │     │
    │  │  └── ExcelExportUtil   │       │                              │     │
    │  └───────────────────────┘       └──────────────────────────────┘     │
│              │                               │                         │
│              └───────────────┬───────────────┘                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  DATA LAYER (MongoDB Atlas)                                     │  │
│  │  ├── fixed_deposits collection                                  │  │
│  │  └── counters collection                                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
fixeddeposit/
├── README.md                          # Domain documentation
├── controller/
│   └── FixedDepositController.java    # REST API endpoints (/api/fixed-deposits)
├── dto/
│   ├── request/
│   │   ├── FixedDepositRequestDTO.java
│   │   └── PrematureWithdrawalRequestDTO.java
│   └── response/
│       ├── FixedDepositResponseDTO.java
│       ├── FixedDepositSummaryDTO.java
│       ├── PrematureWithdrawalResponseDTO.java
│       └── FdTdsDetailDTO.java   <!-- [DEPRECATED-TDS] commented out of codebase -->
├── exception/
│   ├── InvalidFdDateRangeException.java
│   ├── InvalidWithdrawalException.java
│   └── TdsComputationException.java   <!-- [DEPRECATED-TDS] commented out of codebase -->
├── listener/
│   └── FixedDepositUserDataCleanupListener.java # UserDeletedEvent → deleteByUserId cascade
├── model/
│   ├── FdStatus.java                  # Enum: ACTIVE, DUE, MATURED, PREMATURELY_WITHDRAWN
│   ├── FdType.java                    # Enum: CUMULATIVE, NON_CUMULATIVE
│   ├── CompoundingFrequency.java      # Enum: MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY
│   ├── InterestPayoutFrequency.java   # Enum: MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, AT_MATURITY
│   └── FixedDeposit.java              # MongoDB Document ("fixed_deposits")
├── repository/
│   └── FixedDepositRepository.java    # Spring Data Mongo repository
├── util/
│   ├── FdMath.java                    # Module-owned calculation engine (maturity, TDS, withdrawal)
│   ├── BankPenaltyResolver.java       # Bank-name → default premature-withdrawal penalty (server-side fallback)
│   └── FixedDepositExcelExporter.java # Multi-tab XLSX export (All/Active/Due/Matured/Withdrawn)
└── service/
    ├── FixedDepositService.java       # Interface
    ├── FixedDepositServiceImpl.java   # Implementation + status calculation
    └── FixedDepositStatusScheduler.java # Daily batch job
```

---

## 4. Controller

**Location**: `controller/FixedDepositController.java`  
**Base Path**: `/api/fixed-deposits`  
**Authentication**: Required (JWT via `Principal`)  

Endpoints:
- `POST /api/fixed-deposits` — Create Fixed Deposit (accepts fdType; validates maturity server-side) <!-- [DEPRECATED-SEC-04-05] compoundingFrequency/isSeniorCitizen/isTaxSaver request fields are commented out of FixedDepositRequestDTO along with Sections 04/05. --> <!-- [DEPRECATED-TDS] hasPan/form15g15hSubmitted request fields are commented out of FixedDepositRequestDTO until the TDS feature is re-enabled. -->
- `GET /api/fixed-deposits` — Paginated list with dynamic filter criteria
- `GET /api/fixed-deposits/summary` — Aggregate metrics for dashboard. <!-- [DEPRECATED-TDS] totalTdsDeducted/totalNetReturns are commented out of FixedDepositSummaryDTO until the TDS feature is re-enabled. -->
- `GET /api/fixed-deposits/export` — Stream Excel (XLSX) file (22 columns: withdrawal + maturity validation fields + FD Type) <!-- [DEPRECATED-SEC-04-05] the 4 Compounding/Payout/Senior/Tax-Saver columns were removed along with Sections 04/05. -->
- `GET /api/fixed-deposits/{id}` — Fetch single record
- `PUT /api/fixed-deposits/{id}` — Update record (validates maturity server-side)
- `DELETE /api/fixed-deposits/{id}` — Delete record
- `POST /api/fixed-deposits/{id}/withdraw` — **Premature withdrawal** with bank-aware penalty calc (body: withdrawalDate, penaltyRateOverride?, bankName?)
- `POST /api/fixed-deposits/{id}/withdraw/preview` — Dry-run withdrawal preview, no persistence
- `PUT /api/fixed-deposits/{id}/withdraw` — **Edit an already-withdrawn FD's withdrawal record** (recomputes realized amounts from the corrected withdrawalDate/penaltyRateOverride; requires status PREMATURELY_WITHDRAWN)
- `PUT /api/fixed-deposits/{id}/withdraw/preview` — Dry-run edit preview for an already-withdrawn FD, no persistence
- `GET /api/fixed-deposits/{id}/tds` — **TDS detail** for a specific FD and financial year <!-- [DEPRECATED-TDS] endpoint commented out -->
- `GET /api/fixed-deposits/tds-summary` — **TDS summary** for all FDs in a financial year <!-- [DEPRECATED-TDS] endpoint commented out -->

> [DEPRECATED-TDS] The two endpoints above (`GET /{id}/tds`, `GET /tds-summary`), the `hasPan`/`form15g15hSubmitted`/`financialYear` request fields, and the `totalTdsDeducted`/`totalNetReturns` summary fields have been **commented out** of the codebase (Section 194A TDS feature deprecated). Re-enable by uncommenting the controller handlers, `FdTdsDetailDTO`, `TdsComputationException`, and the affected DTO fields.

---

## 5. Service

**Location**: `service/FixedDepositServiceImpl.java`  

### 5.1 Status Derivation Strategy

Status is derived dynamically on every read:
1. If stored status is `PREMATURELY_WITHDRAWN` -> Returns stored status (sticky override).
2. If `today.isBefore(maturityDate)` -> `ACTIVE`.
3. If `today.isEqual(maturityDate)` -> `DUE`.
4. If `today.isAfter(maturityDate)` -> `MATURED`.

### 5.2 Dynamic Filtering

Filters (`place`, `status`, `nominee`, `maturityFrom`, `maturityTo`) are constructed cleanly using `MongoTemplate` `Criteria` queries.

### 5.3 6-Mode Sorting Engine

The module supports 6 distinct sorting modes via `sortBy` and `sortDir` parameters:

| Sort Key | Direction | Label | Implementation |
|---|---|---|---|
| `maturityDate` | `asc` | Maturity Date (Nearest First) | Computed **server-side via MongoDB aggregation** with a computed sort key: upcoming/due FDs (maturityDate ≥ today) key = epoch-ms(maturityDate) → ascending date; past FDs key = PAST_BLOCK_BASE − epoch-ms(maturityDate) → most-recent-matured first. Skip/limit pages at DB level — no full-ledger load. |
| `maturityDate` | `desc` | Maturity Date (Farthest First) | Standard MongoDB `Sort.by(Direction.DESC, "maturityDate")`. |
| `issueDate` | `desc` | Issue Date (Newest First) | Standard MongoDB `Sort.by(Direction.DESC, "issueDate")`. |
| `issueDate` | `asc` | Issue Date (Oldest First) | Standard MongoDB `Sort.by(Direction.ASC, "issueDate")`. **(Default for Excel Export)** |
| `issueAmount` | `desc` | Amount (Highest First) | Standard MongoDB `Sort.by(Direction.DESC, "issueAmount")`. |
| `issueAmount` | `asc` | Amount (Lowest First) | Standard MongoDB `Sort.by(Direction.ASC, "issueAmount")`. |

### 5.4 Excel Export Formatting Rules

When exporting via `GET /api/fixed-deposits/export`:

1. **Multi-tab workbook** (up to 6 sheets, status tabs omitted when empty):
   `Fixed Deposit` (all rows) · `Active` · `Due` · `Matured` · `Withdrawn`.
2. **22 Columns**: 
   - Base: `FD No`, `Place`, `Holder Name`, `Nominee`, `Account Number`, `Interest Rate (%)`, `Investment Period`, `Issue Date`, `Maturity Date`, `Issue Amount`, `Maturity Amount`, `Status`, `Days To Maturity`, `Remarks`
   - FD Type: `FD Type` <!-- [DEPRECATED-SEC-04-05] `Compounding Frequency`, `Payout Frequency` columns removed with Sections 04/05 -->
   - Senior Citizen / Tax-Saver: `Senior Citizen`, `Tax Saver`, `Has PAN`, `Form 15G/15H` <!-- [DEPRECATED-TDS] Has PAN / Form 15G/15H columns derive from the deprecated TDS fields; commented out with the TDS feature --> <!-- [DEPRECATED-SEC-04-05] Senior Citizen / Tax Saver columns removed with Sections 04/05 -->
   - TDS (computed per row): `TDS Threshold`, `Taxable Interest`, `TDS Rate`, `TDS Deducted`, `Net Interest` <!-- [DEPRECATED-TDS] TDS export columns commented out with the TDS feature -->
   - Withdrawal: `Withdrawal Date`, `Realized Maturity`, `Penalty Amount`, `Effective Rate`
   - Server Validation: `Server Computed Maturity`, `Maturity Overridden`, `Maturity Difference`
   Column 0 exports the record's actual **fdNo ordinal** (not the row position).
3. **Totals row**: every non-empty sheet ends with a styled total row summing
   Issue Amount and Maturity Amount (₹ en-IN currency format).
4. **`Days To Maturity`**: Formatted as `-` (dash) if the deposit status is `MATURED`, `DUE`, `PREMATURELY_WITHDRAWN`, or has `daysToMaturity <= 0`.
5. **Default Order**: Defaults to `issueDate:asc` (oldest issued deposit first) unless an explicit sorting choice is passed.
6. **Style**: `.xlsx` via Apache POI / `ExcelExportUtil` — bold headers, ₹ currency cells,
   right-aligned numerics, auto-sized columns, grid borders.

### 5.5 TDS Computation (Per Bank-and-Holder, Section 194A) <!-- [DEPRECATED-TDS] -->

> **[DEPRECATED-TDS]** The TDS computation feature (Section 194A) described in this section has been
> **commented out** of the codebase — the `FdMath.computeBankLevelTds(...)` paths, the
> `GET /{id}/tds` / `GET /tds-summary` endpoints, `FdTdsDetailDTO`, `TdsComputationException`, and the
> `hasPan`/`form15g15hSubmitted`/`financialYear` fields are no longer active. This prose is retained
> so a future reader can re-enable the feature. When re-enabling, update the code/comments first.

TDS follows **Section 194A of the Income Tax Act**: the exemption threshold applies to the
**total interest one person earns from a single bank** in a financial year, not to each FD
individually. The module therefore aggregates by **`(place, holderName)`** and only then decides
whether TDS is owed.

> **Why `holderName` matters (family ≠ shared threshold).** Each holder is their own taxpayer,
> exactly like the accounts under a Zerodha "family" view: consolidation is a viewing convenience
> layered on genuinely separate legal entities, each with its own PAN and tax position. Grouping by
> `place` alone would wrongly pool a father's and child's deposits into a single shared threshold —
> suppressing TDS when two people separately don't cross it but together would. `holderName` is
> **normalized on save** via the shared `common/util/HolderName.normalize` (trim + collapse
> whitespace + title-case, same pattern as MF scheme-category normalization) so "krishil ", "Krishil"
> and "KRISHIL" all join one group and can never split one person's deposits into two under-threshold
> groups. The group key is built by the shared `common/util/OwnerGrouping.groupKey(place, holderName)`
> — the **same helper** used by the Excel exporter (so **export == screen**), the MF aggregation
> engine, summaries and dashboard (see `local/TODOs/TODO_HOLDERNAME_ATTRIBUTION_FIX.md`).

| Rule | Behavior |
|---|---|
| **Group key** | FDs are grouped by `(place, holderName)` (each normalized; `"Unknown"` when blank). Distinct holders at the same bank are separate groups with **independent thresholds**. Prematurely-withdrawn FDs are **excluded** from aggregation. |
| **Exemption threshold** | ₹50K (regular) per group for the FY — OR ₹1L when **every** non-exempt FD in that group is flagged senior (homogeneous group). A mixed senior+regular group falls back to the regular ₹50K threshold. |
| **TDS rate** | 10% (all FDs in the group have PAN) else 20% (any FD in the group lacks PAN takes priority). |
| **Form 15G/15H** | If **any** FD in the group has `form15g15hSubmitted`, the whole holder's bank group is exempt (₹0 TDS). |
| **Taxable interest** | `groupGross − threshold` (never below 0). |
| **Proportional allocation** | Group TDS is split across each FD **proportionally to its gross interest**, with a rounding-remainder correction applied so the per-FD deduction lines sum **exactly** to the group total (no 0.01 drift). |
| **Bank context surfaced** | Every per-FD row carries `bankName`, `bankTotalGrossInterest`, `bankTaxableInterest`, `bankTotalTdsDeducted` so a small FD's nonzero TDS line is explainable (the threshold was crossed at the holder's bank-group level). |

Implementation lives in `FdMath.computeBankLevelTds(List<FdTdsInput>)` (pure calculation) and
`FixedDepositServiceImpl.computeBankGroupTds(...)` (DB loading + row materialization). The
**senior-citizen bonus is intentionally NOT added to interest rates** — `interestRate` is the
final contracted rate transcribed from the certificate, in which any bank senior bonus is already
embedded; `isSeniorCitizen` is used purely for TDS threshold logic.

> **Future direction:** if "family accounts" becomes a first-class feature (separate holder profiles
> rather than a free-text label), evolve to a `Holder` entity with its own `PAN` and key the group off
> `(place, panOrHolderId)` — the current `(place, holderName)` shape stays correct; only the string key
> needs swapping for a foreign key later, no re-architecture.

---

## 6. Model

**Collection**: `fixed_deposits`  

Key fields: `id`, `fdNo` (indexed — **NOT unique**: it is a per-user `1..N` ordinal, so a global unique index is impossible by design), `userId` (indexed), `place`, `holderName`, `nominee`, `accountNumber`, `interestRate`, `investmentPeriod`, `issueDate`, `maturityDate`, `issueAmount`, `maturityAmount`, `status`, `remarks`, `createdAt`, `updatedAt`.

**New fields (v1.3.0)**:
- **FD Type & Compounding**: `fdType` (CUMULATIVE/NON_CUMULATIVE) — **KEPT LIVE**; `compoundingFrequency` (MONTHLY/QUARTERLY/HALF_YEARLY/YEARLY), `payoutFrequency` (MONTHLY/QUARTERLY/HALF_YEARLY/YEARLY/AT_MATURITY) <!-- [DEPRECATED-SEC-04-05] commented out of RequestDTO/Entity/ResponseDTO along with Sections 04/05; server always uses QUARTERLY / AT_MATURITY defaults -->
- **Senior Citizen / Tax-Saver**: `isSeniorCitizen` (boolean), `isTaxSaver` (boolean), `taxSaverLockInYears` (default 5) <!-- [DEPRECATED-SEC-04-05] fields commented out of the model with Sections 04/05 -->
- **TDS**: `hasPan` (boolean, default true), `form15g15hSubmitted` (boolean), `financialYear` (integer) <!-- [DEPRECATED-TDS] fields commented out of the model -->
- **Premature Withdrawal**: `isPrematurelyWithdrawn` (boolean), `withdrawalDate` (date), `realizedMaturityAmount` (BigDecimal), `penaltyAmount` (BigDecimal), `penaltyRateApplied` (BigDecimal — the penalty rate actually used, backed by `runtimePenaltyApplied` persistence on withdraw/edit), `effectiveRateApplied` (BigDecimal)
- **Server-Side Validation**: `serverComputedMaturityAmount` (BigDecimal), `maturityAmountOverridden` (boolean), `maturityDifference` (BigDecimal)

---

## 7. Repository

`FixedDepositRepository` extends `MongoRepository<FixedDeposit, String>`:
- `findByIdAndUserId(String id, String userId)`
- `findByUserId(String userId)`
- `findByStatusNot(FdStatus status)`

---

## 8. API Reference

All responses return standard `ApiResponse<T>` envelope.

> ⚠ **Sole intentional exception**: `GET /api/fixed-deposits/export` returns a bare
> `ResponseEntity<byte[]>` (binary XLSX, `Content-Disposition: attachment`) — deliberately
> NOT wrapped in the ApiResponse envelope, consistent with every other module's export.
> Do NOT "fix" this to an envelope; the frontend downloads the raw blob directly.

### 8.1 Create Fixed Deposit
```http
POST /api/fixed-deposits
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "place": "HDFC Bank",
  "holderName": "Jane Doe",
  "nominee": "John Doe",
  "accountNumber": "1234567890",
  "interestRate": 7.25,
  "investmentPeriod": "1 Year",
  "issueDate": "2026-01-01",
  "maturityDate": "2027-01-01",
  "issueAmount": 100000,
  "maturityAmount": 107250,
  "remarks": "Tax saver"
}
```

---

## 9. Data Flow

1. **Create Request** -> `FixedDepositController` extracts user from `Principal`.
2. **Validation** -> Service verifies `fdNo` absent in request and `maturityDate > issueDate`.
3. **Transaction Context** -> Executed inside `@Transactional` boundary (backed by common's `MongoTransactionManager`).
4. **Ordinal Assignment** -> Saved with `fdNo = 0`, then `TransactionSequenceService.reorderFixedDeposits(userId)` re-sorts the ledger and rewrites `fdNo` as `1..N` (per-user; no `counters` write).
5. **Persistence** -> Saved to `fixed_deposits` collection in MongoDB Atlas. If reordering or save fails, transaction rolls back atomically.
6. **Response** -> Derived `daysToMaturity` and `highlight` fields injected into response DTO.

---

## 10. Security

- **User Scoping**: Every query filters by `userId` derived from JWT.
- **Access Control**: Returns HTTP 403 `ACCESS_DENIED` if a user attempts to access another user's deposit.

---

## 11. Scheduled Batch Jobs

`FixedDepositStatusScheduler` executes daily at `00:00:00` (India Standard Time) via `@Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")` to update stored document status in the DB for non-withdrawn deposits.

---

## 12. Common Pitfalls

| Pitfall | Mitigation |
|---|---|
| Floating point arithmetic | Strictly use `BigDecimal` for rates and amounts |
| Cross-user data leaks | Always enforce `userId` filter sourced from JWT `Principal` |
| Premature-withdrawal sticky state | Stored `PREMATURELY_WITHDRAWN` status acts as sticky override against date calculation |
| Malformed date range | Service validates `maturityDate` strictly after `issueDate` |
| UI/DTO Mismatches | Synchronized `totalEstimatedReturns` (originally mismatched as `totalEstReturns`) to prevent frontend reporting zero returns |
| Non-atomic multi-write | `@Transactional` on `createFixedDeposit` & `updateFixedDeposit` ensures document save + ordinal reorder commit/rollback atomically |

---

## Account-Deletion Cascade (added 2026-08-23)

`listener/FixedDepositUserDataCleanupListener.java` listens for common's `UserDeletedEvent`
and deletes **all** fixed deposits via the newly added
`FixedDepositRepository.deleteByUserId(String)`.

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.4.0 | 2026-09-13 | **Bank-aware premature-withdrawal penalty + editable + edit-withdrawal record**: new `util/BankPenaltyResolver.java` resolves a default penalty from the bank/institution name (SBI amount tiers, tenure-aware Kotak/Yes/ICICI/Mahindra/Ujjivan/Equitas, flat majors, co-op 0.5%, small-finance/RRB 1%, payments 0%, Post Office 2%, NBFC 1.5–3%, amount-tier fallback 0.5/1), used as the server-side fallback in `computeWithdrawalResponse` when no `penaltyRateOverride` is sent (override is clamped to `[0, contractedRate]`). The applied rate is now **persisted** on the FD as `penaltyRateApplied` and returned in `FixedDepositResponseDTO` / reconstructed in `toWithdrawalResponse` (fallback: `interestRate − effectiveRateApplied`). Added edit-withdrawal endpoints `PUT /{id}/withdraw` + `PUT /{id}/withdraw/preview` (`updatePrematureWithdrawal` / `updatePrematureWithdrawalPreview` — recompute + persist on an already-withdrawn FD, rejected on non-withdrawn). Frontend: `frontend/src/lib/bankPenalty.js` (mirror resolver covering all ~1,511 Razorpay-registry bank names), editable Penalty Rate field in `WithdrawDialog` with tenure-aware default + bank source hint + reset, `WithdrawnFdDialog` read-only record dialog with Edit Details / Edit Withdrawal / Delete actions, preview/confirm routed between `withdraw` and `updateWithdraw` by FD status. `PrematureWithdrawalTest` extended (override clamp, resolver categories, bank-aware defaults, update/update-preview, persisted `penaltyRateApplied`). |
| 1.3.5 | 2026-09-13 | **Maturity mode now persisted & round-tripped — fixes intermittent "mode not applied" behavior**: `maturityMode` was DTO-transient (read on create/update only), so the mode was never stored, edits appeared to randomly not apply, and an FD created as Automatic re-opened in Manual (the dialog hardcoded `manual` for edits). Now part of the `FixedDeposit` entity (`@Builder.Default AUTOMATIC`, legacy docs resolve to AUTOMATIC), returned in `FixedDepositResponseDTO`, written in create, resolved in update as **explicit request → persisted → AUTOMATIC** (so an update that omits the mode never silently flips a Manual record), and populated in `toResponseDTO`. Frontend `FdDialog` restores the stored mode on edit (`MANUAL` ⇒ manual) and Manual mode shows a helper note that the certificate value is preserved unless the Maturity Amount is changed. `FixedDepositServiceTest` extended (rows 8/8b/9 now assert `response.getMaturityMode()`, new tests 9b/9c cover update-preserve and update-flip). |
| 1.3.4 | 2026-09-13 | **Interest Structure / Eligibility fields deprecated (Sections 04/05)**: `compoundingFrequency`, `payoutFrequency`, `isSeniorCitizen`, `isTaxSaver` (+ `taxSaverLockInYears`) are **commented out** of `FixedDepositRequestDTO`, `FixedDeposit`, `FixedDepositResponseDTO`, `FixedDepositServiceImpl` (create/update wiring, premature-withdrawal + server-maturity math now use the fixed defaults — QUARTERLY compounding / AT_MATURITY payout / non-senior / non-tax-saver), `validateTaxSaverFd` and the tax-saver withdrawal guard, the Excel exporter (4 columns removed → 22 columns), the corresponding tests, and the frontend (`FdDialog` INITIAL_STATE/edit-load/submit payload, `WithdrawDialog` senior notice, Cypress fixtures + happy-path assertions). **`fdType` is KEPT LIVE** (entity, request/response, `FdMath` maturity/premature-withdrawal math, exporter "FD Type" column) because `NON_CUMULATIVE`/payout-style records may exist in the DB and their maturity math depends on it — create still defaults to `CUMULATIVE`, edits preserve the stored value. Fields are marked `[DEPRECATED-SEC-04-05]`; re-enable together with the commented Sections 04/05 in `FdDialog` to restore them. |
| 1.3.3 | 2026-08-30 | **Single terminal status — `CLOSED` removed**: user-initiated termination is now modelled solely as `PREMATURELY_WITHDRAWN` (the richer state carrying withdrawal economics). `FdStatus.CLOSED` and the `PATCH /{id}/close` endpoint are removed; all `CLOSED` checks across service/summary/export/TDS now use `PREMATURELY_WITHDRAWN`. <!-- [DEPRECATED-TDS] the "TDS" mention in this row refers to the deprecated TDS feature; retained for historical accuracy --> Excel "Closed" tab renamed to "Withdrawn". Frontend CLOSE button/flow, CLOSED status badge/filter removed; status filter now surfaces `PREMATURELY_WITHDRAWN`. New `FdV131Migration` (`fd_v131`, `@Order(11)`) migrates legacy `status=CLOSED` documents → `PREMATURELY_WITHDRAWN` (+ `isPrematurelyWithdrawn=true`). Backend tests + Cypress updated (fixture CLOSED row → PREMATURELY_WITHDRAWN). |
| 1.3.2 | 2026-08-28 | **HolderName attribution fix**: owner grouping centralized behind shared `common/util/OwnerGrouping.groupKey` + `common/util/HolderName.normalize` (extracted from this module's `normalizeHolderName`, which now delegates). TDS summary grouping and Excel export now build identical keys via the shared helper (**export == screen** guaranteed by construction) — see `local/TODOs/TODO_HOLDERNAME_ATTRIBUTION_FIX.md`. <!-- [DEPRECATED-TDS] this row's "TDS summary grouping" work belongs to the now-deprecated TDS feature; retained for historical accuracy --> |
| 1.3.1 | 2026-08-28 | **Per-(bank,holder) TDS + senior-rate correction**: TDS threshold (₹50K regular / ₹1L senior) re-applied **per bank-and-holder group** (grouped by `(place, holderName)`, not `place` alone — each holder is their own taxpayer with an independent threshold under Section 194A, matching the Zerodha-family model) instead of per-FD, with proportional per-FD allocation from the group total (rounding-reconciliation so lines sum exactly). `holderName` now **normalized on save** (trim + whitespace-collapse + title-case, same pattern as MF scheme-category) so a person's FDs can never silently split into under-threshold groups. Bank-level context surfaced on every TDS row (`bankName`, `bankTotalGrossInterest`, `bankTaxableInterest`, `bankTotalTdsDeducted`). Removed the hardcoded **+0.50% senior-citizen rate bonus** from `FdMath.computeMaturity` / `computePrematureWithdrawal` and `FdDialog` — `interestRate` is now treated as the final contracted rate (senior bonus already embedded); `isSeniorCitizen` remains only for TDS threshold logic. <!-- [DEPRECATED-TDS] this row describes the now-deprecated per-bank TDS computation; retained for historical accuracy --> |
| 1.3.0 | 2026-08-27 | **Industry Standards Implementation (6 gaps closed)**: TDS computation, premature withdrawal with penalty, Cumulative/Non-Cumulative FD types, configurable compounding frequency (Monthly/Quarterly/Half-Yearly/Yearly), Senior Citizen (+0.50%) & Tax-Saver (5-yr lock-in, 80C) flags, server-side maturity validation with ±₹1 tolerance auto-override. New enums: `FdType`, `CompoundingFrequency`, `InterestPayoutFrequency`, `FdStatus.PREMATURELY_WITHDRAWN`. New endpoints: `/withdraw`, `/tds`, `/tds-summary`. Excel export expanded to 33 columns with TDS, withdrawal, maturity validation fields. Frontend FdDialog updated with all new fields, withdraw button, TDS display in summary. FdMath utility module created for calculation engine. <!-- [DEPRECATED-TDS] this row's TDS / `/tds` / `/tds-summary` work is now deprecated (commented out); retained for historical accuracy --> |
| 1.2.3 | 2026-08-26 | Transaction safety: annotated `createFixedDeposit` and `updateFixedDeposit` with `@Transactional`, leveraging common's `MongoTransactionManager` for atomic save + ordinal reorder operations. |
| 1.2.2 | 2026-08-26 | XLSX export enhancements: exported actual `fdNo` in column 0, documented multi-tab workbook + totals row. |
| 1.2.1 | 2026-08-26 | Code cleanup: removed dead `SequenceGeneratorService` injection; corrected documentation to accurately reflect ordinal reordering mechanism. |
| 1.2.0 | 2026-07-25 | Initial documentation release. |

