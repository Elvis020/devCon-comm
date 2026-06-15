# Sentinel Security Scan

Date: 2026-06-14
Mode: full
Project: devcongress-comm-idea

## Scope
- Read .sentinel-ignore: none found
- Used .codebase-indexer/docs targeting: yes
- Working-tree files scanned: 155
- Git commit count: 17
- Git history scan: targeted regex scan run

## Summary
| Severity | Count |
|---|---:|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 0 |
| LOW | 6 |

## High-Value Paths Considered
- .env* including hidden env files
- server/app.ts, server/index.ts, vite.config.ts
- lib/supabase/*, types/supabase.ts
- supabase/migrations/*
- .codebase-indexer/docs/* for targeting only

## Result
Findings were detected. See `.sentinel/secrets-found.md` and `.sentinel/remediation.md`.

## Notes
- Full secret values are intentionally not printed. Values are masked as first4...last4.
- LOW findings are placeholder/public-config candidates and still deserve quick manual review when in tracked files.
