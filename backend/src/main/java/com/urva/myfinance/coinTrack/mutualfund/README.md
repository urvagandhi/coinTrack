# Mutual Fund (MF) Investment Management Module – CoinTrack

> **Domain**: Household Mutual Fund Portfolio Tracking (Multi-Holder)
> **Responsibility**: Scheme master CRUD, lumpsum/SIP/redemption ledgers, automatic aggregation, cross-check discrepancy detection, and 5-sheet Excel (XLSX) export
> **Version**: 1.0.0
> **Last Updated**: 2026-07-26

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Controllers](#4-controllers)
5. [Services](#5-services)
6. [Models](#6-models)
7. [Repositories](#7-repositories)
8. [API Reference](#8-api-reference)
9. [Data Flow](#9-data-flow)
10. [Security](#10-security)
11. [Common Pitfalls](#11-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Mutual Fund module replaces error-prone spreadsheet-based household MF tracking with a
**FK-driven, computation-first approach**. It manages investments across multiple holders (e.g.
family members) under a single CoinTrack login, covering lumpsum purchases, SIP mandates and monthly
contributions, redemptions with capital gain tracking, and periodic manual valuation snapshots.

### 1.2 Business Problem Solved

The source of truth for this module was a family spreadsheet with six tabs and ~450 columns that
aggregated totals via `SUMIFS`/`SUMIF` on literal scheme-name strings. A single typo in one scheme
name silently broke the aggregation with no error. This module solves that and several related
structural problems:

| Problem | Solution |
|---|---|
| String-matched aggregation breaks on typos | Every transaction references `schemeId` (real FK to `MfScheme`) — never a re-typed name |
| 100+ date-columns per scheme for SIP tracking | `SipContribution` ledger: one record per month, linked to its `SipMandate` by FK |
| Manual color-coding to flag scheme status | `FundStatus` enum derived automatically from live ledger data |
| No cross-check between broker statements and ledger | `discrepancyFlag` computed for each holder+platform bucket against latest `ValuationSnapshot` |
| Redemptions not netted for all holders | `currentInvestment = totalInvestment - totalTradedValue` applied to every holder uniformly |

### 1.3 Key Features

| Feature | Description |
|---|---|
| **FK-enforced scheme linkage** | Every create operation validates `schemeId` (and `sipMandateId`) against user-owned master records — runtime error on invalid FK |
| **SIP contribution ledger** | `SipContribution` replaces per-date-column tracking; `sipInvestment = SUM(amount WHERE schemeId = X)` is always correct |
| **Automated SIP Scheduling** | Cron job `SipContributionScheduler` backfills missing SIP contributions on due dates, reducing manual entry |
| **FIFO Capital Gains Engine** | `MfFifoEngine` accurately matches redemptions to lots (Lumpsum/SIP) to categorize STCG vs LTCG based on 1-year holding period |
| **Live NAV Integration** | Portfolio holdings accurately compute Unrealized Gains and Absolute Return using latest NAV |
| **Automatic aggregation** | `MfSchemeAggregationService` computes `lumpsumInvestment`, `sipInvestment`, `totalInvestment`, `totalTradedValue`, `currentInvestment`, `totalUnit` per scheme |
| **Status derivation** | `ACTIVE_SIP` / `LUMPSUM_ONLY` / `FULLY_REDEEMED` computed from live mandates and ledger balances — no manual flags |
| **Discrepancy cross-check** | Dashboard compares latest `ValuationSnapshot.investmentValue` against ledger-derived `totalInvestment` per holder+platform bucket; flags divergence > ₹1 |
| **LTCG/STCG tracking** | `capitalGain` auto-computed; `gainType` is user-selected (not auto-applied). Reference-only — not a tax filing tool |
| **Multi-holder support** | `holderName` is a plain field under one `userId`; all list endpoints accept `?holderName=` filter |
| **Category normalization** | `mfCategory` trimmed and case-normalized on save (`"Multicap "` → `"Multicap"`) |
| **Delete-block on referenced schemes** | `deleteScheme` throws if any transaction collection references the scheme — no orphaned FKs |
| **5-sheet Excel export** | `MfExcelExportService` + `MfExcelExporter` produce a styled multi-sheet workbook |
| **`FULLY_REDEEMED` soft-filter** | Excluded from default views; use `?includeRedeemed=true` to surface — data never deleted |

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MUTUAL FUND MODULE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER (7 controllers, thin — delegate only)              │  │
│  │  ├── MfSchemeController         (/api/mutual-fund/schemes)           │  │
│  │  ├── LumpsumTransactionController (/api/mutual-fund/lumpsum)         │  │
│  │  ├── SipMandateController       (/api/mutual-fund/sip-mandates)      │  │
│  │  ├── SipContributionController  (/api/mutual-fund/sip-contributions) │  │
│  │  ├── RedemptionTransactionController (/api/mutual-fund/redemptions)  │  │
│  │  ├── ValuationSnapshotController (/api/mutual-fund/valuation-*)      │  │
│  │  └── MfSummaryController        (/api/mutual-fund/summary|export)    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                │                                            │
│                                ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                        │  │
│  │  ├── MfSchemeService              (CRUD + category normalization)    │  │
│  │  ├── LumpsumTransactionService    (CRUD + schemeId FK validation)    │  │
│  │  ├── SipMandateService            (CRUD + schemeId FK validation)    │  │
│  │  ├── SipContributionService       (CRUD + full FK integrity check)   │  │
│  │  ├── RedemptionTransactionService (CRUD + FK + capitalGain compute)  │  │
│  │  ├── ValuationSnapshotService     (CRUD)                             │  │
│  │  ├── MfSchemeAggregationService   (per-scheme aggregation + summary) │  │
│  │  ├── MfExcelExportService         (data collection + export trigger) │  │
│  │  ├── MfFifoEngine                 (FIFO cost basis & STCG/LTCG calc) │  │
│  │  ├── PortfolioHoldingService      (real-time NAV & gain calculations)│  │
│  │  ├── MfNavService                 (NAV tracking and assignment)      │  │
│  │  ├── PortfolioDashboardService    (overall dashboard analytics)      │  │
│  │  └── SipContributionScheduler     (automated backfilling of SIPs)    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                │                                            │
│              ┌─────────────────┴─────────────────┐                         │
│              ▼                                   ▼                         │
│  ┌────────────────────────┐       ┌──────────────────────────────────┐     │
│  │  SHARED COMMON LAYER   │       │  REPOSITORY LAYER (6 repos)      │     │
│  │  ├── SequenceGenerator │       │  ├── MfSchemeRepository           │     │
│  │  └── ExcelExportUtil   │       │  ├── LumpsumTransactionRepository │     │
│  └────────────────────────┘       │  ├── SipMandateRepository         │     │
│              │                    │  ├── SipContributionRepository    │     │
│              │                    │  ├── RedemptionTransactionRepo.   │     │
│              └──────────────┐     │  └── ValuationSnapshotRepository  │     │
│                             ▼     └──────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  DATA LAYER (MongoDB Atlas)                                           │  │
│  │  ├── mf_schemes                  ├── mf_sip_contributions            │  │
│  │  ├── mf_lumpsum_transactions     ├── mf_redemption_transactions      │  │
│  │  ├── mf_sip_mandates             └── mf_valuation_snapshots          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
mutualfund/
├── README.md
├── controller/
│   ├── MfSchemeController.java
│   ├── LumpsumTransactionController.java
│   ├── SipMandateController.java
│   ├── SipContributionController.java
│   ├── RedemptionTransactionController.java
│   ├── ValuationSnapshotController.java
│   └── MfSummaryController.java
├── dto/
│   ├── OverallSummaryDto.java       (dashboard totals + discrepancy reports)
│   └── SchemeSummaryDto.java        (per-scheme aggregated view)
├── model/
│   ├── FundStatus.java              (ACTIVE_SIP, LUMPSUM_ONLY, FULLY_REDEEMED)
│   ├── GainType.java                (LTCG, STCG)
│   ├── MfScheme.java
│   ├── LumpsumTransaction.java
│   ├── SipMandate.java
│   ├── SipContribution.java
│   ├── RedemptionTransaction.java
│   └── ValuationSnapshot.java
├── repository/
│   ├── MfSchemeRepository.java
│   ├── LumpsumTransactionRepository.java
│   ├── SipMandateRepository.java
│   ├── SipContributionRepository.java
│   ├── RedemptionTransactionRepository.java
│   └── ValuationSnapshotRepository.java
├── service/
│   ├── MfSchemeService.java
│   ├── LumpsumTransactionService.java
│   ├── SipMandateService.java
│   ├── SipContributionService.java
│   ├── RedemptionTransactionService.java
│   ├── ValuationSnapshotService.java
│   ├── MfSchemeAggregationService.java
│   └── MfExcelExportService.java
└── util/
    └── MfExcelExporter.java
```

---

## 4. Controllers

**Base Path**: `/api/mutual-fund`
**Authentication**: Required (JWT via `@AuthenticationPrincipal`)
All responses are wrapped in the standard `ApiResponse<T>` envelope.

| Controller | Base Path | Operations |
|---|---|---|
| `MfSchemeController` | `/schemes` | CRUD + `?holderName` + `?includeRedeemed` filters |
| `LumpsumTransactionController` | `/lumpsum` | CRUD + `?schemeId` filter |
| `SipMandateController` | `/sip-mandates` | CRUD + `?schemeId` filter |
| `SipContributionController` | `/sip-contributions` | CRUD + `?schemeId` filter |
| `RedemptionTransactionController` | `/redemptions` | CRUD + `?schemeId` filter |
| `ValuationSnapshotController` | `/valuation-snapshots` | CRUD + `?holderName` + `?platform` filters |
| `MfSummaryController` | `/scheme-summary`, `/summary`, `/export` | Aggregation + dashboard + Excel export |

---

## 5. Services

### 5.1 `MfSchemeService` — Master Scheme CRUD

- Normalizes `mfCategory` on every save: `trim()` + capitalize first character + lowercase remainder.
  Ensures `"Multicap "` and `"Multicap"` are stored identically.
- `deleteScheme()` queries all 4 transaction collections before deletion. If any reference the scheme,
  throws `RuntimeException("Cannot delete scheme because it has associated transactions.")`.
  This is the FK delete-block that prevents orphaned transaction records.
- `getAllSchemes(userId, holderName)` — uses `findByUserIdAndHolderName` when `holderName` is provided.

### 5.2 `LumpsumTransactionService` / `SipMandateService` / `RedemptionTransactionService`

All three share the same FK enforcement pattern:

1. `validateSchemeOwnership(userId, schemeId)` — calls `MfSchemeRepository.findById(schemeId)` and
   asserts the scheme's `userId` matches the caller. Throws if missing or mismatched.
2. Called in both `createTransaction()` and `updateTransaction()` (when schemeId changes).
3. `RedemptionTransactionService.createTransaction()` additionally auto-computes:
   `capitalGain = redemptionValue - tradeInvestmentValue` (§4 rule 6 of the spec).

### 5.3 `SipContributionService` — Three-Part FK Integrity Check & Scheduling

- Includes automated SIP contribution scheduling and mandate backfilling with improved NAV valuation logic.

`createContribution()` performs:
1. `schemeId` → user-owned `MfScheme` exists.
2. `sipMandateId` → user-owned `SipMandate` exists.
3. `mandate.schemeId == contribution.schemeId` — prevents denormalization drift where a contribution
   is linked to a mandate for a different scheme.

### 5.4 `MfSchemeAggregationService` — Per-Scheme Computation Engine

For a given `(userId, schemeId)`:

```
lumpsumInvestment = SUM(LumpsumTransaction.lumpsumInvestment)
sipInvestment      = SUM(SipContribution.amount)
totalInvestment     = lumpsumInvestment + sipInvestment
totalTradedValue     = SUM(RedemptionTransaction.tradeInvestmentValue)
currentInvestment     = totalInvestment - totalTradedValue
totalUnit              = SUM(LumpsumTransaction.totalUnit) - SUM(RedemptionTransaction.redemptionUnit)
```

**Status derivation:**
```java
if (any active SipMandate for this scheme) → ACTIVE_SIP
else if (currentInvestment <= 0 && totalTradedValue > 0) → FULLY_REDEEMED
else → LUMPSUM_ONLY
```

`calculateOverallSummary()` additionally computes discrepancy reports:

- Groups all schemes by `holderName + "|" + platform` bucket.
- Finds the latest `ValuationSnapshot` per bucket.
- Compares `snapshot.investmentValue` vs. `ledgerTotalByBucket`.
- If difference > ₹1 tolerance: `discrepancyFlag = true`, `discrepancyAmount` (signed).

### 5.5 `MfExcelExportService` — Export Orchestration

Single-responsibility service that:
1. Fetches all user data from the 6 collections.
2. Delegates per-scheme aggregation to `MfSchemeAggregationService`.
3. Calls `MfExcelExporter.export()` to produce the 5-sheet workbook.

### 5.6 `MfFifoEngine` — Accurate Capital Gains Engine
- Simulates the chronological purchase and redemption of units using a First-In-First-Out (FIFO) queue of lots.
- Computes Short-Term Capital Gains (STCG) vs Long-Term Capital Gains (LTCG) based on 1-year holding periods automatically upon redemption.

### 5.7 `PortfolioHoldingService` — Advanced Metrics
- Aggregates lumpsum, SIP, and redemption transactions to compute the user's `PortfolioHolding` per scheme.
- Calculates derived metrics like `averageCost`, `realizedGain`, `unrealizedGain`, `marketGain`, and `absoluteReturnPercentage` utilizing the latest NAV prices.

### 5.8 `SipContributionScheduler` & `MfNavService`
- **Scheduler**: Automatically scans active `SipMandate`s and backfills missing monthly contributions on their due dates, eliminating manual tracking.
- **NAV Service**: Responsible for fetching and applying the correct NAV value for transactions to ensure accurate mark-to-market valuations.

Keeps `MfSchemeAggregationService` focused on computation only.

---

## 6. Models

### `MfScheme` — `mf_schemes`

| Field | Type | Notes |
|---|---|---|
| `id` | String | MongoDB `@Id` |
| `userId` | String | Owner (from JWT) |
| `holderName` | String | Free text — "Krishil", "Juhi", etc. |
| `schemeName` | String | Canonical name, entered once, referenced everywhere by `id` |
| `mfCategory` | String | Trim + case-normalized on save |
| `platform` | String | CAMS, KARVY, COIN, NJ_FUNDS, OTHER |
| `folioNo` | String | Free text, no format validation (provider formats are inconsistent by design) |
| `bank` | String | |
| `sipStartDate` | LocalDate | Nullable |
| `sipStopDate` | LocalDate | Nullable |
| `status` | FundStatus | Derived dynamically; stored for reference only |
| `createdAt` / `updatedAt` | Instant | |

### `LumpsumTransaction` — `mf_lumpsum_transactions`

| Field | Type | Notes |
|---|---|---|
| `transactionNo` | Long | Sequential, via `SequenceGeneratorService` |
| `schemeId` | String | FK to `MfScheme` — validated on create |
| `investmentDate` | LocalDate | |
| `lumpsumInvestment` | BigDecimal | |
| `totalUnit` | BigDecimal | Units purchased |
| `navPrice` | BigDecimal | NAV at purchase date |
| `debitedBank` | String | |

### `SipMandate` — `mf_sip_mandates`

| Field | Type | Notes |
|---|---|---|
| `schemeId` | String | FK to `MfScheme` — validated on create |
| `holderName` | String | |
| `startDate` | LocalDate | |
| `amount` | BigDecimal | Mandated monthly amount |
| `active` | boolean | Drives `ACTIVE_SIP` status derivation |
| `registrationNo` | String | |

### `SipContribution` — `mf_sip_contributions`

| Field | Type | Notes |
|---|---|---|
| `sipMandateId` | String | FK to `SipMandate` — validated on create |
| `schemeId` | String | Denormalized FK — must match mandate's `schemeId` |
| `contributionMonth` | YearMonth | Replaces the source sheet's 100+ date-columns |
| `amount` | BigDecimal | |

### `RedemptionTransaction` — `mf_redemption_transactions`

| Field | Type | Notes |
|---|---|---|
| `transactionNo` | Long | Sequential, via `SequenceGeneratorService` |
| `schemeId` | String | FK to `MfScheme` — validated on create |
| `redemptionDate` | LocalDate | |
| `totalUnit` | BigDecimal | Total units held at time of redemption |
| `redemptionUnit` | BigDecimal | Units sold |
| `balanceUnit` | BigDecimal | Remaining units after redemption |
| `tradeInvestmentValue` | BigDecimal | Cost basis of redeemed units |
| `redemptionValue` | BigDecimal | Actual sale proceeds |
| `capitalGain` | BigDecimal | **Auto-computed**: `redemptionValue - tradeInvestmentValue` |
| `gainType` | GainType | User-selected: `LTCG` or `STCG` |
| `redemptionNav` | BigDecimal | |

### `ValuationSnapshot` — `mf_valuation_snapshots`

| Field | Type | Notes |
|---|---|---|
| `holderName` | String | |
| `platform` | String | Matches `MfScheme.platform` for bucket cross-check |
| `snapshotDate` | LocalDate | |
| `investmentValue` | BigDecimal | Manually entered from broker statement |
| `currentValue` | BigDecimal | Current market value from statement |
| `periodPL` | BigDecimal | |
| `periodPLPercent` | BigDecimal | |

---

## 7. Repositories

All extend `MongoRepository<T, String>`.

| Repository | Key Query Methods |
|---|---|
| `MfSchemeRepository` | `findByUserId`, `findByUserIdAndHolderName` |
| `LumpsumTransactionRepository` | `findByUserId`, `findByUserIdAndSchemeId` |
| `SipMandateRepository` | `findByUserId`, `findByUserIdAndSchemeId`, `findByUserIdAndSchemeIdAndActiveTrue` |
| `SipContributionRepository` | `findByUserId`, `findByUserIdAndSchemeId` |
| `RedemptionTransactionRepository` | `findByUserId`, `findByUserIdAndSchemeId` |
| `ValuationSnapshotRepository` | `findByUserId`, `findByUserIdAndHolderNameAndPlatform` |

---

## 8. API Reference

All responses return standard `ApiResponse<T>` envelope. Base path: `/api/mutual-fund`.
All endpoints require `Authorization: Bearer <jwt>`.

### 8.1 Scheme Summary (Aggregated Per-Scheme View)

```http
GET /api/mutual-fund/scheme-summary
?includeRedeemed=false   # default: exclude FULLY_REDEEMED
&holderName=Krishil      # optional: filter by holder
```

Response body includes: `schemeId`, `schemeName`, `holderName`, `platform`, `totalUnit`,
`lumpsumInvestment`, `sipInvestment`, `totalInvestment`, `totalTradedValue`, `currentInvestment`, `status`.

### 8.2 Dashboard Summary

```http
GET /api/mutual-fund/summary
```

Response body: `totalInvested`, `currentInvestment`, `totalRedeemed`, `overallPL`, `activeSipCount`,
`discrepancyFlag`, `discrepancyAmount`, `discrepancies[]` (per-bucket detail).

### 8.3 Export

```http
GET /api/mutual-fund/export
```

Returns a `Mutual_Funds_Ledger.xlsx` workbook with 5 sheets:

| Sheet | Content |
|---|---|
| MF Investment | Scheme summary + overall dashboard card |
| Investment & Valuation | All valuation snapshots |
| Lumpsum Investment | All lumpsum transactions |
| Redemption Investment | All redemptions with capital gain |
| SIP Details | All monthly SIP contributions |

### 8.4 Sample — Create Scheme

```http
POST /api/mutual-fund/schemes
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "holderName": "Krishil",
  "schemeName": "Parag Parikh Flexicap Fund - Direct Growth",
  "mfCategory": "Flexicap",
  "platform": "CAMS",
  "folioNo": "1234567890",
  "bank": "HDFC",
  "sipStartDate": "2022-01-05"
}
```

### 8.5 Sample — Create Lumpsum Transaction

```http
POST /api/mutual-fund/lumpsum
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "schemeId": "<MfScheme._id>",
  "investmentDate": "2024-03-15",
  "lumpsumInvestment": 50000.00,
  "totalUnit": 412.345,
  "navPrice": 121.32,
  "debitedBank": "HDFC"
}
```

---

## 9. Data Flow

### Create a Lumpsum Transaction

1. `POST /api/mutual-fund/lumpsum` → `LumpsumTransactionController` extracts `userId` from JWT.
2. `LumpsumTransactionService.createTransaction()`:
   a. `validateSchemeOwnership(userId, schemeId)` — throws 500 if scheme not found or wrong owner.
   b. Sets `userId`, generates `transactionNo` via `SequenceGeneratorService`.
   c. Saves to `mf_lumpsum_transactions`.
3. Any subsequent call to `GET /api/mutual-fund/scheme-summary` triggers `MfSchemeAggregationService`
   which recomputes `lumpsumInvestment`, `totalInvestment`, `currentInvestment`, `totalUnit`, and `status`.

### Discrepancy Check Flow

1. User manually enters a `ValuationSnapshot` for "Krishil | CAMS" from a broker statement.
2. `GET /api/mutual-fund/summary` → `MfSchemeAggregationService.calculateOverallSummary()`:
   a. Sums all scheme `totalInvestment` values where `holderName = "Krishil"` and `platform = "CAMS"`.
   b. Fetches the latest `ValuationSnapshot` for that bucket.
   c. Computes `|snapshot.investmentValue - ledgerTotal|`. If > ₹1: adds a `DiscrepancyReport`.
3. Frontend surfaces the flag so the user knows a transaction may be missing.

---

## 10. Security

- **User Scoping**: Every repository query filters by `userId` derived from JWT. No cross-user data is ever accessible.
- **FK Ownership Validation**: All `create*` methods in transaction services verify the referenced `schemeId` (and `sipMandateId`) belongs to the same `userId` — never trusting client-supplied IDs blindly.
- **Delete-Block**: `deleteScheme()` refuses to delete a scheme that still has any associated transactions, preventing orphaned FK references.
- **No Manual Aggregation**: Summary totals are always computed from the ledger; clients cannot submit overrides.

---

## 11. Common Pitfalls

| Pitfall | Mitigation |
|---|---|
| Floating point for money/units/NAV | Strictly `BigDecimal` for all monetary and unit fields |
| Free-typing scheme names per transaction | Always use `schemeId` — `createTransaction()` validates FK at write time |
| `"Multicap "` vs `"Multicap"` category mismatch | `normalizeCategory()` called on every `MfScheme` save — trim + normalize casing |
| `sipMandateId` pointing to wrong scheme | `SipContributionService` validates mandate `schemeId` matches contribution `schemeId` |
| LTCG/STCG used for tax filing | These are reference-tracking fields only — not authoritative for tax computation |
| Treating `ValuationSnapshot` as ledger data | Snapshots are independently entered cross-checks; never merged with or derived from the ledger |
| Expecting `FULLY_REDEEMED` schemes in default list | Use `?includeRedeemed=true` to surface them |
| `capitalGain` edited directly | It is auto-computed on every save (`redemptionValue - tradeInvestmentValue`); manual edits are overwritten |
