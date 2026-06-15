# Environment Variables

Use `.env.local` for local development. Do not commit real credentials.

| Variable | Required | Browser-safe | Purpose |
|---|---:|---:|---|
| `VITE_SUPABASE_URL` | Optional locally | Yes | Supabase project URL used by browser and server helpers |
| `VITE_SUPABASE_ANON_KEY` | Optional locally | Yes | Public Supabase anon key for browser-safe operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional locally, required for server Supabase writes | No | Server-only key for privileged Supabase operations |
| `VITE_ADMIN_BASE_PATH` | No | Yes | Organizer route prefix; defaults to `/organizer-console` |
| `ADMIN_PASSWORD` | No locally, yes for deployments | No | Prototype organizer login password |
| `ADMIN_SESSION_SECRET` | No locally, yes for deployments | No | Prototype organizer cookie/session secret |
| `PUBLIC_APP_URL` | No | No | Absolute base URL used in API payloads when request origin is unavailable |

## Rules

- Only variables prefixed with `VITE_` are exposed to browser code.
- Never prefix the Supabase service-role key with `VITE_`.
- Rotate any real key that appears in git history, logs, screenshots, or public issues.
- Keep `.env.local` local and use deployment secret stores for hosted environments.
