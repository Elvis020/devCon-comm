# Sentinel Security Scan

Generated: 2026-06-15T15:28:35.751Z
Mode: full targeted scan
Commit-count guardrail: 24 commits

## Summary

| Severity | Count |
|---|---:|
| CRITICAL | 3 |
| HIGH | 9 |
| MEDIUM | 4 |
| LOW | 8 |

## Scope

- Checked `.sentinel-ignore` before scanning; no suppressions were found.
- Read `.codebase-indexer/docs/architecture.md` and `.codebase-indexer/docs/implementation.md` for high-value paths.
- Scanned env/config/source/docs/schema files with credential-focused patterns.
- Ran guarded git-history keyword scan because the repository is below the 500-commit threshold.

## Result

Findings were detected. See `.sentinel/secrets-found.md` and `.sentinel/remediation.md`.

## Notes

- Full secret values are intentionally not printed. Values are masked as first4...last4.
- LOW findings are likely placeholders or documentation examples, but should still be reviewed before deployment.
