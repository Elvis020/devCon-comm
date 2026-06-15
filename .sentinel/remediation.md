# Remediation

## Immediate Actions
- Rotate any CRITICAL/HIGH secrets that are real credentials.
- Remove real secrets from tracked files and replace with environment placeholders.
- If a real secret appears in git history, assume it is exposed and rotate it even if later removed.

## Project-Specific Guidance
- Keep real values in local untracked env files only; checked-in env examples should contain placeholders.
- Supabase service role keys must remain server-only and never be exposed to browser code.
- Browser-safe values such as VITE_SUPABASE_URL and anon keys are lower risk, but should still be checked for environment correctness.
- Consider adding .env.local and .sentinel/ to .gitignore if the team wants local-only secret/report artifacts.

## Follow-Up Commands
- Re-run Sentinel after remediation.
- If any real credential was committed, rotate at the provider and consider history cleanup only after rotation.
