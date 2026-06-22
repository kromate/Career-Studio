# Learning from `srbhr/Resume-Matcher`: Career Studio Implementation Plan

This document captures what Career Studio can learn from the open-source [`srbhr/Resume-Matcher`](https://github.com/srbhr/Resume-Matcher) project and turns those lessons into a concrete implementation plan for [`kromate/Career-Studio`](https://github.com/kromate/Career-Studio).

The goal is **not** to copy Resume Matcher directly. Resume Matcher is Apache-2.0 licensed, while Career Studio is MIT licensed, and Career Studio already has its own product thesis: a trustworthy, deterministic, evidence-preserving career workspace. We should learn from Resume Matcher's product patterns, architecture, documentation, contributor practices, and feature design, then implement compatible Career Studio-native versions.

---

## Executive Summary

Resume Matcher is a mature resume-tailoring product with strong adoption and a clear workflow:

1. Upload a master resume.
2. Paste or provide a target job description.
3. Generate tailored resume improvements.
4. Review and customize the resume.
5. Generate a cover letter.
6. Export a polished PDF.
7. Track applications.

Career Studio already implements many foundational pieces:

- Nuxt 3 + Vue + TypeScript application.
- Resume ingestion for PDF, DOCX, TXT, and pasted text.
- Extraction review.
- Deterministic Resume Quality Score.
- Deterministic Job Match Score.
- Evidence-linked findings.
- Safe rewrite suggestions.
- Resume versions.
- PDF/DOCX export.
- Saved jobs and application pipeline.
- Local preview storage with planned Goalmatic production integration.

The biggest opportunities from Resume Matcher are therefore not simply "add resume matching." Career Studio already has that direction. The strongest lessons are:

1. **Turn the product into a full resume operating system**: master resume, tailoring, builder, cover letters, templates, tracking, and settings should feel like one continuous workflow.
2. **Add stronger job-description comparison UX**: side-by-side job description and resume coverage with highlighted matches and missing terms.
3. **Add a focused enrichment wizard**: ask a small number of targeted questions to improve weak bullets without overwhelming the user.
4. **Expand export templates and formatting controls**: multiple layouts, margin/spacing/font/accent controls, and ATS-safe defaults.
5. **Improve AI provider configuration**: support cloud and local providers in a clear settings experience while keeping scores deterministic.
6. **Strengthen application tracking auto-population**: tailored versions should automatically create or update pipeline cards.
7. **Create agent/developer documentation packs**: architecture, feature, API, testing, and workflow docs should be written so contributors and coding agents can work safely.
8. **Add internationalization readiness**: prepare UI strings, locale parity checks, and eventually localized content generation.
9. **Improve community-facing README and setup guides**: Resume Matcher is successful partly because the repo explains the product clearly, shows screenshots, provides setup instructions, and welcomes contributors.

---

## Source Repository Observations

### Repository identity

- Source: [`srbhr/Resume-Matcher`](https://github.com/srbhr/Resume-Matcher)
- Description: "Improve your resumes with Resume Matcher. Get insights, keyword suggestions and tune your resumes to job descriptions."
- Primary stack: TypeScript + Python.
- Product focus: resume tailoring, matching, builder, cover letters, templates, PDF export, AI provider support, and application tracking.

### High-value product patterns

Resume Matcher presents a clear user journey:

1. **Master Resume**: A comprehensive source resume acts as the base.
2. **Job Description Input**: The user targets a specific role.
3. **AI Suggestions**: The app generates tailored improvements.
4. **Builder and Template Customization**: The user modifies sections and layout.
5. **Cover Letter Generator**: The same resume + job context powers a cover letter.
6. **Resume Scoring and Keyword Highlighting**: The user sees match feedback.
7. **PDF Export**: The user receives a usable output.
8. **Application Tracker**: The tailored output can become part of a pipeline.

### High-value engineering patterns

Resume Matcher also documents several implementation patterns that Career Studio can adapt:

- App split between frontend and backend responsibilities.
- Provider-agnostic LLM configuration through LiteLLM.
- Local-first development and Docker deployment.
- API-key handling and encrypted provider settings.
- Resume parser + improver + prompt templates as separate modules.
- Feature documentation for application tracking, job matching, enrichment, templates, and i18n.
- Local hooks and tests to keep contribution quality high.

---

## Career Studio Principles We Must Preserve

Resume Matcher leans heavily into AI-generated tailoring. Career Studio's existing documentation establishes stricter trust boundaries. We should preserve these principles:

1. **Deterministic numeric scores**
   - Resume Quality Score and Job Match Score must be produced by versioned deterministic code, not a generative model.
   - AI may explain, rewrite, or ask questions, but must not directly assign points.

2. **Evidence-preserving rewrites**
   - AI suggestions cannot invent employers, titles, dates, degrees, technologies, certifications, responsibilities, or metrics.
   - Any possible new fact must be explicitly marked for user confirmation.

3. **Parse review before scoring**
   - Users must see extracted content and warnings before trusting the report.
   - Low-confidence parses must not receive a normal-looking score.

4. **Version history and auditability**
   - Original uploads, parsed content, analyses, accepted rewrites, rejected suggestions, and exports should remain traceable until deletion.

5. **User-owned job-seeker product**
   - Career Studio should not claim to reproduce every ATS.
   - It should not become employer-side candidate ranking.

6. **Privacy by design**
   - Resume text is sensitive.
   - Production must use account-scoped storage, redacted logs, explicit deletion, and no training on user documents by default.

---

## Feature-by-Feature Learning and Implementation Plan

## 1. Master Resume as the Source of Truth

### What Resume Matcher teaches

Resume Matcher starts from a master resume and uses it as the source for job-specific tailoring. This is a strong mental model: users should not rebuild their career history from scratch for every job.

### Career Studio implementation

Career Studio should formalize the concept of a **Master Resume Profile**:

- One active master resume per account.
- Multiple imported versions can exist, but one is marked active.
- Tailored resumes should always link back to:
  - source resume ID;
  - source resume version ID;
  - target job ID;
  - accepted suggestions;
  - scoring version;
  - export artifacts.

### Proposed data model additions or confirmations

Career Studio already documents these tables:

- `job_search_resumes`
- `job_search_resume_versions`
- `job_search_analyses`
- `job_search_jobs`
- `job_search_applications`
- `job_search_rewrite_sessions`

We should ensure the following fields exist in the production schema:

| Table | Field | Purpose |
| --- | --- | --- |
| `job_search_resumes` | `is_master` | Marks the current master resume. |
| `job_search_resume_versions` | `source_version_id` | Links tailored versions to the original. |
| `job_search_resume_versions` | `job_id` | Links job-specific versions to a saved job. |
| `job_search_resume_versions` | `version_kind` | `imported`, `edited`, `rewritten`, `tailored`, `exported`. |
| `job_search_resume_versions` | `canonical_content_hash` | Enables reproducible scoring and caching. |
| `job_search_rewrite_sessions` | `decision_state` | Tracks accepted/rejected/edited suggestions. |

### Implementation steps

1. Add or verify `is_master` support in local preview state.
2. Add a master resume selector in the dashboard.
3. Ensure the target-job workflow requires or suggests selecting the active master resume.
4. Store tailored versions as children of the master version.
5. Show lineage in the UI: "Tailored from Master Resume v3 for Frontend Engineer at Acme."

### Acceptance criteria

- A user can identify their active master resume.
- A tailored resume always links back to a master version and job.
- Deleting a master resume warns about dependent tailored versions.
- Analysis history distinguishes master quality scoring from job-specific matching.

---

## 2. Job Description Match Comparison UI

### What Resume Matcher teaches

Resume Matcher documents a "JD Match" feature with:

- side-by-side comparison;
- original job description on the left;
- resume content on the right;
- highlighted matching keywords;
- match statistics;
- color-coded match percentage.

This is simple, explainable, and useful even before advanced semantic matching.

### Career Studio implementation

Career Studio already has a deterministic Job Match Score. We should add a **Job Coverage Review** view that combines deterministic scoring with visual keyword coverage.

### Proposed UI

Route options:

- `/app/jobs/[id]/match`
- `/app/resumes/[resumeVersionId]/job-match`
- or a tab inside the existing target/job workflow.

Layout:

| Panel | Contents |
| --- | --- |
| Left | Normalized job description, required skills, preferred skills, responsibilities, qualifications. |
| Right | Resume version with highlighted evidence, missing requirements, and coverage badges. |
| Top summary | Job Match Score, required coverage, preferred coverage, responsibility coverage, seniority alignment. |
| Bottom actions | Create tailored version, request rewrite suggestions, export, add to application tracker. |

### Deterministic matching behavior

Use the existing `src/lib/resume/matching.ts` direction, but expand it into a richer output shape:

```ts
export interface JobCoverageResult {
  score: number
  scoringVersion: string
  taxonomyVersion: string
  required: RequirementCoverage[]
  preferred: RequirementCoverage[]
  responsibilities: RequirementCoverage[]
  missingEvidence: MissingEvidenceItem[]
  matchedEvidence: MatchedEvidenceItem[]
  warnings: MatchWarning[]
}
```

Each requirement should have:

- canonical requirement ID;
- original job phrase;
- normalized skill or responsibility;
- importance: `required`, `preferred`, `responsibility`, `credential`;
- matched resume evidence locations;
- match type: exact, alias, taxonomy, deterministic phrase;
- whether it contributes to score.

### Highlighting rules

- Highlight only evidence-backed matches.
- Do not highlight repeated keyword stuffing as extra credit.
- Highlight missing required terms separately from matched terms.
- Explanations should say: "We found evidence for X in your Projects section" or "We did not find evidence for Y."

### Implementation steps

1. Expand the matching result model.
2. Add requirement extraction and normalization from pasted job descriptions or imported job URLs.
3. Build a `JobCoveragePanel.vue` component.
4. Build a `HighlightedResumeEvidence.vue` component.
5. Add a `MissingRequirementsList.vue` component.
6. Add tests for exact matches, aliases, repeated terms, and missing requirements.
7. Connect the view to the existing target-job workflow.

### Acceptance criteria

- Users can see exactly which job requirements are supported by resume evidence.
- Required and preferred requirements are visually distinct.
- The UI explains missing requirements without encouraging fabrication.
- Match scores remain deterministic and reproducible.

---

## 3. Resume Enrichment Wizard

### What Resume Matcher teaches

Resume Matcher has an enrichment workflow that:

1. analyzes weak or generic resume descriptions;
2. asks targeted questions;
3. generates improved bullet points from user answers;
4. preserves existing content;
5. limits questions to avoid overwhelming the user.

This is highly compatible with Career Studio's no-fabrication principle because the user supplies missing facts.

### Career Studio implementation

Add a **Resume Evidence Enrichment Wizard**.

### Workflow

1. User opens a weak finding, such as "Bullet lacks measurable impact."
2. Career Studio asks targeted questions, for example:
   - "What changed because of this work?"
   - "How many users, customers, files, tickets, dollars, hours, or systems were affected?"
   - "What tools or methods did you use?"
   - "How did you know the work succeeded?"
3. User answers in plain language.
4. AI proposes one or more bullets grounded only in:
   - original resume content;
   - user answers;
   - selected job requirements, if present.
5. User accepts, edits, or rejects each suggestion.
6. Accepted content creates a new resume version and triggers deterministic re-score.

### Guardrails

- Maximum 6 questions per enrichment session.
- Original bullets remain recoverable.
- New metrics must come from user answers, not model invention.
- The UI must show which answer supports each new fact.
- If the user does not know a metric, the AI should improve clarity without inventing one.

### Proposed files

| Area | Proposed Career Studio file |
| --- | --- |
| Types | `src/types/enrichment.ts` |
| Prompt contract | `src/lib/resume/enrichment.ts` |
| Composable | `src/composables/useResumeEnrichment.ts` |
| UI wizard | `src/components/resume/ResumeEnrichmentWizard.vue` |
| Question card | `src/components/resume/EnrichmentQuestionCard.vue` |
| Suggestion review | `src/components/resume/EnrichmentSuggestionReview.vue` |
| Tests | `tests/resume-enrichment.test.ts` |

### Suggested TypeScript contract

```ts
export interface EnrichmentQuestion {
  id: string
  targetSectionId: string
  targetBulletId?: string
  reason: string
  question: string
  answerKind: 'metric' | 'scope' | 'tooling' | 'impact' | 'context' | 'constraint'
  required: boolean
}

export interface EnrichmentSuggestion {
  id: string
  sourceQuestionIds: string[]
  sourceEvidenceIds: string[]
  originalText?: string
  proposedText: string
  unsupportedFacts: string[]
  addressedRuleIds: string[]
  decision: 'pending' | 'accepted' | 'edited' | 'rejected'
}
```

### Acceptance criteria

- The wizard asks no more than 6 questions.
- Every generated suggestion maps to original evidence or user answers.
- Unsupported facts are blocked or require explicit confirmation.
- Accepted suggestions produce a new version and deterministic re-score.

---

## 4. Cover Letter Studio

### What Resume Matcher teaches

Resume Matcher includes cover letter generation as a natural extension of resume + job tailoring. Career Studio's roadmap already lists Cover Letter Studio as planned next.

### Career Studio implementation

Build **Cover Letter Studio** as a dedicated product surface, not a hidden export button.

### Inputs

- Approved resume version.
- Target job description.
- Company and role.
- User writing preferences.
- Optional user notes.

### Output

- Draft cover letter grounded in approved resume evidence.
- Evidence sidebar showing which resume facts support each paragraph.
- Tone controls: direct, warm, concise, formal.
- Length controls: short email, standard letter, recruiter note.
- Export to PDF, DOCX, and copy-to-clipboard.

### Guardrails

- Do not invent career facts.
- Do not claim direct company knowledge unless present in the job description or user notes.
- Mark unsupported enthusiasm claims for review.
- Keep generated text editable and versioned.

### Proposed route

- `/app/cover-letters`
- `/app/jobs/[id]/cover-letter`

### Implementation phases

1. Generate basic grounded cover letter from resume + job.
2. Add paragraph-level evidence mapping.
3. Add tone/length controls.
4. Add export.
5. Add version history.
6. Add application tracker attachment.

### Acceptance criteria

- A cover letter cannot be exported until unsupported claims are resolved.
- The user can regenerate without losing previous drafts.
- The cover letter is linked to the job and resume version used.

---

## 5. Resume Builder, Templates, and Formatting Controls

### What Resume Matcher teaches

Resume Matcher supports multiple templates and extensive formatting controls:

- single-column and two-column layouts;
- modern and classic styles;
- margins;
- spacing;
- line height;
- base font size;
- header scale;
- font family;
- compact mode;
- contact icons;
- accent color.

This is important because users need both ATS readability and visual control.

### Career Studio implementation

Career Studio already has export support and `src/lib/resume/templates.ts`. We should expand into a **Template System v1**.

### Template set

Start with four templates:

| Template | Purpose |
| --- | --- |
| `ats-clean` | Conservative, single-column, maximum parseability. |
| `modern-single` | Single-column with restrained accent styling. |
| `compact-two-column` | Space-efficient layout for dense resumes. |
| `executive` | More spacious layout for senior profiles. |

### Formatting controls

| Control | Initial range | Notes |
| --- | --- | --- |
| Margin | compact / standard / spacious | Avoid arbitrary values in v1. |
| Density | compact / standard / relaxed | Controls section and item spacing. |
| Font scale | small / standard / large | Keep ATS-safe. |
| Accent color | neutral / blue / green / purple | Only for non-ATS templates. |
| Contact icons | on / off | Default off for ATS template. |
| Section order | drag/drop | Persist per resume version. |
| Optional sections | show/hide | Preserve hidden data. |

### Architecture

Templates should render from the canonical resume model only. Do not let template-specific structures become the source of truth.

```text
Canonical Resume Version
  -> Template Renderer
  -> Preview HTML
  -> PDF/DOCX Export
```

### Proposed files

| Area | Proposed file |
| --- | --- |
| Template types | `src/types/resume-template.ts` |
| Template registry | `src/lib/resume/templates.ts` |
| Template settings | `src/lib/resume/template-settings.ts` |
| Preview component | `src/components/resume/ResumeTemplatePreview.vue` |
| Controls | `src/components/resume/TemplateFormattingControls.vue` |
| Renderers | `src/components/resume/templates/*.vue` |

### Acceptance criteria

- User can switch templates without losing resume content.
- Export output matches preview closely.
- ATS template avoids icons, columns, decorative bars, and unusual ordering.
- Template settings are stored per resume version.
- Tests verify that all templates render required fields.

---

## 6. AI Provider Configuration

### What Resume Matcher teaches

Resume Matcher supports multiple AI providers and local AI through Ollama. The setup documentation clearly explains:

- OpenAI;
- Anthropic;
- Gemini;
- OpenRouter;
- DeepSeek;
- OpenAI-compatible endpoints;
- Ollama.

### Career Studio implementation

Career Studio should support a provider abstraction while preserving deterministic scoring.

### Provider use cases

AI providers may be used for:

- structuring already-extracted text;
- explaining findings;
- rewrite suggestions;
- enrichment questions;
- cover letter drafts;
- job description cleanup;
- coaching interactions.

AI providers must not be used for:

- calculating numeric Resume Quality Score;
- calculating numeric Job Match Score;
- silently changing evidence locations;
- adding unverified facts.

### Settings UI

Add a provider settings page or expand `/app/settings`:

- Provider selector.
- Model name.
- API base URL for OpenAI-compatible or local providers.
- API key input.
- Test connection button.
- Data handling disclosure.
- Local-only mode explanation.

### Security requirements

Local preview may store settings locally, but production must:

- store provider keys server-side only;
- encrypt keys at rest;
- never expose provider keys to the browser;
- redact keys from logs;
- support key deletion;
- separate account-level and user-level provider configuration.

### Acceptance criteria

- User can test an AI provider before running a rewrite.
- If no provider is configured, deterministic scoring still works.
- Provider failures do not corrupt resume versions.
- Production API keys are never sent to the browser.

---

## 7. Application Tracker Auto-Population

### What Resume Matcher teaches

Resume Matcher's tracker is auto-populated from tailoring. Tailored resumes can become application cards without extra manual entry.

### Career Studio implementation

Career Studio already has saved jobs and an application pipeline. We should strengthen the connection between tailoring and tracking.

### Workflow

1. User saves or imports a job.
2. User creates a tailored resume version.
3. Career Studio prompts: "Add this to your application tracker?"
4. Default status:
   - `saved` if not submitted;
   - `applied` if user confirms they applied.
5. Application card links to:
   - job;
   - company;
   - role;
   - tailored resume version;
   - cover letter version, if present;
   - notes;
   - follow-up date.

### Pipeline columns

Recommended stable keys:

- `saved`
- `drafting`
- `applied`
- `no_response`
- `response`
- `interview`
- `offer`
- `accepted`
- `rejected`
- `withdrawn`

Labels can be localized later, but stable keys should not change.

### Acceptance criteria

- Tailoring a resume can create a tracker card in one click.
- Tracker card links back to the exact resume version used.
- Moving cards does not change resume or job data.
- Deleted resume versions are handled gracefully in tracker detail views.

---

## 8. Internationalization Readiness

### What Resume Matcher teaches

Resume Matcher has multilingual README files and UI/content generation language support. It also documents locale parity checks.

### Career Studio implementation

Start with i18n readiness even if English remains the only supported language initially.

### Steps

1. Move user-facing strings into a message catalog.
2. Add locale key parity tests.
3. Avoid hard-coded text inside large Vue templates where practical.
4. Add language preference to user settings.
5. Later, support localized resume explanations and cover letters.

### Initial locales

- English first.
- Spanish next.
- French or Portuguese after user demand.

### Acceptance criteria

- A test fails when a locale file is missing keys.
- All navigation labels and primary workflow text come from message catalogs.
- AI output language is a user preference, not guessed automatically.

---

## 9. Documentation and Contributor Experience

### What Resume Matcher teaches

Resume Matcher has extensive documentation:

- setup guide;
- architecture guide;
- feature docs;
- API docs;
- testing strategy;
- design system notes;
- local hooks.

This improves contributor onboarding and helps AI coding agents make safer changes.

### Career Studio implementation

Add a structured documentation tree:

```text
docs/
├── IMPLEMENTATION_FROM_RESUME_MATCHER.md
├── ARCHITECTURE.md
├── PRODUCT_SPEC.md
├── SCORING.md
├── ROADMAP.md
├── features/
│   ├── resume-enrichment.md
│   ├── job-coverage-review.md
│   ├── cover-letter-studio.md
│   ├── application-tracker.md
│   ├── template-system.md
│   └── ai-provider-settings.md
├── engineering/
│   ├── local-development.md
│   ├── testing-strategy.md
│   ├── release-checklist.md
│   └── privacy-and-security.md
└── agents/
    ├── README.md
    ├── coding-standards.md
    └── workflow.md
```

### README improvements

Career Studio's root README is already strong, but it can become more community-facing by adding:

- screenshots or GIFs;
- badges;
- clearer feature table;
- quick start;
- setup with and without credentials;
- architecture diagram;
- contribution paths;
- product roadmap summary;
- privacy and methodology links;
- hosted demo link.

### Acceptance criteria

- A new contributor can run the app in under 10 minutes.
- Docs explain what AI is and is not allowed to do.
- Feature docs list key files and tests.
- Agent docs tell coding agents where to look before editing.

---

## 10. Testing and Quality Gates

### What Resume Matcher teaches

Resume Matcher uses documented tests and local hooks to guard quality. Career Studio should add similarly explicit quality gates.

### Career Studio test priorities

1. Deterministic scoring fixtures.
2. Parser fixture tests for PDF, DOCX, TXT, and pasted text.
3. Job matching fixture tests.
4. Rewrite guardrail tests.
5. Enrichment unsupported-fact tests.
6. Template rendering smoke tests.
7. Export tests.
8. Application tracker state transition tests.
9. Provider settings validation tests.
10. i18n locale parity tests.

### Suggested scripts

Add or verify package scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "nuxt typecheck",
  "build": "nuxt build",
  "lint": "eslint .",
  "verify": "yarn typecheck && yarn test && yarn build"
}
```

### Local hook

Add optional version-controlled hooks:

```bash
git config core.hooksPath .githooks
```

Pre-push should run:

1. typecheck;
2. unit tests;
3. deterministic scoring fixtures;
4. locale parity when i18n exists;
5. build if reasonably fast.

---

## Recommended Implementation Roadmap

## Phase 1: Documentation and Product Alignment

**Goal:** Make the implementation path explicit before adding more surface area.

Tasks:

- Add this document.
- Create feature docs for:
  - job coverage review;
  - enrichment wizard;
  - cover letter studio;
  - template system;
  - AI provider settings.
- Update root README with a stronger product and contributor narrative.
- Add diagrams for resume and job processing.

Deliverables:

- `docs/IMPLEMENTATION_FROM_RESUME_MATCHER.md`
- `docs/features/*.md`
- README update

## Phase 2: Job Coverage Review

**Goal:** Make job matching more transparent and actionable.

Tasks:

- Expand matching output model.
- Add side-by-side job/resume coverage UI.
- Highlight matched evidence and missing requirements.
- Add deterministic fixture tests.

Deliverables:

- Job coverage route or tab.
- Coverage components.
- Matching tests.

## Phase 3: Enrichment Wizard

**Goal:** Improve weak bullets by asking users for missing evidence.

Tasks:

- Add enrichment types.
- Build question generation contract.
- Build wizard UI.
- Add suggestion review with unsupported-fact detection.
- Create new resume version after accepted suggestions.

Deliverables:

- Resume enrichment wizard.
- Rewrite guardrail tests.

## Phase 4: Template System v1

**Goal:** Give users polished exports without sacrificing ATS readability.

Tasks:

- Create template registry.
- Add four templates.
- Add formatting controls.
- Store template settings per version.
- Improve export preview parity.

Deliverables:

- Template selection UI.
- Formatting controls.
- Template render tests.

## Phase 5: Cover Letter Studio

**Goal:** Extend resume + job evidence into a grounded cover letter workflow.

Tasks:

- Add cover letter data model.
- Add grounded draft generation.
- Add evidence sidebar.
- Add export.
- Link cover letters to tracker cards.

Deliverables:

- Cover Letter Studio route.
- Cover letter versioning.
- Export support.

## Phase 6: Provider Settings and Local AI

**Goal:** Give contributors and users flexible AI options.

Tasks:

- Add provider abstraction.
- Add settings UI.
- Add provider connection test.
- Support OpenAI-compatible endpoints and Ollama where feasible.
- Ensure scoring works without AI.

Deliverables:

- Provider settings page.
- Provider integration tests.

## Phase 7: Production Goalmatic Integration

**Goal:** Move from local preview persistence to production-safe account-scoped storage.

Tasks:

- Replace local persistence with Goalmatic Tables adapters.
- Add private object storage for uploads and exports.
- Add server-side workflow execution.
- Add retention and deletion jobs.
- Add observability and redacted logs.

Deliverables:

- Production storage adapter.
- Account-scoped data access.
- Privacy and retention implementation.

---

## Prioritized Backlog

### P0: Must do before public production use

- Production account-scoped persistence.
- Private file storage.
- Explicit deletion flow.
- Redacted logging.
- Deterministic scoring fixture suite.
- AI rewrite unsupported-fact guardrails.
- Provider key security.

### P1: Highest product value

- Job coverage review with side-by-side highlighting.
- Enrichment wizard.
- Template system v1.
- Cover Letter Studio.
- Tailored-resume-to-application tracker flow.

### P2: Community and growth

- Improved README with screenshots.
- Setup guide.
- Contributor docs.
- Optional local hooks.
- i18n readiness.
- Docker/local deployment docs.

### P3: Later expansion

- Browser extension for saving jobs.
- Interview preparation.
- Company research workspace.
- Referral tracking.
- Controlled application assistant.
- Fully review-gated auto-apply only after trust and audit systems are mature.

---

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| AI fabricates resume facts | Evidence-only prompts, unsupported-fact detection, user approval gates. |
| Users mistake score for official ATS score | Use honest naming: Resume Quality Score and Job Match Score. Explain methodology. |
| Keyword stuffing | Award coverage once per requirement and flag unnatural repetition. |
| Provider key leakage | Store keys server-side, encrypt at rest, redact logs, never expose to browser. |
| Template customization hurts ATS readability | Keep an ATS-safe template and warn when decorative templates may parse worse. |
| Local preview differs from production | Maintain adapter contracts and production integration tests. |
| Too many features feel scattered | Keep dashboard centered on one recommended next action. |
| Cover letters invent company knowledge | Ground output in job description, resume evidence, and user notes only. |

---

## Success Metrics

Measure the implementation with product and trust metrics:

- Upload-to-first-report completion rate.
- Percentage of users who confirm parse accuracy.
- Findings resolved per resume.
- Resume Quality Score improvement after accepted edits.
- Job Match Score improvement after tailoring.
- Tailored resume versions created per saved job.
- Cover letters created per tailored resume.
- Application tracker cards created from tailored versions.
- Export completion rate.
- User-reported fabricated suggestions.
- User-reported false or confusing findings.
- Repeat analysis stability under unchanged content and versions.

---

## Immediate Next Actions

1. Review this document and decide which Phase 2 route should host Job Coverage Review.
2. Create feature docs under `docs/features/` for the first three planned features.
3. Expand matching tests before changing the UI.
4. Build the side-by-side coverage UI using deterministic match output.
5. Add enrichment wizard after coverage evidence locations are stable.
6. Expand templates once canonical resume rendering is stable.
7. Implement Cover Letter Studio using the same evidence approval model as resume rewrites.

---

## Final Recommendation

Career Studio should adopt Resume Matcher's strongest product lessons while staying stricter on trust, scoring, and evidence. Resume Matcher shows that users value an end-to-end workflow: upload, tailor, customize, export, and track. Career Studio can differentiate by making that workflow more transparent, deterministic, privacy-aware, and auditable.

The implementation should therefore focus on:

1. **explainable job coverage**;
2. **evidence-gathering enrichment**;
3. **grounded cover letters**;
4. **template customization with ATS-safe defaults**;
5. **secure provider configuration**;
6. **excellent documentation and contributor experience**.

If we implement those pieces carefully, Career Studio becomes more than a resume checker. It becomes a trustworthy career workspace that helps users improve their materials without losing control of their story.
