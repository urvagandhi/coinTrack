
# CoinTrack Context-Building — Part 1: Inventory, READMEs, Config

ROLE
You are performing a full architectural audit of the CoinTrack monorepo. Your goal
in THIS file is NOT to write or modify any code, and NOT yet to read Java/TypeScript
source. Your goal is to build the map of what exists, then deeply understand every
README, then understand every config/env surface. Do not skip files because a
similarly-named file was read elsewhere — always open and read actual content.

At the end of this file's phases, STOP. Do not proceed into source code reading.
Source code reading happens per-module in the second file, independently.

═══════════════════════════════════════════════════════════════

# PHASE 0 — FULL RECURSIVE INVENTORY

═══════════════════════════════════════════════════════════════

1. Recursively list every file in the repo matching these patterns, at ANY depth,
   including nested submodule folders (e.g. backend/.../coinTrack/mutualfund/dto/,
   backend/.../broker/adapters/zerodha/mapper/, etc.):
   - README.md (root, backend/, frontend/, and every module/submodule folder —
     do not assume only top-level module folders have READMEs; check subfolders too)
   - *.env, *.env.example, *.env.local, application*.properties, application*.yml
   - render.yaml, Dockerfile, docker-compose.yml
   - pom.xml, package.json, next.config.*, tsconfig.json
2. Print the full list, grouped by directory depth:
   - Depth 0 = repo root
   - Depth 1 = backend/, frontend/
   - Depth 2 = module folders (broker/, portfolio/, mutualfund/, etc.)
   - Depth 3+ = submodule folders (adapters/zerodha/, dto/kite/, model/enums/, etc.)
3. State the total file count per category (READMEs found / config files found).
   If the module list you find doesn't match this known set, flag the mismatch
   and re-scan before proceeding:
   Known modules (from root README): broker, calculator, common, email,
   fixeddeposit, notes, portfolio, ppf, epf, goldsilver, security, user, mutualfund.
4. Do not proceed to Phase 1 until the inventory is printed and confirmed complete.

═══════════════════════════════════════════════════════════════

# PHASE 1 — READMEs, DEEPEST FIRST, ROOT LAST

═══════════════════════════════════════════════════════════════
Process every README found in Phase 0, ordered from deepest folder level up to the
root README.md, which you read LAST (root should confirm what you already learned
from module READMEs, not introduce it fresh — reading it last exposes any drift
between what the root README claims and what module READMEs actually say).

For EACH README, extract and hold as structured working notes (do not discard
between READMEs — you are building one running document):

- Module name, one-line responsibility, version, last-updated date
- Every MongoDB collection it owns, with key fields if listed
- Every REST endpoint: method, path, auth requirement (public/JWT), one-line purpose
- Every explicit cross-module dependency ("depends on", "calls", "delegates to",
  "injected into", "shared by")
- Every named "pitfall", "gotcha", "critical rule", "anti-pattern", or "CRITICAL
  ARCHITECTURAL NOTE" — quote these close to verbatim, they are load-bearing
- Any TODO, known bug, unresolved question, or "not yet implemented" note
- Any calculation formula or business rule stated explicitly (e.g. aggregation
  formulas, tax logic, interest accrual rules) — capture the exact formula, not
  a paraphrase, since these are precision-critical

Do not summarize a README in fewer than the facts it actually contains. A thin
summary here is a bug — the whole point of this phase is exhaustive extraction.

═══════════════════════════════════════════════════════════════

# PHASE 2 — CONFIG & ENV FILES (structure only, never expose secret values)

═══════════════════════════════════════════════════════════════
Open every env/properties/yml/render.yaml/Dockerfile/pom.xml/package.json found
in Phase 0.

Rules:

- Record variable NAMES and their PURPOSE (from comments, key naming, or
  surrounding context). NEVER print, quote, or repeat an actual secret value,
  even if one happens to be present in a file you're reading (e.g. a committed
  .env with a real key). If you detect a real secret value in a tracked file,
  flag it as a security concern in your notes but do not reproduce it.
- Note required vs optional variables, and which runtime consumes them (backend
  Spring Boot / frontend Next.js / Docker build / Render deploy).
- For pom.xml and package.json: list major dependencies and what capability each
  one enables (e.g. Bucket4j = rate limiting, Apache POI = Excel export,
  BouncyCastle = AES-256-GCM encryption) — this tells you what infra choices
  were made and why, without reading source yet.
- Cross-check: does every env var a README says a module "requires" actually
  exist in render.yaml / Dockerfile / application-*.properties? Flag any gap
  either direction (README mentions a var not in config, or config has a var
  no README explains).

═══════════════════════════════════════════════════════════════

## OUTPUT OF THIS FILE

═══════════════════════════════════════════════════════════════
Produce a file at repo root: PROJECT_CONTEXT_PART1.md containing:

1. Full file inventory (from Phase 0), as a tree or grouped list
2. One structured section per module, containing everything extracted in Phase 1
   (collections, endpoints, dependencies, pitfalls, formulas, TODOs)
3. One consolidated config/env reference table (variable | purpose | consumer |
   required?) — no secret values
4. A short "Discrepancies Found So Far" list (README-vs-README contradictions,
   README-vs-config gaps)

Do NOT begin reading Java or TypeScript/JSX source code in this file. That is the
explicit scope of the next file, done one module at a time, independently.
