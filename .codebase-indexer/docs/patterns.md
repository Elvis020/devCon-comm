# Patterns

## Naming Conventions
- Files: `kebab-case` for utilities; Vue SFCs use `PascalCase.vue`.
- Components/views: `PascalCase` (`DashboardView`, `AdminEventView`, `ViewSkeleton`).
- Types/interfaces: `PascalCase` with snake_case fields where matching persisted data (`event_date`, `created_at`).
- Mock DB helpers: `verb + entity` (`getAllEvents`, `getEventById`, `createEvent`, `updateEvent`).
- Constants: `SCREAMING_SNAKE_CASE` (`POLL_INTERVAL_MS`, `DEFAULT_POINTS`).
- Active organizer routes: build paths via `adminPath(...)`, not hardcoded `/admin`.

## Folder Conventions
- `src/` contains active Vue application code; `src/views/admin/` holds organizer screens.
- `src/components/ui/` holds shared active Vue primitives; `src/lib/` holds browser-side helpers like `notify`.
- `server/` contains active Hono/Bun server code.
- `lib/mock-db/` has one async helper module per entity and should be used instead of raw JSON reads in routes.
- Root docs (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`) are for open-source entry points and project policy.
- `docs/user-guides/`, `docs/technical/`, `docs/reference/`, and `docs/features/` hold deeper docs so the README stays concise.
- `docs/features/_TEMPLATE.md` is the starting point for new feature docs; link new feature docs from `docs/features/README.md`.
- `app/`, `components/`, and `hooks/` are legacy Next/React references; avoid adding new active features there unless intentionally preserving compatibility.
- `docs/` is the existing human-facing index; `.codebase-indexer/docs/` is the generated indexer cache.

## Recurring Code Patterns
- Data fetching: Vue views use same-origin `fetch('/api/...')` and local refs/computed state.
- API errors: Hono routes return `c.json({ error }, status)`; admin mutations call `requireAdmin(c)` first.
- Persistence: Hono routes call typed helpers from `lib/mock-db/*`; `writeData` serializes writes per JSON file.
- UI loading: use `ViewSkeleton` variants instead of bare loading text.
- Notifications: call `notify` from `src/lib/notify.ts`; avoid direct `toast` imports in views.
- Styling: use `dc-*` Tailwind tokens, `src/styles.css` component classes, and keep `tailwind.config.ts` + `lib/design-system.ts` synchronized.
- Motion: use transform/opacity/color transitions with `--motion-fast`, `--motion-smooth`, `--motion-spring`; respect `prefers-reduced-motion`.
- Admin links: preserve hub return context via query params like `?from=attendance` or `?from=feedback` where supported.
- README style: keep the landing page short, badge row honest/static unless real CI exists, and move detailed setup, routes, features, and operational guidance into linked docs.

## Co-Change Coupling (Git History)
| File A | File B | Coupling Signal |
|---|---|---|
| — not determinable from git history | — | Coupling helper was not run; skill rules say to suggest, not auto-run, the coupling script. |

## Testing Conventions
- Test runner: `pnpm test` (`vitest run`).
- Typecheck: `pnpm typecheck` (`vue-tsc --noEmit`).
- Existing test files are colocated near covered modules (`lib/scoring.test.ts`, `app/api/quiz/state/route.test.ts`).
- Browser smoke checks are ad hoc via Playwright scripts, not formal committed tests.
- Seed/reset local mock data with `pnpm seed`.

## Anti-Patterns Observed
- Keep `GET /api/quiz/state` read-only; use `POST /api/quiz/state/advance` for polling-era phase progression.
- JSON flat files fail loudly on corrupt data and use atomic temp-file rename on write, but still lack relational integrity and multi-process write safety.
- Broad `server/app.ts` route file is large and centralizes many domains.
- Legacy Next/React and active Vue/Hono code coexist; check active route surface before editing.
- Several active UI/server modules currently have no direct automated tests.
