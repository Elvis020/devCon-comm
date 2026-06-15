# Secrets Found

Full values are masked. Do not paste raw secrets into chat or issues.

| # | Severity | Location | Identifier | Evidence Type | Masked Value |
|---:|---|---|---|---|---|
| 1 | LOW | project_brief.md:489 | CRON_SECRET | contextual-credential | ....... |
| 2 | MEDIUM | lib/supabase/server.ts:31 | autoRefreshToken | contextual-credential | ....... |
| 3 | MEDIUM | src/views/admin/AdminLoginView.vue:8 | password | contextual-credential | ....... |
| 4 | MEDIUM | src/views/admin/AdminLoginView.vue:19 | password | contextual-credential | JSON...fy({ |
| 5 | CRITICAL | .env.local:2 | VITE_SUPABASE_URL | contextual-credential | http...e.co |
| 6 | LOW | .env.local:3 | VITE_SUPABASE_ANON_KEY | contextual-credential | eyJh...moCs |
| 7 | CRITICAL | .env.local:7 | SUPABASE_SERVICE_ROLE_KEY | contextual-credential | eyJh...yjDw |
| 8 | LOW | .env.local:13 | ADMIN_PASSWORD | contextual-credential | devc...dmin |
| 9 | LOW | docs/deployment-cloudflare-supabase.md:438 | VITE_SUPABASE_URL | contextual-credential | ....... |
| 10 | LOW | docs/deployment-cloudflare-supabase.md:439 | VITE_SUPABASE_ANON_KEY | contextual-credential | ....... |
| 11 | CRITICAL | docs/deployment-cloudflare-supabase.md:440 | SUPABASE_SERVICE_ROLE_KEY | contextual-credential | ....... |
| 12 | LOW | docs/deployment-cloudflare-supabase.md:441 | ADMIN_PASSWORD | contextual-credential | ....... |
| 13 | LOW | docs/deployment-cloudflare-supabase.md:442 | ADMIN_SESSION_SECRET | contextual-credential | ....... |
| 14 | LOW | lib/supabase/browser.ts:18 | anonKey | contextual-credential | impo..._KEY |
| 15 | MEDIUM | lib/supabase/browser.ts:26 | autoRefreshToken | contextual-credential | ....... |
| 16 | HIGH | git history | commit e3c2df9 | history-secret-keyword; review changed files | value not printed |
| 17 | HIGH | git history | commit 8e4b19e | history-secret-keyword; review changed files | value not printed |
| 18 | HIGH | git history | commit 139d7b9 | history-secret-keyword; review changed files | value not printed |
| 19 | HIGH | git history | commit 134a123 | history-secret-keyword; review changed files | value not printed |
| 20 | HIGH | git history | commit be884bc | history-secret-keyword; review changed files | value not printed |
| 21 | HIGH | git history | commit 1d27b49 | history-secret-keyword; review changed files | value not printed |
| 22 | HIGH | git history | commit 97fc30d | history-secret-keyword; review changed files | value not printed |
| 23 | HIGH | git history | commit 74e19bd | history-secret-keyword; review changed files | value not printed |
| 24 | HIGH | git history | commit c9c4544 | history-secret-keyword; review changed files | value not printed |

## Severity Meaning

- CRITICAL means likely active secret in a tracked file or deploy config.
- HIGH means secret-like material or credential keywords appeared in git history.
- MEDIUM means unverified credential-like text that needs manual review.
- LOW means placeholder-like or documentation-only hits.
