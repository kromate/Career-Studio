# Product Research

Research updated: June 13, 2026.

## Executive Summary

The market has seven overlapping product categories:

1. General resume quality scoring
2. Job-description matching and resume tailoring
3. Resume building and AI rewriting
4. Job discovery, tracking, autofill, and auto-apply
5. Peer and expert interview practice
6. Mentorship and career exploration
7. Company, interview, and compensation transparency

The strongest initial product is not a broad auto-apply platform. It is a
trusted resume workspace that produces stable scores, shows its evidence,
supports controlled rewriting, and keeps every resume version connected to the
job it was created for.

The closest product pattern is Huntr's separation of a base resume score from a
job-specific match score. Resume Worded is strongest at granular feedback.
Jobscan is strongest at job-description comparison. Rezi is unusually clear
that no universal ATS score exists. Teal connects resume work to a job tracker.

The broader Career Studio vision also reflects patterns proven by adjacent
career products: Exponent Practice makes live peer practice concrete, ADPList
organizes mentorship around goals and bookable conversations, Glassdoor uses
anonymous workplace and interview experiences to create context, Levels.fyi
structures compensation around company, role, level, and location, and the
U.S. Department of Labor frames career exploration around skills, interests,
work preferences, preparation, and transitions.

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
| [Exponent Practice](https://www.tryexponent.com/practice) | Live mock interviews with peers, collaborative practice, and structured feedback | Practice is more useful when it is realistic, repeatable, and followed by actionable feedback |
| [Interviewing.io](https://interviewing.io/) | Technical mock interviews with detailed feedback and anonymous practice options | Psychological safety and useful feedback matter as much as question coverage |
| [ADPList](https://adplist.org/) | Goal-led mentor discovery and bookable one-to-one conversations | Mentorship should begin with a specific goal and relevant experience, not a generic directory |
| [Glassdoor](https://www.glassdoor.com/) | Jobs, anonymous company reviews, interview experiences, salaries, and workplace conversation | Company context must balance anonymity, moderation, recency, and protection against retaliation |
| [Levels.fyi](https://www.levels.fyi/) | Compensation and leveling data structured by company, role, level, and location | Pay information is most useful when the context and limitations travel with the number |
| [O*NET Career Exploration Tools](https://www.dol.gov/agencies/eta/onet/tools) | Self-directed tools for planning career options, preparation, and transitions | Career discovery should connect skills, interests, and work preferences to clear next steps |
| [Harvard Resume Guide](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/) | Positions a resume as a brief summary that highlights a person's strongest assets | Resume guidance should help people communicate evidence clearly, not optimize only for a score |

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

> Move your career forward with tools you can understand and people you can
> learn from. Start with a resume review that shows what to fix and why.

The public message should lead with the user's outcome, then clearly separate
what is available now from what is on the roadmap. Use familiar terms such as
"practice interviews," "mentorship," "company and pay insights," "job search,"
and "career exploration" instead of abstract platform language.

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
- a clear record of which resume version was used for each application;
- plain-language outcomes before implementation details;
- specific feedback instead of generic "AI-powered" claims;
- transparent limits, costs, and availability;
- community participation without implying that planned features already exist.

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
- Job comparison
- Resume version history
- Saved jobs
- Application tracker
- Account/settings

### Later

- Browser extension for saving jobs
- Cover letters
- Live peer interview practice and structured feedback
- Goal-based mentor discovery and scheduling
- Moderated company, interview, and compensation insights
- Career exploration based on skills, interests, and work preferences
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
