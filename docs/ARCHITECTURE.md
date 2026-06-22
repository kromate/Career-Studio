# Architecture

## Product Boundary

Career Studio is a job-seeker product, not an employer screening system. It
helps a user improve their own application materials and organize their search.
It must not claim to reproduce every employer's ATS or guarantee interviews.

## Implemented Application

The open-source application is a Nuxt 3, Vue, and TypeScript project. The
working local preview uses:

- browser-side PDF, DOCX, TXT, and pasted-text extraction;
- optional Gemini Lite assisted structuring for imported resume text;
- a canonical parsed-resume model;
- versioned deterministic scoring and matching modules;
- optional Tabstack JSON extraction for public job posting URLs;
- evidence-preserving rewrite suggestions;
- browser storage for contributor-friendly persistence;
- client-side PDF and DOCX export;
- optional shared-project Firebase Google authentication.

The local adapter is intentionally usable without private Goalmatic source code
or credentials. It is not the production storage model.

Production rollout must replace browser persistence with account-scoped
Goalmatic Tables and private object storage, resolve the active Goalmatic
account after authentication, and execute privileged workflows server-side.

## App-Owned Responsibilities

- Landing page, authentication experience, dashboard, and resume editor
- PDF/DOCX ingestion and canonical resume representation
- Versioned deterministic scoring engine
- Analysis reports, rewrite review, and document export
- Job-specific matching and application tracking
- Deployment, observability, releases, and contributor tooling

## Goalmatic-Owned Responsibilities

- User authentication and account context
- Structured product records in Goalmatic Tables
- AI agents and workflow execution
- Connected integrations and OAuth authorization
- Shared user and account lifecycle

## Identity and SSO

The app should use the same Firebase project as Goalmatic. Google sign-in and
email OTP therefore resolve to the same Firebase UID used by Goalmatic.

Firebase browser persistence is origin-scoped. A user authenticated on
`goalmatic.io` is not automatically authenticated on another app domain.

Recommended rollout:

1. Use the same Firebase project and login methods for identity parity.
2. Add a Goalmatic-owned SSO initiation endpoint.
3. Exchange a single-use, short-lived authorization code server-to-server.
4. Mint a Firebase custom token for the confirmed user.
5. Never put a reusable custom token, ID token, or account secret in a URL.

Every data operation must use a real authenticated user and active account ID.

## Data Model

Uploaded files belong in private object storage. Goalmatic Tables hold metadata,
structured resume content, analysis results, and product state.

Production tables:

| Table | Purpose |
| --- | --- |
| `job_search_resumes` | Source file metadata and active version |
| `job_search_resume_versions` | Imported, edited, rewritten, and tailored versions |
| `job_search_analyses` | Immutable score results and per-rule evidence |
| `job_search_jobs` | Saved jobs and normalized job descriptions |
| `job_search_applications` | Pipeline status, dates, notes, and submitted resume |
| `job_search_rewrite_sessions` | Suggestions and user approval decisions |

Every record includes `account_id` and `creator_id`. Analysis records also store
the input hash, parser version, scoring version, and taxonomy version.

## Resume Processing

```text
Upload
  -> virus/type/size validation
  -> deterministic text and layout extraction
  -> optional Gemini Lite structuring of already-extracted text
  -> canonical structured resume
  -> parse-quality report
  -> deterministic rule evaluation
  -> stored immutable analysis
  -> optional AI explanations and rewrite suggestions
  -> user-approved new resume version
  -> deterministic re-score
  -> PDF/DOCX export
```

The canonical representation contains sections, roles, dates, bullets, skills,
education, certifications, contact fields, page/layout facts, and extraction
warnings. Scoring consumes this representation rather than raw model output.

## Job Processing

```text
Public job posting URL
  -> server-side Tabstack JSON extraction with a job description schema
  -> normalized title, company, location, URL, and job description
  -> deterministic resume-to-job matching
  -> saved job and application pipeline record
```

Tabstack extraction is optional in local preview mode and requires a server-only
`TABSTACK_API_KEY`. The browser never receives the key, and numeric match scores
continue to come only from the deterministic matching engine.

## AI Safety

The rewrite agent may reorganize or rephrase evidence already present in the
resume. It must not invent employers, titles, dates, technologies, education,
certifications, responsibilities, or metrics.

Any potentially new fact is represented as an unresolved suggestion and needs
explicit user confirmation before it can enter an exportable resume.

## Privacy

Resumes contain sensitive personal data. The product must support:

- private storage and account-scoped authorization;
- encryption in transit and at rest;
- explicit deletion of files, extracted text, analyses, and exports;
- a documented retention policy;
- no model training on user documents by default;
- redacted logs and no resume text in analytics events;
- provider and subprocessors disclosure before launch.
