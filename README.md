# Career Studio by Goalmatic

Open-source tools for every career move, powered by Goalmatic.

Career Studio is building one place for the work behind a better career:
resume improvement, peer review, practice interviews, mentorship, company and
pay insights, job search, and career exploration.

The product is beginning with resume review: helping people understand and
improve their resumes, tailor a resume to a specific role, and create a clean
new version without inventing experience.

The project is community-first. Core methods and product decisions should be
open to inspection. When a feature carries a real infrastructure or human
delivery cost, that cost should be transparent and tied to delivering value,
not artificial lock-in.

## Product Direction

The first release focuses on a trustworthy resume workflow:

1. Upload a PDF or DOCX resume.
2. See whether the document parsed correctly.
3. Receive a repeatable Resume Quality Score with evidence for every check.
4. Review prioritized, line-level improvements.
5. Accept or reject AI-assisted rewrites without inventing experience.
6. Export a clean, ATS-readable resume.
7. Optionally add a job description for a separate Job Match Score.

The same resume, parser version, and scoring version must always produce the
same score. Generative AI may explain or rewrite content, but it does not
calculate the numeric score.

## Goalmatic Foundation

- Goalmatic Firebase Authentication provides the same user identity.
- Goalmatic account IDs scope every resume, analysis, job, and application.
- Goalmatic Tables store structured product data and analysis history.
- Goalmatic workflows run analysis, rewriting, reminders, and automations.
- Goalmatic AI agents provide coaching and evidence-preserving rewrite help.

Sharing the Firebase project means the same Google account maps to the same
Goalmatic user. Seamless cross-domain SSO will require a dedicated short-lived
token handoff; browser authentication state cannot simply be shared between
unrelated domains.

## Current Status

The full local-preview application is implemented in Nuxt 3 and includes:

- responsive public landing, methodology, privacy, and open-source pages;
- shared-project Firebase Google sign-in when configured;
- local email-code preview mode for contributors;
- PDF, DOCX, TXT, and pasted-text resume ingestion;
- extraction review before scoring;
- deterministic, versioned Resume Quality and Job Match scoring;
- evidence-linked findings and safe rewrite suggestions;
- immutable resume version history and PDF/DOCX export;
- saved jobs, job-aware tailoring, and an application pipeline;
- local account settings, preferences, and explicit data deletion.

Local preview stores extracted content in browser storage. Production
deployments must connect the documented Goalmatic identity, account context,
Tables, storage, and workflow adapters before handling real user data.

## Development

Requirements: Node.js 22 or newer and Yarn.

```bash
yarn install
yarn dev
```

The app runs at [http://localhost:3030](http://localhost:3030). It works without
credentials in local preview mode. Copy `.env.example` to `.env.dev` when you
need shared Goalmatic Firebase identity or the email OTP endpoint. Goalmatic
contributors should map the public Firebase web values from
`gm/frontend/.env.dev`; never copy server credentials into this app.

```bash
yarn test
yarn typecheck
yarn build
yarn lint
```

## Documentation

- [Market and product research](docs/RESEARCH.md)
- [UX direction](docs/UX_DIRECTION.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Deterministic scoring specification](docs/SCORING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Delivery roadmap](docs/ROADMAP.md)

## Open Source

This project is MIT licensed. See [CONTRIBUTING.md](CONTRIBUTING.md) and
[SECURITY.md](SECURITY.md) before contributing.
# Career-Studio
