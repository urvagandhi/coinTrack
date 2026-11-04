---
trigger: always_on
description: Protocol for starting new sessions or switching contexts across topics, modules, or technologies.
---

## Session Initialization, Context-Switching & Skill Discovery Protocol

Whenever a **new conversation starts** OR the context within a conversation **shifts to a different topic, module, or technology**, you MUST follow this three-phase protocol before writing code or proposing solutions:

### Phase 1: Codebase Grounding via Graphify & Knowledge Graphs
1. **Graphify First**: Query the AST dependency graph in `graphify-out/` to ground decisions in actual dependencies and symbol relationships:
   - Run `graphify query "<question>"` for scoped subgraphs on concepts or features.
   - Run `graphify path "<source>" "<target>"` to determine dependency pathways before modifying shared symbols.
   - Run `graphify explain "<symbol>"` for deep structural understanding of hub nodes.
2. **Understand-Anything**: Use `/understand-explain <path>` or `/understand-domain` for business logic flows and high-level architectural layering.
3. **Session Memory**: Check `local/memory/` and Section 8 of `AGENTS.md` for historical architectural decisions and system invariants.

### Phase 2: Domain Skill Activation
Identify the subsystem being touched and activate the appropriate packaged skill in `.agents/skills/`:
- **Java / Spring Boot**: `java-pro` (records, hexagonal architecture, virtual threads, domain safety)
- **Next.js & React**: `nextjs-best-practices` & `frontend-ui-engineering` (App Router, server vs. client boundaries, lowercase imports)
- **Styling & Craft**: `tailwind-patterns` & `unslop` (Terminal Editorial tokens, eliminating AI template slop, quiet chrome, status dots, calm typography)
- **Database**: `postgres-best-practices` (indexing, connection pooling, safe migrations)
- **Security & Auth**: `security-and-hardening` & `api-security-best-practices` (OWASP Top 10, TOTP, token encryption, revocation priority)
- **Testing**: `test-driven-development` (red-green-refactor, test pyramid proof)
- **Docker**: `docker-expert` (multi-stage builds, non-root Alpine execution)
Read the relevant `SKILL.md` before taking action.

### Phase 3: Web Research Fallback for Missing Skills / Emerging Context
If no existing local skill, rule, or documentation adequately covers the specific technology, UI design pattern, third-party broker API (e.g. Upstox V2, Zerodha Kite Connect, AngelOne SmartAPI), library version, or architectural pattern:
- **Search the Web proactively** using `search_web` to discover the best modern skills, official RFCs, reference implementations, and industry best practices.
- Ground all implementation details in authoritative, up-to-date sources (`source-driven-development`) and work according to those discovered best practices rather than relying on ungrounded or outdated assumptions.
