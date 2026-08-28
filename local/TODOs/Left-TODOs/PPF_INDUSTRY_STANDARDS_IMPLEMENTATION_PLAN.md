# PPF Module — Industry Standards Implementation Plan

**Source:** Part 2 deep-dive audit gaps vs PPF Scheme 2019 (web re-verified against 2026 sources on 2026-08-26)
**Target:** Close remaining 7 tracker-level feature gaps (Gap 1 calculation bug already fixed — see §GAP 1)
**Approach:** Manual-first ledger philosophy preserved; every statutory check ships as **guidance/warning first**, hard enforcement only where data integrity demands it

---

## 🌐 WEB-VERIFIED STANDARDS BASELINE (checked 2026-08-26)

| Parameter | Statutory value (PPF Scheme 2019, still current 2026) | Verified against |
|---|---|---|
| Interest rate | **7.10% p.a.**, compounded annually; revised quarterly by MoF; unchanged since Apr-Jun 2020 quarter, held through **Jul-Sep 2026** (9th straight quarter) | Kalkine 2026-07-11 · ClearTax (rate table shows Q1-Q2 2026-27 = 7.1%) · Economic Times 2026-04 |
| Interest calc method | Lowest balance between **5th and last day of each month** × rate/12; credited **March 31** annually | Motilal Oswal · ClearTax |
| Contribution floor | **₹500/FY** minimum, ≤12 installments/year; missed → account becomes **inactive/discontinued** (balance still earns interest); reactivate = **₹50 penalty per default year + ₹500 min deposit for each inactive year** | ET Money 2026-02 · ClearTax |
| Contribution ceiling | **₹1,50,000/FY**; excess treated as **irregular and refunded without interest** by banks | ET Money · Groww |
| Loan window | **3rd to 6th FY** (completed 2–5 FYs); one loan per FY; no new loan until previous fully repaid | Mint 2026-04 · Zeebiz 2026-04 · IndiaPost 2026-06 |
| Loan amount | **25% of balance at end of 2nd preceding FY** (Mar 31 value, e.g. apply in FY2026-27 → Mar 31 2024 balance) | All sources, consistent |
| Loan interest | **PPF rate + 1%** while repaid within **36 months**; on default → **PPF rate + 6%, retroactive from disbursement date**; principal first, then interest in ≤2 monthly installments; unpaid interest deducted from PPF balance; borrowed portion earns NO PPF interest during loan | Moneyview · emicalculator.net (2019 rule change 2%→1%) · ET Money |
| Partial withdrawal | From **7th FY onward** (= after **6 completed FYs**); once/FY; **50% of lower(balance at end of 4th preceding FY, preceding FY)**; Form C | IndiaPost timeline table · ET Money 2026-04 |
| Premature closure | After **5 full years**; grounds: life-threatening illness (self/spouse/children/parents), higher education (self/children), residency change (NRI); penalty = **entire account interest recalculated at rate −1% from inception**, shortfall deducted from proceeds; proceeds remain tax-free | Bajaj Finserv 2026-08 · IndiaPost worked example |
| Maturity & extension | 15 years counted from **end of opening FY**; extension in **5-year blocks, indefinitely repeatable** (Scheme 2019 removed the old one-block limit); WITH_CONTRIBUTION: deposits allowed, aggregate withdrawals ≤ **60% of block-opening balance**, 1 withdrawal/FY; WITHOUT_CONTRIBUTION: any amount once/FY | Navi · Scheme 2019 |

---

## 📋 GAP SUMMARY

| # | Gap | Priority | Effort | Risk | Status |
|---|-----|----------|--------|------|--------|
| 1 | Off-by-one in FY completion count | P0 (correctness) | Small | Low | ✅ **FIXED 2026-08-26** (incl. same-day regression repair, see below) |
| 2 | Annual contribution ceiling (₹1.5L) + excess flagging | P1 (data integrity) | Small-Med | Low | OPEN |
| 3 | Minimum deposit / dormancy (₹500, ₹50 reactivation) | P2 (completeness) | Medium | Low | OPEN |
| 4 | Interest simulation engine (5th-day method, Mar-31 credit) | P1 (core tracker value) | Large | Medium | OPEN — deliberate design gap, needs decision |
| 5 | Premature closure execution endpoint | P1 (DTO already promises it) | Medium | Medium | OPEN |
| 6 | Loan lifecycle modeling (25% cap, window, +1%/36mo) | P1 (statutory formulas absent) | Large | Medium | OPEN |
| 7 | March-31 interest crediting assistant | P2 (UX) | Small | Low | OPEN |
| 8 | Post-maturity auto-extension detection/nudge | P3 (UX) | Small | Low | OPEN |

---

## ⚠ GAP 1 — RESOLVED, WITH REGRESSION NOTE (P0)

**Original bug:** `completedFYs = currentFyStartYear - openingFyEndYear` undercounted by 1.
**Fix applied 2026-08-26:** `completedFYs = currentFyStartYear - openingFyStartYear`.
**Regression caught same day via 2026 web re-verification:** the original gates (`< 6`, loan `[2,5]`) were ALREADY correct relative to a correctly-computed count — because `completedFYs == 6` IS the 7th FY under the fixed formula. The initial fix round had also bumped thresholds to `< 7` / `[3,7]`, which would have blocked withdrawal until the **8th** FY and mis-windowed loans to the 4th–8th FY.
**Final state (current code):**
```java
completedFYs = currentFyStartYear - openingFyStartYear;
// lock-in gate
if (completedFYs < 6) { LOCK_IN }        // opens in 7th FY ✓ statute
.loanAllowed(completedFYs >= 2 && completedFYs <= 5)  // 3rd–6th FY ✓ statute
if (completedFYs < 15) { pre-maturity } else { MATURED } // year-16 entry ✓
// eligible-FY display: openFyStart+6 → 7th FY ✓
// 50%-cap offsets: fyMinus4/fyMinus1 strings — correct independent of count var ✓
```
**Lesson recorded:** verify threshold constants AND the counting variable together against a worked calendar example before shipping either change.

---

## 🏗 ARCHITECTURAL DECISIONS

### 1. Guidance-first, not bank-enforcement
CoinTrack is a **tracker**, not an account operator: it cannot refund deposits or charge penalties. Therefore:
- Statutory caps (₹1.5L, 25% loan, 60% block) → **computed and surfaced** (`maxX`, `overLimitBy`, warnings); writes are accepted but flagged, except where flagged-only data corrupts statutory math (see GAP 2 decision).
- Only the **loan window / withdrawal lock-in** style checks stay hard-blocked client-side (already the pattern).

### 2. Derived state over stored state
Account age, dormancy, maturity status, block index are all **functions of (dateOfIssue, transactions, today)** — compute on read (service layer), never persist. Avoids migration + stale-state bugs.

### 3. Simulation ≠ ledger mutation
Interest projection (GAP 4) and March-31 crediting (GAP 7) live in a read-only **projection service** + an optional "insert suggested INTEREST_CREDIT" dialog. The ledger itself stays fully manual, preserving today's reconciliation guarantee (`balance` never client-supplied).

### 4. Rate configurability
Current rate 7.1% (unchanged since 2020) ships as a **default constant** + optional per-year override table (`PpfRateOverrideEmbed` on User settings) so historical simulations can use era-correct rates (7.9% FY2020, 8.0% FY2019…). Public rate history table included in §GAP 4.

### 5. New endpoints follow existing conventions
JWT via `@AuthenticationPrincipal UserPrincipal`; `ApiResponse<T>` envelope; ownership via userId scoping; `@Valid` DTOs (pattern set by W2 fix).

### API surface plan
| Endpoint | Change |
|----------|--------|
| `GET /api/ppf/contribution-status?financialYear=` | **NEW** — deposited vs ₹1.5L cap, excess amount, installment count vs 12 |
| `POST /api/ppf/loans/quote` | **NEW** — max eligible loan (25% × 2nd-preceding-FY-end balance), window check, rate (PPF+1%) |
| `GET /api/ppf/loans/active` | **NEW** — outstanding loan state (from LOAN debits minus LOAN_REPAYMENT credits) |
| `POST /api/ppf/premature-closure/quote` | **NEW** — eligibility (≥5 full yrs + reason enum), recalculated proceeds at rate−1% from inception |
| `GET /api/ppf/interest-projection?financialYear=&rate=` | **NEW** — simulated Mar-31 credit using 5th-day-min method (read-only) |
| `GET /api/ppf/account-health` | **NEW** — dormancy flags, missing-minimum years, maturity countdown, extension-mode nudge |

---

## 🔧 DETAILED IMPLEMENTATION PER GAP

---

### GAP 2: Contribution ceiling ₹1,50,000/FY + excess flagging (P1)

**Statute:** max ₹1.5L/FY, ≤12 installments; excess = irregular, refunded w/o interest by operators.

#### Backend
- New DTO `PpfContributionStatusDTO { financialYear, totalDepositsThisFy, remainingHeadroom, overLimitAmount, installmentCount, maxInstallments=12 }`
- `contributionStatus(userId, fy)`: reuse FY-scoped summary walk (pattern from D5 fix) filtering `particularType ∈ {DEPOSIT, ACCOUNT_OPENING}` credits.
- Surface in create-flow response: when a DEPOSIT crosses the cap, response gains non-blocking `warnings[]` field (`CONTRIBUTION_CAP_EXCEEDED: excess ₹X will not earn interest`).
- **No hard reject** (matches guidance-first; a user recording what their bank actually did must be able to enter reality).

#### Frontend
- PpfDialog: live headroom line under amount field when type=DEPOSIT ("₹1,02,000 of ₹1,50,000 used this FY") using `contribution-status` query keyed by selected txn date's FY.
- Amber inline warning when exceeding; installments counter "7 of 12".

**Effort:** S-M · **Risk:** Low

---

### GAP 3: Minimum deposit / dormancy tracking (P2)

**Statute:** ₹500 min/FY else inactive; reactivate ₹50/default-year + ₹500/dead-year; balance keeps earning interest even when inactive.

#### Backend
- `account-health` endpoint computes per-FY deposit totals across account life → `List<FyDepositHealth { fy, deposited, meetsMinimum, isActive }>`.
- Dormant-year count + implied reactivation cost (`years × ₹50 + years × ₹500`).
- Note in DTO docs: interest continues on balance regardless (per ET Money reading of Scheme) — do NOT zero anything.

#### Frontend
- Header strip badge when current FY has no deposit yet ("Min ₹500 pending") or when past dormant years exist ("N inactive years — reactivation cost ≈ ₹X").

**Effort:** M · **Risk:** Low

---

### GAP 4: Interest simulation engine (P1 — largest gap, needs owner sign-off on scope)

**Statute:** monthly interest on **lowest balance between 5th and last day of month**, credited **Mar 31**; rate quarterly-set, currently 7.1%.

#### Reference rate history (for back-simulation)
| Period | Rate | | Period | Rate |
|---|---|---|---|---|
| Apr 2020 → today (Q2 FY27) | 7.10% | | Apr–Jun 2019 | 8.00% |
| Jan–Mar 2020 | 7.90% | | Oct–Dec 2018 | 8.00% |
| Jul–Sep 2019 | 7.90% | | Jul–Sep 2018 | 7.60% |

#### Backend — `PpfInterestProjectionService` (read-only)
```
for each month M in requested range:
    balanceOn5th = ledger balance after last txn dated ≤ 5th of M
    monthInterest = min(balanceOn5th, monthEndBalance?) → statute uses balance on 5th if no txn after 5th,
                    i.e. LOWEST of (balance after 5th-of-month txns) vs (month-end balance)
    accumulate at applicable rate (override map > default 7.1%)
projection: accrued-so-far-this-FY + projected Mar-31 credit at current rate
```
- Output DTO: `{ monthlyBreakdown[], accruedThisFy, projectedMar31Credit, effectiveRate, isSimulation: true }`
- **Never writes** transactions (decision §Architectural-3).

#### Frontend
- Summary card third metric gains ⓘ popover with breakdown; button "Preview this FY's interest" → modal table.

**Effort:** L · **Risk:** Med (month-boundary semantics must match operator practice; validate against one real passbook year before trusting)

---

### GAP 5: Premature closure execution (P1)

**Statute:** allowed after 5 full yrs; reasons: illness/higher-ed/NRI; **all interest since inception recomputed at rate−1%**, shortfall deducted; proceeds tax-free.

#### Backend
- DTO exists partially (`requiresPrematureClosureReason`, `allowedReasons`, `prematureClosureInterestReduction="1%"`) — extend with quote endpoint:
  `POST /premature-closure/quote { reason: LIFE_THREATENING_DISEASE|HIGHER_EDUCATION|CHANGE_IN_RESIDENCY }`
- Eligibility: `completedRealYears >= 5` (calendar years from opening, NOT the FY-count used elsewhere — statute says "after five years").
- Proceeds math: replay ledger per-FY applying rate−1% (uses GAP 4 engine + override map) → `{ eligible, currentBalance, recalculatedInterestAtReducedRate, penaltyAmount, netProceeds }`.
- Execution stays **manual** (user records actual closure in their bank): closing here = optional `OTHER` debit + settings `dateOfIssue=null` reset; no special endpoint needed for the write itself.

**Effort:** M · **Risk:** Med (depends on GAP 4 engine for exact figures; can ship v1 with flat approximation + disclaimer, v2 with replay precision)

---

### GAP 6: Loan lifecycle modeling (P1)

**Statute:** window 3rd–6th FY; max = **25% × balance at end of 2nd preceding FY**; interest **PPF+1%** within 36 months else **PPF+6% retroactive**; one active loan; principal→then interest ≤2 installments; borrowed slice earns nothing meanwhile.

#### Backend
- `POST /loans/quote`: window check via corrected `completedFYs ∈ [2,5]`; cap = `0.25 × getBalanceAtEndOfFy(fyStr(currentFyStartYear-2))` (helper already exists).
- Active-loan detection: pair `LOAN` debits with `LOAN_REPAYMENT` credits (**new ParticularType enum value**) FIFO; expose `{ outstandingPrincipal, disbursedOn, monthsElapsed, withinWindow: months<36, applicableRate: ppf+1 or ppf+6, projectedPenaltyIfUnpaidToday }`.
- Withdrawal-status DTO already carries `loanAllowed` + `requiresOutstandingLoanClearance` — wire clearance flag to the detector above instead of static `true`.

#### Frontend
- PpfDialog DEBIT type=LOAN: show quote panel (max eligible, rate, 36-month deadline) before submit.
- Ledger row for LOAN gains subtle countdown chip ("repay by Mar 2027 · rate 8.1%").

**Effort:** L · **Risk:** Med (enum addition is backward-compatible; old ledgers without repayments just read as fully outstanding)

---

### GAP 7: March-31 crediting assistant (P2)

- After GAP 4 ships: each new FY, header shows "Projected Mar 31 credit: ₹X — [Add entry]" prefills an INTEREST_CREDIT dialog (amount editable, never auto-inserted).
- Keeps manual-first invariant; kills the #1 data-entry tedium.

**Effort:** S · **Risk:** Low

---

### GAP 8: Post-maturity extension nudge (P3)

- When `completedFYs >= 15 && extensionMode unset/null`: `withdrawal-status` already returns `MATURED`; add `extensionModeMissing: true` → frontend banner linking to PpfSettingsDialog ("Account matured — set extension mode (Form H) to unlock correct limits").
- No auto-set: mode is a genuine user choice (Scheme 2019 default WITHOUT_CONTRIBUTION only applies at the operator).

**Effort:** S · **Risk:** Low

---

## 🚚 SUGGESTED SHIPPING ORDER

| Wave | Contents | Why |
|---|---|---|
| 1 | GAP 2 (cap surfacing) + GAP 8 (nudge) | Small, independent, immediate statutoriness |
| 2 | GAP 4 core engine (read-only) | Unblocks GAP 5 v2 + GAP 7 |
| 3 | GAP 6 loans (quote + repayment pairing) | Largest remaining formula gap |
| 4 | GAP 5 closure quote + GAP 3 dormancy + GAP 7 assistant | Polish layer |

**Verification protocol per wave** (mirrors FD plan discipline): unit tests with worked examples from the web sources above (IndiaPost loan example: apply FY2026-27 → Mar-31-2024 balance; Bajaj closure penalty example; ET Money excess-refund rule), `mvn test -Dtest='Ppf*'`, `next build`, then update PART2 ppf-card statuses with dated markers.

---
*Created: 2026-08-26 · Sources verified same day · Gap 1 closed in code (PpfWithdrawalValidationService.java) with tests green (5/5) prior to this file's creation.*
