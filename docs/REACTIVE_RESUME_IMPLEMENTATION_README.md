# Learning from Reactive Resume: Career Studio Implementation README

## Purpose

This document captures what Career Studio can learn from [`amruthpillai/reactive-resume`](https://github.com/amruthpillai/reactive-resume) and turns those lessons into a practical implementation plan for [`kromate/Career-Studio`](https://github.com/kromate/Career-Studio).

Reactive Resume is a mature, highly adopted, MIT-licensed resume builder with strong opinions around privacy, resume ownership, self-hosting, templates, export, internationalization, and developer experience. Career Studio already has a broader product ambition: resume review, deterministic scoring, job matching, rewrite safety, application tracking, and later career workflows. The goal is not to clone Reactive Resume. The goal is to learn from its strongest product, architecture, UX, documentation, and operational patterns and adapt them to Career Studio's mission.

## Executive summary

Career Studio should adopt these major ideas from Reactive Resume:

1. **A builder-centered workspace**: Move beyond upload-and-score into a full resume workspace with editing, live preview, design controls, section ordering, and safe exports.
2. **A first-class resume schema**: Treat parsed resumes, edited resumes, tailored resumes, imports, exports, scoring, and job matching as different views of one canonical typed model.
3. **Template architecture**: Build a small but extensible template system with shared primitives, style tokens, A4/Letter support, custom colors, custom typography, and deterministic rendering.
4. **Privacy and ownership as product features**: Make export, deletion, local preview, self-hosting, no tracking, and transparent retention part of the core promise.
5. **Portable data**: Support JSON export/import, and eventually JSON Resume compatibility, so users can leave with their data.
6. **Design-system discipline**: Create a content-first, resume-focused UI system where the application chrome does not compete with the resume content.
7. **Self-hosting readiness**: Add Docker Compose, environment-variable documentation, health checks, backup guidance, and production deployment guidance.
8. **Internationalization readiness**: Plan for multiple locales, RTL layouts, variable-length text, and localized resume section labels early.
9. **Testable deterministic workflows**: Add PR-gated unit and e2e coverage for upload, parse review, scoring, editing, export, import, and public/share flows.
10. **Community-grade documentation**: Expand README, architecture, roadmap, self-hosting, contribution, security, and troubleshooting documentation so open-source users can actually run and improve the project.

## Repository context

### Reactive Resume

Source repository: <https://github.com/amruthpillai/reactive-resume>

Observed characteristics:

- TypeScript monorepo.
- Mature README with product positioning, feature list, template screenshots, quick start, tech stack, self-hosting, docs, support, and contribution paths.
- pnpm/Turborepo workspace layout.
- Full-stack app split into web app, server app, and domain packages.
- Strong template and PDF architecture.
- Client-side PDF generation in current versions.
- PostgreSQL persistence, optional S3-compatible storage, auth, AI providers, and feature flags.
- Privacy, ownership, self-hosting, data export, and delete controls are explicitly marketed.
- e2e tests cover core deterministic flows.

### Career Studio

Target repository: <https://github.com/kromate/Career-Studio>

Current observed characteristics:

- Nuxt 3, Vue, and TypeScript app.
- Product direction already emphasizes trustworthy resume review, deterministic scoring, evidence, safe rewrites, job matching, application tracking, and Goalmatic integration.
- Current local preview supports resume ingestion, extraction review, deterministic scoring, job matching, version history, export, saved jobs, and account settings.
- Persistence is intentionally local-preview/browser storage until production Goalmatic adapters are connected.
- Documentation already exists for research, UX direction, product spec, scoring, architecture, and roadmap.

## Strategic framing: what to copy, what not to copy

### We should copy the principles

Reactive Resume proves that users value:

- complete control over resume content;
- a polished editing and preview workflow;
- templates that look professional but remain customizable;
- export formats that do not lock users in;
- self-hosting and privacy guarantees;
- open-source transparency;
- strong documentation and easy setup;
- a product that works even before AI features are configured.

Career Studio should copy these principles directly.

### We should not blindly copy the product

Career Studio is not only a resume builder. It is a career workspace. Its differentiators should remain:

- deterministic Resume Quality Score;
- deterministic Job Match Score;
- evidence-linked findings;
- safe rewrite approval gates;
- version history tied to analysis history;
- job-specific tailoring;
- application pipeline and audit trail;
- future cover letter, interview, discovery, and application-assistant workflows.

Reactive Resume is strongest as a builder. Career Studio should become a **trustworthy resume intelligence and career execution workspace** that includes a strong builder.

## Product lessons and implementation plan

## 1. Build a true resume workspace, not just a resume checker

### What Reactive Resume teaches

Reactive Resume centers the user experience around editing and previewing a resume in real time. The README highlights:

- real-time preview as you type;
- multiple export formats;
- drag-and-drop section ordering;
- custom sections;
- rich text editing;
- customizable colors, fonts, and spacing.

Its design documentation describes a productivity-oriented builder with:

- a left sidebar for section forms;
- a center artboard for live resume preview;
- a right sidebar for design controls;
- persisted panel sizes;
- mobile overlays for sidebars.

### Career Studio opportunity

Career Studio already analyzes and improves resumes. It should now present that analysis inside a workspace where users can act immediately.

Instead of this sequence:

```text
Upload -> Score -> Findings -> Suggestions -> Export
```

Move toward:

```text
Resume Workspace
  -> Source / Import
  -> Parse Review
  -> Structured Editor
  -> Live Preview
  -> Quality Findings
  -> Job Match Findings
  -> Rewrite Suggestions
  -> Version Compare
  -> Export
```

### Implementation phases

#### Phase 1.1: Workspace shell

Create a responsive resume workspace route, for example:

```text
/src/pages/resumes/[resumeId]/workspace.vue
```

The workspace should contain:

- left panel: structured resume sections and findings;
- center panel: live resume preview/artboard;
- right panel: design, export, versions, and job match controls.

Recommended route sections:

```text
/resumes/:resumeId/workspace
/resumes/:resumeId/workspace/editor
/resumes/:resumeId/workspace/analysis
/resumes/:resumeId/workspace/design
/resumes/:resumeId/workspace/versions
/resumes/:resumeId/workspace/jobs/:jobId
```

Nuxt can render this as one page with tabbed state first, then split into nested routes later if needed.

#### Phase 1.2: Workspace panels

Recommended components:

```text
src/components/workspace/WorkspaceShell.vue
src/components/workspace/WorkspacePanel.vue
src/components/workspace/WorkspaceToolbar.vue
src/components/resume/ResumeEditorPanel.vue
src/components/resume/ResumePreviewPanel.vue
src/components/resume/ResumeDesignPanel.vue
src/components/resume/ResumeFindingsPanel.vue
src/components/resume/ResumeVersionPanel.vue
```

#### Phase 1.3: User actions from findings

Every finding should support one or more actions:

- edit affected field;
- request rewrite suggestion;
- mark as intentionally ignored;
- compare before/after score impact;
- jump to preview location where possible.

This is where Career Studio can exceed Reactive Resume: Reactive Resume has a great builder, but Career Studio can make the builder evidence-driven.

## 2. Strengthen the canonical resume data model

### What Reactive Resume teaches

Reactive Resume uses Zod schemas and typed domain packages for resume data. Its schema includes:

- basics;
- sections;
- layout;
- page settings;
- typography;
- design colors;
- template metadata;
- custom sections;
- analysis output schemas.

The lesson is that everything should flow through one trusted resume representation.

### Career Studio opportunity

Career Studio's scoring, rewriting, export, tailoring, and application tracking should all share one canonical model.

The model should support both:

1. **content facts**: what the user's resume says;
2. **presentation choices**: how the resume is rendered.

### Proposed model layers

```text
ResumeDocument
  id
  owner/account metadata
  source metadata
  activeVersionId
  versions[]

ResumeVersion
  id
  resumeId
  parentVersionId
  origin: imported | edited | rewritten | tailored | restored
  contentHash
  parserVersion
  scorerVersion
  taxonomyVersion
  canonicalContent
  presentation
  createdAt
  createdBy

CanonicalResumeContent
  basics
  summary
  experience[]
  education[]
  projects[]
  skills[]
  certifications[]
  awards[]
  languages[]
  publications[]
  volunteer[]
  references[]
  customSections[]

ResumePresentation
  templateId
  pageFormat: a4 | letter
  typography
  colors
  spacing
  sectionOrder
  layoutPages
  hiddenSections
```

### Implementation steps

1. Audit current `src/types` and scoring types.
2. Create or formalize a schema module:

```text
src/types/resume.ts
src/lib/resume/schema.ts
src/lib/resume/defaults.ts
src/lib/resume/hash.ts
src/lib/resume/versioning.ts
```

3. Use runtime validation with Zod or a comparable validator.
4. Make parsers produce `CanonicalResumeContent`.
5. Make scoring consume only `CanonicalResumeContent` plus parse warnings.
6. Make export consume `CanonicalResumeContent` plus `ResumePresentation`.
7. Make job matching consume `CanonicalResumeContent` and normalized job criteria.
8. Store input hash, parser version, scoring version, and taxonomy version on every analysis.

### Acceptance criteria

- Identical resume content produces identical canonical JSON.
- Identical canonical JSON plus identical scorer versions produces identical scores.
- Export never reads raw extracted text directly.
- AI rewrites produce proposed patches against the canonical model, not arbitrary regenerated resumes.

## 3. Add template architecture and design controls

### What Reactive Resume teaches

Reactive Resume ships many templates, each implemented through shared PDF primitives and template-specific layout components. Its architecture separates:

- template registry;
- PDF document renderer;
- page size helpers;
- shared section primitives;
- color roles;
- typography;
- per-template style slots;
- RTL helpers;
- font registration;
- section filtering.

This is a major lesson: templates should not be one-off HTML pages. They should be structured renderers over a stable resume model.

### Career Studio opportunity

Career Studio can start with fewer templates but build the system correctly.

Recommended initial templates:

1. **Studio Classic**: ATS-friendly, single-column, conservative.
2. **Studio Sidebar**: two-column with compact sidebar for skills/contact.
3. **Studio Modern**: clean headings, subtle accent color.
4. **Studio Academic**: publications, education, and projects emphasized.
5. **Studio Compact**: optimized for one-page resumes.

### Template registry

Create a registry like:

```text
src/lib/resume/templates/index.ts
src/lib/resume/templates/classic.ts
src/lib/resume/templates/sidebar.ts
src/lib/resume/templates/modern.ts
src/lib/resume/templates/academic.ts
src/lib/resume/templates/compact.ts
```

Example conceptual shape:

```ts
export type ResumeTemplateId =
  | 'studio-classic'
  | 'studio-sidebar'
  | 'studio-modern'
  | 'studio-academic'
  | 'studio-compact'

export type ResumeTemplate = {
  id: ResumeTemplateId
  name: string
  description: string
  supportedFormats: Array<'a4' | 'letter'>
  defaultPresentation: ResumePresentation
  previewImage?: string
}
```

### Shared rendering primitives

Create shared primitives instead of duplicating layout logic:

```text
src/components/resume/render/ResumePage.vue
src/components/resume/render/ResumeSection.vue
src/components/resume/render/ResumeHeading.vue
src/components/resume/render/ResumeText.vue
src/components/resume/render/ResumeContactItem.vue
src/components/resume/render/ResumeSkillLevel.vue
src/components/resume/render/ResumeDateRange.vue
```

### Design controls

The right-side design panel should include:

- template selector;
- A4 / Letter selector;
- accent color;
- text color;
- background color;
- body font;
- heading font;
- font size scale;
- section spacing;
- page margins;
- show/hide icons;
- show/hide link underline;
- section ordering;
- sidebar width for two-column templates.

### Important Career Studio rule

Design customization must never alter score calculation. Scoring remains based on canonical content and parse/layout facts, not on subjective design preferences, except for explicitly documented parseability/layout checks.

## 4. Live preview and export should become first-class

### What Reactive Resume teaches

Reactive Resume makes preview and export central. Its README advertises PDF, JSON, and DOCX export. Its implementation includes dedicated PDF and DOCX packages and currently emphasizes browser/client-side PDF generation.

### Career Studio opportunity

Career Studio already supports PDF/DOCX export. The next step is to make export feel integrated, reliable, and preview-driven.

### Implementation plan

#### Preview

- Render a page-like preview in the center workspace.
- Maintain A4 and Letter aspect ratios.
- Add zoom controls.
- Add page navigation for multi-page resumes.
- Highlight sections related to selected findings when possible.
- Show parse warnings and overflow warnings.

#### Export

Export formats to support:

1. PDF: primary user-facing document.
2. DOCX: editable fallback.
3. JSON: full Career Studio export.
4. JSON Resume: future compatibility import/export.
5. Plain text: future ATS/debug export.

#### Export safety checks

Before export, show:

- active version name;
- quality score;
- job match score if exporting a tailored resume;
- unresolved AI suggestions;
- parse warnings;
- hidden sections;
- possible one-page overflow;
- whether the resume is ATS-friendly.

#### Signed download URLs for production

Reactive Resume uses short-lived signed PDF download URLs in its server flow. Career Studio should adopt this pattern for production export endpoints.

Recommended behavior:

- signed token includes resume ID, version ID, account ID, user ID, issuedAt, expiresAt;
- max TTL: 10 minutes;
- HMAC signature with server secret;
- timing-safe comparison;
- token cannot be reused for a different resume/version;
- export endpoint verifies authorization again.

## 5. Add data portability: JSON export/import and JSON Resume compatibility

### What Reactive Resume teaches

Reactive Resume supports data export and JSON Resume import. Its import package includes tests that map JSON Resume basics, work, education, and other sections into its internal model.

### Career Studio opportunity

Data portability aligns perfectly with Career Studio's open-source and privacy promises.

### Implementation plan

#### Career Studio JSON export

Add a full-fidelity export format:

```json
{
  "format": "career-studio-resume",
  "formatVersion": "1.0.0",
  "exportedAt": "2026-06-22T00:00:00.000Z",
  "resume": {},
  "versions": [],
  "analyses": [],
  "jobs": [],
  "applications": []
}
```

#### Import behavior

On import:

1. Validate format and version.
2. Validate resume schema.
3. Recompute content hashes.
4. Do not trust imported scores unless marked historical.
5. Re-run current scoring engine for active score.
6. Preserve historical analyses as imported records if useful.

#### JSON Resume compatibility

Add:

```text
src/lib/import/jsonResume.ts
src/lib/export/jsonResume.ts
src/lib/import/jsonResume.test.ts
```

Map JSON Resume fields into Career Studio:

- basics -> basics/contact/summary;
- work -> experience;
- education -> education;
- skills -> skills;
- projects -> projects;
- certificates -> certifications;
- awards -> awards;
- languages -> languages;
- publications -> publications;
- volunteer -> volunteer.

### Acceptance criteria

- Exported Career Studio JSON can be imported into a clean browser profile.
- JSON Resume import creates a valid canonical resume.
- Invalid JSON fails with user-readable validation errors.
- Imported resumes are rescored using current deterministic scoring.

## 6. Add drag-and-drop section and chip ordering

### What Reactive Resume teaches

Reactive Resume uses drag-and-drop for skill chips, URL lists, and page layout management. This makes a resume builder feel tactile and efficient.

### Career Studio opportunity

Career Studio should support drag-and-drop in three places:

1. section order;
2. bullet order within a role/project;
3. skill/tag order.

### Vue implementation options

Recommended packages:

- `vue-draggable-plus` or `vuedraggable` for simple lists;
- `@vueuse/core` utilities for pointer/keyboard behavior;
- custom keyboard-accessible reordering for critical accessibility paths.

### Accessibility requirements

Drag-and-drop must not be pointer-only. Add:

- up/down move buttons;
- keyboard shortcuts where possible;
- screen-reader labels;
- visible focus states;
- undo support for accidental moves.

## 7. Introduce a command palette and keyboard-driven workflow

### What Reactive Resume teaches

Reactive Resume includes a command palette triggered by `Cmd+K` / `Ctrl+K`, with navigation across resumes, settings, and preferences.

### Career Studio opportunity

A command palette fits Career Studio's power-user workflow.

### Initial commands

- Upload resume.
- Create new resume.
- Open active resume.
- Export PDF.
- Export DOCX.
- Add job posting.
- Run resume analysis.
- Run job match.
- Open latest findings.
- Open settings.
- Delete local data.
- Toggle dark mode.

### Implementation

Create:

```text
src/components/command/CommandPalette.vue
src/composables/useCommandPalette.ts
src/lib/commands/registry.ts
```

Use a fuzzy search library such as Fuse.js or a small local matcher.

## 8. Build a stronger design system

### What Reactive Resume teaches

Reactive Resume has a detailed `DESIGN.md` that defines colors, typography, layout, animation, components, internationalization, and do/don't rules.

The most useful design lesson is: the app UI should be quiet so the resume content is the hero.

### Career Studio opportunity

Career Studio should add its own design-system README, not just component code.

Recommended file:

```text
docs/DESIGN_SYSTEM.md
```

### Proposed design principles

1. **Trustworthy, not flashy**: scoring and rewrite tools should feel evidence-based.
2. **Resume-first**: the preview, findings, and user content should dominate visual attention.
3. **Calm AI**: AI suggestions should appear as reviewable options, not magical overwrites.
4. **Transparent scoring**: every score and finding must expose rule ID, evidence, and version.
5. **Accessible productivity**: keyboard support and readable contrast are required.
6. **Professional defaults**: templates should be polished without requiring design skill.

### Design tokens

Define tokens for:

- app background;
- card surface;
- border;
- foreground;
- muted foreground;
- primary action;
- safe/success;
- warning;
- destructive;
- score colors;
- evidence highlight;
- job-match highlight;
- AI suggestion highlight.

### Component inventory

Document and standardize:

- buttons;
- inputs;
- textareas;
- selects;
- cards;
- badges;
- score rings/bars;
- finding cards;
- evidence snippets;
- dialogs;
- toasts;
- sidebars;
- tabs;
- accordions;
- empty states;
- upload zones;
- version timeline;
- application pipeline cards.

## 9. Make privacy, deletion, and ownership visible

### What Reactive Resume teaches

Reactive Resume markets privacy and control directly:

- self-hosting;
- no tracking/analytics by default;
- full data export;
- permanent deletion;
- open-source code;
- no hidden costs.

### Career Studio opportunity

Career Studio already talks about trust. It should turn trust into concrete UI and backend guarantees.

### Product additions

Add a **Data & Privacy** settings page with:

- export all data;
- delete one resume;
- delete all local data;
- delete account data in production;
- view retention policy;
- view AI provider/data usage policy;
- view model training defaults;
- view subprocessors/providers;
- toggle product analytics if analytics are ever added.

### Production requirements

Before production launch:

- no resume text in logs;
- no resume text in analytics events;
- encrypted object storage;
- account-scoped authorization;
- documented retention policy;
- deletion job with audit outcome;
- clear provider disclosure.

## 10. Add self-hosting and Docker documentation

### What Reactive Resume teaches

Reactive Resume has a comprehensive self-hosting guide with:

- minimum requirements;
- Docker Compose;
- `.env` reference;
- auth secrets;
- database settings;
- SMTP settings;
- storage settings;
- AI settings;
- feature flags;
- health checks;
- backups;
- troubleshooting.

### Career Studio opportunity

Career Studio should provide the same level of operational clarity, even if production Goalmatic integration remains optional or separate.

### Implementation plan

Add:

```text
Dockerfile
compose.yml
compose.dev.yml
docs/SELF_HOSTING.md
docs/ENVIRONMENT.md
docs/DEPLOYMENT.md
server/api/health.get.ts
```

### Self-hosting modes

Career Studio should document three modes:

#### Mode A: Local preview mode

- browser/local storage;
- no external credentials required;
- contributor-friendly;
- not for real user data.

#### Mode B: Standalone self-hosted mode

- app server;
- database;
- object storage;
- optional auth provider;
- optional AI provider;
- suitable for individual/team private use.

#### Mode C: Goalmatic production mode

- shared Firebase identity;
- Goalmatic account resolution;
- Goalmatic Tables;
- Goalmatic workflows;
- private object storage;
- server-side privileged operations.

### Health endpoint

The health endpoint should report:

```json
{
  "ok": true,
  "version": "0.1.0",
  "checks": {
    "app": "ok",
    "database": "ok",
    "storage": "ok",
    "auth": "ok",
    "ai": "optional_unconfigured"
  }
}
```

Do not include secrets, connection strings, resume text, or user identifiers.

## 11. Add e2e coverage for core flows

### What Reactive Resume teaches

Reactive Resume's e2e README shows that PR-gated browser coverage focuses on deterministic core flows, including:

- auth smoke;
- dashboard sample resume creation;
- builder editing and autosave;
- JSON export/import;
- public sharing.

### Career Studio opportunity

Career Studio should add Playwright and define a small but meaningful PR gate.

### Recommended e2e tests

```text
tests/e2e/upload-parse-score.spec.ts
tests/e2e/editor-autosave.spec.ts
tests/e2e/rewrite-approval.spec.ts
tests/e2e/export.spec.ts
tests/e2e/job-match.spec.ts
tests/e2e/application-pipeline.spec.ts
tests/e2e/data-deletion.spec.ts
```

### Initial PR-gated coverage

Start with:

1. Upload/paste a sample resume.
2. Confirm extraction preview.
3. See deterministic quality score.
4. Open a finding and verify evidence.
5. Edit a bullet manually.
6. Re-score and see version history.
7. Export PDF or DOCX.
8. Import/export JSON if implemented.

### Testing rule

AI-dependent flows should not be required for the initial PR gate. Test deterministic fallbacks and mock AI suggestions.

## 12. Add internationalization readiness

### What Reactive Resume teaches

Reactive Resume treats i18n as a core architecture concern, including:

- many locales;
- RTL support;
- logical CSS properties;
- variable-length text;
- localized section titles;
- directional icon handling.

### Career Studio opportunity

Career Studio users may be global job seekers. Internationalization should be planned before templates and exports become too rigid.

### Implementation plan

1. Choose Nuxt i18n strategy.
2. Move user-facing strings into translation files.
3. Add locale to resume presentation metadata.
4. Localize default section titles.
5. Use CSS logical properties where possible.
6. Add RTL smoke testing for Arabic or Hebrew.
7. Ensure exports include correct document language metadata where supported.

### Important scoring caveat

Scoring rules may be language-specific. Start with English scoring if needed, but explicitly label it:

```text
Scoring language: English
Scoring version: resume-quality-en-v1
```

Do not silently apply English grammar rules to non-English resumes without disclosure.

## 13. Add public resume sharing carefully

### What Reactive Resume teaches

Reactive Resume supports sharing resumes via unique links.

### Career Studio opportunity

Sharing could be valuable, but Career Studio must handle it carefully because it also stores analyses, private job matches, and application history.

### Recommended sharing model

Share only explicit resume versions, not the whole workspace.

A public share should include:

- rendered resume;
- optional download button;
- optional public title;
- no quality score by default;
- no job match score;
- no private findings;
- no application history;
- no source upload;
- revocation controls.

### Share controls

- Create public link.
- Regenerate link.
- Disable link.
- Track createdAt and lastViewedAt if analytics are allowed.
- Make public pages excluded from private app state.

## 14. Improve README and documentation structure

### What Reactive Resume teaches

A great open-source README quickly answers:

- What is this?
- Why should I use it?
- What can it do?
- What does it look like?
- How do I run it?
- How do I self-host it?
- What is the tech stack?
- Where are the docs?
- How do I contribute?
- How do I get support?

### Career Studio opportunity

Career Studio's README is already clear about product direction. It should become more visual and action-oriented.

### Proposed README structure

```text
# Career Studio by Goalmatic

Hero tagline
Badges
Screenshot or product preview
Primary links: Try it, Docs, Contribute

## What Career Studio does
## Why it is different
## Current features
## Roadmap
## Screenshots / workflow preview
## Quick start
## Configuration
## Tech stack
## Documentation
## Privacy and data ownership
## Contributing
## Security
## License
```

### Docs to add or expand

```text
docs/DESIGN_SYSTEM.md
docs/SELF_HOSTING.md
docs/ENVIRONMENT.md
docs/EXPORTS.md
docs/IMPORTS.md
docs/TEMPLATES.md
docs/TESTING.md
docs/PRIVACY_AND_RETENTION.md
docs/GOALMATIC_INTEGRATION.md
docs/REACTIVE_RESUME_IMPLEMENTATION_README.md
```

## 15. Architecture changes to consider

### Current Career Studio architecture

Career Studio is currently a Nuxt 3 app with local-preview persistence and future Goalmatic production adapters.

### Lesson from Reactive Resume

Reactive Resume uses package boundaries to keep domain logic, schema, API, PDF, DOCX, import, UI, env, and utilities separate.

Career Studio does not need to become a monorepo immediately, but it should introduce strong internal boundaries now.

### Recommended internal structure

```text
src/
  components/
    resume/
    workspace/
    command/
    ui/
  composables/
    useResumeWorkspace.ts
    useResumeVersions.ts
    useResumeExport.ts
    useJobMatch.ts
  lib/
    resume/
      schema.ts
      defaults.ts
      normalize.ts
      hash.ts
      versioning.ts
      templates/
      render/
      export/
      import/
    scoring/
      engine.ts
      rules/
      versions.ts
    jobs/
      normalize.ts
      matching.ts
    privacy/
      redaction.ts
      retention.ts
    storage/
      localAdapter.ts
      goalmaticAdapter.ts
      types.ts
  types/
    resume.ts
    scoring.ts
    jobs.ts
    applications.ts
server/
  api/
    health.get.ts
    exports/
    imports/
    jobs/
```

### Boundary rules

- Scoring must not import UI components.
- Export rendering must not mutate resume content.
- AI rewrite logic must produce patches/suggestions, not overwrite content directly.
- Storage adapters must implement shared interfaces.
- Goalmatic production adapters must never leak into local-preview-only code.
- Browser code must never receive server-only keys.

## 16. AI feature boundaries

### What Reactive Resume teaches

Reactive Resume supports AI providers as optional extras. The rest of the product works without AI.

### Career Studio opportunity

Career Studio has stronger AI-safety requirements because it makes rewrite suggestions and career recommendations.

### Rules for Career Studio

1. AI may parse, explain, summarize, and suggest.
2. AI may not calculate numeric scores.
3. AI may not invent facts.
4. AI may not silently modify exportable resume content.
5. AI suggestions must show before/after text.
6. AI suggestions must identify unsupported/new facts.
7. Users must accept, edit, or reject suggestions.
8. Every accepted suggestion creates a new version.

### Patch-based rewrite model

Represent AI output as patches:

```ts
type RewriteSuggestion = {
  id: string
  resumeVersionId: string
  targetPath: string
  originalText: string
  suggestedText: string
  rationale: string
  riskFlags: Array<'new_fact' | 'metric_added' | 'date_changed' | 'title_changed' | 'company_changed'>
  status: 'pending' | 'accepted' | 'edited' | 'rejected'
}
```

Acceptance creates a new `ResumeVersion` and triggers deterministic rescoring.

## 17. Application tracking and job workflow integration

### What Reactive Resume teaches

Reactive Resume's main focus is resume creation, but Career Studio already has job matching and application tracking in its roadmap and current status.

### Career Studio opportunity

Use Reactive Resume's resume-builder strengths as the foundation, then connect them to job workflows.

### Recommended flow

```text
Saved Job
  -> Normalized Requirements
  -> Match Against Resume Version
  -> Missing Evidence Report
  -> Tailoring Suggestions
  -> User-Approved Tailored Version
  -> Export
  -> Attach Version to Application
  -> Pipeline Stage Updates
```

### Audit trail

Every application should reference:

- job ID;
- company;
- title;
- posting URL;
- resume version submitted;
- export file metadata;
- cover letter version if any;
- application stage;
- notes;
- dates;
- follow-up reminders.

This is a major differentiator from Reactive Resume.

## 18. Suggested implementation roadmap

## Milestone 0: Documentation and alignment

Duration: 1 week

Deliverables:

- This implementation README.
- Updated main README structure.
- `docs/DESIGN_SYSTEM.md` draft.
- `docs/TEMPLATES.md` draft.
- `docs/SELF_HOSTING.md` outline.
- GitHub issues for each milestone.

Acceptance criteria:

- Contributors understand where the product is going.
- The builder, template, export, privacy, and testing plans are documented.

## Milestone 1: Canonical model hardening

Duration: 1-2 weeks

Deliverables:

- Formal resume schema.
- Resume defaults.
- Resume normalization.
- Resume hashing.
- Version metadata.
- Tests for deterministic normalization and hashing.

Acceptance criteria:

- Same input creates same canonical output.
- Scoring consumes canonical content only.
- Export consumes canonical content plus presentation only.

## Milestone 2: Workspace shell and live preview

Duration: 2-3 weeks

Deliverables:

- Workspace route.
- Three-panel layout.
- Live preview surface.
- Basic editor integration.
- Findings panel integration.
- Version panel placeholder.

Acceptance criteria:

- User can edit structured content and see preview update.
- User can click a finding and jump to related content.
- Workspace works on desktop and mobile.

## Milestone 3: Template system v1

Duration: 2-3 weeks

Deliverables:

- Template registry.
- Shared render primitives.
- Studio Classic template.
- Studio Sidebar template.
- Design panel controls.
- A4/Letter support.

Acceptance criteria:

- User can switch templates without losing content.
- User can export selected template.
- Template settings are stored per resume version or presentation profile.

## Milestone 4: Export and import upgrades

Duration: 2 weeks

Deliverables:

- Full Career Studio JSON export.
- Career Studio JSON import.
- JSON Resume import prototype.
- Export safety dialog.
- Tests for import/export roundtrip.

Acceptance criteria:

- A resume exported as Career Studio JSON imports successfully.
- Invalid import errors are understandable.
- Export warns about unresolved suggestions and parse issues.

## Milestone 5: Drag-and-drop and command palette

Duration: 1-2 weeks

Deliverables:

- Section ordering.
- Skill chip ordering.
- Bullet ordering.
- Command palette.
- Keyboard-accessible reordering controls.

Acceptance criteria:

- Pointer and keyboard users can reorder content.
- Command palette can trigger top workspace actions.

## Milestone 6: Self-hosting and production readiness

Duration: 2-3 weeks

Deliverables:

- Dockerfile.
- Compose files.
- Health endpoint.
- Environment documentation.
- Storage adapter documentation.
- Privacy/retention documentation.

Acceptance criteria:

- A contributor can run local preview easily.
- A self-hosting user understands required services.
- Health checks are safe and useful.

## Milestone 7: E2E test gate

Duration: 1-2 weeks

Deliverables:

- Playwright setup.
- Upload/parse/score e2e test.
- Editor/autosave e2e test.
- Export e2e test.
- Job match e2e test.
- CI workflow.

Acceptance criteria:

- Core deterministic flows are PR-gated.
- AI-provider configuration is not required to pass CI.

## Milestone 8: Internationalization readiness

Duration: 1-2 weeks

Deliverables:

- i18n setup.
- Locale metadata.
- Localized section titles.
- RTL smoke route/test.
- Documentation for writing i18n-safe UI.

Acceptance criteria:

- App shell can switch locales.
- Resume section labels can be localized.
- RTL layout does not break the workspace.

## Prioritized backlog

### High priority

- [ ] Formalize canonical resume schema.
- [ ] Build workspace shell.
- [ ] Add live preview artboard.
- [ ] Create template registry.
- [ ] Add Studio Classic template.
- [ ] Add design controls.
- [ ] Add Career Studio JSON export/import.
- [ ] Add export safety dialog.
- [ ] Add Playwright e2e tests for deterministic flows.
- [ ] Add privacy/data settings page.

### Medium priority

- [ ] Add JSON Resume import.
- [ ] Add drag-and-drop section ordering.
- [ ] Add command palette.
- [ ] Add signed export URLs for production.
- [ ] Add Dockerfile and Compose.
- [ ] Add health endpoint.
- [ ] Add self-hosting docs.
- [ ] Add design system docs.
- [ ] Add public share links for explicit resume versions.

### Lower priority

- [ ] Add multi-language UI.
- [ ] Add RTL template support.
- [ ] Add template screenshot generation.
- [ ] Add marketplace/community template contribution process.
- [ ] Add browser extension support for saving jobs.
- [ ] Add cover letter studio.
- [ ] Add interview preparation workspace.

## Technical risks and mitigations

### Risk: Builder work distracts from scoring differentiation

Mitigation:

- Treat the builder as the action layer for scoring.
- Every builder feature should improve the path from finding to fix to export.

### Risk: Templates become hard to maintain

Mitigation:

- Start with 2-3 templates.
- Use shared primitives.
- Document template rules.
- Add visual regression tests later.

### Risk: AI rewrites create trust issues

Mitigation:

- Keep patch-based suggestions.
- Show before/after.
- Flag new facts.
- Require approval.
- Keep deterministic score separate.

### Risk: Local preview and production adapters diverge

Mitigation:

- Define storage interfaces early.
- Keep local and production adapters behind the same API.
- Test behavior at the adapter contract level.

### Risk: Export rendering differs from preview

Mitigation:

- Share rendering primitives where possible.
- Add export snapshot tests.
- Add e2e export smoke tests.

### Risk: Privacy promises are vague

Mitigation:

- Document exact retention and deletion behavior.
- Build deletion controls before production launch.
- Avoid logging resume text.

## Success metrics

Product metrics:

- upload-to-first-report completion;
- report-to-edit conversion;
- findings resolved per resume;
- score improvement after edits;
- export completion;
- job match usage;
- tailored versions created;
- applications tied to resume versions;
- user-reported false findings;
- user-reported fabricated suggestions.

Developer metrics:

- local setup success rate;
- time to first contribution;
- CI pass rate;
- e2e flake rate;
- test coverage for scoring/import/export;
- number of external contributors;
- documentation issues opened.

Trust metrics:

- deletion success rate;
- export-all-data usage;
- privacy/support issues;
- rewrite rejection rate due to unsupported facts;
- scoring reproducibility failures.

## Source references used

Key Reactive Resume references reviewed:

- Repository README: <https://github.com/amruthpillai/reactive-resume/blob/main/README.md>
- Architecture guide: <https://github.com/amruthpillai/reactive-resume/blob/main/docs/contributing/architecture.mdx>
- Design system: <https://github.com/amruthpillai/reactive-resume/blob/main/DESIGN.md>
- Self-hosting guide: <https://github.com/amruthpillai/reactive-resume/blob/main/docs/self-hosting/docker.mdx>
- Template registry: <https://github.com/amruthpillai/reactive-resume/blob/main/packages/pdf/src/templates/index.ts>
- PDF document renderer: <https://github.com/amruthpillai/reactive-resume/blob/main/packages/pdf/src/document.tsx>
- JSON Resume importer tests: <https://github.com/amruthpillai/reactive-resume/blob/main/packages/import/src/json-resume.test.ts>
- Resume API CRUD examples: <https://github.com/amruthpillai/reactive-resume/blob/main/packages/api/src/features/resume/crud.ts>
- Signed PDF download URL implementation: <https://github.com/amruthpillai/reactive-resume/blob/main/packages/api/src/features/resume/pdf-download-url.ts>
- E2E test README: <https://github.com/amruthpillai/reactive-resume/blob/main/tests/e2e/README.md>

Key Career Studio references reviewed:

- Repository README: <https://github.com/kromate/Career-Studio/blob/main/README.md>
- Architecture: <https://github.com/kromate/Career-Studio/blob/main/docs/ARCHITECTURE.md>
- Product spec: <https://github.com/kromate/Career-Studio/blob/main/docs/PRODUCT_SPEC.md>
- Roadmap: <https://github.com/kromate/Career-Studio/blob/main/docs/ROADMAP.md>

## Final recommendation

Career Studio should use Reactive Resume as proof that an open-source, privacy-first resume product can win by being polished, portable, self-hostable, and trustworthy. The implementation priority should be:

```text
Canonical model -> Workspace -> Templates -> Export/import -> Privacy/self-hosting -> E2E tests -> i18n/share/community
```

This keeps Career Studio's strongest differentiator intact: a transparent, deterministic, evidence-preserving career workspace that helps users improve their materials without inventing experience or trapping their data.
