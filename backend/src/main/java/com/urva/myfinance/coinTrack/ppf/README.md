# Public Provident Fund (PPF) Management Module – CoinTrack

> **Domain**: User Public Provident Fund (PPF) Ledger  
> **Responsibility**: Transaction CRUD, ledger balance recalculation, and Excel (XLSX) export  
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
11. [Common Pitfalls](#11-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Public Provident Fund (PPF) module provides a **ledger management system** for tracking government PPF accounts. It focuses on the core engineering complexity of cascading balance recalculation whenever a transaction is added, edited, or deleted.

### 1.2 Business Problem Solved

PPF is a long-term investment requiring chronological tracking of deposits, interest credits, and rare withdrawals. This module allows users to:
- 📖 **Maintain a continuous ledger**, accurately recalculating running balances across all entries.
- 🔄 **Support out-of-order insertions** by auto-sorting transactions by `transactionDate` and cascading balance updates.
- 🚫 **Prevent negative balances** via strict validation and multi-document transactions.
- 🔢 **Assign atomic sequential IDs** (`transactionNo`) to entries for easy reference.
- 📊 **Aggregate financial data** such as total deposits vs. interest earned exactly reconciled with transaction history.

### 1.3 Key Features

| Feature | Description |
|---|---|
| **Cascading Ledger Recalculation** | Every edit triggers a full user ledger recount sorted by `transactionDate` |
| **Negative Balance Protection** | Throws `InsufficientPpfBalanceException` and aborts save if a negative balance occurs |
| **Transaction Safety** | CRUD operations and recalculations are protected by `@Transactional` |
| **Financial Year Filtering** | Helper utility filters dates strictly by Indian FY (April 1 - March 31) |
| **Sequential `transactionNo`** | Uses shared `SequenceGeneratorService` (`ppf_txn_no_<userId>`) |
| **Excel (XLSX) Export** | Stream styled spreadsheets with right-aligned columns and bold sequential numbers |
| **Statutory Withdrawal Validation** | Full enforcement of PPF Scheme 2019/2023 rules (lock-in period, 50% max limit, single withdrawal per FY) |
| **Post-Maturity Extension Modes** | Support for both `WITHOUT_CONTRIBUTION` and `WITH_CONTRIBUTION` (Form H) with strict 60% block cap enforcement |
| **Programmatic Aggregation** | Dashboard summaries computed programmatically from the ledger to prevent stale status values |

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PPF MODULE ARCHITECTURE                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER                                               │  │
│  │  └── PpfController.java            (REST endpoints)             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                  │  │
│  │  ├── PpfTransactionService.java    (CRUD interface)             │  │
│  │  ├── PpfTransactionServiceImpl.java (CRUD logic, Aggregation)   │  │
│  │  └── PpfBalanceRecalculationService.java (Ledger recalculation) │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│              ┌───────────────┴───────────────┐                         │
│              ▼                               ▼                         │
│  ┌───────────────────────┐       ┌──────────────────────────────┐     │
│  │  SHARED COMMON LAYER   │       │  REPOSITORY LAYER            │     │
│  │  ├── SequenceGenerator │       │  └── PpfTransactionRepository│     │
│  │  ├── ExcelExportUtil   │       │      (MongoRepository)       │     │
│  │  └── FinancialYearUtil │       └──────────────────────────────┘     │
│  └───────────────────────┘                       │                     │
│                                                  ▼                     │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  DATA LAYER (MongoDB Atlas)                                     │  │
│  │  ├── ppf_transactions collection                                │  │
│  │  └── counters collection                                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
ppf/
├── README.md
├── controller/
│   └── PpfController.java
├── dto/
│   ├── request/
│   │   └── PpfTransactionRequestDTO.java
│   └── response/
│       ├── PpfSummaryDTO.java
│       └── PpfTransactionResponseDTO.java
├── model/
│   ├── PpfParticularType.java
│   └── PpfTransaction.java
├── repository/
│   ├── PpfSettingsRepository.java
│   └── PpfTransactionRepository.java
└── service/
    ├── PpfBalanceRecalculationService.java
    ├── PpfTransactionService.java
    ├── PpfTransactionServiceImpl.java
    └── PpfWithdrawalValidationService.java
```

---

## 4. Controller

**Location**: `controller/PpfController.java`  
**Base Path**: `/api/ppf`  
**Authentication**: Required (JWT via `Principal`)  

Endpoints:
- `POST /api/ppf/transactions` — Create Transaction (Triggers Recalculation)
- `GET /api/ppf/transactions` — Paginated list with filtering (including `financialYear`)
- `GET /api/ppf/summary` — Aggregate metrics computed programmatically
- `GET /api/ppf/export` — Stream styled Excel (XLSX) sheet in chronological ascending order
- `GET /api/ppf/withdrawal-status` — Fetch live statutory eligibility for withdrawals and max cap calculations
- `GET /api/ppf/transactions/{id}` — Fetch single record
- `PUT /api/ppf/transactions/{id}` — Update record (Triggers Recalculation)
- `DELETE /api/ppf/transactions/{id}` — Delete record (Triggers Recalculation)
- `GET / PUT /api/ppf/settings` — Update PPF account details and Post-Maturity Extension Mode

---

## 5. Service

**Location**: `service/PpfBalanceRecalculationService.java`  

### 5.1 Recalculation Logic
Since users can insert entries out of order (e.g., adding a missed deposit from January in July), a new insert requires a ledger recount:
1. Fetch all transactions for `userId`, sorted by `transactionDate` ASC (tiebreak by `createdAt` ASC).
2. Walk the array top to bottom computing `runningBalance`.
3. If `< 0`, throw `InsufficientPpfBalanceException` to rollback.
4. Else, bulk save updated balances.

### 5.2 Statutory Withdrawal Validation
Encapsulated in `PpfWithdrawalValidationService.java`, the system strictly validates withdrawals based on:
1. **Initial Lock-in**: No partial withdrawal before the 7th financial year (i.e. 5 complete FYs after opening).
2. **Frequency**: Strict limit of 1 withdrawal per financial year.
3. **Pre-Maturity Limit**: Maximum withdrawal capped at 50% of the lower of the balance at the end of the 4th preceding FY and the previous FY.
4. **Post-Maturity Extension**: Supports `WITH_CONTRIBUTION` mode which dynamically limits aggregate withdrawals over a 5-year block to 60% of the block's opening balance.

---

## 6. Model

**Collection**: `ppf_transactions`  

Key fields: `id`, `transactionNo`, `userId`, `transactionDate`, `particulars`, `particularType`, `debitAmount`, `creditAmount`, `balance`, `remarks`.

---

## 7. Repository

`PpfTransactionRepository` extends `MongoRepository<PpfTransaction, String>`:
- `findByIdAndUserId(String id, String userId)`
- `findByUserId(String userId, Sort sort)`

---

## 8. API Reference

All responses return standard `ApiResponse<T>` envelope.

### 8.1 Create PPF Transaction
```http
POST /api/ppf/transactions
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "transactionDate": "2026-04-10",
  "particulars": "UPI / Bank Transfer",
  "particularType": "DEPOSIT",
  "creditAmount": 150000.00,
  "remarks": "Max limit reached"
}
```

---

## 9. Data Flow

1. **Create Request** -> Controller extracts `userId`.
2. **Validation** -> Ensures only one of credit/debit exists and `> 0`.
3. **Save Entry** -> Saved with sequential `transactionNo`.
4. **Recalculation** -> `PpfBalanceRecalculationService` reorders and computes running balances.
5. **Response** -> Returns the newly updated transaction.

---

## 10. Security

- **User Scoping**: Every query filters by `userId` derived from JWT.
- **Transaction Rollback**: Ensures partial balance updates are reverted if validation fails.

---

## 11. Common Pitfalls

| Pitfall | Mitigation |
|---|---|
| Relying on `transactionNo` for order | Ledger is STRICTLY ordered by `transactionDate` |
| Client-provided balances | The `balance` field in `PpfTransactionRequestDTO` is rejected |
| Aggregation pipeline mismatch | Summary metrics are calculated programmatically from transactions, guaranteeing correct balance reconciliation |
| Concurrent modifications | Handled via single-threaded recalculation in Mongo `@Transactional` |
