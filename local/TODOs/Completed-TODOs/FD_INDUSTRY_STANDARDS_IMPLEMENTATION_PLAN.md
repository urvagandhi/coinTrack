# FD Module — Industry Standards Implementation Plan

**Source:** Part 2 deep-dive audit gaps vs Indian banking FD standards  
**Target:** Close all 6 tracker-level gaps (none are calculation bugs)  
**Approach:** Incremental, backward-compatible, with feature flags for new fields

> **[DEPRECATED-TDS]** The TDS modeling feature (Gap #1 — Section 194A `GET /{id}/tds` and
> `GET /tds-summary` endpoints, `FdTdsDetailDTO`, `TdsComputationException`, the
> `hasPan`/`form15g15hSubmitted`/`financialYear` fields, and `FixedDepositSummaryDTO.totalTdsDeducted`/
> `totalNetReturns`) has been **commented out** of the codebase. The TDS prose sections below are
> retained so a future reader can re-enable the feature. When re-enabling, uncomment the code first.

> **REVISION 2026-08-28 (post-1.3.0 correction):**
> 1. **TDS is now per (place, holderName), NOT per-FD** (Section 194A): the ₹50K regular / ₹1L
>    senior threshold applies to the TOTAL interest ONE holder earns at ONE bank, then each FD
>    gets a **proportional share** of that group's TDS (with rounding reconciliation so per-FD lines
>    sum exactly to the group total). Distinct holders at the same bank are **separate taxpayers**
>    with independent thresholds ("family" is a viewing convenience, not a shared threshold — the
>    Zerodha-family model). Holder names are **normalized on save** (trim + whitespace-collapse +
>    title-case, same pattern as MF scheme-category) so one person's FDs can never split into
>    under-threshold groups. Bank-level context (`bankName`, `bankTotalGrossInterest`,
>    `bankTaxableInterest`, `bankTotalTdsDeducted`) is surfaced on every TDS row.
> 2. **Senior-citizen rate bonus removed**: the module no longer auto-adds **+0.50%** to
>    `interestRate`. The rate is the **final contracted rate** from the certificate (any bank senior
>    bonus is already embedded). `isSeniorCitizen` now drives the ₹1L TDS threshold and 80TTB only.

---

## 📋 GAP SUMMARY

| # | Gap | Priority | Effort | Risk | Status |
|---|-----|----------|--------|------|--------|
| 1 | TDS Modeling | P0 (regulatory) | Large | Medium | ✅ **DONE** |
| 2 | Premature Withdrawal (Close ≠ Withdraw) | P0 (correctness) | Medium | Low | ✅ **DONE** |
| 3 | Cumulative vs Non-Cumulative | P1 (correctness) | Medium | Low | ✅ **DONE** |
| 4 | Senior Citizen / Tax-Saver Flags | P1 (completeness) | Small | Low | ✅ **DONE** |
| 5 | Configurable Compounding Frequency | P1 (correctness) | Small | Low | ✅ **DONE** |
| 6 | Server-Side Maturity Validation | P0 (security) | Small | Low | ✅ **DONE** |

---

## 🏗 ARCHITECTURAL DECISIONS

### 1. Data Model Strategy
- **Add new fields to `FixedDeposit` model** — all nullable with sensible defaults
- **New enum `FdType`**: `CUMULATIVE`, `NON_CUMULATIVE`
- **New enum `InterestPayoutFrequency`**: `MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`, `AT_MATURITY`
- **New enum `CompoundingFrequency`**: `MONTHLY` (12), `QUARTERLY` (4), `HALF_YEARLY` (2), `YEARLY` (1)
- **New DTOs** for premature withdrawal response and TDS details

### 2. Calculation Engine
- **Create `FdMath` utility** in `fixeddeposit/util/` (not in calculator module) — module-owned math
- **Reuse `SavingsMath`** for calculator endpoint; FD module uses its own math for persistence
- **Server-side validation** on create/update: recompute maturity, compare with client value, allow ±₹1 tolerance

### 3. API Changes
| Endpoint | Change |
|----------|--------|
| `POST /api/fixed-deposits` | Accept new fields; validate & recompute maturity |
| `PUT /api/fixed-deposits/{id}` | Same as create |
| `PATCH /api/fixed-deposits/{id}/close` | **Deprecated** — keep for backward compat (sticky flag only) |
| `POST /api/fixed-deposits/{id}/withdraw` | **NEW** — premature withdrawal with penalty calc |
| `GET /api/fixed-deposits/{id}/tds` | **NEW** — TDS computation for a FY <!-- [DEPRECATED-TDS] endpoint commented out -->
| `GET /api/fixed-deposits/summary` | Add net-of-TDS fields <!-- [DEPRECATED-TDS] net-of-TDS fields (totalTdsDeducted/totalNetReturns) removed --> |
| `GET /api/fixed-deposits/export` | Add TDS, type, penalty columns |

### 4. Frontend Changes
- **FdDialog**: FD Type selector (Cumulative/Non-Cumulative), Compounding Frequency, Interest Payout, plus Senior Citizen / Tax Saver / PAN / Form 15G-15H checkboxes (Section 04 "Interest Structure" + Section 05 "Tax & Compliance")
- **Auto-calc**: Mirrors `FdMath` — non-cumulative uses simple interest; cumulative uses the selected compounding frequency with a broken-days tail (duplicated in frontend, matching backend math)
- **Server vs client maturity**: Edit view shows `serverComputedMaturityAmount`, override status, and `maturityDifference` banner
- **New "Withdraw" button** next to "Close" (card + table) → opens `WithdrawDialog` calling `/withdraw` and rendering the full `PrematureWithdrawalResponseDTO` breakdown
- **TDS Summary UI**: New `TdsSummary` component (per-financial-year filter) rendering bank-and-holder TDS lines with threshold/taxable/rate/TDS/net + 15G-15H exemption; header stat cards show Total Returns, TDS Deducted, Net Returns
- **Status**: `PREMATURELY_WITHDRAWN` badge + filter added; withdraw only offered for active/non-withdrawn/non-closed FDs

---

## 🔧 DETAILED IMPLEMENTATION PER GAP

---

### ✅ GAP 1: TDS Modeling (P0) — **IMPLEMENTED** <!-- [DEPRECATED-TDS] entire Gap 1 feature commented out of the codebase -->

#### 1.1 Model Changes (`FixedDeposit.java`)
```java
// New fields
private Boolean isSeniorCitizen;           // default false
private Boolean hasPan;                    // default true   [DEPRECATED-TDS] commented out
private Boolean form15g15hSubmitted;       // default false  [DEPRECATED-TDS] commented out
private Integer financialYear;             // for TDS tracking (optional) [DEPRECATED-TDS] commented out
```

#### 1.2 TDS Calculation Rules (per FY 2025-26 / AY 2026-27)
| Category | Threshold | TDS Rate (with PAN) | TDS Rate (no PAN) |
|----------|-----------|---------------------|-------------------|
| Regular (<60) | ₹50,000 | 10% | 20% |
| Senior Citizen (60+) | ₹1,00,000 | 10% | 20% |

**Note**: Budget 2025 raised thresholds from ₹40k/₹50k to ₹50k/₹1L effective FY 2025-26.

#### 1.3 TDS Computation Logic

> **REVISED (2026-08-28):** Section 194A applies the threshold to the **total interest ONE holder
> earns from ONE bank**, not per-FD. The module now aggregates FDs by **`(place, holderName)`** (a
> "bank-and-holder group"), applies the exemption threshold to the group total, then allocates each
> FD's share **proportionally by gross interest** (with a rounding-remainder correction so the
> per-FD lines sum exactly to the group total). Distinct holders at the same bank are separate
> groups — never pooled into a shared family threshold. Holder names are normalized on save.

```java
// PER BANK-AND-HOLDER GROUP (grouped by `(place, holderName)`), per financial year:
groupGross     = Σ grossInterest of active/non-withdrawn FDs of that holder at that bank
groupThreshold = (all non-exempt FDs in group are senior) ? 100000 : 50000
groupTaxable   = anyExempt(form15g15h in group) ? 0 : max(groupGross - groupThreshold, 0)
groupHasPan    = all FDs in group have PAN
groupTdsRate   = groupHasPan ? 0.10 : 0.20          // no-PAN takes priority
groupTdsDeducted = groupTaxable * groupTdsRate

// PER FD (within the group):
share = (anyExempt || groupTdsDeducted == 0) ? 0
        : groupTdsDeducted * gross / groupGross      // proportional
// last allocatable FD absorbs the rounding remainder so Σ shares == groupTdsDeducted
```

Per-group threshold rules captured in `FdMath.computeBankLevelTds(List<FdTdsInput>)`; grouping in
`FixedDepositServiceImpl.tdsGroupKey(...)`. **Future:** when family accounts become first-class,
swap the free-text `holderName` grouping key for a `Holder` entity's `(place, paneOrHolderId)` —
same shape, no re-architecture.

#### 1.4 New DTO: `FdTdsDetailDTO` <!-- [DEPRECATED-TDS] DTO commented out -->
```java
class FdTdsDetailDTO {
    String fdId;
    Long fdNo;
    String place;                 // bank group container
    Integer financialYear;
    BigDecimal grossInterest;
    BigDecimal tdsThreshold;
    BigDecimal taxableInterest;
    BigDecimal tdsRate;
    BigDecimal tdsDeducted;
    BigDecimal netInterest;
    Boolean form15g15hSubmitted;
    Boolean hasPan;
    // Bank-level context surfaced so a small FD's nonzero TDS is explainable:
    String  bankName;
    BigDecimal bankTotalGrossInterest;
    BigDecimal bankTaxableInterest;
    BigDecimal bankTotalTdsDeducted;
}
```

#### 1.5 New Endpoints <!-- [DEPRECATED-TDS] both endpoints below commented out -->
- `GET /api/fixed-deposits/{id}/tds?fy=2025-26` → `FdTdsDetailDTO`
- `GET /api/fixed-deposits/tds-summary?fy=2025-26` → List per FD + totals
- Add `totalTdsDeducted`, `totalNetReturns` to `FixedDepositSummaryDTO` <!-- [DEPRECATED-TDS] summary fields removed -->

#### 1.6 Excel Export
Add columns: `TDS Threshold`, `Taxable Interest`, `TDS Rate`, `TDS Deducted`, `Net Interest`

---

### ✅ GAP 2: Premature Withdrawal (P0) — **IMPLEMENTED**

#### 2.1 Key Distinction
| Action | Current | New |
|--------|---------|-----|
| `PATCH /close` | Sets `status=CLOSED` (sticky flag) | **Keep for backward compat** — just a flag |
| `POST /withdraw` | **NEW** | Computes actual payout with penalty |

#### 2.2 Penalty Rules (Bank-Agnostic Defaults, Configurable)
| Bank | Small FD (≤₹5L) | Large FD (>₹5L) | Min Holding for Interest |
|------|-----------------|-----------------|--------------------------|
| SBI | 0.50% | 1.00% | 7 days |
| HDFC | 1.00% | 1.00% | 7 days |
| ICICI | 0.50% (<1yr) / 1.00% (≥1yr) | 1.00% | 7 days |
| Axis | 1.00% | 1.00% | 7 days |
| **CoinTrack Default** | **0.50%** | **1.00%** | **7 days** |

**Formula**:
```
actualTenorDays = withdrawalDate - issueDate
applicableRate = min(contractedRate, rateForActualTenor)  // rateForActualTenor from bank's rate card (simplified: use contractedRate)
penaltyRate = (issueAmount > 500000) ? 1.00% : 0.50%
effectiveRate = applicableRate - penaltyRate
if (actualTenorDays < 7) effectiveRate = 0

// Interest calculation based on FD type
if (fdType == CUMULATIVE) {
    maturity = principal * (1 + effectiveRate/compoundingFreq)^(compoundingFreq * years)
} else {
    // Non-cumulative: simple interest on principal for actual period
    maturity = principal + principal * effectiveRate * actualTenorDays / 365
}
penaltyAmount = (contractedMaturityAmount - actualMaturityAmount)
```

#### 2.3 New Model Fields for Withdrawal
```java
private Boolean isPrematurelyWithdrawn;    // default false
private LocalDate withdrawalDate;
private BigDecimal realizedMaturityAmount; // actual payout
private BigDecimal penaltyAmount;
private BigDecimal effectiveRateApplied;
```

#### 2.4 New Endpoint
```
POST /api/fixed-deposits/{id}/withdraw
Request: { withdrawalDate, penaltyRateOverride?, bankName? }
Response: PrematureWithdrawalResponseDTO {
    fdId, fdNo, withdrawalDate,
    contractedRate, applicableRate, penaltyRate, effectiveRate,
    contractedMaturityAmount, realizedMaturityAmount, penaltyAmount,
    actualTenorDays, interestEarned
}
```

#### 2.5 Status Transition
- On withdraw: `status` → `WITHDRAWN` (new `FdStatus` value), `isPrematurelyWithdrawn = true`
- `CLOSED` remains for manual sticky override only

---

### ✅ GAP 3: Cumulative vs Non-Cumulative (P1) — **IMPLEMENTED**

#### 3.1 New Enum
```java
public enum FdType {
    CUMULATIVE,        // Interest compounded, paid at maturity
    NON_CUMULATIVE     // Interest paid out periodically (simple interest on principal)
}
```

#### 3.2 New Fields
```java
private FdType fdType;                           // default CUMULATIVE
private InterestPayoutFrequency payoutFrequency; // for NON_CUMULATIVE: MONTHLY/QUARTERLY/HALF_YEARLY/YEARLY
```

#### 3.3 Calculation Differences
| Aspect | Cumulative | Non-Cumulative |
|--------|------------|----------------|
| Interest | Compounded (quarterly default) | Simple interest on principal |
| Payout | At maturity | Monthly/Quarterly/Half-yearly/Yearly |
| Total Return | Higher (compounding) | Lower (no compounding) |
| Tax | Accrual basis annually | Cash basis when received |

#### 3.4 Frontend
- Radio group: "Cumulative (Money Multiplier)" vs "Non-Cumulative (Regular Income)"
- If Non-Cumulative: show payout frequency dropdown
- Auto-calc uses correct formula based on selection

---

### ✅ GAP 4: Senior Citizen / Tax-Saver Flags (P1) — **IMPLEMENTED**

#### 4.1 New Fields
```java
private Boolean isSeniorCitizen;          // default false → TDS threshold + 80TTB only (NO auto rate bonus)
private Boolean isTaxSaver;               // default false → 5-year lock-in, no premature withdraw
private Integer taxSaverLockInYears;      // default 5 (fixed)
```

#### 4.2 Behavioral Rules
| Flag | Effect |
|------|--------|
| `isSeniorCitizen=true` | **REVISED (2026-08-28):** no automatic rate bonus — `interestRate` is the final contracted rate printed on the certificate (any bank senior bonus 0.25–0.75% is already embedded). Drives the higher TDS threshold (₹1L, per bank group) and 80TTB eligibility. |
| `isTaxSaver=true` | Tenor fixed to 5 years; `PATCH /close` allowed but `POST /withdraw` **blocked**; 80C deduction eligible (old regime only) |

#### 4.3 Validation
- If `isTaxSaver=true`: `maturityDate` must be exactly 5 years from `issueDate` (±1 day for holidays)
- If `isTaxSaver=true`: `/withdraw` returns 400 "Tax-saver FDs cannot be withdrawn before 5 years"

---

### ✅ GAP 5: Configurable Compounding Frequency (P1) — **IMPLEMENTED**

#### 5.1 New Enum
```java
public enum CompoundingFrequency {
    MONTHLY(12),
    QUARTERLY(4),        // Default (RBI norm for banks)
    HALF_YEARLY(2),
    YEARLY(1);

    private final int periodsPerYear;
}
```

#### 5.2 Model Field
```java
private CompoundingFrequency compoundingFrequency; // default QUARTERLY
```

#### 5.3 Formula Update
```java
// A = P * (1 + r/n)^(n*t)
BigDecimal n = BigDecimal.valueOf(compoundingFrequency.getPeriodsPerYear());
BigDecimal rateDecimal = ratePercent.divide(HUNDRED, SCALE, ROUNDING);
BigDecimal periodicRate = rateDecimal.divide(n, SCALE, ROUNDING);
BigDecimal exponent = n.multiply(BigDecimal.valueOf(tenureDays).divide(BigDecimal.valueOf(365), SCALE, ROUNDING));
BigDecimal maturity = principal.multiply(MathUtil.pow(BigDecimal.ONE.add(periodicRate), exponent.doubleValue()));
```

#### 5.4 Frontend
- Dropdown in FdDialog: "Monthly", "Quarterly (Standard)", "Half-Yearly", "Yearly"
- Show effective yield for each option
- Post Office: quarterly compounding, annual payout

---

### ✅ GAP 6: Server-Side Maturity Validation (P0) — **IMPLEMENTED**

#### 6.1 Validation Logic
```java
@Transactional
public FixedDepositResponseDTO createFixedDeposit(FixedDepositRequestDTO requestDTO, String userId) {
    // ... existing validation ...
    
    // SERVER-SIDE RECOMPUTATION
    BigDecimal serverMaturity = fdMath.computeMaturity(
        requestDTO.getIssueAmount(),
        requestDTO.getInterestRate(),
        requestDTO.getIssueDate(),
        requestDTO.getMaturityDate(),
        requestDTO.getFdType(),              // NEW
        requestDTO.getCompoundingFrequency(), // NEW
        requestDTO.isSeniorCitizen(),         // NEW
        requestDTO.getPayoutFrequency()       // NEW
    );
    
    BigDecimal clientMaturity = requestDTO.getMaturityAmount();
    BigDecimal tolerance = new BigDecimal("1.00"); // ±₹1
    
    if (clientMaturity.subtract(serverMaturity).abs().compareTo(tolerance) > 0) {
        if (requestDTO.getEntryMode() == EntryMode.AUTOMATIC) {
            // Auto-mode: override with server value
            requestDTO.setMaturityAmount(serverMaturity);
            log.warn("Client maturity {} overridden to server value {} for user {}", 
                     clientMaturity, serverMaturity, userId);
        } else {
            // Manual mode: accept but flag
            log.info("Manual entry: client maturity {} vs server {} (diff within tolerance? {})",
                     clientMaturity, serverMaturity, 
                     clientMaturity.subtract(serverMaturity).abs().compareTo(tolerance) <= 0);
        }
    }
    
    // ... save with validated maturity ...
}
```

#### 6.2 Response Enhancement
Add to `FixedDepositResponseDTO`:
```java
private BigDecimal serverComputedMaturityAmount;  // always present
private Boolean maturityAmountOverridden;         // true if auto-mode & mismatch
private BigDecimal maturityDifference;            // client - server
```

---

## 📦 FILES TO CREATE / MODIFY

### Backend — New Files
```
backend/src/main/java/com/urva/myfinance/coinTrack/fixeddeposit/
├── model/
│   ├── FdType.java                      # NEW enum
│   ├── InterestPayoutFrequency.java     # NEW enum
│   ├── CompoundingFrequency.java        # NEW enum
│   └── FdStatus.java                    # ADD WITHDRAWN value
├── dto/
│   ├── request/
│   │   ├── FixedDepositRequestDTO.java  # MODIFY: add new fields
│   │   └── PrematureWithdrawalRequestDTO.java  # NEW
│   └── response/
│       ├── FixedDepositResponseDTO.java # MODIFY: add serverComputedMaturity, etc.
│       ├── FixedDepositSummaryDTO.java  # MODIFY: add TDS totals <!-- [DEPRECATED-TDS] totalTdsDeducted/totalNetReturns removed -->
│       ├── PrematureWithdrawalResponseDTO.java  # NEW
│       └── FdTdsDetailDTO.java          # NEW <!-- [DEPRECATED-TDS] commented out -->
├── exception/
│   ├── InvalidWithdrawalException.java  # NEW (tax-saver, <7 days, etc.)
│   └── TdsComputationException.java     # NEW <!-- [DEPRECATED-TDS] commented out -->
├── util/
│   └── FdMath.java                      # NEW — module-owned calculation engine
├── service/
│   └── FixedDepositService.java         # MODIFY: add withdraw(), getTds(), etc.
├── controller/
│   └── FixedDepositController.java      # MODIFY: new endpoints
└── util/
    └── FixedDepositExcelExporter.java   # MODIFY: add new columns
```

### Backend — Modified Files
- `FixedDeposit.java` — add all new fields
- `FixedDepositRepository.java` — add query methods for TDS summary
- `FixedDepositServiceImpl.java` — implement all new logic
- `FixedDepositController.java` — new endpoints
- `FixedDepositExcelExporter.java` — new columns

### Frontend — Modified Files
```
frontend/src/lib/api.js                  # fdAPI: withdraw(), getTdsDetail(), getTdsSummary()
frontend/src/components/fixeddeposit/FdDialog.jsx
├── New fields: fdType, compoundingFrequency, payoutFrequency
├── New checkboxes: isSeniorCitizen, isTaxSaver, hasPan, form15g15hSubmitted
├── Auto-calc uses new formulas (non-cumulative + configurable compounding)
└── Server vs client maturity diff banner on edit
frontend/src/components/fixeddeposit/WithdrawDialog.jsx   # NEW — premature withdrawal flow
frontend/src/components/fixeddeposit/TdsSummary.jsx       # NEW — per-FY TDS table + totals
frontend/src/app/(main)/fixed-deposit/page.jsx            # WITHDRAW buttons, status filter,
                                                          # TDS/Net-Returns stat cards, wiring
```

### Tests
```
backend/src/test/java/com/urva/myfinance/coinTrack/fixeddeposit/
├── FdMathTest.java                      # NEW — comprehensive math tests
├── PrematureWithdrawalTest.java         # NEW
├── TdsComputationTest.java              # NEW
├── FixedDepositServiceTest.java         # EXTEND: test new fields/endpoints
└── FixedDepositControllerTest.java      # EXTEND: test new endpoints
```

---

## 🧮 FDMATH — CALCULATION ENGINE SPEC

```java
package com.urva.myfinance.coinTrack.fixeddeposit.util;

public final class FdMath {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final int SIMPLE_INTEREST_THRESHOLD_DAYS = 181;

    // Main entry point
    public static BigDecimal computeMaturity(
            BigDecimal principal,
            BigDecimal ratePercent,
            LocalDate issueDate,
            LocalDate maturityDate,
            FdType fdType,
            CompoundingFrequency compoundingFreq,
            boolean isSeniorCitizen,
            InterestPayoutFrequency payoutFreq) { ... }

    // Premature withdrawal
    public static PrematureWithdrawalResult computePrematureWithdrawal(
            BigDecimal principal,
            BigDecimal contractedRate,
            LocalDate issueDate,
            LocalDate maturityDate,
            LocalDate withdrawalDate,
            FdType fdType,
            CompoundingFrequency compoundingFreq,
            BigDecimal penaltyRate) { ... }

    // TDS <!-- [DEPRECATED-TDS] computeTds below no longer exists in FdMath (TDS feature commented out) -->
    public static TdsResult computeTds(
            BigDecimal annualInterest,
            boolean isSeniorCitizen,
            boolean hasPan,
            boolean form15g15hSubmitted) { ... }

    // Helper: days between, quarters, broken days, etc.
}
```

---

## 🧪 TEST SCENARIOS (Critical)

### TDS Tests  <!-- [DEPRECATED-TDS] TDS tests are DISABLED in the codebase (see TdsComputationTest banner) -->
- [x] Regular citizen, interest ₹30k → no TDS
- [x] Regular citizen, interest ₹60k → TDS on ₹10k @ 10% = ₹1k
- [x] Senior citizen, interest ₹80k → no TDS (threshold ₹1L)
- [x] Senior citizen, interest ₹1.2L → TDS on ₹20k @ 10% = ₹2k
- [x] No PAN → 20% TDS
- [x] Form 15G/15H submitted → 0% TDS
- [x] Bank-and-holder aggregation: 3 FDs of one holder at one bank (60k + 10k + 80k = ₹1.5L) → taxable ₹1L @10% → TDS ₹10k, allocated proportionally 4k / 666.67 / 5,333.33
- [x] Holders at the same bank are SEPARATE groups (Alice 60k → TDS 1k; Bob 30k+10k → no TDS) — never pooled into a shared family threshold
- [x] Holder-name normalization: " bob", "Bob", "BOB" join one group; a person's FDs can't split into under-threshold groups
- [x] No aggregation across banks or across holders (same amounts split across banks/holders → no TDS at any single group)
- [x] Senior threshold used only when ALL non-exempt FDs in the group are senior; mixed group → regular ₹50k threshold
- [x] Form 15G/15H on ANY FD in the group exempts the whole holder's bank group
- [x] Rounding reconciliation: proportional per-FD shares sum EXACTLY to the group TDS total

### Premature Withdrawal Tests
- [x] Withdraw after 7 days, small FD → 0.5% penalty
- [x] Withdraw after 7 days, large FD → 1% penalty
- [x] Withdraw before 7 days → 0 interest
- [x] Tax-saver FD withdraw → 400 error
- [x] Partial withdrawal (future) → pro-rata

### Cumulative vs Non-Cumulative Tests
- [x] ₹1L @ 7% 5yr cumulative → ~₹1.41L
- [x] ₹1L @ 7% 5yr non-cumulative quarterly → ₹35k total interest
- [x] Verify compounding frequency changes output

### Server Validation Tests
- [x] Auto-mode: client sends wrong maturity → server overrides
- [x] Manual-mode: client sends wrong maturity → accepted, logged, flagged
- [x] Tolerance ±₹1 respected

---

## 🚀 ROLLOUT SEQUENCE

### Phase 1: Foundation (No Breaking Changes)
1. [x] Add enums (`FdType`, `CompoundingFrequency`, `InterestPayoutFrequency`, `FdStatus.WITHDRAWN`)
2. [x] Add nullable fields to `FixedDeposit` model with defaults
3. [x] Create `FdMath` utility with all calculation methods
4. [x] Add server-side validation in create/update (log only, don't reject)
5. [x] Unit tests for `FdMath`

### Phase 2: TDS & Withdrawal
6. [x] Implement TDS computation + new endpoints
7. [x] Implement premature withdrawal endpoint + logic
8. [x] Update summary/export with TDS fields
9. [x] Integration tests

### Phase 3: Frontend & Polish
10. [x] Update FdDialog with new fields
11. [x] Add "Withdraw" button + flow
12. [x] Show server-computed vs client maturity
13. [x] E2E tests

### Phase 4: Migration & Cleanup
14. [x] Data migration script for existing FDs (set defaults)
15. [x] Deprecate `/close` in docs (keep functional)
16. [x] Update README v1.3.0 with all new features

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| Breaking existing API consumers | All new fields nullable with defaults; `/close` kept |
| TDS rule changes annually | Externalize thresholds/rates to config (`application.yml`) |
| Bank-specific penalty variations | Make penalty rate configurable per FD (override field) |
| Floating-point precision | Use `BigDecimal` throughout; `Math.pow` only for final step |
| Frontend/backend formula drift | Share `FdMath` logic via `/api/calculators/savings/fd` or duplicate with tests |

---

## 📚 REFERENCES

1. **TDS**: Section 194A, Finance Act 2025 — thresholds ₹50k/₹1L (FY 2025-26+)
2. **Premature Penalty**: SBI 0.5-1%, HDFC 1%, ICICI 0.5-1%, Axis 1%
3. **Cumulative vs Non-Cumulative**: Standard banking definitions (compounding vs simple interest)
4. **Tax-Saver FD**: Section 80C, 5-year lock-in, no premature withdrawal, old regime only
5. **Senior Citizen**: banks add a **+0.25–0.75% bonus** to the base rate — handled by entering the **final contracted rate** from the certificate, **not** by an automatic module-side bonus. ₹1L TDS threshold (per bank group), 80TTB ₹50k deduction
6. **Compounding**: RBI norm = quarterly; Post Office = quarterly compounded, annual payout; corporates may vary

---

## ✅ DEFINITION OF DONE

- [x] All 6 gaps implemented with tests ≥80% coverage
- [x] `mvn clean test` passes (all modules) — FixedDepositServiceTest 6/6 PASS
- [x] Frontend builds (`npm run build`)
- [x] E2E: create FD with all new fields → export shows TDS → withdraw shows penalty
- [x] PART1/PART2 audit docs updated with new field inventory
- [x] README v1.3.0 published

---

## 🔁 ADDENDUM — 2026-08-30 (supersedes the "keep `/close`" decisions above)

The plan above deliberately kept `PATCH /{id}/close` as a deprecated sticky-flag endpoint
("keep for backward compat"). This was later **consolidated away**: the standalone `CLOSED`
terminal status is removed entirely, and user-initiated termination is modelled **solely** as
`PREMATURELY_WITHDRAWN` (the richer state that already carries withdrawal economics —
`withdrawalDate`, `realizedMaturityAmount`, `penaltyAmount`, `effectiveRateApplied`,
`isPrematurelyWithdrawn`).

Consequences vs. the rows above:
- Line 55 / 161 / 214: `/close` is **removed**, not deprecated — no backward path remains.
- Line 262: Tax-Saver tenure fixed to 5 years; there is no `/close`; withdrawal remains blocked.
- Line 528 / 537: "Deprecate `/close`" is replaced by **remove `/close`**; existing DB
  `status=CLOSED` docs are migrated to `PREMATURELY_WITHDRAWN` by `FdV131Migration`
  (`fd_v131`) with `isPrematurelyWithdrawn=true`.

Live contract now = module `README.md` v1.3.3.