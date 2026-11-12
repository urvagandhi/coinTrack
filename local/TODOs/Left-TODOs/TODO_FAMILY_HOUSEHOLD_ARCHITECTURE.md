# Family & Household Architecture — End-to-End Implementation Plan

**Source:** Deep audit of how CoinTrack models owner attribution across every asset module, vs Indian
fintech / regulatory standards (SEBI individual-account basis, Income-Tax per-assessee grouping, DPDP
consent, PF single-holder rules, minor/guardian rules)
**Target:** One place to manage each individual's **full portfolio** AND the **family aggregate** across
the member-scoped asset types (FD, MF, gold/silver, PPF, EPF, broker, notes) — with the **Calculator kept
common/global** (a shared tool, not an owned asset) — under a single login today, with a documented future
path where members silently get their own login.
**Approach:** Planning-only. Two tiers documented (Tier 1 ships now, Tier 2 is the future promotion path).
**Status:** **PLAN ONLY — NOT STARTED.** No code, schema, or migration has been written. Every gap below
is `NOT STARTED`.

---

## 🎯 Scope & The Two Axes (Read This First)

Industry research (Arthavi, Kuvera Family/Managed, INDmoney Family, Zerodha Console family view, Famli)
converges on one principle: **decouple two things that are often conflated** —

1. **ACCESS CONTROL** — *who can log in and operate*. CoinTrack keeps this **single-login** (exactly as
   the current codebase does). No member accounts exist at the schema level in Tier 1. This is the
   "manual-proxy" model (Kuvera *Family Account*, Arthavi profiles, INDmoney Family) — one owner keeps
   control, members may never log in.
2. **IDENTITY ATTRIBUTION** — *whose PAN owns each instrument*, for correct per-assessee tax/TDS
   grouping. This is the actual problem to solve. Today it is done piecemeal with a free-text
   `holderName` on only FD and MF (and buggily inconsistent — see Problem Statement).

> **Claude reconciliation (owner-approved).** We are solving an **attribution** problem, NOT a
> **consent/distributed-control** problem. So we do NOT import the Managed-Account architecture
> (per-member auth, OTP approval of every write, sub-account sessions) into Tier 1. Instead:
> - **Access** stays single-login; nobody approves writes with OTP.
> - **Attribution** becomes a first-class, redirectable owner reference (`ownerRef`) present on **every**
>   asset document, not just FD/MF.
> - **Consent** becomes a DPDP-style **self/guardian attestation** at the moment a member profile is
>   created (Tier 1), plus a documented **promotion** path to a real login in Tier 2.

**Member = first-class household entity, but NOT a login-account in Tier 1.** It is a reference object
(name, relation, PAN, DOB, guardian flag, auth identifier) under the single owner. In Tier 2, a member
can be *promoted* to a real login-capable account with the **same** data re-pointed to them — no
re-entry.

---

## 📋 GAP SUMMARY

All rows are **NOT STARTED** unless marked. Priority = business/regulatory urgency; Effort = relative.

> **Scope note:** the `holderName` normalization + FD/MF shared-grouping fix is **✅ IMPLEMENTED** and is
> folded into this document at **§5.3.1** (the former `TODO_HOLDERNAME_ATTRIBUTION_FIX.md` has been
> completed/deleted). This document is about **household structure, owner
> attribution (`ownerRef`), the family aggregate view, and consent/promotion** — not the string-normalization
> bug mechanics.

| # | Gap | Priority | Effort | Risk | Status |
|---|-----|----------|--------|------|--------|
| 1 | No `Member` / household entity anywhere in the data model | P0 | Large | High | 🔴 NOT STARTED |
| 2 | Owner attribution present only via free-text `holderName` on FD/MF; **absent** on gold/silver, PPF, EPF, broker, notes (all `userId`-only). The **Calculator is intentionally common/global** — out of scope | P0 | Large | High | 🔴 NOT STARTED |
| 3 | No family-aggregate view (dashboard, allocation, holdings, tax roll-up) | P1 | Large | Med | 🔴 NOT STARTED |
| 4 | Consent/attestation capture (DPDP-ready) absent | P1 | Medium | Med | 🔴 NOT STARTED |
| 5 | Member promotion to real login (Tier 2) — whole auth flow | P2 | Large | Med | 🔴 NOT STARTED |
| 6 | Per-member data lifecycle + audit trail + cleanup cascade | P1 | Medium | Med | 🔴 NOT STARTED |

---

## 🐛 PROBLEM STATEMENT — Why This Exists

CoinTrack cannot represent a **household** at all today. Every asset document is scoped by `userId` (the
single logged-in owner) plus, on FD/MF only, a **free-text** `holderName`. There is no `Member` entity,
no family boundary, no way to attribute an instrument to more than one distinct person under one login,
and no family-aggregate view. Consequences:

1. **No family tracking.** Gold/silver, PPF, EPF, broker, notes have **zero** owner/`holder`
   field — only `userId` (the **Calculator** is a shared tool and stays common). You cannot slice a
   portfolio by person, let alone roll a family aggregate up.
2. **Attribution is a fragile string.** Where `holderName` exists it is free text, inconsistently
   normalized across FD and MF, and used as a *grouping key*.
3. **No consent/provenance.** There is no record of who a member is, whether the owner is a guardian,
   what was attested, or when — i.e. no DPDP-ready trail and no path to a member later getting their own
   login.

> **The specific TDS/MF grouping bug** (a person's FDs/MFs splitting into wrong buckets because of name
> spelling/normalization inconsistencies) is the symptom that surfaced this. Its mechanics have been
> **fixed and shipped** — see **§5.3.1** (the former `TODO_HOLDERNAME_ATTRIBUTION_FIX.md` is
> completed/deleted). The architectural root cause — no
> first-class owner entity — is what this document solves.

> **Standing correction (verified by grep):** `goldsilver`, `ppf`, `epf` have **NO** `holderName` field.
> `GoldSilverInvestment` has only `userId` (`purchasedFrom` is the seller/place). PPF/EPF are *legally
> single-holder per person* (see References) — the fix for those is owner-attribution, not holder-name
> text.

---

## 🎯 CHOSEN APPROACH — DECIDED: Option D (Hybrid), shipped in stages

> **Decision locked (owner-confirmed).** We are NOT keeping an open menu of options. The approach is
> **Option D — a hybrid shipped in stages**, combining the two viable shapes:
>
> - **Tier 1 (ships now) = Option B — member registry + generic owner reference.** A `Member` collection
>   (household members under one owner) and a generic `ownerRef` on *every* asset document across all
>   modules:
>   - `ownerRef: { memberId }` where `memberId` defaults to synthetic `"SELF"` for existing rows →
>     **zero-migration backward compatibility** (all current data reads as the single owner's own).
>   - FD/MF `holderName` becomes a *display* field for the bank's record; the **grouping/attribution key
>     becomes `ownerRef.memberId`** — first-class, not a string.
>   - Dashboard `Portfolio`, `Brokers`, `Notes` become **scope-aware**: `SELF` (today's behavior) or a
>     chosen member (the **Calculator stays common/global** — not member-scoped). A new **Family**
>     aggregate view rolls up all members.
>   - Consent/attestation is captured at `Member` creation (DPDP-ready).
>   - Single-login retained.
>
> - **Tier 2 (future) = Option C — member becomes a full sub-account / real login via promotion.** A member
>   is promoted to a real, login-capable `User` (near-clone of the `User` model with their own
>   settings/credentials) by **re-pointing** their `ownerRef` from `memberId` → their new `userId`
>   (see Section 6). No re-entry of data, no duplicate account, no manual import. The original owner
>   optionally keeps a `familyLink` for the aggregate.
>
> - **Why not Option A (the minimal string fix alone)?** It closes the TDS/MF grouping bug but adds **no**
>   household capability. Its *mechanics* (name-normalization + shared grouping function) are **already
>   built and shipped — see §5.3.1** (former `TODO_HOLDERNAME_ATTRIBUTION_FIX.md`, now
>   completed/deleted) — but it is **not** an alternative to this document's goal.
>
> - ✅ Industry-conforming, fully backward compatible, incremental, no architectural pivot; closes all gaps.
> - ❌ Tier 2 (Option C) is genuinely complex (auth + 2FA + data handover) and is sequenced strictly **after**
>   Tier 1 ships.

---

# TIER 1 — SINGLE-LOGIN FAMILY & MEMBER TRACKING (Option B) — SECTIONS 1–5

## 1. Data Model

### 1.1 New `Member` entity (household member — NOT a login-account in Tier 1)
New package: `backend/src/main/java/com/urva/myfinance/coinTrack/member/`
`model/Member.java`, `@Document(collection = "members")`:

```
@Id                     String id
@Indexed                String userId            // which logged-in owner "owns" this member's tracking
@Indexed                String memberId          // stable public-facing id (e.g. usr-based ULID), used in ownerRef
@Indexed                String panOrHolderId     // PAN or stable holder id — the attribution anchor
                        String name
                        enums   Relation         // SELF, SPOUSE, PARENT, CHILD, SIBLING, OTHER
                        boolean isMinor
                        LocalDate dateOfBirth
                        boolean isSeniorCitizen   // derived eventually from DOB, drives TDS threshold
                        String   phone            // OPTIONAL (minors may lack one); shared within family OK; HEAD-EDITABLE
                        String   email            // REQUIRED at creation — login id + OTP/notify anchor (shareable within family); HEAD-EDITABLE
                        String   username         // REQUIRED at creation — manual-login id (unique across accounts); HEAD-EDITABLE
  @Builder.Default        Consent  consent        // see 1.4
  @Builder.Default        boolean  isArchived = false
  @CreatedDate/@LastModifiedDate   createdAt, updatedAt
```

- `userId` = the owner who entered data; `memberId` = the attribution anchor used in `ownerRef`.
- `Member.createdAt` seeds `consent.givenAt` (see 1.4).

### 1.2 `OwnerRef` embedded owner reference — the core abstraction
New embed `model/OwnerRef.java` reused by **every** asset model:

```
String memberId        // attribution anchor. "SELF" = the logged-in owner themselves.
// Tier 2 adds:
String userId          // after promotion: the member's own login userId (re-pointed here)
boolean promoted
```

**Every asset document gains `private OwnerRef ownerRef;`** — defaulting to
`OwnerRef.builder().memberId("SELF").build()` via `@Builder.Default`. This is the **backward-compat
keystone**: all existing rows without `ownerRef` read as `SELF`, i.e. exactly today's behavior.

Modules/files to add `ownerRef` to (each has a `@Indexed userId` today; add `ownerRef` alongside):

| Module | Model file(s) to modify |
|--------|--------------------------|
| fixeddeposit | `model/FixedDeposit.java` (keep `holderName` as display; grouping uses `ownerRef.memberId`) |
| mutualfund | `model/MfScheme.java`, `ValuationSnapshot`, `SipMandate` (add ownerRef; the raw-holder string-bucket bug is already fixed — see §5.3.1) |
| goldsilver | `model/GoldSilverInvestment.java` (currently `userId` only — add ownerRef) |
| ppf | `model/PpfTransaction.java` (single-holder per person; add ownerRef) |
| epf | `model/EpfTransaction.java` (add ownerRef) |
| broker | `broker/model/BrokerAccount.java` (+ links) — add `ownerRef.memberId`. The ENTIRE connection — credentials, tokens, sync'd holdings — belongs to that member; default `SELF`. Only module storing live credentials → member-scoped sessions + view-only family rollup + encrypted storage (see §5.7) |
| notes | `notes/model/Note.java` (add ownerRef; `NotesUserDataCleanupListener` is the cleanup precedent to parallel for members) |

> **Calculator is intentionally common / global — NOT member-scoped.** It is a shared tool, not an owned
> asset, so it is removed from the member-scoping table above and from the "one context = one member"
> rule (§3). Its config/sessions stay keyed by `userId` only.

> **Keeping `holderName` (FD/MF):** it is the *bank's record of the holder's name* and stays for
> display/export. But **grouping is `ownerRef.memberId`**, never the free-text string — so one person's
> FDs/MFs group correctly regardless of name spelling (the `holderName` normalization mechanics are
> already **built** — see §5.3.1).

### 1.3 Per-member settings (mirrors the existing embedded-settings pattern)
Precedent already exists: `User` embeds `epfSettings`, `ppfSettings`, `metalRateSettings`
(`user/model/EpfSettingsEmbed.java`, `PpfSettingsEmbed.java`). Mirror this for members:
- `member/model/MemberSettingsEmbed.java` → optional embedded `epfSettings`, `ppfSettings`,
  `metalRateSettings`, and a `seniorCitizen`/`dob` override so a member's TDS/80TTB is computed from
  *their* profile, not the head's.
- Add `private MemberSettingsEmbed settings;` to `Member`.

### 1.4 Consent / attestation record (`Consent` embed on `Member`)
`member/model/Consent.java`:

```
ConsentState  state          // PENDING (attestation not yet provided) | ATTESTED | (Tier2: ACCEPTED | REVOKED)
ConsentType   type           // SELF      (adult member, or member is legal-owner tracking own side)
                             // GUARDIAN  (head attests they are natural/legal guardian of a minor/unsound)
Boolean       dpdpAgreement  // affirmative checkbox to DPDP notice (free/specific/informed/unconditional — §6)
String        noticeVersion  // which DPDP consent-notice version was shown
LocalDateTime givenAt         // = Member.createdAt for Tier 1
LocalDateTime updatedAt
String        ipAddress       // juris/audit
String        userAgent       // audit
```

**Why is this the right consent model (Tier 1)?** DPDP §6 requires free/specific/informed/unconditional
consent with affirmative action. For a manual-proxy tracker, the person who *enters and holds* the data
is the owner; for a **minor** member the owner is the **guardian who entered it by construction** (this
is the industry's accepted reading — the guardian is the one transacting; see References on PPF/AMFI
guardian rules + DPDP verifiable parental consent). So Tier 1 captures an **attestation** at
member-create. Tier 2 (Section 6) upgrades this to a real **two-party acceptance** by the member.

## 2. Full Flow — Creating a Member (Frontend → Backend → DB)

### 2.1 Frontend: "Add member" flow
- New route section under Profile (matches existing `FOLIO·§06` editorial style): `Family & Consent
  (Folio · §07)`.
- New component: `frontend/src/components/member/MemberDialog.jsx` (mirror `FdDialog` / `LegalModals`)
  with a **ConsentScreen** step.
- New API object: `familyAPI` in `frontend/src/lib/api.js` (mirror `userAPI`), plus `memberAPI` if split.

**ConsentScreen (attestation) — the whole UI flow, step by step:**
1. **Profile step (DECIDED capture set — required vs optional)** — takes:
   - **Always required:** `name`, `relation` (SELF/SPOUSE/PARENT/CHILD/...), `dateOfBirth` (auto-fills
     `isMinor`/`isSeniorCitizen`), `panOrHolderId` (masked; see 1.6 security), **`username`** and
     **`emailAddress`** (both are login identifiers from day one — username = manual-login id, email =
     OTP + first-login head-notification anchor; see §6.2).
   - **Optional:** `phone` — *only* legitimately-optional field (a minor typically has no phone yet). Any
     phone entered is captured for later contact/Tier-2 login.
   - **Uniqueness / contact rule (DECIDED — mirrors SEBI family-mobile rule):**
     - **Within a household (family):** the same email and/or mobile may be shared across members — e.g.
       head + spouse + minor child may share one phone/email (SEBI explicitly permits one mobile/email for
       a **family = self, spouse, dependent children, dependent parents**; [SEBI 2024-12-03
       circular via Economictimes](https://economictimes.indiatimes.com/wealth/invest/stock-market-investors-can-family-members-operate-their-demat-accounts-using-a-single-mobile-number-heres-what-sebi-says/articleshow/116007440.cms)).
     - **Outside a household (across different users/accounts):** each `username`, `email`, and `phone`
       must be **unique** — no two CoinTrack accounts share an identifier (the owner's rule: "if not in
       family, then mobile number / email-id should be different"). This keeps the manual-login identity
       unambiguous and prevents cross-account collisions.
     - **Enforcement:** uniqueness validated at member create (across the user's own account) AND at
       promotion / self-login (across *all* users, because it becomes a real account there — see §6.2).
   - Because `username`/`email` are now required at creation, the only field a member may still lack for
      their own login is **`phone`** — so "gather missing info" at promotion (§6.2, both paths) reduces to
      **phone only** (and only when it was left blank because the member was a minor at creation).
   - **Head editability (DECIDED): email, phone, AND username are head-editable.** After creation the
     **head can edit a member's `email`, `phone`, and `username`** in the member profile — the head is the
     sole operator and all three are contact/login data (mirroring the existing single-user profile page,
     which already lets a user edit username/email/phone with global-uniqueness checks). Edits re-validate
     the uniqueness rules (§2.1): `username` unique across all accounts; `email`/`phone` unique across
     accounts but shareable within the same family. A member editing their **own** username/email/phone
     after promotion uses the same rules.
2. **Consent step** — if `isMinor`, show **Guardian attestation**: "I am the parent/legal guardian of
   `<name>` and legally authorized to enter and manage financial records on their behalf. I consent to
   CoinTrack processing this data for tracking/tax purposes." Must tick `dpdpAgreement`; **cannot
   submit unless ticked** (affirmative action). Links to the DPDP notice (versioned).
   - If adult member: **Self-attestation**: "I confirm I am authorized to track this person's
     instruments and consent to such processing."
3. **Affirmative submit** → `familyAPI.createMember(payload)`.

### 2.2 Backend: endpoint + service + persistence
- `member/controller/MemberController.java`, `@RequestMapping("/api/family/members")` (mirrors
  `UserController` `/api/users` REST + `ApiResponse` wrapper).
- `MemberController` reads `UserPrincipal.getUserId()` from the JWT (same pattern as
  `UserController.updateCurrentUser`).
- `member/service/MemberService.java`:
  - validate relation/DOB enum; derive `isMinor`/`isSeniorCitizen` from DOB;
  - **initialize `Consent`** with `state=ATTESTED`, `type` per minor/adult, `givenAt=now`,
    `noticeVersion`, capture `ipAddress` via `RequestUtils.extractIpAddress` and `User-Agent`
    (patterns already used in `SecurityConfig`/`UserController`);
  - validate PAN format (`\d{4}[A-Z]{5}\d[A-Z0-9]`) and **reject PAN already bound to another member of
    the same household** (see edge cases 5.1);
  - write one `Member` doc (`memberRepository.save`).
- `member/repository/MemberRepository.java` with queries:
  - `findAllByUserIdOrderByCreatedAtAsc(String userId)`
  - `existsByUserIdAndPanOrHolderIdAndArchivedFalse(String userId, String pan)`
  - `findByUserIdAndMemberId(String userId, String memberId)`
- Response DTO `MemberResponseDTO` (never returns the raw PAN unless the request is the owner's own;
  mask otherwise — see 1.6).

### 2.3 DB write (normalized)
```
members.updateOne(
  { userId: <ownerId> },
  { $set: { memberId, name, relation, panOrHolderId, isMinor, dateOfBirth,
            consent: { state:'ATTESTED', type, dpdpAgreement:true, noticeVersion, givenAt, ipAddress, userAgent },
            createdAt, updatedAt } } )
```
**Synchronous commit; failure surfaces as `ApiResponse.error` and the UI toast shows no member created.**

## 3. Full Flow — Scoping Assets to a Member (ownerRef on create/edit)

> **One context = one member.** Switching the scope selector to a member makes the ENTIRE workspace that
> member's — FDs, MFs, gold, PPF, EPF, broker connections (credentials + tokens + sync'd holdings), and
> notes — **every feature except the Calculator, which stays common/global**. Every member-scoped module
> reads/writes under `ownerRef.memberId`; nothing from another member leaks into view; the head's `SELF`
> view stays exactly as today.

> **This is a wide, cross-cutting refactor — frontend AND backend.** Because the **head of the family can
> edit every member, everything, across all modules**, every member-scoped module must become scope-aware:
> - **Backend:** `model` → `repository` → `service` → `controller` for `Note`/`NoteService`,
>   `FixedDepositServiceImpl`, `MfSchemeAggregationService`/`ValuationSnapshotService`/`SipMandateService`,
>   `GoldSilverInvestments`, `PpfTransaction`/`EpfTransaction`, and `BrokerConnectServiceImpl` +
>   broker adapters. Each gains `ownerRef.memberId` on write and scope-aware queries on read.
> - **Frontend:** each module's page + create/edit dialog + `api.js` object gain a scope selector
>   (default `SELF`); the `Family` tab renders per-member per-module breakdowns. Scope selector default =
>   `SELF`; switching re-scopes that module's list/create/edit.

Every asset create/edit dialog gains a **"For which member?"** selector (defaults to **Self**):
- `MultiScope` value = `SELF` (today's behavior) or a specific `memberId`.
- Backend service injects `ownerRef` at persistence time from the authenticated user id + chosen
  memberId (never trusts a client-supplied arbitrary memberId without checking the member belongs to
  that user — authorization guard, see 5.2).

Example — FD: `FixedDepositServiceImpl.createFixedDeposit` currently reads `userId` from principal;
it now also resolves `request.memberId → ownerRef.memberId` and stores it. The attribution grouping key
becomes `ownerRef.memberId` (the same stable-key change applies to MF, gold, PPF, EPF, broker — see 5.3).

**Scope-aware read:** all list/detail/summary queries accept an optional `scope=memberId` (or
`scope=family`) so the UI can render "My FDs" vs "Mom's FDs" vs "Family".

## 4. Family Aggregate View

> **Family tab shows BOTH a family total AND per-member, per-module detail.** The head sees everything:
> 1. **Family total** — grand sum across all members ∪ head, for every module.
> 2. **Per-member, per-module breakdown** — each member's FDs, MFs, gold, PPF, EPF, brokers, notes shown
>    individually (not just their aggregate).
> 3. **Per-PAN tax roll-up** — summed TDS by person, 80TTB, MF LTCG.
> The family broker total **sums broker holdings across ALL members** and the rollup is **read-only**
> (invariant, §5.7). In Tier 2 a promoted member can *view* the whole family here **only if the head has
> granted them family-visibility** (§6.8); otherwise they see a **member directory only — NO financial
> data** of other members.

### 4.1 UI
- New top-level route `/family` (add to `Sidebar` nav; matches numeric-index pattern) or a **scope
  dropdown** in the header that switches the whole app between `SELF`, each member, and `FAMILY`
  (the Arthavi/Kuvera-INDmoney pattern — this is the "single place" the owner asked for).
- Family dashboard shows: combined net worth, allocation, holdings with owner avatar/badge, a
  **per-member, per-module breakdown** panel, and a **family-per-PAN tax roll-up** (summed TDS by person,
  80TTB, MF LTCG).

### 4.2 Backend aggregate service
- `member/service/FamilyAggregationService.java` orchestrates across modules by querying each module
  with `scope ∈ members∪{SELF}` and combining — it must **not** duplicate per-module math.
- Backend endpoints under `/api/family/...`:
  - `GET /api/family/summary` — aggregate net worth + counts (grand total across members ∪ head)
  - `GET /api/family/members` — list (with masked PAN + consent state)
  - `GET /api/family/{memberId}/{module}` — per-member, per-module breakdown (FD, MF, gold, PPF, EPF,
    broker, notes)
  - `GET /api/family/broker-accounts` — all members' broker connections (read-only)
  - `GET /api/family/allocation` — merged allocation
  - `GET /api/family/tax?fy=...` — per-PAN tax roll-up
- Frontend `familyAPI` mirrors `portfolioAPI.getSummary`.

## 5. Edge Cases & Guards (Tier 1) — Deep

### 5.1 Member creation
- **Duplicate PAN in household** → `409`; PAN already belongs to another member. (PAN is the tax anchor;
  two members with the same PAN would double-count attribution.) Block, do not merge silently.
- **Minor without guardian type** → `400`: minors require `Consent.type=GUARDIAN`.
- **Adult without self-attestation** → `400`: `dpdpAgreement` must be true for `ATTESTED`.
- **DOB edge**: 18th birthday boundary → `isMinor` computed as `LocalDate.now().compareTo(dob.plusYears(18)) < 0` so age flips correctly; senior citizen at 60 (drives TDS threshold).
- **PAN + no DOB** → continue but flag for 80TTB/senior threshold to default regular until DOB set.
- **Existing data (no ownerRef)** → must read as `SELF`; NEVER auto-assign a member or mutate historical
  rows during reads (any lazy add of `ownerRef={memberId:"SELF"}` is optional and behavior-neutral).

### 5.2 Authorization (critical — never trust client scope)
Every asset write/read that accepts a `memberId` must **verify the member belongs to the authenticated
user** (`memberRepository.findByUserIdAndMemberId(ownerId, memberId)` must return the member). Otherwise
any logged-in user could read/write another user's household members by guessing a memberId. All reads
are additionally filtered by `ownerRef.memberId ∈ {SELF} ∪ myMembers`.

- **Surface the member NAME, not just the id.** Everywhere a scope/member context is active (scope
  selector, asset dialog, list/detail headers, family breakdown), display the member's **name** (and
  relation/badge) alongside the authorized `memberId`/`SELF`. This makes it **visually unambiguous whose
  data is being read/written** — the head always sees e.g. "Mom's FDs", "Self", "Son's PPF" rather than an
  opaque id, reducing accidental writes to the wrong member. The name is resolved server-side from the
  verified member record (never trusted from the client) and returned in the response DTOs.

### 5.3 Attribution consistency (architecture level)
- One logical person whose name is spelled differently → still grouped correctly because the grouping key
  is `memberId`, **not** the string. This is the structural guarantee that makes name-spelling irrelevant.
- **All modules and their consumers (FD service + exporter, MF aggregation/summary/valuation/mandate,
  gold/PPF/EPF/broker/notes)** must share **one** grouping abstraction
  (`OwnerGrouping.groupKey(OwnerRef, placeOrPlatform)`) keyed on `ownerRef.memberId`.

#### 5.3.1 Owner-grouping abstraction — part DONE (FD/MF), whole-project expansion REQUIRED
*(Formerly tracked in `TODO_HOLDERNAME_ATTRIBUTION_FIX.md`, which has been **deleted/completed** and is
folded here.)*

**Scope split — this is the important part.** The shared grouping abstraction must apply at the **whole
project level**, i.e. to **every** module that carries an owner + grouping signal (FD, MF, gold, PPF, EPF,
broker, notes). It must **not** be siloed to the two modules it was first built for.

**✅ DONE — FD/MF** (the original near-term fix, already shipped):
- `common/util/HolderName.java` — canonical `normalize` (trim + whitespace-collapse + title-case each
  token, hyphen/apostrophe tokens treated as single tokens). Used on-save and on-read.
- `common/util/OwnerGrouping.java` — `groupKey(placeOrPlatform, holderName)` = `place + "|" +
  HolderName.normalize(holder)`; blank inputs fall back to `"Unknown"`.
- Consumers routed through it (no inline key concat): `FixedDepositServiceImpl` (TDS summary +
  `normalizeHolderName` now delegates), `FixedDepositExcelExporter` (export == screen),
  `MfSchemeService` (normalize on save + filter by normalized param), `MfSchemeAggregationService`
  (**fixed the raw-bucket same-class bug**), `MfSummaryController` (replaced `equalsIgnoreCase`),
  `ValuationSnapshotService` (filter + on-save), `SipMandateService` (canonical downstream),
  `PortfolioDashboardService` (totalFolios key).
- `migration/HolderNameBackfillMigration.java` (idempotent) backfills `holderName` in `mf_schemes`,
  `fixed_deposits`, `mf_valuation_snapshots`, `mf_sip_mandates`.
- Tests: `HolderNameTest`, `OwnerGroupingTest`; suite green (974 run, 0 failures); `mvn compile` +
  `npm run build` pass. Frontend `FdDialog.jsx` / `NewSchemeModal.jsx` need no change (readOnly name).

**🚧 OPEN — whole-project expansion (REQUIRED by this family plan):** the FD/MF work is only the *first
two modules*. The family architecture requires the **same** shared grouping to be adopted across all
remaining owner-scoped modules. Concretely, each of these must route its grouping/filter keys through the
shared `OwnerGrouping` (with the appropriate `groupKey` signature — string key today, `ownerRef.memberId`
once `OwnerRef` lands) instead of inline concat:
- **gold** (`GoldSilverInvestment`)
- **PPF** (`PpfInvestment`)
- **EPF**
- **broker** (`BrokerAccount` / sync'd holdings — member-scoped, §5.7)
- **notes** (`Note` — keyed by `userId`, member-scoped)

The string-normalization util applies only where a free-text holder name exists (FD/MF today); the other
modules key directly on `ownerRef.memberId` but must still go through `OwnerGrouping.groupKey(OwnerRef,
placeOrPlatform)` so the *shape* is uniform project-wide and the family aggregate can sum across every
module with one abstraction (no per-module drift).

> **TDS grouping rule (context):** Section 194A applies the exemption threshold to the **total interest ONE
> holder earns from ONE bank**, not per-FD. The normalization fix makes the *holder key* stable so grouping
> is correct; the `FdMath` TDS math itself is already implemented correctly in the FD module (see
> `FD_INDUSTRY_STANDARDS_IMPLEMENTATION_PLAN.md`).

> **Forward-compat:** once `Member`/`ownerRef` is added, consumers swap the string key
> (`groupKey(placeOrPlatform, holderName)`) for the id key (`groupKey(OwnerRef.memberId, placeOrPlatform)`)
> — the shared helper already centralizes that, so no re-architecture is needed. The FD/MF work was built
> to be exactly this swap-ready.

### 5.4 Role/permission model within the household
- `SELF` owner (head) retains **full CRUD on every member, everything, across all modules** — they are the
  sole operator (single-login) and authorized as the household owner. Cross-**user** access (another
  household's members) is still blocked by the authorization guard in 5.2.
- No co-editor in Tier 1 (single-login; conflicts impossible without two editors). A *promoted* member can
  **edit only their own** data; other members remain read-only to them unless the head designates otherwise
  (see §6.8).

### 5.5 Member deletion / archiving + audit
> **Scope/link (keep in sync with Tier 2):** this §5.5 covers a **Tier 1 (unpromoted) `Member` row**.
> A **promoted** member (now a real `User`) leaving the household is governed by **§6.7** (hand-back /
> erase / account deletion), and the promotion/deletion audit trail lives in **§6.6**. The bulk-delete
> mechanics below (listeners, archive flag, consent-gated hard delete) are shared by both paths — §6.7
> reuses them.

- **Soft delete (`isArchived=true`)** first — never hard-delete a member with data.
- **Re-confirmation** required (password re-auth, mirroring `UserController.deleteCurrentUser`'s
  re-auth + audit, plus the guardian attestation text) before archive.
- On archive: `ownerRef.memberId` values remain on the docs (data history is preserved), but the member
  disappears from active scope selectors and the family view; a banner shows archived members with data.
- **Cascade cleanup** on hard delete (member never created any asset, or the head explicitly purges):
  reuse/parallel the `UserDeletedEvent` + listener pattern (`SecurityUserDataCleanupListener`) to
  delete the member's asset docs + member row. A new `MemberDataCleanupListener` handles this. (The
  promoted-member equivalent is §6.7's hand-back/erasure + `familyLink` removal.)
- **Hard delete is HEAD-ONLY and consent-gated.** Only the **head** may hard-delete a member, and only
  after explicit **confirmation = consent** (re-auth + a confirmation prompt explicitly stating the
  member's asset docs and the member record will be permanently erased — matching §6.7's "erase my data"
  segmentation: statutory-retain records are kept under Legal Obligation Override, rest purged via
  30-day soft-delete). A member can **never** hard-delete another member or themselves; non-head members
  only ever get hand-back-to-head (see §6.7) or self-archive (not hard deletion).
- Every archive/deletion is written to `MemberAuditLog` (§6.6) so DPDP erasure/correction rights remain
  exercisable later (§5.6).

### 5.6 Security of PAN / PII (DPDP §11–14 rights)
- MASk PAN at rest/on read for non-owner roles and in all list APIs (`PAN as for masking`).
- Store PAN encrypted or hashed (`HashUtil.sha256` precedent); only the owning account can decrypt.
- Honor DPDP data-principal rights: member can later (Tier 2) request correction/erasure; Tier 1 keeps
  an audit trail (consent + changes) so these rights are exercisable later.
- Consent notice versioning + language option (English / Eighth-Schedule language) per DPDP §6(3).

### 5.7 Broker connections — member-scoped + credentials (invariants)
The broker module is the **only** one storing live credentials (tokens, Zerodha/Upstox/AngelOne keys),
so it carries two hard invariants:
- **Member-scoped session invariant.** *Every* adapter call and any background sync/token-refresh must
  resolve by `ownerRef.memberId + brokerUserId` — never by `userId` alone. A scheduled holdings refresh for
  member A must never read/refresh member B's or the head's account. Filing: `BrokerConnectServiceImpl`,
  `ZerodhaBridgeController`, and `broker/adapters/*` all gain the member scope.
- **View-only family rollup invariant.** The family aggregate *reads* all members' broker holdings (summed)
  but never mutates or executes on anyone's connection (SEBI view-only family model; TraderTape pattern).
- **Credential storage.** Existing `encrypted*` fields on `BrokerAccount` are kept; credentials are
  encrypted at rest, masked in any API response, never logged, and fetched only under the correct `ownerRef`.
- **Migration / defaults:**
  - The head's pre-existing broker connection → defaults to `memberId = "SELF"` (zero migration; unchanged).
  - Two members on the **same broker** (e.g. head + spouse both on Zerodha) → **two separate**
    `BrokerAccount` rows under different `memberId`s, each with its own credentials — never one shared
    connection. This mirrors the industry rule that each PAN can have its own account and credentials are
    never shared (Zerodha/SEBI).

---

# TIER 2 — MEMBER PROMOTION TO A REAL SUB-ACCOUNT / LOGIN (Option C — future) — SECTION 6

**Goal (owner's words):** "If a member later logs in under their own email/phone/username — they have no
password yet — we must set one (forgot-password style), OR via OAuth gather the missing info + 2FA +
login. After login they see everything the head entered for them, and their edits sync back to the head."

**Principle: PROMOTE-IN-PLACE, re-point ownership — never re-enter, never duplicate.**

## 6.1 What changes structurally
- `Member.promoted` → true; `OwnerRef.userId` set to the member's new login `userId`;
  `OwnerRef.memberId` is retained (keeps a stable attribution anchor and the family link).
- The member becomes a real `User` (reuses the full existing auth stack) but is **born already populated**:
  their instruments are simply re-pointed. No import, no CSV, no duplication.
- Optional `familyLink` on the new User keeps the head's family aggregate reading the member's data
  (Zerodha-family-model: view-only consolidated, per-PAN attribution preserved).

## 6.2 Two login paths (mirroring existing `AuthController` flows)

### Path 1 — Manual (password) login — "no password yet → set one"
0. **Minor gate (DECIDED):** if `member.isMinor` and the guardian handover flag is NOT set → **block**
   promotion/login (regulators: guardian operates until majority; mirror PPF/AMFI minor→major conversion).
1. Member goes to `/login`, enters **username or email or phone** (the id captured at member creation).
2. `UserAuthenticationService.findUserByUsernameEmailOrMobile(...)` — if a `Member` (not yet a `User`)
   matches with **no password**, return a **distinct "member-needs-credential"** response
   (`profileComplete=false`, `needsCredentialSetup=true`, plus a signed temp token — mirroring how the
   Google `PendingRegistration` temp-token flow works).
3. **Proof-of-identity (DECIDED: EMAIL-ONLY OTP)** — OTP sent to the member's email via the existing
   `EmailTokenService`; **no SMS provider** (decision: email-only to avoid SMS subscription costs).
   This is the strongest gate; without it anyone could claim the member's data.
4. **Gather missing info (SAME as Path 2 — applies to manual login too, DECIDED)** — because `username`
   and `email` are now **required at creation** (§2.1), the only login field a member may still lack is
   **`phone`** (left blank because the member was a minor at creation). Request it via a
   `completeGoogleProfile`-style endpoint. **Uniqueness is enforced across ALL users here** (at promotion
   the identifier becomes a real account): `username`, `email`, and `phone` must not collide with any
   other user's — except that a **phone/email shared within the SAME household/family is allowed**
   (SEBI-family rule; the member was already part of the household). The head is never asked for anything
   already captured (DOB/PAN/name/relation/username/email).
5. **Set password** (the "best forgot-password flow" the owner asked for) — reuse `ForgotPasswordController`
   style: validate strength, confirm password, hash via the same encoder, save on the new `User`.
6. **2FA setup** — reuse `TotpService`/`completeRegistrationWithTotp` flow to bind TOTP before the
   account becomes fully active.
7. Login completes via the standard `generateFinalLoginResponse(...)` path (JWT + refresh token).
8. **Notify the head (DECIDED):** on this **first successful login**, dispatch an email to the head —
   "<Member> has logged in for the first time; all the details have been transferred." This is a
   **notification, not an approval** (no delayed head-approval gate — decided).

Variations of Path 1:
- **Expired/invalid OTP** → resend + retry counter, TTL enforced (mirror pending-registration TTL).
- **Member email/phone already collides with an existing unrelated real user** (a user OUTSIDE this
  household) → do NOT auto-link; show conflict, require resolution. Same-family sharing of phone/email is
  allowed (§2.1), so an *in-family* match is fine; an *out-of-family* collision is not.
- **Concurrent set-password race** → unique constraint on the promoted identifier; one wins.

### Path 2 — OAuth (Google) login — "gather missing info + 2FA"
1. Member clicks **Continue with Google**.
2. `POST /api/auth/oauth2/google` — `GoogleOAuthService.exchangeCodeForIdToken` + `verifyIdToken`
   (existing code).
3. **Match the incoming Google email to a Member record.** If a `Member` (not a User) has this email →
   **auto-create/upgrade the User from the Member**, copying profile fields; do NOT start a fresh
   `PendingRegistration` (which would orphan the already-tracked data).
4. If Google email does NOT match a member, fall back to the existing self-signup path.
5. **Gather missing info** — the only login field possibly absent is **`phone`** (username/email are
   required at creation per §2.1; DOB/PAN/name/relation never re-requested) via
   `completeGoogleProfile`-style endpoint. Uniqueness (`username`, `email`, `phone`) is enforced across
   **all users**, with the **within-family sharing allowance** for phone/email (SEBI-family rule) — same as
   Path 1 step 4.
6. **2FA** — `TOTP_REGISTRATION` + `completeRegistrationWithTotp` (existing).
7. Login completes via standard response.

Variations of Path 2:
- **Google email unverified** → reject linking (existing rule in `authenticateGoogle`).
- **Email matches a member AND a real user already** → priority: existing real User wins (no collision);
  if the existing user is the head, block (a member cannot be their own head), surface conflict.
- **Cancel/abandon OAuth mid-flow** → temp tokens expire (existing TTL), nothing persisted.

### 6.3 Post-login experience for the promoted member
- **"Whose view?": member picker at login (DECIDED).** On successful login, if the authenticated account
  **has household members** (`memberId ≠ SELF` exist under the user), the app **prompts the user to pick
  which member's workspace to enter** — "View as: Self / Mom / Son / Spouse / Family (aggregate)". Default
  selection is **Self** (today's behavior). The user can also pick **Family** to land directly on the
  family-tab aggregate (available only if they may see it — head always; promoted member only with
  `familyVisibility=true`).
  - The picker is **authorization-enforced**: only members belonging to this user (`MemberRepository
    .findByUserIdAndMemberId`) and, for a promoted member, only their **own** member + any family visibility
    they hold are offered — never another user's members (see §5.2).
  - Choosing a member sets the workspace scope (§3) to that `memberId` for the whole session (scope
    selector still available in-app to switch); the member's **name** (not id) is shown, resolved
    server-side from the verified member record (§5.2).
  - A promoted member with **no** family visibility and no other members is not re-prompted (single-member
    account → straight to their own workspace).
- **Member sees everything the head entered for them** — re-pointed `ownerRef.userId` means the standard
  per-`userId` queries (`getAllSchemes`, `getTdsSummary`, portfolio summary, etc.) now return their data
  with **zero extra query logic** (this is the elegance of re-pointing: existing userId-scoped code
  "just works").
- **Edits sync back to the head** — because the family view reads by `memberId` link, the head sees
  live changes. This is real two-way sync *without* replication: one shared underlying record per
  instrument.
- **Family-tab visibility (head-granted, per-member).** A promoted member can *view the whole family* in
  the family tab **only if the head has enabled the `familyVisibility` option for them**; otherwise they see
  **a member directory only (names, relations, head) with NO financial data** of other members. The head
  grants/revokes this per member (see §6.8).
- **Revoking visibility ≠ removing from aggregate (DECIDED).** When the head revokes a member's
  `familyVisibility`, the member *stays in the household* and their **own data STILL feeds the family
  aggregate** (totals/tax roll-up the head sees). Visibility controls only **who can view**, not **whose
  data is included** — the two are decoupled. The member only leaves the family totals when they actually
  **leave the household** (§6.7 head-drops-familyLink).
- **Broker connection follows the member on promotion.** On promote, the member's broker `ownerRef`
  re-points (`memberId` retained, `userId` added) so their broker connection — credentials + sync'd
  holdings — follows them; **no re-connect, no re-entry**.
- **First-login notification to the head (DECIDED).** On the member's **first successful login after
  promotion** (both Path 1 and Path 2), the system emails the head: "<Member> has logged in for the first
  time; all the details have been transferred." This is a **notification only** — there is **no delayed
  head-approval gate** (decision: member self-service with OTP is sufficient proof of identity).
- **Guardianship continuity for minors that promote** — when a member who is a minor turns 18 (or
  earlier via guardian handover), promote + require the now-major to KYC/confirm (mirroring AMFI/PPF
  minor→major conversion). Until then a minor member does NOT self-login (promotion is **blocked while
  `isMinor`** unless the guardian explicitly sets the handover flag); the guardian keeps operating
  (matches PPF/AMFI guardian rules) — decision locked, see §6.11.

### 6.4 End-to-end events (Path 1, happy path) — component-by-component
| Layer | Action |
|-------|--------|
| Frontend `Login` page | identifier entry → detect `needsCredentialSetup` → OTP screen |
| Frontend post-login | if account has members → **member picker** ("View as: Self/Mom/Son/…/Family", default Self) → sets session scope (§6.3) |
| `authAPI` / `familyAPI` | `GET /api/family/members` (authorized subset) → drives the login picker |
| `authAPI` | `POST /api/family/promote/login` returns pending-token + flags |
| `ForgetPassword`-style flow | `POST /api/family/promote/verify-otp` → `POST /api/family/promote/set-password` |
| `Totp` flow | `POST /api/family/promote/enable-2fa` (reuse `TotpService`) |
| `MemberPromotionService` | transactional: create `User` (copy fields, hash password, TOTP), set `Member.promoted=true`, **bulk re-point** `ownerRef.userId = newUserId WHERE memberId = X` across all module repos |
| `SecurityConfig` | whitelist the public promote endpoints (mirror how `/api/auth/**` is whitelisted) |
| DB | `users` insert; `members` update; `N×assets` re-pointed in one transaction |

### 6.5 Transactionality & failure of re-pointing
- Promote is **one transaction** (or a Saga with compensation): if any asset re-point fails, roll back
  the whole promote (no half-promoted state: data must not be split across two identities).
- Idempotency key on the promote request so retries don't double-create a User or double-repoint.
- After success, dispatch a `MemberPromotedEvent` → the head's family link is refreshed and an
  in-app/email notification is sent to the head ("<Name> now has their own login").

### 6.6 Audit trail for promotion
> **Link:** this `MemberAuditLog` is the single audit record shared with §5.5 (member archive/deletion) and
> §6.7 (promoted-member leaving/erasure) — every create/promote/archive/hand-back/erase is appended here.

- No register of credential setters; log: who created the member (head, consent), who promoted, when,
  from which device/IP, and every asset re-point count — into a `MemberAuditLog` collection
  (append-only; DPDP + trust).

### 6.7 Revocation / leaving the household & member account deletion (edge)
> **Scope/link (keep in sync with Tier 1):** §6.7 governs a **promoted** member who is now a real `User`.
> Deleting/archiving an **unpromoted `Member` row** (Tier 1) is §5.5; the shared archive/cascade/hard-delete
> mechanics and the HEAD-only + consent-gated rule are defined there and reused here. Audit for both lives
> in §6.6. Read this section together with §5.5.

**Revocation / removal from family view (de-link, member keeps their own account):**
- If a promoted member later wants to be **removed from the family view** → the head drops the
  `familyLink` (member still keeps their own account + data). The member can **revoke** their consent
  (§6 DPDP — ease of withdrawal ≈ ease of grant; see References).

**Member account deletion — DECIDED: "hand data back to the head" by default.**
Deleting a promoted member's *account* is the **reverse of promotion** and is NOT a silent data wipe.
Industry pattern (Arthavi "Safe Profile Deletion & DB Cleanup" blocks while active assets exist; Forbidden
Finance: a leaving member's *own accounts and data remain unaffected*):
- **Block hard-delete while the member still owns active data.** If the member has any non-zero
  instruments (FD/MF/gold/PPF/EPF/broker/notes), the delete flow **refuses** and shows a checklist of
  blocking dependencies (mirrors Arthavi's DependencyGuard), with quick links to resolve each.
- **Default exit = hand data back to the head.** The member chooses "leave household / hand data back to
  the head": reverse re-point `ownerRef` from the member back to the head (`SELF`), the member's account
  closes, and the head **keeps the financial records + PAN-attributed tax history** (they were the
  original tracker). The family aggregate updates with **no double-count and no orphans**.
- **Optional explicit "erase my data"** = a separate, informed, separately-confirmed action (re-auth +
  DPDP notice): runs **segmented erasure** —
  - **Consent-based / operational data** (profile, consent beyond legal retention, auxiliary metadata)
    → erased (industry-standard **30-day soft-delete**, then hard-delete; backups age out ~30–60 days).
  - **Statutory-retain data** (PAN/identity, transaction/financial records) → retained only where law
    requires, under the **Legal Obligation Override** (Income-Tax books 6–8 yr, PMLA 5 yr post-relationship,
    SEBI records, IT/CERT-In logs 180 days, consent-manager records 7 yr), isolated to a restricted/audit
    track with a **denial register** recording the legal basis + earliest erasure date; scheduled erasure at
    end-of-retention. (DPDP §8(7) erasure yields to any law in force — see References.)
  - The **head keeps the records** even here where statutorily required for the household tax history.
- **Hard-delete (full purge)** is only allowed when the member holds **zero** data (or after hand-back +
  lawful erasure), reusing the standard user-deletion flow + cascade listeners + removing `familyLink`.

**Head deletes their own account (household owner):**
- Industry pattern (Forbidden Finance): the **household dissolves** and sharing is revoked; each promoted
  member **keeps their own account + data**. Non-promoted members (reference-only) are archived with their
  data preserved (per §5.5), never silently deleted.

### 6.8 Family-tab visibility — head-granted per member (Tier 2)
Where a promoted member sees the **whole family** in the family tab is gated by the head:
- **Only relevant once a member is PROMOTED (DECIDED).** The `familyVisibility` toggle is surfaced **only
  when at least one member has been **promoted** (has their own CoinTrack login / account). If the account
  is just **head + (unpromoted) members** — where *only the head can log in* — there is **no one else to
  view the family**, so the option is **hidden/irrelevant** (no toggle shown, no state needed). The moment
  a member is promoted, the head's per-member visibility toggle appears for that member (default `false`).
- New embed field on `Member` / on the promoted `User`'s family link:
  `familyVisibility` (boolean, default **false**) — **the head grants it per member**.
- If **true** → the member can open `/family` and see the same whole-family view as the head
  (per-member per-module breakdown + family total + per-PAN tax roll-up), read-only for other members'
  data.
- **PAN in the family view (DECIDED): full PAN for all.** A member with `familyVisibility=true` sees the
  **full PAN of every member** in the family view (the head's own full-PAN authority extends read-only to
  a visibility-granted member). Outside the family view, PAN masking rules of §1.6 still apply (e.g. a
  visibility-granted member editing only their own data still gets their own full PAN, never others').
- **Revoking visibility keeps the member IN the aggregate (DECIDED).** `familyVisibility=false` (or later
  revoked) only stops the member *viewing* the family; their own data **remains in the head's family
  totals and per-PAN tax roll-up** (they stay a household member until they leave per §6.7). Decouples
  "who can view" from "whose data is included".
- If **false** (default) → the member sees **NO financial data** of other members. The family tab shows
  **only a member directory / roster** — the names and relations of all members and who the **head** is —
  with **zero balances, holdings, or tax data**. (The directory itself is not financial data; it lets the
  member know whom the household comprises.)
- The head can grant/revoke at any time (a `familyVisibilityChanged` audit entry is written; see §6.6).
- **DECIDED — head's grant is sufficient; no other-member consent required.** Granting family-visibility
  exposes *other members'* data to the promoted member, but the **head's per-member grant IS the consent
  mechanism** (proprietor/owner rationale: the head is the **main/primary operator** of the household and
  the original tracker of every member's data under their single-login authority). No additional DPDP
  consent from the *other* members is required. The grant/revoke is audited (§6.6), and the head can
  revoke at any time. (Legal note retained: this rests on the head's operator authority established at
  member creation — §2.1 attestation/guardian consent — and the visibility grant is a read-only extension
  of it.)
- A promoted member can **edit only their own** data regardless of `familyVisibility`; other members stay
  read-only to them unless the head designates editor status (out of scope — see §7 multi-head).

### 6.9 Multiple heads / a member managing others (advanced, OUT OF SCOPE now)
A promoted member operating data for *their own* members is simply the same Tier-1 system nested one
level down. Deferred (Section 7) — but the `ownerRef` design already permits it with no schema rework.

### 6.10 Membership limits & abuse (edge)
- Cap household size (e.g. ≤10 members, aligned with Zerodha's 10-sub-account cap) → `409` beyond cap.
- Rate-limit promote/OTP endpoints (mirror existing password rate-limit fields on `User`).

### 6.11 Locked decisions for Tier 2 (records — do NOT re-litigate)
The items below were previously open; **all are now DECIDED (owner-confirmed)** and specified in the
relevant sections. Kept here as a locked-decision record so they are not re-litigated:

- **Minor self-login before age 18** → **DECIDED: promote/login blocked while `isMinor`** unless the
  guardian explicitly sets a handover flag. Specified in §6.2 Path 1 (regulators: guardian operates
  until majority; PPF/AMFI minor→major conversion pattern).
- **Promotion head-authorization** → **DECIDED: member self-service with OTP only; NO delayed
  head-approval gate.** On the member's **first successful login**, the system **emails the head**
  ("<Member> has logged in for the first time; all details have been transferred") as a notification,
  not an approval. Specified in §6.3.
- **SMS gateway** → **DECIDED: EMAIL-ONLY OTP.** No SMS provider (subscription cost). The promote-flow
  OTP reuses the existing email OTP infrastructure (`EmailTokenService`). The SMS / real-time SMS
  build-block is removed from scope (see §7). For Tier 2 start, record an inventory of current
  phone/email OTP capability so the promote-flow design reuses it.
- **Family-visibility consent of *other* members** → **DECIDED: head's per-member grant is sufficient,
  NO other-member consent required** (the head is the main/primary operator of the household; the grant
  IS the consent mechanism — a read-only extension of the head's operator authority established at member
  creation). Specified in §6.8.

### 6.12 Head incapacity / death / succession (DECIDED — add successor-head plan)
> **DPDP §14(1)** gives a Data Principal the right to **nominate** an individual who, on the principal's
> **death or incapacity** (`unsoundness of mind` / `infirmity of body`), exercises the principal's rights.
> We mirror this at the household level with an explicit **successor-head** mechanic. (Citable: [DPDP Act
> 2023 §14 — meity.gov.in](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf).)

- **Two ways headship can transfer (DECIDED, owner-confirmed):**
  1. **Head-designated successor (in-app, when the head has an active account).** The head pre-nominates a
     member as `successorHead` in the household settings. On the head's death/incapacity event, the
     nominated member may claim headship with proof-of-identity + the head's designation (recorded in
     `MemberAuditLog`, §6.6). The head can change/cancel this nomination at any time.
  2. **System-Admin, manual request (when the head has no active account / no nomination / contested).** A
     written request — **an email or a physical letter to the office** (the owner's preferred channel; no
     self-service, no automated approval) — is reviewed by the **System Admin**, who verifies legal
     authority (death certificate, legal-heir / nomination documents, power-of-attorney, or a court order)
     and transfers headship to the lawful successor. Manual, documented, and auditable.
- **On headship transfer:** the new head inherits the full single-login head authority over all members
  (§5.4) and the family aggregate continues unchanged (data is not re-entered, ownership is not lost).
  The **old head's own account** (if it still exists as a member) follows the **same block-if-data rule
  as everywhere else in this doc**: it may be **dissolved only if the old head holds zero data** across
  all modules (no active SIP, no lump-sum MF, no active FD, nothing in gold/PPF/EPF/broker/notes — a
  full zero check, mirroring §5.5 / §6.7's DependencyGuard). If the old head still owns any non-zero
  instrument, the account/records are **retained** (not silently wiped); under DPDP §14 nomination the
  **nominee/successor continues to exercise** the old principal's rights over that retained data.
- **Idempotent + audited:** a `headshipTransferred` event is written to `MemberAuditLog` with old-head,
  new-head, method (designation / admin-request), and verifier. Only one active head exists at a time
  (transfer is atomic — no interim two-head split). Securely handled by admin only; no ordinary member
  can self-elevate.

---

# SECTION 7 — DEFERRED / OUT OF SCOPE

- **Full Multi-Head / member-manages-others nesting** beyond one level (6.9).
- **Managed-Account write-approval (OTP every execute)** — intentionally NOT adopted (Claude
  reconciliation); only relevant if the product later wants distributed control, not attribution.
- **Account-Aggregator (DEPA/AA) live data sync** (FOLO/INDmoney model) — currently manual-entry only;
  a separate roadmap item, not this one. The `ownerRef`+consent model keeps the door open.
- **SMS / real-time SMS messaging platform** — **DECIDED: NOT in scope.** OTP is **email-only** (reuse
  `EmailTokenService`); no SMS provider is added (subscription cost). Removed from Tier 2 build-block list.
- **Joint/HUF instrument modeling** (Famli labels joint/HUF) — the brief explicitly excludes
  joint/pooled ownership; per-PAN attribution only.
- **Cross-account co-editing / conflict resolution** — single-login makes this moot for now.

---

# 🧪 TEST SCENARIOS (to be written when implementation starts)

**Attribution (member-scoped):**
- [ ] Two members with distinct PANs have instruments at the same bank/broker/platform → attributed to the correct `memberId` and **never pooled** into one group.
- [ ] One logical person with name-spelling variants → still one group because key is `memberId` (the string-normalization mechanics are already tested in `HolderNameTest`/`OwnerGroupingTest — see §5.3.1).
- [ ] SELF-scoped vs member-scoped reads return the right slices; family roll-up sums members∪SELF without double counting.

**Scope/authorization:**
- [ ] `scope=memberId` returns only that member's data; `scope=family` returns all members∪SELF.
- [ ] Attempting another user's memberId → `403/404` (never leaks).
- [ ] Server resolves and returns the member **name** (not just `memberId`) for every scoped context; the
      name is never trusted from the client (spoofed name → ignored, real name returned).
- [ ] Existing rows (no `ownerRef`) read as SELF with zero code mutation.
- [ ] Switching the scope selector to a member shows only that member's broker/sync'd holdings; the
      **Calculator is unaffected by scope** (common/global).
- [ ] **Login member-picker:** an account with members is prompted "View as: Self/Mom/Son/.../Family" on
      login (default Self); only members belonging to the user are offered; a promoted member is offered
      only their own member + permitted family visibility; single-member accounts skip the prompt. Picker
      is authorization-enforced (§5.2).
- [ ] Two members on the same broker (e.g. both Zerodha) → two isolated `BrokerAccount` rows, separate
      credentials, no leakage between them.
- [ ] Background token-refresh/holdings-sync for member A never reads/refreshes member B's or the head's
      connection (member-scoped session invariant).
- [ ] Family broker total = sum of ALL members' broker holdings; rollup is read-only.

**Family aggregate (family tab):**
- [ ] Family totals = grand sum across all members ∪ head, per module, no double counting.
- [ ] Per-member, per-module breakdown correct (FD, MF, gold, PPF, EPF, broker, notes shown individually).
- [ ] Per-PAN tax roll-up sums each person's TDS/80TTB/MF LTCG correctly.
- [ ] **Decoupling (visibility ≠ inclusion):** head revokes a member's `familyVisibility` → the member can
      no longer *view* the family, but their data **stays in the head's family totals / tax roll-up**
      (they only leave the totals when they leave the household).
- [ ] **PAN visibility (Tier 2):** a member with `familyVisibility=true` in the family view sees the **full
      PAN of every member**; outside the family view, §1.6 masking still applies.

**Member lifecycle:**
- [ ] Create adult member w/o attestation → `400`; with attestation → `ATTESTED`.
- [ ] Create minor w/o guardian type → `400`.
- [ ] Duplicate PAN within household → `409`.
- [ ] **Head edits a member's `email`/`phone`/`username`** → allowed (re-validating within-family/unique
      rules; username unique across all accounts); a member editing their **own** username/email/phone
      after promotion uses the same rules.
- [ ] Archive keeps data + banner; hard-delete (only when no assets) cascades child docs.

**Promotion (Tier 2):**
- [ ] Member login w/o password → OTP → set-password → 2FA → logged in; sees all head-entered data.
- [ ] OAuth login with member email → auto-upgrade, missing info gathered, 2FA, data re-pointed.
- [ ] Re-point is atomic: forced failure of one asset update rolls back entire promotion.
- [ ] Head sees member's edits live (family link) and can drop link / member can revoke consent.
- [ ] Minor cannot self-promote unless guardian handover (promote blocked while `isMinor`).
- [ ] Promoted member with `familyVisibility=true` sees the whole family tab (full data); with `false`
      sees **only the member directory / roster** (names, relations, head) and **NO financial data** of
      other members; in both cases they can **edit only their own** data.
- [ ] **Visibility requires promotion:** account = head + unpromoted members (only head can log in) → the
      `familyVisibility` option is **hidden** (no one else to view); once a member is promoted, the toggle
      appears for them (default `false`).
- [ ] Broker connection re-points on promotion (no re-connect).

**Promotion guards (decided behavior):**
- [ ] Promote/login **blocked** while `member.isMinor` and guardian-handover flag is NOT set → `403`.
- [ ] Email-only OTP (no SMS): expired OTP → resend + retry counter; **rate-limit** promote/OTP endpoints
      (mirror `User` password rate-limit fields) → `429` beyond limit.
- [ ] First successful member login (Path 1 & Path 2) → **head notified by email** ("<Member> logged in for
      the first time; all details transferred"); **no head-approval gate** required.
- [ ] **Contact uniqueness (SEBI-family rule):** same phone/email across members **within one household** →
      allowed; a phone/email colliding with a user **outside the household** → rejected (conflict surfaced);
      `username` unique across all accounts.
- [ ] **Gather missing info = phone only** (username/email required at creation): promoting a minor with no
      phone captures phone; nothing already captured is re-requested.

**Account deletion / leaving the household (edge):**
- [ ] Delete account while the member owns non-zero data → **blocked**; DependencyGuard checklist lists the
      orphan-risk modules + quick links to resolve (Arthavi pattern).
- [ ] "Hand data back to the head" (default exit) → reverse re-point `ownerRef` to head; member account
      closes; family aggregate correct with **no double-count and no orphans**.
- [ ] "Erase my data" (explicit, informed) → consent-based/operational data purged (30-day soft-delete →
      hard-delete; backups age out); **statutory-retain data retained** under Legal Obligation Override with
      denial register + scheduled end-of-retention erasure.
- [ ] Hard-delete (full purge) only allowed when the member holds **zero** data (or after hand-back + lawful
      erasure); reuses standard user-deletion + cascade listeners + removes `familyLink`.
- [ ] Head deletes their own account → household **dissolves**; promoted members keep their own accounts +
      data; sharing revoked (Forbidden Finance pattern); non-promoted members archived (data preserved, §5.5).
- [ ] Removed member's PAN removed from the per-PAN tax roll-up **exactly once** (no residue double-count).

**Head succession (Tier 2, §6.12):**
- [ ] Head-designated successor claims headship with proof-of-identity + the recorded designation → atomic
      transfer; only one active head; old head's authority removed.
- [ ] System-Admin manual request (email/letter to office) for headship → verified (death certificate /
      legal-heir / PoA / court order) → headship transferred; audited `headshipTransferred` event.
- [ ] Old head's own account: if they hold **any non-zero data** → account/records **retained** (not wiped);
      dissolved only when the old head holds **zero data** across all modules (mirrors §5.5/§6.7 guard).

---

# 📦 FILES TO CREATE / MODIFY (full inventory)

### Backend new
```
member/
  model/Member.java, OwnerRef.java, Consent.java, MemberSettingsEmbed.java, Relation.java, ConsentState.java, ConsentType.java
  repository/MemberRepository.java, MemberAuditLogRepository.java
  service/MemberService.java, FamilyAggregationService.java
  service/MemberPromotionService.java        (Tier 2)
  controller/MemberController.java, FamilyController.java, MemberPromotionController.java (Tier 2)
  dto/request/... , dto/response/MemberResponseDTO.java, FamilySummaryDTO.java, etc.
  event/MemberPromotedEvent.java, MemberDataCleanupListener.java
  util/OwnerGrouping.java      // shared ownerRef grouping abstraction (5.3)
```

### Backend modified (add `ownerRef` + scope-aware queries; adopt shared grouping abstraction)
> The mechanical FD/MF `holderName` normalization + grouping refactor is **done** (§5.3.1); here we add the
> `ownerRef` field + scope-aware reads and extend grouping through `OwnerGrouping` to the **remaining**
> modules (gold/PPF/EPF/broker/notes).
```
fixeddeposit/model/FixedDeposit.java, FixedDepositServiceImpl.java, FixedDepositExcelExporter.java   // add ownerRef + route grouping
mutualfund/model/MfScheme.java, ValuationSnapshot.java, SipMandate.java                              // add ownerRef
mutualfund/service/MfSchemeService.java, MfSchemeAggregationService.java, ValuationSnapshotService.java, SipMandateService.java   // add ownerRef + scope
mutualfund/controller/MfSummaryController.java
gold/silver: goldsilver/model/GoldSilverInvestment.java
ppf: ppf/model/PpfTransaction.java
epf: epf/model/EpfTransaction.java
broker: broker/model/BrokerAccount.java, broker/controller/BrokerConnectController.java, ZerodhaBridgeController.java, broker/service/impl/BrokerConnectServiceImpl.java (member-scoped sessions + token refresh), broker/adapters/* (Zerodha/Upstox/AngelOne) — all gain ownerRef.memberId scope
notes: notes/model/Note.java, notes/service/NoteService.java, notes/controller/NoteController.java (ownerRef + scope; parallel NotesUserDataCleanupListener for MemberDataCleanupListener)
user: user/ (User: add optional familyLink + familyVisibility for Tier 2 promotion)
user/service/UserAuthenticationService.java  (Tier 2 promote cases), AuthController or MemberPromotionController
email/controller/ForgotPasswordController.java (reuse for set-password), EmailTokenService (OTP)
security/config/SecurityConfig.java (whitelist promote endpoints)
common/event/UserDeletedEvent.java (parallel MemberDataCleanupListener)
```

### Frontend
```
src/components/member/MemberDialog.jsx, ConsentScreen.jsx
src/components/family/FamilyDashboard.jsx (per-member per-module breakdown + family total), MemberSelector.jsx(scope switch), FamilyVisibilityToggle.jsx (head grants per-member family visibility, Tier 2)
src/app/(main)/profile/page.jsx (+ Folio·§07 Family & Consent), Sidebar.jsx (+ /family)
src/lib/api.js (+ familyAPI, memberAPI),
src/lib/endpoints.js (+ family endpoints),
promote/login/OAuth + 2FA pages (Tier 2), LoginMemberPicker.jsx (post-login "which member's view", default Self, §6.3), and every member-scoped module's page + create/edit dialog gains a scope selector (default Self)
```

### Tests
```
member/MemberServiceTest.java, MemberControllerTest.java,
member/FamilyAggregationServiceTest.java, MemberPromotionServiceTest.java (Tier 2),
extension of FixedDepositServiceTest + MfSchemeAggregationServiceTest for ownerRef grouping
```

---

## 📚 REFERENCES (industry standards + regulations)

1. **SEBI individual-account basis** (securities accounts are individual, per-PAN tax records; family
   view is reporting-only, never pooling thresholds/orders): Zerodha Console Family-view
   ([support.zerodha.com/category/console/profile/account/articles/family-account](https://support.zerodha.com/category/console/profile/account/articles/family-account); [zerodha.com/z-connect/console/introducing-family-portfolio-view-on-console](https://zerodha.com/z-connect/console/introducing-family-portfolio-view-on-console); [v2.webnotes.in/zerodha-family-declaration](https://v2.webnotes.in/zerodha-family-declaration)).
2. **Two-account model (every member own login + OTP write approval)** — Kuvera **Managed Account**,
   closest to the Tier-2/promotion shape ([kuvera.freshdesk.com/.../managed-account](https://kuvera.freshdesk.com/support/solutions/articles/82000760585-what-is-a-managed-account-); [kuvera.freshdesk.com/.../how-does-manage-account-work](https://kuvera.freshdesk.com/support/solutions/articles/82000772570-how-does-manage-account-work-); [kuvera.in/blog/managed-accounts...](https://kuvera.in/blog/managed-accounts-link-and-invest-across-kuvera-accounts/)). Contrast with **Family Account** (single-login manual control, no member login): [kuvera.in/why-kuvera/family-account](https://kuvera.in/why-kuvera/family-account).
3. **Single-login family profiles + aggregate** — Arthavi Multi-Profile/Family ([arthavi.com/blog/introducing-multi-profile-family-wealth-aggregation](https://arthavi.com/blog/introducing-multi-profile-family-wealth-aggregation/)); INDmoney Family Accounts (invite + accept, revoke) ([indmoney.com/networth/family-accounts](https://www.indmoney.com/networth/family-accounts)); Famli ([famlilife.com](https://www.famlilife.com/)); FOLO (consent via Account Aggregator, revocable) ([folo.one](https://www.folo.one/)).
4. **Income Tax — per-assessee attribution**: TDS Sec 194A (₹50K/₹1L senior per (bank,holder); Budget 2025), MF LTCG 12.5% over ₹1.25L/exempt; clubbing Sec 64(1A) + minor; 80TTB ₹50K senior — figures must each carry a URL before assertion in code/docs (see FD plan references).
5. **PPF/EPF single-holder rules**: PPF Scheme 1968 — one account per person, guardian opens minor's,
   ₹1.5L cap across own+children ([nsiindia.gov.in PPF PDF](https://www.nsiindia.gov.in/writereaddata/FileUploads/PPF.pdf); [PPF Scheme Rule PDF](http://www.nsiindia.gov.in/writereaddata/SchemeRules/PublicProvidentFundSchemeRule.pdf)); guardian-only minors, minor→major conversion ([livemint...kerala-hc](https://www.livemint.com/money/personal-finance/think-your-child-ppf-separate-rs-1-5-lakh-limit-kerala-hc-high-court-order-see-public-provident-fund-saving-scheme-11786704646504.html); [economictimes...ppf-child](https://economictimes.indiatimes.com/wealth/invest/investing-for-your-childs-future-through-ppf-heres-what-every-parent-should-know-before-opening-a-ppf-account/articleshow/132111112.cms)).
6. **Minor MF — guardian operates, child sole holder, clubbing till 18**: AMFI ([amfiindia.com/investor/become-mf-distributor?zoneName=nomination](https://www.amfiindia.com/investor/become-mf-distributor?zoneName=nomination)); TOI ([timesofindia/...minor mf](https://timesofindia.indiatimes.com/business/mutual-funds/investing-in-a-childs-name-how-mutual-fund-accounts-for-minors-work-rules-to-know-and-tax-impact-explained/articleshow/126996535.cms)); moneyexcel ([moneyexcel.com/investing-in-childs-name...](https://moneyexcel.com/investing-in-childs-name-via-mutual-funds-rules-tax-guide/)).
7. **DPDP Act 2023 consent** — §6 (free/specific/informed/unconditional/unambiguous, affirmative,
   withdrawal ease), §5 notice, §8(7) erasure-when-purpose-served, child (verifiable parental consent),
   consent-manager audit trails ≥7y ([indiacode.nic.in DPDP Act](https://www.indiacode.nic.in/handle/123456789/22037?locale=en); [egazette DPDP PDF](https://egazette.gov.in/WriteReadData/2023/248045.pdf); [EY DPDP Rules 2025](https://www.ey.com/en_in/insights/cybersecurity/decoding-the-digital-personal-data-protection-act-2023); [vratex fintech DPDP](https://www.vratex.com/blog/dpdp-act-fintech-compliance-india)).
8. **Broker accounts are per-PAN and credentials are never shared** — Zerodha supports **one trading
   account per PAN** and its policy states *any sharing of user credentials is not permitted*; the family
   portfolio view on Console is **view-only** (can't place orders for a relative without an
   Authorised-Person/PoA construct): [support.zerodha.com/category/account-opening/trading-accounts...multiple-trading-account-limit](https://support.zerodha.com/category/account-opening/account-opening-trading-and-demat/articles/how-many-trading-accounts-can-i-open); [zerodha.com/policies-and-procedures](https://zerodha.com/policies-and-procedures); [zerodha.com/z-connect/console/introducing-family-portfolio-view-on-console](https://zerodha.com/z-connect/console/introducing-family-portfolio-view-on-console).
9. **Family-groups broker model** — TraderTape Family Groups: *each member connects their own broker; family
   members don't share broker credentials, they share visibility*; broker sessions/risk/strategies stay
   per-user; the family rollup is a **view-only** concern ([tradertape.com/docs/wealth/family-groups](https://tradertape.com/docs/wealth/family-groups)). KuberOne (open-source family/expanse tracker): admin creates a family workspace, each member holds their own **named, owner-scoped** investment accounts ([github.com/drprash/kuberone](https://github.com/drprash/kuberone)). Arthavi chose a **credential-less** path (CAS/CSV upload per member profile) specifically to avoid sharing broker credentials across family under one login ([arthavi.com/blog](https://arthavi.com/blog/introducing-multi-profile-family-wealth-aggregation/)).
10. **DPDP erasure + Legal Obligation Override (member/account deletion)** — §8(7) erasure yields where
    another law requires retention; §12(3) data-principal erasure right (also §12 correction/update).
    Implement **data-element segmentation**: consent-based/operational data erased on request; statutory
    records retained with a **denial register** (legal basis + earliest erasure date) + scheduled erasure at
    end-of-retention; 30-day soft-delete then hard-delete; encrypted-backup age-out ([indiankanoon DPDP §8(7)](https://indiankanoon.org/doc/157637354/); [egazette DPDP PDF](https://egazette.gov.in/WriteReadData/2023/248045.pdf); [ConsentOS RBI-DPDP fix](https://consentos.in/learn/rbi-dpdp-retention-conflict/); [AMLEGALS erasure](https://amlegalsdpdpa.com/insights/data-retention-erasure-dpdpa); [unifiedchambers RBI-DPDP](https://www.unifiedchambers.com/blog/rbi-dpdp-retention-reconciliation)).
11. **Statutory retention periods (India) driving the override** — Income-Tax books 6–8 y; RBI KYC /
    PMLA records 5 y post-relationship (up to 10 y for some); SEBI trading/client records 5 y; IT
    Act/CERT-In logs 180 days; DPDP consent-manager records 7 y ([ringsafe retention-erasure](https://ringsafe.in/academy-dpdp-retention-erasure/); [AMLEGALS DPDPA](https://amlegalsdpdpa.com/insights/data-retention-erasure-dpdpa)).
12. **Account-deletion / leaving household patterns** — Arthavi **"Safe Profile Deletion & DB Cleanup"**: deletion is **blocked** while a profile holds active assets (checklist of blocking dependencies: active MFs/stocks/goals) to avoid orphans ([arthavi.com/blog/introducing-multi-profile-family-wealth-aggregation](https://arthavi.com/blog/introducing-multi-profile-family-wealth-aggregation/)). Forbidden Finance household permissions: a member **leaving** loses shared access but their **own accounts/data remain unaffected**; when the **owner deletes their account the household dissolves** and sharing is revoked ([help.403fin.io/household/permissions](https://help.403fin.io/household/permissions)).
13. **SEBI family mobile/email sharing rule** — brokers must keep a **separate mobile/email per client**, but may upload the **same mobile/email for >1 client who belong to one family** (self, spouse, dependent children, dependent parents) **on the client's written request** (SEBI circular, effective 03-Dec-2024) ([economictimes](https://economictimes.indiatimes.com/wealth/invest/stock-market-investors-can-family-members-operate-their-demat-accounts-using-a-single-mobile-number-heres-what-sebi-says/articleshow/116007440.cms)). Basis of the doc's **within-family contact-sharing** rule (unique across accounts; shareable within a family).
14. **DPDP §14 nomination (head succession / event of death-incapacity)** — a Data Principal may **nominate** an individual who, on the principal's **death or incapacity** (`unsoundness of mind` / `infirmity of body`), exercises the principal's rights; the basis for the household **successor-head** mechanic in §6.12 ([meity DPDP Act 2023 PDF](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)).

---

## ✅ DEFINITION OF DONE (Tier 1)

- [ ] `Member` + `OwnerRef` on **every** asset module; all existing rows read as `SELF` (no behavior change for current users).
- [ ] Attribution/model-consumers adopt the shared `ownerRef.memberId` grouping abstraction (5.3) — extend the built `OwnerGrouping.groupKey` to **all** modules (FD/MF already done, §5.3.1; gold/PPF/EPF/broker/notes remaining).
- [ ] Member create + Consent/attestation flow; duplicate-PAN + minor-guardian + adult-attestation guards.
- [ ] Scope-aware queries (`SELF`/member/`FAMILY`) + family aggregate dashboard (summaries, allocation, tax roll-up).
- [ ] Authorization guard on every member-scoped read/write; PAN masked + encrypted; audit trail present.
- [ ] Tests (Section "TEST SCENARIOS") green; `mvn clean test`; frontend `npm run build`.
- [ ] **Tier 2** marked FUTURE (not shipped) with promotion flow specced, not implemented.
- [ ] STATUS line below reflects reality.

---

**STATUS: PLAN ONLY — Family feature deprioritized. The FD/MF `holderName` normalization + stable
attribution-key fix previously tracked separately is **✅ COMPLETED and folded into this doc at §5.3.1**;
extending the shared `OwnerGrouping` abstraction project-wide (gold/PPF/EPF/broker/notes) remains open.
CHOSEN approach is **Option D — hybrid shipped in stages**: Tier 1
(Option B: Member/OwnerRef + family aggregate + consent) is the agreed immediate shape; Tier 2 (Option C:
member promotion to a real sub-account/login) is designed but NOT scheduled. All gaps here are
NOT STARTED.**
