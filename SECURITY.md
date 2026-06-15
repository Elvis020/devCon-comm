# Security Policy

DevCongress Community is currently a prototype moving toward production-ready community operations. Please report vulnerabilities responsibly and do not disclose them publicly before maintainers have had time to respond.

## Supported Scope

Security reports are welcome for:

- Authentication and organizer route bypasses
- Exposed secrets or unsafe environment variable usage
- Supabase service-role misuse
- Unsafe file upload handling
- Cross-site scripting or unsafe rendered user content
- Public API data leaks
- Attendance or feedback data exposure

## Reporting a Vulnerability

Please send a private report to the maintainers. If the repository host supports private vulnerability reporting, use that first. Otherwise, contact the DevCongress maintainers through the private channel listed on the organization profile.

Include:

- A short summary
- Affected route, API, or file path
- Reproduction steps
- Impact
- Suggested fix, if you have one

Do not include real secrets in public issues, pull requests, or chat logs.

## Secrets Policy

- Keep `.env.local` out of commits.
- Treat `SUPABASE_SERVICE_ROLE_KEY` as server-only.
- Browser variables must use only public/anon credentials.
- Rotate any key that appears in git history or public logs.
- Use masked values when documenting findings.

## Maintainer Response

Maintainers should acknowledge valid reports, triage severity, patch privately where needed, and publish a short disclosure note after the fix is available.
