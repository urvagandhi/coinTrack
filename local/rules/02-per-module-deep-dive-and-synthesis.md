
# CoinTrack Context-Building — Part 2: Per-Module Deep Dive + Final Synthesis

PRECONDITION
You have already completed Part 1 and PROJECT_CONTEXT_PART1.md exists. Load it
into context before starting. Everything in this file builds on it — do not
re-derive README facts from scratch; reference what Part 1 already captured.

ROLE
For each module below, you will go FULLY VERTICAL: read that module's backend
Java code, then its linked frontend Next.js code, then reconcile both against
what Part 1 already learned from its README — all before moving to the next
module. Do not context-switch between modules mid-phase. Do not read another
module's code "while you're in there" unless this module's README explicitly
named it as a dependency — in that case, note the link but do NOT deep-dive the
other module yet; that module gets its own full pass in its own turn.

MODULE PROCESSING ORDER (process independently, one fully before the next):

1. common          (read first — nearly everything else imports it)
2. security
3. user
4. email
5. broker
6. portfolio
7. calculator
8. notes
9. fixeddeposit
10. ppf
11. epf
12. goldsilver
13. mutualfund

═══════════════════════════════════════════════════════════════

# PER-MODULE PROTOCOL — repeat this exact sequence for each module in the order

above. Do not skip steps. Do not merge steps across modules.
═══════════════════════════════════════════════════════════════

#### STEP A — Recall

Pull this module's section from PROJECT_CONTEXT_PART1.md (collections, endpoints,
pitfalls, formulas, dependencies already known from its README). Hold this as the
"claims to verify" list for the rest of this module's pass.

#### STEP B — Backend model/ layer

Read every file in backend/.../coinTrack/<module></module>/model/ (and enums/ subfolders
if present). For each entity/record:

- List every field, its type, and any annotation that changes behavior
  (@Id, @Indexed, @Transactional-relevant, validation annotations)
- Note the MongoDB collection name it maps to
- Cross-check against Part 1: does this match what the README claimed the
  model contains? Flag any field the README didn't mention, or vice versa.

#### STEP C — Backend repository/ layer

Read every repository interface. List every derived query method
(findByX, findByXAndY, etc.) and what it implies about how data is queried
elsewhere (e.g. findByUserIdAndHolderName implies a holder-scoped filter exists
in some service/controller).

#### STEP D — Backend service/ layer (the real logic)

Read every service class fully, not just method signatures. For each method:

- What validation happens before persistence (ownership checks, FK checks,
  negative-balance checks, date-range checks)?
- What is computed vs what is stored as-is from the request?
- Any @Transactional boundary — what's the rollback condition?
- Any scheduled job (@Scheduled) — what does it do and how often?
- Any formula implemented here — compare the actual code logic against the
  formula Part 1 extracted from the README. Flag any mismatch explicitly:
  "README says X, code computes Y."

#### STEP E — Backend controller/ layer

Read every controller. List every endpoint: HTTP method, path, request body
shape, response shape, auth annotation. Cross-check against the endpoint list
Part 1 already extracted from the README — flag any endpoint in code but not
in README, or in README but not in code.

#### STEP F — Backend config/ (if the module has one)

Read any module-specific config classes (rate limiters, scheduled task config,
YAML loaders). Note what external behavior they control.

#### STEP G — Linked frontend code

Using the module's endpoints (from Step E) as the search key, find every
frontend file under frontend/src/ that calls those endpoints — check
src/lib/ (API client), relevant src/app/(main)/<feature></feature>/ pages, and any
src/hooks/ or src/components/ tied to this feature.

- Confirm every backend endpoint from Step E has a frontend caller, or note
  it as backend-only (e.g. internal/scheduled-only endpoints, or endpoints
  not yet wired to UI).
- Note any frontend-side transformation of the data (e.g. computed display
  fields, client-side sorting/filtering) that isn't just a pass-through of
  the API response — this is frontend logic that duplicates or diverges from
  backend logic, worth flagging.
- Identify shared frontend infra this module's pages depend on (AuthContext,
  a specific React Query hook, a shared form component).

#### STEP H — Module synthesis card

Before moving to the next module, write a compact synthesis card for THIS
module only:

- Module: <name></name>
- Owns collections: <list></list>
- Real dependency edges: <this module imports/calls these other modules'
  services/repos — from actual code, not README prose>
- Endpoint-to-frontend map: <endpoint -> calling page/hook, or "unused">
- Discrepancies found (README vs code, backend vs frontend): <list></list>
- Formulas/business rules confirmed correct: <list></list>
- Formulas/business rules that diverge from README or look suspicious: <list></list>
- Open questions: <anything genuinely unclear after this full pass></anything>

Append this card to a running file: PROJECT_CONTEXT_PART2.md, then move to the
next module in the order above and restart at Step A. Do not carry unresolved
context from one module's Step B-G into another module's Step B-G — each
module's deep dive is self-contained; only the synthesis card persists forward.

═══════════════════════════════════════════════════════════════

# FINAL PHASE — GLOBAL SYNTHESIS (only after all 13 modules have a card)

═══════════════════════════════════════════════════════════════
Now, and only now, look across all synthesis cards together and produce the
final file at repo root: PROJECT_CONTEXT.md (this supersedes and merges
PROJECT_CONTEXT_PART1.md and PROJECT_CONTEXT_PART2.md into one file — the parts
are working scratch, this is the deliverable).

#### Required structure:

1. System Overview (2-3 sentences)
2. Module Inventory table: module | responsibility | collections owned |
   key services | depends on | depended on by
3. Full Dependency Graph (text diagram), built from the "real dependency edges"
   field of every synthesis card — this is the ACTUAL code-derived graph, not
   the README-claimed one
4. Complete API Surface: every endpoint across all modules, method, auth
   requirement, owning module, frontend caller (or "unused")
5. Cross-Module Business Rules: anything spanning 2+ modules, pulled from
   synthesis cards (e.g. TOTP enforced on manual auth only never Google SSO;
   portfolio excludes positions from summary; EncryptionUtil shared by broker
   and security for different secret types)
6. All Discrepancies Found: consolidated from every module's card, tagged by
   module and severity (cosmetic doc drift vs actual logic risk)
7. Config/Env Reference: from Part 1, carried forward unchanged
8. Open Gaps: consolidated open questions from every card

Do not compress this into vague generalities. A future session with zero memory
of this conversation should be able to open PROJECT_CONTEXT.md and answer, e.g.,
"which service validates scheme ownership before a lumpsum transaction is
created, and does the frontend surface that error correctly" — without
re-reading the codebase.

#### RULES THROUGHOUT PART 2

- If a file is too large to read in one pass, read it in chunks — never skip
  the back half of a file to save time.
- Never guess at logic you haven't actually read — if a method's behavior is
  ambiguous from the code alone, say so in the synthesis card as an open
  question rather than inferring it from the README.
- Read-only throughout. No code edits, no refactors, during this entire pass.
