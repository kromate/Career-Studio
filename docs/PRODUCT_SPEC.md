# Initial Product Specification

## Goal

Help a job seeker turn an existing resume into a clearer, stronger, parseable,
and role-appropriate resume while preserving the truth of their experience.

## Primary User Journey

1. The user lands on a Goalmatic-branded product page.
2. They sign in with the same Google account or email OTP used by Goalmatic.
3. They upload a PDF or DOCX resume.
4. The app shows an extraction preview before analysis.
5. The app produces a stable Resume Quality Score and categorized findings.
6. The user opens a finding and sees the exact affected section or bullet.
7. The user applies a manual edit or requests an AI rewrite suggestion.
8. Every AI suggestion shows before/after text and requires acceptance.
9. The revised version is rescored by the same deterministic engine.
10. The user exports PDF and DOCX files.
11. The user may add a job description and create a tailored version with a
    separate Job Match Score.

## MVP Pages

### Landing Page

- Clear promise centered on understanding and improving a resume
- Interactive example report
- Explanation of the two scores
- Privacy and methodology links
- Goalmatic company attribution and open-source link

### Login

- Goalmatic logo and company attribution
- Google sign-in
- Email OTP
- Existing-user identity continuity

### Dashboard

- Active resume and current quality score
- Recent analyses and score changes
- Resume versions
- Saved jobs and match scores
- Application pipeline summary
- A single recommended next action

### Upload and Parse Review

- PDF/DOCX upload
- File validation and progress
- Extracted sections and contact fields
- Parse warnings
- Confirmation before storing and scoring

### Analysis Report

- Resume Quality Score
- Parse confidence
- Dimension scores
- Prioritized findings
- Exact evidence and deterministic rule ID
- Estimated point impact after a fix

### Rewrite Studio

- Structured resume editor
- Before/after suggestions
- Accept, edit, or reject
- Fact verification flags
- Version history and score comparison
- Export preview

### Target a Job

- Paste job URL or job description
- Review normalized requirements
- Job Match Score
- Required and preferred skill coverage
- Qualification and responsibility gaps
- Create a tailored resume version

## Non-Goals for MVP

- Automatically applying to jobs
- Scraping every job board
- Guaranteeing an interview or ATS pass
- Employer-side candidate ranking
- Automatically adding facts or performance metrics
- Scoring personality, age, disability, ethnicity, gender, or other protected
  or sensitive traits

## Acceptance Criteria

- Uploading identical resume content twice under the same parser and scoring
  versions returns exactly the same score and per-rule results.
- A score response identifies its parser, scorer, and taxonomy versions.
- Every lost point maps to a documented rule and evidence.
- The numeric score does not depend on an LLM response.
- A low-confidence parse cannot silently receive a normal-looking score.
- AI rewrites cannot enter an export without user approval.
- The original upload and every edited version remain recoverable until the
  user deletes them.
- Deletion removes the source file, extracted content, analyses, and exports
  according to the documented retention policy.

## Success Metrics

- Upload-to-first-report completion
- Percentage of users who understand the extraction preview
- Findings resolved per resume
- Score improvement after accepted edits
- Export completion
- Job-specific resume versions created
- Repeat analyses caused by meaningful edits, not score instability
- User-reported false findings and fabricated suggestions
