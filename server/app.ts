import { Hono } from 'hono';
import { getAllEvents } from '@/lib/mock-db/events';
import { getAllQuizParticipants } from '@/lib/mock-db/quiz-participants';
import { getAllTalks } from '@/lib/mock-db/talks';
import { getAllUsers } from '@/lib/mock-db/users';
import type { LeaderboardEntry } from '@/types';

const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    runtime: typeof Bun === 'undefined' ? 'vite-dev-server' : 'bun',
  });
});

app.get('/api/overview', async (c) => {
  const [events, talks, leaderboard] = await Promise.all([
    getAllEvents(),
    getAllTalks(),
    buildLeaderboard(),
  ]);

  return c.json({ events, talks, leaderboard });
});

app.get('/api/events', async (c) => {
  return c.json(await getAllEvents());
});

app.get('/api/talks', async (c) => {
  const eventId = c.req.query('eventId');
  const talks = await getAllTalks();
  return c.json(eventId ? talks.filter((talk) => talk.event_id === eventId) : talks);
});

app.get('/api/leaderboard', async (c) => {
  return c.json(await buildLeaderboard());
});

app.get('*', (c) => {
  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevCon-Comm</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`);
});

async function buildLeaderboard(): Promise<LeaderboardEntry[]> {
  const [participants, users] = await Promise.all([getAllQuizParticipants(), getAllUsers()]);
  const usersById = new Map(users.map((user) => [user.id, user]));

  return [...participants]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 10)
    .map((participant, index) => ({
      user_id: participant.user_id,
      nickname: usersById.get(participant.user_id)?.nickname ?? participant.nickname_used,
      total_score: participant.total_score,
      rank: index + 1,
      streak_count: participant.current_streak,
    }));
}

export default app;
