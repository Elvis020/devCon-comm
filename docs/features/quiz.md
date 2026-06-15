# Quiz

## Status

Preview.

## Overview

The quiz flow is a Kahoot-style community game for meetup days. Organizers prepare questions, open a lobby, and attendees join with a code.

The current implementation is useful for prototyping but not yet treated as the phase-one production focus.

## User Flows

- Organizer creates or edits quiz questions for an event.
- Organizer opens a quiz lobby.
- Attendees join through `/play/:code`.
- The server controls question phases while players poll for state.
- Scores update based on correctness, speed, and streak bonuses.

## Key Files

| File | Purpose |
|---|---|
| `src/views/admin/AdminQuizView.vue` | Quiz builder and host controls |
| `src/views/PlayView.vue` | Public quiz landing and inactive-session state |
| `src/views/PlayCodeView.vue` | Player join/play experience |
| `lib/scoring.ts` | Points and streak-bonus calculations |
| `server/app.ts` | Quiz API routes |
| `server/quiz-state.ts` | Read-only state response and explicit phase-advance helper |
| `data/questions.json` | Local seeded questions |
| `data/quiz-sessions.json` | Local quiz sessions |

## Known Gaps

- Polling is used instead of WebSockets or Supabase Realtime.
- Clients call `POST /api/quiz/state/advance` before `GET /api/quiz/state` as an explicit polling-era phase tick; this should still become a job, Durable Object, or realtime-backed state machine before larger live games.
- Realtime scale testing is still needed before public launch.

## Testing

```bash
pnpm test
pnpm typecheck
```

Manual checks:

- Create questions from the organizer console.
- Open a lobby.
- Join from a second browser or private window.
- Answer questions and verify scoring behavior.
