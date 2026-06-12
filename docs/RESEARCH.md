# Product Research

Research date: June 11, 2026.

## Executive Summary

The market has four overlapping product categories:

1. General resume quality scoring
2. Job-description matching and resume tailoring
3. Resume building and AI rewriting
4. Job discovery, tracking, autofill, and auto-apply

The strongest initial product is not a broad auto-apply platform. It is a
trusted resume workspace that produces stable scores, shows its evidence,
supports controlled rewriting, and keeps every resume version connected to the
job it was created for.

The closest product pattern is Huntr's separation of a base resume score from a
job-specific match score. Resume Worded is strongest at granular feedback.
Jobscan is strongest at job-description comparison. Rezi is unusually clear
that no universal ATS score exists. Teal connects resume work to a job tracker.

## Competitor Findings

| Product | Useful pattern | Product lesson |
| --- | --- | --- |
| [Candoorai](https://candoora.io/) | Career workspace with resume analysis, matching, pipeline, interview prep, company intelligence, referrals, and a Career OS | A coherent dashboard can connect the full search, but feature breadth should follow a strong core workflow |
| [Resume Worded](https://resumeworded.com/score) | 20+ checks across impact, brevity, style, and other recruiter-oriented criteria; line-level feedback | Show category scores, exact evidence, and concrete fixes rather than only a number |
| [Resume Worded Targeted Resume](https://resumeworded.com/targeted-resume) | Separate relevancy score based on a resume and job description | General quality and job fit are different measurements |
| [Jobscan](https://www.jobscan.co/) | Resume/job comparison covering skills, keywords, titles, education, formatting, and file type | The job description must be a first-class input for matching |
| [Huntr](https://huntr.co/product/resume-checker) | Separate Base ATS Score and Job Match Score; qualifications and responsibilities are evaluated independently | This is the clearest scoring model to adapt, without copying its implementation |
| [Rezi](https://www.rezi.ai/rezi-docs/the-rezi-score-explained) | Real-time score and prioritized fixes; explicitly says real ATS products do not expose one universal official score | Call our result a Career Studio Resume Score, disclose its version, and avoid false guarantees |
| [Teal](https://www.tealhq.com/tool/resume-checker) | 15+ checks, resume builder, job-description match, and application tracker | Resume improvement becomes more valuable when linked to saved jobs and versions |
| [Kickresume](https://www.kickresume.com/en/ats-resume-checker/) | 20+ ATS checks and a fast upload-to-report flow | Fast time-to-value and a clear list of weak points matter |
| [Enhancv](https://enhancv.com/resources/resume-checker/) | General checks, ATS compatibility, and AI rewrite assistance | Rewrite tools should remain downstream of analysis |
| [SkillSyncer](https://skillsyncer.com/) | Simple missing-keyword workflow | Keyword gaps are useful, but should not become keyword-stuffing incentives |
| [Simplify](https://simplify.jobs/) | Resume builder, tailoring, job tracker, and application autofill | Autofill is a later distribution feature, not the first product foundation |
| [Sorce](https://www.sorce.jobs/) | Mobile swipe-based discovery plus AI-assisted applications | Discovery can be delightfully simple, but automated submission creates trust and quality risks |
| [LoopCV](https://www.loopcv.pro/) | Automated searches, applications, statistics, and job aggregation | Search automation is compelling after profile quality and targeting are reliable |
| [Sonara](https://www.sonara.ai/) | Learns preferences, finds jobs, and applies continuously | Continuous automation requires strong controls, exclusions, and audit history |

## What ATS Products Actually Do

Employer systems do not all behave the same way.

- [Workday](https://www.workday.com/en-us/topics/hr/applicant-tracking-system.html)
  describes parsing resumes into structured education, skills, and work
  history.
- [Lever](https://help.lever.co/s/article/Understanding-Resume-Parsing)
  extracts fields such as name and organization into a candidate profile.
- [Greenhouse](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse)
  documents parsing failures caused by file size and formatting.
- Greenhouse's newer
  [Talent Matching](https://support.greenhouse.io/hc/en-us/articles/41396009937307-Talent-Matching)
  describes match scores as assistive rather than automated hiring decisions.

Therefore, a third-party product cannot truthfully promise one score that every
ATS will assign. It can reliably test parseability, content quality, and
alignment to a supplied job description.

## Recommended Positioning

> Know exactly what is weakening your resume, fix it with evidence-preserving
> AI, and create a tailored version for every job.

Avoid:

- "Guaranteed to pass every ATS"
- "The score recruiters will see"
- "Add these keywords and you will be hired"
- fabricated metrics or experience in generated resumes

Prefer:

- transparent checks and score versions;
- parse previews showing what software extracted;
- general quality separated from role match;
- user-approved edits with before/after evidence;
- a clear record of which resume version was used for each application.

## Proposed Product Surface

### Public

- Landing page
- How scoring works
- Example report
- Open-source repository and contribution page
- Privacy, security, and methodology pages
- Goalmatic sign-in

### Authenticated

- Dashboard
- Resume library and upload
- Resume analysis report
- Rewrite studio
- Job targeting
- Resume version history
- Saved jobs
- Application tracker
- Account/settings

### Later

- Browser extension for saving jobs
- Cover letters
- Interview preparation
- Follow-up reminders
- Job discovery
- Application autofill
- Carefully controlled auto-apply

## Product Principles

1. Evidence before advice
2. Stable scores before clever prose
3. User control before automation
4. One source resume, many intentional job-specific versions
5. No invented experience
6. Privacy and deletion are product features
7. Open methodology where it does not enable gaming or compromise security

## Risks

- Resume parsing differs by file format and layout.
- Model-generated feedback may contradict deterministic findings.
- Users may optimize for the number rather than truthful communication.
- Keyword matching can punish synonyms or reward stuffing.
- Auto-apply can submit low-quality or unwanted applications.
- Resume data is highly sensitive and must not leak into logs or analytics.
- Claims about ATS behavior can become misleading if presented as universal.

The scoring and architecture specifications address these risks directly.
