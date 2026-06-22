# Production Adapter Contracts

Local preview behavior is intentionally browser-only. Production must replace it with account-scoped Goalmatic adapters.

## Records

Every record must include:

- `account_id`
- `creator_id`
- `created_at`
- `updated_at`
- deterministic content hash or source hash where applicable

Tables:

| Record | Required behavior |
| --- | --- |
| Resumes | Metadata, active version, master designation, source file metadata. |
| Resume versions | Immutable text/canonical content, lineage, target job, accepted suggestions, export metadata. |
| Analyses | Immutable deterministic score results and rule evidence. |
| Jobs | Normalized job descriptions, match results, linked resume version. |
| Applications | Stable status keys, notes, next actions, submitted resume and cover letter version IDs. |
| Cover letters | Paragraphs, evidence sources, unsupported flags, export metadata. |
| Public shares | Explicit version-only shares; no findings, scores, jobs, applications, or source uploads. |

## Object Storage

Uploaded source files and exports belong in private storage. Public shares must render from selected version content only.

## Signed Exports

- Scope URLs to `account_id`, `resume_id`, and `version_id`.
- Use short expiration windows.
- Use HMAC or platform signing with timing-safe verification.
- Recheck authorization when the URL is redeemed.
- Do not embed raw resume text or provider keys in URLs.

## Retention Jobs

Production should support deletion for source files, parsed content, analyses, jobs, applications, cover letters, public shares, and export artifacts. Deletion jobs must be account-scoped and idempotent.
