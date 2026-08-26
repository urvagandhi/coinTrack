# FD Module — Industry Standards Implementation Plan

**Source:** Part 2 deep-dive audit gaps vs Indian banking FD standards  
**Target:** Close all 6 tracker-level gaps (none are calculation bugs)  
**Approach:** Incremental, backward-compatible, with feature flags for new fields

---

## 📋 GAP SUMMARY

| # | Gap | Priority | Effort | Risk |
|---|-----|----------|--------|------|
| 1 | TDS Modeling | P0 (regulatory) | Large | Medium |
| 2 | Premature Withdrawal (Close ≠ Withdraw) | P0 (correctness) | Medium | Low |
| 3 | Cumulative vs Non-Cumulative | P1 (correctness) | Medium | Low |
| 4 | Senior Citizen / Tax-Saver Flags | P1 (completeness) | Small | Low |
| 5 | Configurable Compounding Frequency | P1 (correctness) | Small | Low |
| 6 | Server-Side Maturity Validation | P0 (security) | Small | Low |

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
| `GET /api/fixed-deposits/{id}/tds` | **NEW** — TDS computation for a FY |
| `GET /api/fixed-deposits/summary` | Add net-of-TDS fields |
| `GET /api/fixed-deposits/export` | Add TDS, type, penalty columns |

### 4. Frontend Changes
- **FdDialog**: Add FD Type selector (Cumulative/Non-Cumulative), Compounding Frequency, Senior Citizen, Tax Saver checkboxes
- **Auto-calc**: Use new `FdMath` logic (shared via API or duplicated in frontend)
- **New "Withdraw" button** next to "Close" — calls `/withdraw` endpoint
- **Summary/Export**: Show net-of-TDS values

---

## 🔧 DETAILED IMPLEMENTATION PER GAP

---

### GAP 1: TDS Modeling (P0)

#### 1.1 Model Changes (`FixedDeposit.java`)
```java
// New fields
private Boolean isSeniorCitizen;           // default false
private Boolean hasPan;                    // default true
private Boolean form15g15hSubmitted;       // default false
private Integer financialYear;             // for TDS tracking (optional)
```

#### 1.2 TDS Calculation Rules (per FY 2025-26 / AY 2026-27)
| Category | Threshold | TDS Rate (with PAN) | TDS Rate (no PAN) |
|----------|-----------|---------------------|-------------------|
| Regular (<60) | ₹50,000 | 10% | 20% |
| Senior Citizen (60+) | ₹1,00,000 | 10% | 20% |

**Note**: Budget 2025 raised thresholds from ₹40k/₹50k to ₹50k/₹1L effective FY 2025-26.

#### 1.3 TDS Computation Logic
```java
// Per FD per financial year
annualInterest = maturityAmount - issueAmount  // simplified; actual needs per-FY split
if (isSeniorCitizen) threshold = 100000; else threshold = 50000;
if (annualInterest > threshold) {
    taxableInterest = annualInterest - threshold;
    tdsRate = hasPan ? 0.10 : 0.20;
    if (form15g15hSubmitted) tdsRate = 0;  // exemption
    tdsAmount = taxableInterest * tdsRate;
} else {
    tdsAmount = 0;
}
netInterest = annualInterest - tdsAmount;
```

#### 1.4 New DTO: `FdTdsDetailDTO`
```java
record FdTdsDetailDTO(
    String fdId,
    Long fdNo,
    Integer financialYear,
    BigDecimal grossInterest,
    BigDecimal tdsThreshold,
    BigDecimal taxableInterest,
    BigDecimal tdsRate,
    BigDecimal tdsDeducted,
    BigDecimal netInterest,
    Boolean form15g15hSubmitted,
    Boolean hasPan
)
```

#### 1.5 New Endpoints
- `GET /api/fixed-deposits/{id}/tds?fy=2025-26` → `FdTdsDetailDTO`
- `GET /api/fixed-deposits/tds-summary?fy=2025-26` → List per FD + totals
- Add `totalTdsDeducted`, `totalNetReturns` to `FixedDepositSummaryDTO`

#### 1.6 Excel Export
Add columns: `TDS Threshold`, `Taxable Interest`, `TDS Rate`, `TDS Deducted`, `Net Interest`

---

### GAP 2: Premature Withdrawal (P0)

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

### GAP 3: Cumulative vs Non-Cumulative (P1)

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

### GAP 4: Senior Citizen / Tax-Saver Flags (P1)

#### 4.1 New Fields
```java
private Boolean isSeniorCitizen;          // default false → adds +0.50% typically
private Boolean isTaxSaver;               // default false → 5-year lock-in, no premature withdraw
private Integer taxSaverLockInYears;      // default 5 (fixed)
```

#### 4.2 Behavioral Rules
| Flag | Effect |
|------|--------|
| `isSeniorCitizen=true` | +0.50% on contracted rate (configurable); higher TDS threshold (₹1L); eligible for 80TTB |
| `isTaxSaver=true` | Tenor fixed to 5 years; `PATCH /close` allowed but `POST /withdraw` **blocked**; 80C deduction eligible (old regime only) |

#### 4.3 Validation
- If `isTaxSaver=true`: `maturityDate` must be exactly 5 years from `issueDate` (±1 day for holidays)
- If `isTaxSaver=true`: `/withdraw` returns 400 "Tax-saver FDs cannot be withdrawn before 5 years"

---

### GAP 5: Configurable Compounding Frequency (P1)

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

### GAP 6: Server-Side Maturity Validation (P0)

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
│       ├── FixedDepositSummaryDTO.java  # MODIFY: add TDS totals
│       ├── PrematureWithdrawalResponseDTO.java  # NEW
│       └── FdTdsDetailDTO.java          # NEW
├── exception/
│   ├── InvalidWithdrawalException.java  # NEW (tax-saver, <7 days, etc.)
│   └── TdsComputationException.java     # NEW
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
frontend/src/components/fixeddeposit/FdDialog.jsx
├── New fields: fdType, compoundingFrequency, isSeniorCitizen, isTaxSaver, payoutFrequency
├── New "Withdraw" button (calls /withdraw)
├── Auto-calc uses new formulas
└── Validation for tax-saver (5-year lock-in)
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

    // TDS
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

### TDS Tests
- [ ] Regular citizen, interest ₹30k → no TDS
- [ ] Regular citizen, interest ₹60k → TDS on ₹10k @ 10% = ₹1k
- [ ] Senior citizen, interest ₹80k → no TDS (threshold ₹1L)
- [ ] Senior citizen, interest ₹1.2L → TDS on ₹20k @ 10% = ₹2k
- [ ] No PAN → 20% TDS
- [ ] Form 15G/15H submitted → 0% TDS
- [ ] Multiple FDs per bank → aggregate interest for threshold

### Premature Withdrawal Tests
- [ ] Withdraw after 7 days, small FD → 0.5% penalty
- [ ] Withdraw after 7 days, large FD → 1% penalty
- [ ] Withdraw before 7 days → 0 interest
- [ ] Tax-saver FD withdraw → 400 error
- [ ] Partial withdrawal (future) → pro-rata

### Cumulative vs Non-Cumulative Tests
- [ ] ₹1L @ 7% 5yr cumulative → ~₹1.41L
- [ ] ₹1L @ 7% 5yr non-cumulative quarterly → ₹35k total interest
- [ ] Verify compounding frequency changes output

### Server Validation Tests
- [ ] Auto-mode: client sends wrong maturity → server overrides
- [ ] Manual-mode: client sends wrong maturity → accepted, logged, flagged
- [ ] Tolerance ±₹1 respected

---

## 🚀 ROLLOUT SEQUENCE

### Phase 1: Foundation (No Breaking Changes)
1. Add enums (`FdType`, `CompoundingFrequency`, `InterestPayoutFrequency`, `FdStatus.WITHDRAWN`)
2. Add nullable fields to `FixedDeposit` model with defaults
3. Create `FdMath` utility with all calculation methods
4. Add server-side validation in create/update (log only, don't reject)
5. Unit tests for `FdMath`

### Phase 2: TDS & Withdrawal
6. Implement TDS computation + new endpoints
7. Implement premature withdrawal endpoint + logic
8. Update summary/export with TDS fields
9. Integration tests

### Phase 3: Frontend & Polish
10. Update FdDialog with new fields
11. Add "Withdraw" button + flow
12. Show server-computed vs client maturity
13. E2E tests

### Phase 4: Migration & Cleanup
14. Data migration script for existing FDs (set defaults)
15. Deprecate `/close` in docs (keep functional)
16. Update README v1.3.0 with all new features

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
5. **Senior Citizen**: +0.25-0.50% rate, ₹1L TDS threshold, 80TTB ₹50k deduction
6. **Compounding**: RBI norm = quarterly; Post Office = quarterly compounded, annual payout; corporates may vary

---

## ✅ DEFINITION OF DONE

- [ ] All 6 gaps implemented with tests ≥80% coverage
- [ ] `mvn clean test` passes (all modules)
- [ ] Frontend builds (`npm run build`)
- [ ] E2E: create FD with all new fields → export shows TDS → withdraw shows penalty
- [ ] PART1/PART2 audit docs updated with new field inventory
- [ ] README v1.3.0 published