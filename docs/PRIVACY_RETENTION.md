# Privacy And Retention

Career Studio handles sensitive career data. The product must make storage, deletion, and provider behavior explicit.

## Local Preview

- Stores extracted resume text, analyses, jobs, applications, cover letters, settings, and local public shares in browser storage.
- Does not upload source files by default.
- Supports JSON export/import and local deletion from Settings.

## Production Requirements

- Private storage with account-scoped authorization for all resume and export artifacts.
- Encryption in transit and at rest for source files, parsed content, provider keys, and exports.
- No resume text in analytics, health checks, logs, or error payloads.
- No model training on user documents by default.
- Provider disclosures before sending content to optional AI services.
- User-visible export and deletion flows.

## Deletion Scope

A deletion request must cover:

- source uploads;
- parsed resume text;
- builder documents;
- resume versions and analyses;
- saved jobs and job descriptions;
- applications and next actions;
- cover letter drafts and exports;
- public resume shares;
- temporary export artifacts.

## Provider Keys

Provider keys must be server-side only in production, encrypted at rest, redacted from logs, and deletable by the user or account admin.
