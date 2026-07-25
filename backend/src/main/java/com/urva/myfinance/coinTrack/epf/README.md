# EPF Management Module (Employees' Provident Fund & Employees' Pension Scheme)

> **Version**: 1.2.0  
> **Last Updated**: 2026-07-25  

## Overview
The EPF Management Module provides statutory contribution splitting and dual-balance tracking (EPF and EPS) following official Employees' Provident Fund (EPFO) regulations and the EPF Scheme crediting rules.

---

## Key Features & Business Logic

### 1. Statutory Contribution Split Engine (`EpfContributionCalculationService`)
- **Employee EPF**: 12% (or user-configured 10%/8%) of `Basic + DA`.
- **Employer EPS**: 8.33% of `min(Basic+DA, ₹15,000)` capped at **₹1,250/month**, unless the user has opted into `useActualSalaryForEps` (post-Nov 2022 Supreme Court ruling).
- **Employer EPF**: Remainder of employer's 12% contribution after deducting the EPS share (`0.12 * Basic+DA - EPS`).
- **VPF (Voluntary Provident Fund)**: 100% credited to EPF balance (0% to EPS).

### 2. Dual-Balance Interest Engine (`EpfInterestAccrualService`)
Interest is accrued independently for the **EPF Balance** and the **EPS Balance** using EPFO's official 3-case formula per financial year:
1. **Opening Balance (less withdrawals in FY)**: Earns interest for all 12 months.
2. **Withdrawals during FY**: Stop earning interest from the month of withdrawal (earns interest only up to the month *before* withdrawal).
3. **New Contributions during FY**: Earn interest starting from the month *after* contribution through FY-end.

> **CRITICAL ARCHITECTURAL NOTE FOR MAINTAINERS:**  
> Do **NOT** replace this calculation with a simplified "monthly interest on opening balance" approximation. The 3-case monthly running balance simulation accurately mirrors EPFO's official annual crediting rules.

### 3. User-Editable FY Reference Interest Rates (`epf_interest_rates`)
- EPFO declares interest rates per financial year (e.g. 8.25% for FY 2025-26). Rates are stored dynamically in the `epf_interest_rates` database collection rather than hardcoded.

### 4. Recalculation Cascade (`EpfBalanceRecalculationService`)
- Editing or deleting a past transaction automatically recomputes both running `epfBalance` and `epsBalance` ledgers. Throws `InsufficientEpfBalanceException` (400 Bad Request) if any transaction date results in a negative balance.

### 5. Taxability Indicator
- Surfaces `taxableInterestFlag: boolean` on the summary DTO if total employee contributions + VPF in the current financial year exceed **₹2,50,000**.

---

## Database Collections

1. **`epf_settings`**: Per-user configuration (`defaultBasicDA`, `employeeContributionRate`, `useActualSalaryForEps`, `monthlyVpfAmount`).
2. **`epf_transactions`**: Individual monthly or ad-hoc ledger entries.
3. **`epf_interest_rates`**: Reference table mapping financial years (e.g. `2025-26`) to interest percentage rates.

---

## API Endpoints

Base path: `/api/epf` (JWT authenticated)

| Method | Path | Description |
|---|---|---|
| GET / PUT | `/api/epf/settings` | Get/update user EPF settings |
| GET / POST | `/api/epf/interest-rates` | Get/add interest rate entries for financial years |
| POST | `/api/epf/transactions` | Add entry (AUTO_SALARY split or MANUAL_OVERRIDE) |
| GET | `/api/epf/transactions` | List paginated transactions with optional filters (`dateFrom`, `dateTo`, `financialYear`, `mode`) |
| GET / PUT / DELETE | `/api/epf/transactions/{id}` | Single transaction operations (edits/deletes trigger balance recalculation) |
| GET | `/api/epf/summary` | Dashboard summary metrics (EPF & EPS balances, totals, live accrued interest, tax flag) |
| GET | `/api/epf/export` | Export filtered transactions to styled Excel (XLSX) with perfect UI-parity |
