# Career Studio Complete Implementation Plan

This plan combines the lessons from [Learning from `srbhr/Resume-Matcher`](IMPLEMENTATION_FROM_RESUME_MATCHER.md) and [Learning from Reactive Resume](REACTIVE_RESUME_IMPLEMENTATION_README.md) into one execution-oriented roadmap for Career Studio.

The goal is not to copy either product. Resume Matcher shows the value of an end-to-end tailoring workflow: master resume, job match, suggestions, cover letters, export, and application tracking. Reactive Resume shows the value of a polished builder: canonical data, templates, live preview, privacy, portability, self-hosting, and contributor-grade documentation.

Career Studio should combine those lessons into one product thesis:

```text
Trustworthy resume intelligence -> evidence-backed editing -> job-specific tailoring -> export -> application workflow
```

Numeric scores remain deterministic. AI may parse, explain, ask questions, draft, and suggest, but it must not calculate scores or silently add unsupported career facts.

## Decision Framework

Use this effort and return model when choosing implementation order.

### Effort

| Effort | Meaning |
| --- | --- |
| XS | 0.5-1 day, mostly documentation or small UI/API work |
| S | 1-3 days, limited files and low architectural risk |
| M | 1-2 weeks, touches a workflow or shared domain model |
| L | 2-4 weeks, cross-cutting product surface with new UI, state, and tests |
| XL | 1+ month, platform-level work or broad product expansion |

### Return

| Return | Meaning |
| --- | --- |
| Very high | Directly improves the core user outcome or unlocks several later features |
| High | Clear user trust, conversion, export, or contributor value |
| Medium | Useful workflow improvement, but not foundational |
| Low | Nice to have, mostly polish, or too early for current stage |

### Priority Rules

1. Prefer high-return work that strengthens trust, evidence, and export outcomes.
2. Prefer work that unlocks multiple later features.
3. Avoid large UI surfaces before the canonical model, evidence locations, and version lineage are stable.
4. Keep production safety work visible even when local-preview mode can defer implementation.
5. Do not prioritize AI expansion ahead of deterministic scoring, user approval, and privacy guardrails.

## Highest Return Per Effort

These are the best near-term implementation bets.

| Rank | Initiative | Effort | Return | Why it wins |
| --- | --- | --- | --- | --- |
| 1 | Job Coverage Review data model | M | Very high | Makes existing Job Match Score explainable and unlocks side-by-side UI, tailoring, enrichment, and cover letters |
| 2 | Master resume and tailored-version lineage | S-M | Very high | Creates the mental model for every job-specific workflow and application audit trail |
| 3 | Export safety dialog | S | High | Increases trust at the moment users create real career materials |
| 4 | Application tracker auto-population from tailored versions | S-M | High | Connects tailoring to the already-implemented pipeline with little conceptual overhead |
| 5 | Deterministic fixture tests for matching, export, and versioning | M | Very high | Protects the product's core promise and makes later refactors safer |
| 6 | Career Studio JSON export/import | M | High | Turns data ownership into a real product capability and supports migration/debugging |
| 7 | Privacy and Data settings page | M | High | Makes trust visible and prepares production deletion/export flows |
| 8 | Job Coverage Review UI | M-L | Very high | Gives users a concrete answer to "what is missing for this role?" |
| 9 | Canonical schema hardening and hashing | M-L | Very high | Ensures scoring, export, matching, rewrite, import, and version history all share one source of truth |
| 10 | README and contributor docs upgrade | S | Medium-high | Improves open-source adoption and helps coding agents/contributors work safely |

## Consolidated Backlog By Effort And Benefit

### Foundation And Trust

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Canonical resume schema hardening | M-L | Very high | Current parsed resume model | P0 | Formalize content, presentation, version metadata, parser/scorer versions, content hash, and source metadata. This should happen before large template/import work. |
| Resume normalization and content hashing | M | Very high | Canonical schema | P0 | Identical resume content should produce identical canonical JSON and hash. Scoring and match caching should use this. |
| Master resume designation | S-M | Very high | Resume state and versions | P0 | One active master resume per account/local workspace; tailored versions link back to master version. |
| Version lineage for tailored/exported resumes | S-M | Very high | Version model | P0 | Store source version, job ID, version kind, accepted suggestions, and export metadata. |
| Deterministic test fixture suite expansion | M | Very high | Existing Vitest setup | P0 | Add fixtures for scoring stability, matching stability, export inputs, import roundtrip, repeated terms, aliases, and unsupported rewrite facts. |
| Export safety dialog | S | High | Existing export flow | P0 | Show active version, score, job match score when present, unresolved suggestions, parse warnings, hidden sections, and ATS warnings. |
| Privacy and Data settings page | M | High | Existing settings and local storage | P0 | Export all data, delete one resume, delete all local data, view retention/provider policy, and later production account deletion. |
| Redaction and no-resume-text logging rules | S-M | High | Server/API conventions | P0 for production | Document and enforce that resume text does not appear in logs, analytics, or error payloads. |

### Job Matching And Tailoring

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Expanded `JobCoverageResult` model | M | Very high | Existing matching engine | P0 | Required, preferred, responsibilities, credentials, matched evidence, missing evidence, warnings, scoring version, taxonomy version. |
| Requirement extraction and normalization | M | Very high | Job description parsing | P0 | Normalize pasted jobs and URL-imported jobs into stable requirements. Keep deterministic behavior. |
| Side-by-side Job Coverage Review UI | M-L | Very high | Coverage result model | P1 | Left: job requirements. Right: resume evidence. Top: match summary. Bottom: tailor/export/application actions. |
| Highlighted resume evidence component | M | High | Evidence locations | P1 | Highlight only evidence-backed matches. Separate missing required terms from matched terms. |
| Missing requirements list | S-M | High | Coverage model | P1 | Prioritized list of unsupported requirements with safe actions: add evidence if true, ignore, or start enrichment. |
| Tailored-resume-to-application tracker flow | S-M | High | Version lineage and jobs | P1 | After tailoring, prompt to create or update an application card linked to the exact version used. |
| Application pipeline stable status keys | S | Medium-high | Tracker state | P1 | Use stable keys like `saved`, `drafting`, `applied`, `interview`, `offer`, `rejected`, `withdrawn`; labels can be localized later. |
| Keyword stuffing protection tests | S-M | High | Matching tests | P1 | Award coverage once per requirement and flag suspicious repetition. |

### Builder, Preview, And Templates

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Resume workspace shell | L | Very high | Canonical model and current builder | P1 | Three-panel workspace: editor/findings, live preview, design/export/versions/jobs. This becomes the main action surface. |
| Live page preview/artboard | M-L | Very high | Template rendering | P1 | A4/Letter aspect ratios, zoom, page navigation, overflow warnings, and selected-finding highlights. |
| Template registry v1 | M | High | Presentation model | P1 | Small registry with `ats-clean`, `modern-single`, `compact-two-column`, and `executive` or equivalent Studio templates. |
| Shared resume rendering primitives | M-L | High | Template registry | P1 | Shared page, section, heading, text, contact item, date range, and skill primitives to avoid one-off templates. |
| Template formatting controls | M | High | Presentation model | P2 | Margin, density, font scale, accent color, contact icons, section order, optional sections. Use constrained options first. |
| Template render tests | S-M | High | Template system | P2 | Verify all templates render required sections and avoid mutating canonical content. |
| Drag-and-drop ordering | M | Medium | Editor state | P2 | Section, bullet, and skill ordering with keyboard-accessible move controls and undo support. |
| Command palette | M | Medium | Stable route/actions | P2 | Cmd/Ctrl+K for upload, export, add job, run analysis, open findings, settings, delete local data, and dark mode. |

### Import, Export, And Portability

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Career Studio JSON export | S-M | High | Canonical model | P1 | Full-fidelity local export with format name, format version, exportedAt, resume, versions, analyses, jobs, and applications. |
| Career Studio JSON import | M | High | Export format and validation | P1 | Validate version, recompute hashes, preserve historical analyses as historical, and rescore active content with current engine. |
| JSON Resume import | M | Medium-high | Canonical model | P2 | Map basics, work, education, skills, projects, certificates, awards, languages, publications, and volunteer. |
| JSON Resume export | M | Medium | Canonical model | P2 | Useful portability feature, but less urgent than Career Studio full-fidelity export. |
| Plain text export | S-M | Medium | Export pipeline | P2 | Useful for ATS/debug workflows. |
| Production signed export URLs | M | High for production | Server export flow and auth | P0 for production | Short-lived, account-scoped, version-scoped, HMAC-signed, timing-safe, and authorization-checked again. |
| Export preview parity tests | M | High | Preview and export renderers | P2 | Reduce mismatch between what users see and what downloads. |

### AI-Assisted Workflows

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Patch-based rewrite contract | M | Very high | Existing rewrite flow | P0-P1 | AI returns target path, original text, suggested text, rationale, risk flags, and status. Acceptance creates a new version. |
| Unsupported-fact detection tests | M | Very high | Rewrite contract | P0-P1 | Guard metrics, dates, titles, companies, degrees, certifications, and technologies. |
| Resume Evidence Enrichment Wizard | M-L | High | Findings, evidence locations, rewrite contract | P2 | Ask up to 6 targeted questions, then generate suggestions grounded in original content and user answers. |
| Enrichment evidence mapping | M | High | Enrichment wizard | P2 | Every proposed fact maps to source evidence or a user answer. Unsupported facts remain blocked or confirmation-gated. |
| AI provider settings | M | Medium-high | Provider abstraction | P2 | Provider, model, base URL, key handling, test connection, local-only disclosure. Scoring continues without AI. |
| OpenAI-compatible/Ollama support | M-L | Medium | Provider settings | P3 | Valuable for self-hosters and local AI users, but should wait until provider security and workflows are stable. |

### Cover Letters And Career Workflow

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Cover Letter Studio v1 | L | High | Resume version, job, rewrite guardrails | P2 | Dedicated route for grounded drafts using approved resume evidence, job description, writing preferences, and user notes. |
| Paragraph-level evidence sidebar | M | High | Cover letter data model | P2 | Shows which resume/job facts support each paragraph. Blocks unsupported claims before export. |
| Cover letter tone and length controls | S-M | Medium | Cover Letter Studio | P3 | Direct, warm, concise, formal; short email, standard letter, recruiter note. |
| Cover letter export | M | Medium-high | Cover Letter Studio | P3 | PDF, DOCX, copy-to-clipboard. Link exported draft to job and resume version. |
| Application tracker attachments | S-M | High | Tracker and cover letters | P2-P3 | Attach resume version, cover letter version, export metadata, notes, and follow-up dates to the application card. |
| Follow-up reminders | M | Medium | Application tracker | P3 | Useful search workflow feature after the tracker and version audit trail are stable. |

### Privacy, Production, And Self-Hosting

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Health endpoint | XS-S | Medium | Server API | P1 | Safe health response with version and configured checks. No secrets, user IDs, or resume text. |
| Environment documentation | S | Medium-high | Current env usage | P1 | Explain local preview, Firebase, Tabstack, AI providers, and production-only secrets. |
| Self-hosting docs | S-M | Medium-high | Env docs | P2 | Document local preview, standalone self-hosted, and Goalmatic production modes. |
| Dockerfile and Compose | M | Medium | Deployment decisions | P2 | Useful for contributors/self-hosters; defer complex production DB/storage until adapter contracts are settled. |
| Production Goalmatic adapter contracts | L-XL | Very high for launch | Stable local adapter behavior | P0 for production | Account-scoped Tables, private object storage, workflow execution, retention jobs, and auth/account isolation. |
| Provider key security | M-L | Very high for production AI | Provider settings | P0 for production AI | Store server-side only, encrypt at rest, redact logs, allow deletion, never send keys to browser. |
| Privacy and retention documentation | S-M | High | Product/legal decisions | P0 for production | Exact retention, deletion, provider disclosure, subprocessors, and no-training defaults. |

### Testing, Documentation, And Community

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| README upgrade with screenshots/workflow | S-M | Medium-high | Stable product screenshots | P1 | Clarify what the product does, why it is different, quick start, docs, privacy, contribution, and security. |
| Design system documentation | S-M | Medium | Existing UI conventions | P2 | Trustworthy, resume-first, calm AI, transparent scoring, accessible productivity, professional defaults. |
| Feature docs under `docs/features` | S-M | Medium-high | First prioritized features | P1 | Job coverage, enrichment, cover letters, template system, AI provider settings, application tracker. |
| Engineering docs | S-M | Medium | Existing setup/test scripts | P2 | Local development, testing strategy, release checklist, privacy/security, agent workflow. |
| Playwright e2e setup | M-L | High | Stable UI routes | P2 | PR-gate upload/parse/score, edit/autosave, export, job match, and data deletion. AI flows should use deterministic mocks. |
| Optional local hooks | S | Medium | Stable scripts | P3 | Pre-push can run typecheck, tests, deterministic fixtures, locale parity later, and build if fast. |
| Locale key parity tests | S-M | Medium | i18n setup | P3 | Prepare for i18n without translating the entire app immediately. |

### Later Expansion

| Initiative | Effort | Return | Dependencies | Recommended priority | Notes |
| --- | --- | --- | --- | --- | --- |
| Internationalized UI | L | Medium | i18n setup and message catalogs | P3 | English first. Add Spanish/French/Portuguese based on demand. Scoring language must be disclosed. |
| RTL export/template support | L | Medium | i18n and templates | P4 | Valuable later, but risky before templates stabilize. |
| Public resume sharing | M-L | Medium | Version privacy model | P3-P4 | Share explicit resume versions only. No private findings, scores, applications, or source uploads by default. |
| Template screenshot generation | M | Low-medium | Template registry | P4 | Useful for polish and docs after templates stabilize. |
| Community template contribution process | M | Low-medium | Template system and tests | P4 | Needs template rules, tests, and review process first. |
| Browser extension for saving jobs | XL | Medium-high later | Stable jobs/tracker API | P4 | Strong distribution feature, but later than core workspace and production safety. |
| Application assistant/autofill | XL | Medium-high later | Tracker, versioning, browser extension, audit trail | P5 | Must be review-gated and fully auditable. |
| Controlled auto-apply | XL | Low now, potentially high later | Trust, audit, exclusions, limits, emergency stop | Last | High risk. Never default. |

## Recommended Roadmap

### Milestone 0: Planning And Docs Cleanup

Goal: Turn research into an executable plan.

Deliverables:

- This consolidated implementation plan.
- README link to the consolidated plan.
- Feature doc stubs for job coverage review, enrichment wizard, template system, and cover letter studio.
- Decision on whether `docs/IMPLEMENTATION_FROM_RESUME_MATCHER.md` and `docs/REACTIVE_RESUME_IMPLEMENTATION_README.md` remain source research docs or are archived after this plan is accepted.

Acceptance criteria:

- Contributors can see the implementation order.
- The plan clearly separates high-return near-term work from later expansion.

### Milestone 1: Trust And Data Foundation

Goal: Make every later feature operate on stable, testable data.

Deliverables:

- Canonical resume schema hardening.
- Resume normalization and content hashing.
- Master resume flag and tailored-version lineage.
- Patch-based rewrite contract.
- Deterministic fixture tests for scoring, matching, versioning, and unsupported facts.
- Export safety dialog.
- Privacy and Data settings page.

Acceptance criteria:

- Same canonical input produces the same hash and score.
- Tailored versions always identify source version and target job.
- Unsupported AI facts cannot enter exportable content without user confirmation.
- Users can understand what they are exporting and delete local data.

### Milestone 2: Explainable Job Coverage

Goal: Make job matching transparent and actionable.

Deliverables:

- Expanded `JobCoverageResult` model.
- Requirement extraction and normalization.
- Required/preferred/responsibility coverage breakdown.
- Matched and missing evidence locations.
- Side-by-side Job Coverage Review UI.
- Missing requirements list.
- Tailored-resume-to-application tracker flow.

Acceptance criteria:

- Users can see exactly which job requirements are supported by resume evidence.
- Required and preferred gaps are visually distinct.
- Match score remains deterministic and reproducible.
- Tailoring can create or update an application card linked to the submitted version.

### Milestone 3: Workspace, Preview, And Templates

Goal: Turn analysis into an editing workspace where users can act immediately.

Deliverables:

- Resume workspace shell.
- Live page preview with A4/Letter support.
- Template registry v1.
- Shared resume rendering primitives.
- Basic design controls.
- Template render tests.

Acceptance criteria:

- Users can edit structured content and see preview updates.
- Users can switch templates without losing content.
- Export output matches preview closely enough for reliable use.
- Design customization does not affect deterministic scores except documented parseability/layout checks.

### Milestone 4: Portability And Export Expansion

Goal: Make ownership and portability real product features.

Deliverables:

- Career Studio JSON export.
- Career Studio JSON import.
- JSON Resume import prototype.
- Plain text export if low-risk.
- Export/import roundtrip tests.

Acceptance criteria:

- Exported Career Studio JSON imports into a clean browser profile.
- Imported resumes are rehashed and rescored using the current deterministic engine.
- Invalid imports fail with user-readable validation errors.

### Milestone 5: Evidence-Gathering AI Workflows

Goal: Let AI help users improve content without inventing facts.

Deliverables:

- Resume Evidence Enrichment Wizard.
- Enrichment questions capped at 6 per session.
- Suggestions mapped to original evidence or user answers.
- Provider settings v1 for local preview.
- Provider failure handling.

Acceptance criteria:

- Every AI suggestion shows source evidence or user answer support.
- Unsupported facts are blocked or explicitly confirmation-gated.
- Provider failures do not corrupt resume versions.
- Deterministic scoring works without AI configuration.

### Milestone 6: Cover Letters And Search Workflow

Goal: Extend resume and job evidence into a broader application workflow.

Deliverables:

- Cover Letter Studio route.
- Grounded draft generation.
- Paragraph-level evidence sidebar.
- Tone and length controls.
- Cover letter export.
- Tracker attachments and follow-up dates.

Acceptance criteria:

- Cover letters are linked to a job and resume version.
- Unsupported claims cannot be exported without resolution.
- Users can attach the exact resume and cover letter versions to an application card.

### Milestone 7: Production, Self-Hosting, And Quality Gate

Goal: Prepare the project for real users, contributors, and deployers.

Deliverables:

- Health endpoint.
- Environment documentation.
- Self-hosting documentation.
- Dockerfile and Compose files.
- Playwright e2e PR gate for deterministic flows.
- Production Goalmatic adapter contracts.
- Privacy and retention documentation.
- Provider key security for production AI.

Acceptance criteria:

- Contributors can run the app locally without private credentials.
- Self-hosters understand the required services and limits of each mode.
- Core upload, parse, score, edit, export, job match, and deletion flows are testable in CI.
- Production handling of real resume data has account isolation, private storage, redacted logs, retention, and deletion.

### Milestone 8: Scale And Distribution

Goal: Add power-user and growth features after the core workflow is trusted.

Deliverables:

- Command palette.
- Drag-and-drop plus keyboard reordering.
- i18n readiness and locale parity tests.
- Public sharing for explicit resume versions.
- Browser extension for saving jobs.
- Application assistant/autofill.
- Controlled auto-apply only after strong audit controls exist.

Acceptance criteria:

- Power-user workflows are faster without becoming pointer-only.
- Shared resumes expose only the selected public version.
- Autofill and automation remain review-gated, reversible where possible, rate-limited, and auditable.

## First Four Implementation Slices

These slices are the strongest way to start because each one creates shippable value and reduces risk for later work.

### Slice 1: Job Coverage Foundation

Effort: M

Return: Very high

Build:

- Expanded match result model.
- Requirement categories.
- Evidence locations.
- Missing evidence items.
- Tests for exact match, alias match, repeated terms, and missing required requirements.

Why first:

- It turns the existing Job Match Score into an explainable feature.
- It gives enrichment, tailoring, cover letters, and the tracker shared evidence data.

### Slice 2: Version Lineage And Export Confidence

Effort: S-M

Return: Very high

Build:

- Master resume flag.
- Source version and target job links for tailored versions.
- Export safety dialog.
- Export metadata attached to versions/applications.

Why first:

- It creates auditability with relatively contained code changes.
- It makes exports safer before introducing more templates and AI workflows.

### Slice 3: Data Ownership

Effort: M

Return: High

Build:

- Career Studio JSON export.
- Career Studio JSON import.
- Data deletion improvements in settings.
- Roundtrip tests.

Why first:

- It turns privacy and ownership from documentation into product behavior.
- It helps contributors debug and test workflows with portable fixtures.

### Slice 4: Workspace And Preview V1

Effort: L

Return: Very high

Build:

- Three-panel workspace shell.
- Live resume preview panel.
- Findings and job coverage actions.
- Design/export/version controls placeholder.

Why first after the data slices:

- It makes Career Studio feel like a real workspace instead of a sequence of pages.
- It becomes the place where templates, enrichment, cover letters, and job workflows connect.

## What To Defer

Do not prioritize these until the core evidence, versioning, and export workflows are stable.

| Defer | Reason |
| --- | --- |
| Full monorepo/package restructure | Internal boundaries can improve inside the current Nuxt app first. |
| Many templates | Start with a small, tested registry and shared primitives. |
| Public sharing | Needs a tight privacy model so scores, findings, applications, and uploads never leak. |
| Full i18n rollout | Start with readiness and key parity; translate later based on demand. |
| Browser extension | Useful distribution feature, but only after jobs, tracker, and auth/storage are stable. |
| Application assistant/autofill | Needs exact version audit trail and review gates first. |
| Controlled auto-apply | Highest trust and accidental-submission risk; keep it last. |

## Product Success Metrics

- Upload-to-first-report completion.
- Parse review confirmation rate.
- Findings resolved per resume.
- Resume Quality Score improvement after accepted edits.
- Job Match Score improvement after tailoring.
- Required requirements covered after tailoring.
- Tailored resume versions created per saved job.
- Application cards created from tailored versions.
- Export completion rate.
- Data export usage.
- Deletion success rate.
- User-reported fabricated suggestions.
- User-reported false or confusing findings.

## Developer Success Metrics

- Local setup success rate.
- Time to first contribution.
- CI pass rate.
- E2E flake rate.
- Deterministic scoring and matching reproducibility failures.
- Import/export roundtrip failures.
- Number of external contributors.
- Documentation issues opened and resolved.

## Final Recommendation

Implement in this order:

```text
Canonical model and lineage
  -> job coverage evidence
  -> export/privacy confidence
  -> workspace and preview
  -> templates and portability
  -> enrichment and cover letters
  -> production/self-hosting/test gate
  -> sharing/i18n/extension/automation
```

This sequence gets Career Studio to the strongest version of its own product: a deterministic, evidence-preserving career workspace where users can understand their resume, improve it safely, tailor it to a job, export with confidence, and connect that version to the application they actually submit.