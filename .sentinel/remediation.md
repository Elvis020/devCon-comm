# Remediation

## Immediate Actions

- Rotate any CRITICAL/HIGH secrets that are real credentials.
- Remove real secrets from tracked files and replace them with environment placeholders.
- If a real secret appears in git history, assume it is exposed and rotate it even if later removed.

## Project-Specific Follow-Up

- Review Supabase service-role usage and keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Keep `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in deployment secrets, not committed config.
- Treat documentation values as placeholders only; do not paste production credentials into docs.

## Hygiene

- Consider adding local-only scan outputs to `.gitignore` if the team does not want security reports committed.
- Re-run this scan before deployment changes or after adding new integrations.
