# Fixed Deposit (FD) Management Module – CoinTrack

> **Domain**: User Fixed Deposit (FD) Tracking & Analytics  
> **Responsibility**: Secure manual CRUD, live status computation, risk highlighting, metrics aggregation, and Excel (XLSX) export  
> **Version**: 1.2.0  
> **Last Updated**: 2026-07-25  

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
- ⏳ **Monitor live maturity states** (`ACTIVE`, `DUE`, `MATURED`, `CLOSED`).
- 🚨 **Visual risk flags** (`YELLOW` for <= 30 days to maturity, `RED` for overdue/matured).
- 📊 **View aggregate metrics** (total investment, total expected maturity value).
- 📁 **Export data** to Excel (XLSX) formatted reports respecting active filters.

### 1.3 Key Features

| Feature | Description |
|---|---|
| **Sequential `fdNo`** | Server-generated atomic counter using shared `counters` collection |
| **Dual Status Strategy** | Live calculation on read + daily cron job for persisted DB state |
| **Smart Relative Sorting** | `maturityDate:asc` (Nearest First) evaluates relative to `today` (`LocalDate.now()`) placing upcoming maturities first and past/matured ones at the bottom |
| **6-Mode Sorting Engine** | Supports sorting by maturity date (nearest/farthest), issue date (oldest/newest), and invested amount (highest/lowest) |
| **Excel (XLSX) Export Formatting** | 14-column spreadsheet using `ExcelExportUtil` with auto-column width calculations, BOLD headers, and right-aligned text cell styling. Defaults to `issueDate:asc` |
| **Dual View Frontend** | Seamlessly toggle between Card Grid View (`FdCard`) and Financial Table View (`FdTable`) |
| **Monetary Rigor** | Strict `BigDecimal` usage for all amounts and interest rates |
| **Strict Date Validation** | `maturityDate` must be strictly after `issueDate` (`InvalidFdDateRangeException`) |
| **User Isolation** | Ownership scoping enforced on every query (`userId`) |

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
│  │  ├── SequenceGenerator │       │  └── FixedDepositRepository  │     │
│  │  └── ExcelExportUtil   │       │      (MongoRepository)       │     │
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
│   │   └── FixedDepositRequestDTO.java
│   └── response/
│       ├── FixedDepositResponseDTO.java
│       └── FixedDepositSummaryDTO.java
├── model/
│   ├── FdStatus.java                  # Enum: ACTIVE, DUE, MATURED, CLOSED
│   └── FixedDeposit.java              # MongoDB Document ("fixed_deposits")
├── repository/
│   └── FixedDepositRepository.java    # Spring Data Mongo repository
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
- `POST /api/fixed-deposits` — Create Fixed Deposit
- `GET /api/fixed-deposits` — Paginated list with dynamic filter criteria
- `GET /api/fixed-deposits/summary` — Aggregate metrics for dashboard
- `GET /api/fixed-deposits/export` — Stream Excel (XLSX) file
- `GET /api/fixed-deposits/{id}` — Fetch single record
- `PUT /api/fixed-deposits/{id}` — Update record
- `PATCH /api/fixed-deposits/{id}/close` — Mark as CLOSED (manual override)
- `DELETE /api/fixed-deposits/{id}` — Delete record

---

## 5. Service

**Location**: `service/FixedDepositServiceImpl.java`  

### 5.1 Status Derivation Strategy

Status is derived dynamically on every read:
1. If stored status is `CLOSED` -> Returns `CLOSED` (manual sticky override).
2. If `today.isBefore(maturityDate)` -> `ACTIVE`.
3. If `today.isEqual(maturityDate)` -> `DUE`.
4. If `today.isAfter(maturityDate)` -> `MATURED`.

### 5.2 Dynamic Filtering

Filters (`place`, `status`, `nominee`, `maturityFrom`, `maturityTo`) are constructed cleanly using `MongoTemplate` `Criteria` queries.

### 5.3 6-Mode Sorting Engine

The module supports 6 distinct sorting modes via `sortBy` and `sortDir` parameters:

| Sort Key | Direction | Label | Implementation |
|---|---|---|---|
| `maturityDate` | `asc` | Maturity Date (Nearest First) | Uses Java `nearestMaturityComparator` to calculate relative distance from `today` (`LocalDate.now()`). Places upcoming active/due deposits maturing today or in future first (`>= today`), and past/matured ones at the bottom. |
| `maturityDate` | `desc` | Maturity Date (Farthest First) | Standard MongoDB `Sort.by(Direction.DESC, "maturityDate")`. |
| `issueDate` | `desc` | Issue Date (Newest First) | Standard MongoDB `Sort.by(Direction.DESC, "issueDate")`. |
| `issueDate` | `asc` | Issue Date (Oldest First) | Standard MongoDB `Sort.by(Direction.ASC, "issueDate")`. **(Default for Excel Export)** |
| `issueAmount` | `desc` | Amount (Highest First) | Standard MongoDB `Sort.by(Direction.DESC, "issueAmount")`. |
| `issueAmount` | `asc` | Amount (Lowest First) | Standard MongoDB `Sort.by(Direction.ASC, "issueAmount")`. |

### 5.4 Excel Export Formatting Rules

When exporting via `GET /api/fixed-deposits/export`:
1. **14 Columns**: `FD No`, `Place`, `Holder Name`, `Nominee`, `Account Number`, `Interest Rate (%)`, `Investment Period`, `Issue Date`, `Maturity Date`, `Issue Amount`, `Maturity Amount`, `Status`, `Days To Maturity`, `Remarks`.
2. **`Days To Maturity`**: Formatted as `-` (dash) if the deposit status is `MATURED`, `DUE`, `CLOSED`, or has `daysToMaturity <= 0`.
3. **Default Order**: Defaults to `issueDate:asc` (oldest issued deposit first) unless an explicit sorting choice is passed.
4. **Style**: Generates a `.xlsx` spreadsheet using `ExcelExportUtil` with bold headers and right-aligned text style.

---

## 6. Model

**Collection**: `fixed_deposits`  

Key fields: `id`, `fdNo` (indexed, unique), `userId` (indexed), `place`, `holderName`, `nominee`, `accountNumber`, `interestRate`, `investmentPeriod`, `issueDate`, `maturityDate`, `issueAmount`, `maturityAmount`, `status`, `remarks`, `createdAt`, `updatedAt`.

---

## 7. Repository

`FixedDepositRepository` extends `MongoRepository<FixedDeposit, String>`:
- `findByIdAndUserId(String id, String userId)`
- `findByUserId(String userId)`
- `findByStatusNot(FdStatus status)`

---

## 8. API Reference

All responses return standard `ApiResponse<T>` envelope.

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
3. **Sequence Generation** -> Atomic `$inc` on `counters` collection (`fd_no`).
4. **Persistence** -> Saved to `fixed_deposits` collection in MongoDB Atlas.
5. **Response** -> Derived `daysToMaturity` and `highlight` fields injected into response DTO.

---

## 10. Security

- **User Scoping**: Every query filters by `userId` derived from JWT.
- **Access Control**: Returns HTTP 403 `ACCESS_DENIED` if a user attempts to access another user's deposit.

---

## 11. Scheduled Batch Jobs

`FixedDepositStatusScheduler` executes daily at `00:00:00` (India Standard Time) via `@Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")` to update stored document status in the DB for non-closed deposits.

---

## 12. Common Pitfalls

| Pitfall | Mitigation |
|---|---|
| Floating point arithmetic | Strictly use `BigDecimal` for rates and amounts |
| Cross-user data leaks | Always enforce `userId` filter sourced from JWT `Principal` |
| Closed state reset | Stored `CLOSED` status acts as sticky override against date calculation |
| Malformed date range | Service validates `maturityDate` strictly after `issueDate` |
| UI/DTO Mismatches | Synchronized `totalEstimatedReturns` (originally mismatched as `totalEstReturns`) to prevent frontend reporting zero returns |
