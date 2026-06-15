# Implementation

## Entry Points
| File | Role |
|---|---|
| `src/main.ts` | Mounts Vue app with Pinia and router; imports app/global styles and fonts. |
| `src/router.ts` | Active Vue route table for public pages, organizer console, event subroutes, and fallback 404. |
| `src/App.vue` | App shell, navigation, breadcrumbs, event tabs, global feedback bot/toaster mounting, quiz availability polling. |
| `server/app.ts` | Hono API handlers and SPA fallback for development/production. |
| `server/index.ts` | Bun production server for `/api/*` and `dist/` files. |
| `vite.config.ts` | Vite + Vue + Hono dev-server configuration; loads `.env.local`. |
| `data/seed.ts` | Mock DB seeding script. |
| `README.md` | Public open-source entry point with concise overview, badges, quick start, docs map, status, stack, and contribution/security links. |
| `docs/README.md` | Documentation map for contributors, organizers, integrators, and maintainers. |

## Per-Module Breakdown

### Hono Server
- **Entry point:** `server/app.ts`
- **Key functions/routes:** `/api/events*`, `/api/talks*`, `/api/quiz*`, `/api/attendance*`, `/api/feedback*`, `/api/public/meetups*`, `/api/auth/*`
- **Initialization:** Exported Hono app is consumed by Vite Hono plugin and `server/index.ts`.
- **Non-obvious logic:** `GET /api/quiz/state` mutates quiz session phase; feedback auto-open is derived from completed event status and 3-day window; checklist milestones can advance event status.

### Vue App Shell
- **Entry point:** `src/main.ts`, `src/App.vue`, `src/router.ts`
- **Key components:** `AdminEventTabs`, `FeedbackBot`, `AppToaster`, `ViewSkeleton`, `AppDropdown`, `AppNumberStepper`
- **Initialization:** `createApp(App).use(createPinia()).use(router).mount('#app')`.
- **Non-obvious logic:** Organizer routes use `VITE_ADMIN_BASE_PATH` through `src/admin-routes.ts`; shell polls `/api/quiz/active` so public Play link appears only for active/waiting sessions.

### Mock DB
- **Entry point:** `lib/mock-db/index.ts`
- **Key functions:** `readData<T>`, `writeData<T>`, plus entity helpers in `events.ts`, `talks.ts`, `feedback.ts`, `attendance.ts`, `event-checklists.ts`, etc.
- **Initialization:** Reads/writes JSON files under `data/` on demand.
- **Non-obvious logic:** Writes are serialized per filename using promise queues; reads are not locked. `event-checklists.ts` creates a default chronological run sheet on first read and infers already reached milestones from event status.

### Quiz
- **Entry points:** `src/views/admin/AdminQuizView.vue`, `src/views/PlayView.vue`, `src/views/PlayCodeView.vue`, quiz routes in `server/app.ts`, legacy `app/api/quiz/state/route.ts`
- **Key functions:** `calculatePoints`, `calculateStreakBonus`, question/session CRUD, paper-to-question generator.
- **Non-obvious logic:** Correct answers are hidden while `question_phase === 'answering'`; points scale with remaining time and streak bonuses.

### Feedback
- **Entry points:** `src/views/admin/AdminFeedbackView.vue`, `src/views/admin/AdminFeedbackOverviewView.vue`, `src/views/FeedbackView.vue`, `src/components/FeedbackBot.vue`, `lib/mock-db/feedback.ts`
- **Key behavior:** Event-scoped campaigns, dynamic questions, public form submission, month-by-month organizer reporting.
- **Non-obvious logic:** Manual `active` campaigns stay open for testing; draft campaigns can auto-open on completed events and close after 3 days.

### Attendance
- **Entry points:** `src/views/admin/AdminAttendanceOverviewView.vue`, `src/views/admin/AdminAttendanceView.vue`, `lib/luma-attendance.ts`, `lib/mock-db/attendance.ts`
- **Key behavior:** One current Luma CSV per event/month; monthly ledger, check-in/no-show/rate summary, venue-planning insights.
- **Non-obvious logic:** Attendance reporting starts from January 2026 and ignores future months.

### Public Meetup API
- **Entry points:** `/api/public/meetups*` in `server/app.ts`, `scripts/verify-public-meetups-api.ts`, `docs/public-meetups-api.md`
- **Key behavior:** Maps internal events/talks to DevCongress.org-compatible public DTOs with CORS and short cache headers.

### Supabase
- **Entry points:** `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `types/supabase.ts`, `supabase/migrations/*`
- **Key behavior:** Tester feedback currently uses Supabase; event feedback schema exists for future structured persistence.
- **Non-obvious logic:** Tester feedback avoids Supabase Auth and uses selected tester names for a trusted testing loop.

### Open-Source Documentation
- **Entry points:** `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `docs/README.md`
- **Key docs:** `docs/user-guides/community-guide.md`, `docs/user-guides/organizer-guide.md`, `docs/technical/local-development.md`, `docs/reference/environment-variables.md`, `docs/reference/routes.md`, `docs/features/*`
- **Key behavior:** README stays short and routes readers into focused docs; feature docs use `docs/features/_TEMPLATE.md` and are indexed from `docs/features/README.md`.
- **Non-obvious logic:** CI status badges are intentionally omitted until a real GitHub Actions workflow and remote exist; current badges are static stack/license/status badges only.

## Configuration
| Variable / Property | Default | Purpose |
|---|---|---|
| `VITE_ADMIN_BASE_PATH` | `/organizer-console` | Organizer route prefix. |
| `ADMIN_PASSWORD` | `devcon-admin` | Prototype organizer login password. |
| `ADMIN_SESSION_SECRET` | `devcon-local-session` | Same-origin admin cookie value. |
| `PUBLIC_APP_URL` | current request origin | Absolute public URLs in API payloads. |
| `VITE_SUPABASE_URL` | unset | Supabase project URL for browser/server clients. |
| `VITE_SUPABASE_ANON_KEY` | unset | Browser-safe Supabase key. |
| `SUPABASE_SERVICE_ROLE_KEY` | unset | Server-only Supabase service role key. |
| `DEFAULT_TIME_LIMIT` | `20` seconds | Quiz question time limit. |
| `DEFAULT_POINTS` | `1000` | Base quiz points. |
| `POLL_INTERVAL_MS` | `1500` | Quiz polling interval. |
| `SIMULATED_DELAY_MS` | `300` | Prototype fake latency. |

## Test Coverage
> Claude-inferred — not a coverage report. Based on naming convention and import/source scan.

| Module / Function | Test File |
|---|---|
| `lib/scoring.ts` / `calculatePoints`, `calculateStreakBonus` | `lib/scoring.test.ts` |
| Legacy quiz state route `app/api/quiz/state/route.ts` | `app/api/quiz/state/route.test.ts` |
| Active Hono server routes in `server/app.ts` | — no direct test found |
| Vue organizer/public views under `src/views/` | — no direct test found |
| `lib/mock-db/*` helpers | — no direct test found |
| `lib/luma-attendance.ts` | — no direct test found |
| Supabase helpers/migrations | — no direct test found |

## Cross-Repo References
Omitted: no `../workspace.md` found during scan.
