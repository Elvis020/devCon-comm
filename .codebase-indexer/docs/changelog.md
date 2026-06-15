# Changelog

## 2026-06-15 — Persistence and quiz-state debt reduction
- Hardened `lib/mock-db/index.ts` so corrupt/non-array JSON throws instead of silently returning an empty collection, and writes replace files through temp-file rename.
- Extracted quiz state behavior to `server/quiz-state.ts`; `GET /api/quiz/state` is now read-only and polling clients call explicit `POST /api/quiz/state/advance` for phase progression.
- Added focused tests for mock DB persistence, Luma attendance parsing/summarization, and quiz state advance/read behavior.

## 2026-06-15 — Organizer link visibility flag
- Added `VITE_SHOW_ORGANIZER_LINK` to gate the public header Organizer button while preserving direct organizer route behavior.
- Updated env docs and local-development docs to make clear this is a visibility toggle, not an auth/security control.

## 2026-06-15 — Open-source documentation update
- Updated codebase-indexer docs after adding the public README, contributor policy files, security/code-of-conduct/license files, and structured human-facing docs.
- Affected modules: root documentation files, `docs/README.md`, `docs/user-guides/`, `docs/technical/`, `docs/reference/`, and `docs/features/`.
- Recorded the README badge posture: static stack/license/status badges now, no CI badge until a real workflow and repository remote exist.

## 2026-06-14 — Initial codebase-indexer full index
- Generated `.codebase-indexer/docs/architecture.md`, `implementation.md`, `patterns.md`, `decisions.md`, and `changelog.md`.
- Indexed the active Vue/Vite + Hono/Bun app shape, JSON mock DB, Supabase feedback foundation, attendance/feedback/checklist organizer workflows, and legacy Next/React reference areas.
- Noted weak direct test coverage for active Hono routes, Vue views, mock DB helpers, attendance parser, and Supabase helpers.
- Did not modify `.gitignore`; the codebase-indexer skill requires user choice on whether `.codebase-indexer/` should be committed or ignored.
