# Changelog

_Update this file at natural checkpoints: before a commit, before a PR, or when explicitly asked._
_Format: `## YYYY-MM-DD — [Feature / Fix / Refactor]` followed by bullet points._

---

## 2026-05-29 — Stack migration foundation

- Switched package management from npm lockfile to pnpm and added `pnpm-lock.yaml`.
- Added Vue 3 + Vite app shell under `src/` with a migration dashboard backed by existing mock data.
- Added Hono API app and Bun production server under `server/` so the UI and `/api/*` run on one same-origin port.
- Added active `/api/health`, `/api/overview`, `/api/events`, `/api/talks`, and `/api/leaderboard` Hono endpoints.
- Updated TypeScript, Vite, Tailwind, and docs for the new migration target while keeping the legacy Next implementation as reference.

## 2026-05-01 — Docs sync to current app/api surface

- Updated architecture docs with current public/admin route inventory and complete API route list.
- Updated implementation docs to reflect active route-to-module mappings for CFP, speakers, talks/slides, and quiz workflows.
- Corrected API contract examples to current snake_case payloads (`/api/cfp`, `/api/quiz/join`, `/api/quiz/answer`).
- Added missing major endpoint coverage in docs: speaker management endpoints, quiz question `PATCH`/`DELETE`/`reorder`, and `/api/talks/[talkId]/upload`.

## 2026-03-23 — Initial index

- First scan of codebase; generated all 5 docs
- Project: DevCon-Comm (Next.js 14, JSON mock DB, quiz system)

---

_Future entries go above this line._
