# Architecture

## Project Type
Vue 3 + Vite 6 + TypeScript 5 community conference platform for DevCongress. The active app is a Vue SPA served with a single Hono/Bun API/static server. Prototype persistence is JSON flat files; intended production direction is Supabase for auth, Postgres, storage, and realtime.

## Directory Map
```text
devcongress-comm-idea/
├── src/                  # Active Vue SPA: app shell, router, views, components
├── server/               # Active Hono API app and Bun production server
├── lib/                  # Mock DB, scoring, design tokens, Supabase helpers
├── types/                # Canonical TypeScript entities and payload shapes
├── data/                 # JSON flat-file database and seed script
├── supabase/             # SQL migrations for future Supabase persistence
├── app/                  # Legacy Next.js routes kept as migration reference
├── components/           # Legacy React components kept as migration reference
├── hooks/                # Legacy React hooks kept as migration reference
├── docs/                 # Human-readable docs: user guides, technical, reference, features, changelog
├── README.md             # Open-source landing page and documentation map
├── CONTRIBUTING.md       # Contributor workflow, code style, testing, and docs expectations
├── SECURITY.md           # Vulnerability reporting and secrets policy
└── scripts/              # Verification utilities
```

## Module Overview
| Module/Package | Purpose |
|---|---|
| `src` | Active Vue SPA, public/community views, organizer console views, route table, shared UI components. |
| `server` | Hono app with API routes plus production Bun static/API server. |
| `server/quiz-state.ts` | Extracted quiz state read model and explicit phase-advance helper. |
| `lib/mock-db` | Entity-specific async helpers over `data/*.json`; `index.ts` provides queued writes. |
| `lib/supabase` | Browser anon and server service-role Supabase clients for feedback and future migration. |
| `lib/scoring.ts` | Quiz point and streak-bonus calculation. |
| `lib/design-system.ts` | JS-side mirror of Tailwind/brand tokens. |
| `types/index.ts` | Event, talk, quiz, feedback, attendance, public meetup, and user types. |
| `supabase/migrations` | SQL schemas for tester feedback and event feedback campaigns. |
| `docs` + root community files | Open-source contributor onboarding, user guides, technical docs, reference docs, feature docs, security policy, and code of conduct. |
| `app`, `components`, `hooks` | Legacy Next/React implementation retained as migration reference. |

## Execution Entry Map
| Entry Point | Type | Notes |
|---|---|---|
| `src/main.ts:createApp(...).mount('#app')` | Runtime | Boots Vue, Pinia, router, global CSS, fonts, and toast CSS. |
| `src/router.ts:createRouter(...)` | Runtime | Declares active public and organizer route surface. |
| `server/app.ts:app` | HTTP | Hono API app used by Vite dev server and Bun production server. |
| `server/index.ts:Bun.serve(...)` | HTTP | Production server; routes `/api/*` to Hono and serves `dist/` assets. |
| `vite.config.ts:hono(...)` | Runtime | Wires Hono app into Vite dev server with `.env.local` loading. |
| `data/seed.ts` | CLI | Seeds/reset JSON mock database via `pnpm seed`. |
| `scripts/verify-public-meetups-api.ts` | CLI | Verifies public meetup API response/headers against website contract. |

## Data Flow
```text
Browser -> Vue Router view -> same-origin fetch('/api/...')
  -> server/app.ts Hono handler
  -> lib/mock-db/* or lib/supabase/*
  -> data/*.json or Supabase
  -> JSON response -> Vue view render
```

Quiz state is server-authoritative but polling-based: players poll `/api/quiz/state` every 1500ms; that GET handler may mutate session phase when timers expire or everyone has answered. Organizer feedback/attendance/checklist flows are admin-cookie protected on mutation routes.

## Multi-Layer Context Artifacts
| Artifact | Location | Why It Matters |
|---|---|---|
| Database schema | `supabase/migrations/20260530000000_feedback.sql`, `supabase/migrations/20260613000000_event_feedback_campaigns.sql` | Defines tester feedback and event feedback campaign/submission tables for migration beyond JSON files. |
| API contract | `docs/public-meetups-api.md`, `scripts/verify-public-meetups-api.ts` | Documents/verifies the read-only DevCongress.org meetup integration DTO. |
| Open-source docs | `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `docs/README.md` | Keeps the public README concise while routing contributors, organizers, integrators, and maintainers into deeper docs. |
| Runtime topology | `server/index.ts`, `vite.config.ts` | Confirms one-origin Hono API + SPA serving in dev and production; no Docker Compose found in scan. |
| Docker Compose | — not found in scan | Runtime currently local Vite/Bun without checked-in compose topology. |
| OpenAPI | — not found in scan | API routes are source-defined in `server/app.ts`; no OpenAPI spec exists. |

## External Dependencies
| Name | Purpose |
|---|---|
| `vue`, `vue-router`, `pinia` | Active SPA rendering, routing, and state foundation. |
| `vite`, `@vitejs/plugin-vue`, `@hono/vite-dev-server` | Dev/build tooling and same-origin Hono integration. |
| `hono`, `bun` | HTTP API framework and production runtime/static server. |
| `@supabase/supabase-js` | Browser/server Supabase clients. |
| `tailwindcss`, `tailwind-merge`, `class-variance-authority` | Styling utilities and variant/class composition. |
| `vue-sonner` | Global themed toast notifications. |
| `qrcode` | Quiz lobby join QR generation. |
| `pdf-parse` | Server-side PDF text extraction for prototype quiz draft generation. |
| `@usenavii/core` | Deterministic local avatar rendering for leaderboard profiles. |
| `vitest`, `vue-tsc`, `playwright` | Tests/typechecking and browser smoke tooling. |
