# Architectural Decisions

> ADR entries explain WHY — not what was built, but why it was built that way.

---

## ADR-012: Explicit Quiz Phase Advance Command
**Date:** 2026-06-15
**Why:** Quiz polling still needs server-authoritative phase transitions, but mutating session state inside `GET /api/quiz/state` hid writes behind a read endpoint. Moving the transition check to `POST /api/quiz/state/advance` makes the mutation explicit and easier to replace later with a job, Durable Object, or realtime state machine.
**Why (inferred):** User requested reducing quiz-state mutation debt; current docs and code showed GET-driven phase mutation as a known production-readiness issue.
**Tradeoffs:** Polling clients now make one extra request before reading state, and this remains a bridge rather than a production realtime architecture.
**Alternatives considered:** Keep GET mutation; move immediately to Supabase Realtime or Durable Objects; require manual organizer advancement.

---

## ADR-010: Align Public App Surfaces With DevCongress.org Light Theme
**Date:** 2026-06-13
**Why:** Public-facing app surfaces should feel like a continuation of `devcongress.org`; use warm cream, black ink, DevCongress yellow, and pink accents.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** Moves away from the prior dark operational identity and requires token synchronization across Tailwind, CSS variables, and JS-side tokens.
**Alternatives considered:** Keep a dark companion app theme; switch the whole app to Astro immediately.

---

## ADR-009: Name-Selected Feedback Without Supabase Sessions
**Date:** 2026-05-30
**Why:** Trusted testers should submit feedback quickly without accounts or magic links.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** Tester identity is not cryptographically verified.
**Alternatives considered:** Supabase Auth for testers, anonymous session IDs, external forms.

---

## ADR-008: Same-Origin Prototype Admin Session
**Date:** 2026-05-29
**Why:** Vue/Bun migration should keep UI and API on one origin so cookie auth remains simple.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** Shared password and local defaults are prototype-only, not production auth.
**Alternatives considered:** Leave admin endpoints open, run a separate API server, add Supabase Auth immediately.

---

## ADR-007: Vue/Vite Frontend With Single Bun/Hono Server
**Date:** 2026-05-29
**Why:** Move off Next.js while preserving one same-origin server for future session/cookie auth.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** Repo temporarily contains both active Vue/Hono and legacy Next/React shapes.
**Alternatives considered:** Separate Vite/API dev servers, Nuxt, keep Next.js.

---

## ADR-001: JSON Flat Files Instead of Supabase
**Date:** 2025-02
**Why:** Build and validate core event/CFP/quiz/leaderboard flows before provisioning Supabase infrastructure.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** No relational integrity, no multi-process concurrency safety, manual reseeding.
**Alternatives considered:** SQLite, Supabase from day one.

---

## ADR-002: Polling Instead of WebSockets for Quiz Real-time
**Date:** 2025-02
**Why:** Simpler than realtime connections; 1500ms polling fits 5s reveal/scoreboard phases.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** Higher request volume and up to 1.5s lag.
**Alternatives considered:** Supabase Realtime, Server-Sent Events.

---

## ADR-003: Server-Driven Phase Transitions via GET Mutation
**Date:** 2025-02
**Why:** Centralized timing keeps all clients converged without clock coordination.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** GET is not idempotent and assumes single-process prototype runtime.
**Alternatives considered:** Admin-driven transitions, cron/background worker.

---

## ADR-006: Design Tokens in Both Tailwind Config and JS Module
**Date:** 2025-02
**Why:** Tailwind utilities cover static styles; JS constants support programmatic styling.
**Why (inferred):** Existing `docs/decisions.md` records this decision; git-log corroboration not evaluated in this run.
**Tradeoffs:** Two manually synchronized token sources.
**Alternatives considered:** CSS variables only, Tailwind theme access from runtime JS.
