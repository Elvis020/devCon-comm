# Patterns

## Naming Conventions

- **Files:** `kebab-case` for utility files; Vue SFCs use `PascalCase.vue`
- **Components:** `PascalCase` (`DashboardView`, `TalkReviewCard`)
- **Composables:** `use-` prefix for future Vue composables
- **API routes:** Active APIs live in `server/app.ts` or `server/routes/*`; legacy Next APIs remain under `app/api`
- **Types:** `PascalCase` interfaces, `camelCase` properties (`QuizSession`, `event_date`)
- **DB helpers:** `verb + entity` pattern (`getAllEvents`, `getEventById`, `createEvent`, `updateEvent`)
- **Constants:** `SCREAMING_SNAKE_CASE` (`POLL_INTERVAL_MS`, `REVEALING_DURATION_MS`)

---

## Folder Conventions

- `src/` — active Vue app shell, routes, views, stores, and future composables
- `server/` — active Hono API and Bun production entrypoint
- `app/(public)/` — legacy Next public routes kept as migration reference
- `app/(admin)/admin/` — legacy Next admin routes kept as migration reference
- `app/api/` — legacy Next API routes kept as migration reference
- `components/` — legacy React components split by domain (`admin/`, `archive/`, `slides/`) + `ui/`
- `lib/mock-db/` — one file per entity, all exported functions are async
- `hooks/` — legacy React hooks only; future Vue state should use Pinia stores/composables under `src/`

---

## Recurring Code Patterns

### Data Fetching in Vue Views
Active Vue views call Hono APIs with same-origin `fetch`:
```ts
const response = await fetch('/api/overview');
const overview = await response.json();
```

### Error Handling in API Routes
Use Hono context responses from active API handlers:
```ts
app.get('/api/events', async (c) => c.json(await getAllEvents()));
```

### Mock DB Access
Always use typed entity helpers from `lib/mock-db/` — never call `readData`/`writeData` directly from routes:
```ts
import { getAllEvents, createEvent } from '@/lib/mock-db/events';
const events = await getAllEvents();
```

### Answer Visibility Guard
In the quiz state endpoint, strip `correct_index` for the `'answering'` phase:
```ts
if (session.question_phase === 'answering') {
  const { correct_index, ...safeQuestion } = q;
  currentQuestion = safeQuestion;
} else {
  currentQuestion = q;  // full question in revealing/scoreboard
}
```

### Role Checks
Auth and role checks have not been migrated yet. Add them in the Hono server first so the Vue app can rely on same-origin session cookies.

### Design Token Usage
Use `dc-*` Tailwind classes for all brand colors. For programmatic style generation (e.g. status badges), use `getStatusBadge(status)` from `lib/design-system.ts`:
```ts
const { className, label } = getStatusBadge(talk.status);
```

---

## Testing Conventions

- Seed script at `data/seed.ts` serves as the manual data setup mechanism.
- Run with: `pnpm seed`
- Run tests with: `pnpm test`

---

## Anti-Patterns Observed

- **Writes inside GET handlers** — `GET /api/quiz/state` mutates the session to advance phases. This is intentional for prototype simplicity (server-driven timing), but would be replaced by a database trigger or cron in production.
- **No auth middleware** — active Hono APIs do not have server-side access control yet. Add session/role checks before exposing admin mutations.
- **Simulated delay in API routes** — `SIMULATED_DELAY_MS` `setTimeout` in every route. Remove before production.
