# Secrets Found

Full values are masked. Do not paste raw secrets into chat or issues.

| # | Severity | Location | Key/Type | Pattern | Masked value |
|---:|---|---|---|---|---|
| 1 | LOW | docs/public-meetups-api.md:85 | PUBLIC_API_BASE_URL | env-assignment | http...-api |
| 2 | LOW | docs/deployment-cloudflare-supabase.md:194 | VITE_SUPABASE_URL | env-assignment | ....... |
| 3 | LOW | docs/deployment-cloudflare-supabase.md:195 | VITE_SUPABASE_ANON_KEY | env-assignment | ....... |
| 4 | LOW | docs/deployment-cloudflare-supabase.md:196 | SUPABASE_SERVICE_ROLE_KEY | env-assignment | ....... |
| 5 | LOW | docs/deployment-cloudflare-supabase.md:197 | ADMIN_PASSWORD | env-assignment | ....... |
| 6 | LOW | docs/deployment-cloudflare-supabase.md:198 | ADMIN_SESSION_SECRET | env-assignment | ....... |
| 7 | HIGH | git history | commit 134a123 | history-secret-keyword; review changed files | value not printed |
| 8 | HIGH | git history | commit c9c4544 | history-secret-keyword; review changed files | value not printed |

## Interpretation
- CRITICAL means likely secret in a tracked file or deploy config.
- HIGH means likely-active credential artifact or history exposure.
- MEDIUM means credential-like string requiring manual review.
- LOW means placeholder/public-config-like hit.
