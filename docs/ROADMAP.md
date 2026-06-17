# Delivery Roadmap

## Current Delivery

The open-source local preview now delivers the core user journeys from phases
1 through 4: public product pages, contributor authentication modes, resume
ingestion and extraction review, deterministic analysis, controlled rewriting,
exports, job matching, tailored versions, saved jobs, and the application
pipeline.

Production Goalmatic persistence, account resolution, workflow-backed AI,
retention operations, and deployment hardening remain platform integration
work. Cover letters, reminders, browser extensions, discovery, interview
preparation, and controlled automation remain future product work.

## Product Sequence

Career Studio should feel like one connected career workspace while shipping
each capability as a focused tool. The product sequence is:

1. **Resume checker — available:** deterministic quality scoring, evidence,
   prioritized findings, and versioned methodology.
2. **Resume builder — available:** controlled rewriting, exports, and version
   history without invented career facts.
3. **Job match — available:** role requirements, evidence coverage, separate
   match scoring, and tailored resume versions.
4. **Application tracker — available:** saved jobs, stages, and the exact
   resume version used for each application.
5. **Cover letter studio — planned next:** drafts grounded in approved resume
   evidence, the job description, and user writing preferences.
6. **Application assistant — later:** prepare recurring answers and autofill
   application details with a review gate and complete audit history.
7. **Job discovery — later:** relevant, verified opportunities connected to
   the user's goals and evidence.
8. **Controlled auto-apply — last:** opt-in rules, exclusions, previews,
   submission limits, and an emergency stop. It must never be the default.

## Phase 0: Validation

- Finalize the scoring rubric with recruiter review
- Build anonymized PDF/DOCX fixture corpus
- Define privacy, retention, and deletion policy
- Validate shared Goalmatic authentication and account isolation
- Decide the public product name and domain

## Phase 1: Trustworthy Resume Analysis

- Landing page and methodology page
- Goalmatic Google and email OTP login
- Resume upload and extraction preview
- Canonical resume model
- Deterministic Resume Quality Score
- Categorized report with evidence
- Analysis history

## Phase 2: Resume Improvement

- Structured resume editor
- Evidence-preserving AI suggestions
- Accept/reject workflow
- Score comparison
- Resume version history
- ATS-readable PDF and DOCX export

## Phase 3: Job Targeting

- Save a job URL or description
- Normalize required and preferred criteria
- Deterministic Job Match Score
- Missing-evidence report
- Tailored resume versions
- Cover letter draft

The cover letter draft becomes a dedicated studio after the evidence and
approval model is shared with resume rewriting.

## Phase 4: Search Workspace

- Saved jobs
- Application pipeline
- Follow-up dates and reminders
- Resume-to-application audit trail
- Search metrics and weekly review

## Phase 5: Distribution

- Browser extension for saving jobs and autofill
- Job discovery and recommendations
- Interview preparation
- Company and referral research
- Controlled application automation

Auto-apply remains last because it has the largest trust, quality, terms-of-use,
and accidental-submission surface.

## Experience Principles

- One profile should power every tool without forcing repeated data entry.
- The landing page should explain a connected journey, not present a wall of
  unrelated AI features.
- Every tool gets one clear outcome, one primary action, and an honest
  availability state.
- Available and planned capabilities must look different.
- AI may parse, explain, draft, and personalize. Deterministic code owns
  numerical scores.
- Application automation must remain reviewable, reversible where possible,
  rate-limited, and fully auditable.
