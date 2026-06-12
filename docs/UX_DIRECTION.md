# UX Direction

## Reference Patterns

### Candoorai

Useful:

- Career-focused storytelling instead of generic AI language
- Persistent left navigation for a multi-step career workspace
- Dashboard summary cards, quick actions, saved jobs, and pipeline preview
- Resume upload as the recommended first action

Avoid:

- Presenting many advanced modules before the core resume workflow is proven
- Sending a user from a product page to pricing without explaining the lock

### Resume Worded

Useful:

- One immediate promise: upload a resume and receive feedback
- Report-first product identity
- Category-level and line-level feedback
- Login page that explains the value of returning to saved analyses

Avoid:

- Dense legacy styling and pages with too many competing links
- Treating the score as the product instead of the evidence behind it

### Sorce

Useful:

- Memorable, opinionated product concept
- Strong usage metrics and social proof
- Mobile-first simplicity

Avoid:

- Applying game mechanics to serious editing decisions
- Making automatic submission the default before user trust is established

### Jobscan, Huntr, Teal, Rezi

Useful:

- Jobscan's side-by-side resume and job-description mental model
- Huntr's separation of base quality from job match
- Teal's connection between resumes, saved jobs, and application stages
- Rezi's real-time score updates and transparent disclaimer

## Recommended Visual Character

The product should feel like a calm professional workspace, not a job board and
not a chat interface.

- Goalmatic purple as an identifying accent, not a full-page wash
- Warm neutral backgrounds with high-contrast text
- Compact cards with restrained borders and minimal shadows
- Clear score rings or bars supported by labels and evidence
- Green reserved for verified improvements, not decorative optimism
- Amber for warnings and low-confidence extraction
- Red only for blocking issues or destructive actions

Typography should prioritize document readability. Resume content and analysis
evidence need more visual weight than decorative illustrations.

## Landing Page Structure

1. Header with Goalmatic attribution, methodology, open-source link, and login
2. Hero with one upload-oriented CTA
3. Interactive example showing score, finding, fix, and improved result
4. Explanation of Resume Quality Score versus Job Match Score
5. Three-step workflow: upload, understand, improve
6. Parseability and privacy section
7. Product screenshots
8. Open-source contribution section
9. FAQ and final CTA

Suggested message direction:

> Your resume should not receive a different answer every time you check it.

Supporting message:

> Get a stable score, see the exact evidence, and build a stronger version
> without inventing your experience.

## Login Structure

Use a focused two-column layout on desktop and one column on mobile.

Left:

- Career Studio identity, with Goalmatic clearly credited as the platform
- Short explanation of saved resumes, analyses, and application history
- Goalmatic company attribution

Right:

- Continue with Google
- Email OTP
- Privacy link
- Return to landing page

## Dashboard Structure

Left navigation:

- Overview
- Resumes
- Target a Job
- Saved Jobs
- Applications
- Settings

Main dashboard:

- Active resume and current quality score
- One recommended next action
- Score change across versions
- Recent findings
- Saved job match scores
- Application pipeline preview

Do not show empty analytics cards merely to fill space. Empty states should
teach the next useful action.

## Analysis Report Structure

Top:

- Overall Resume Quality Score
- Parse confidence
- Scoring version
- Last analyzed time
- Compare versions

Body:

- Dimension breakdown
- Prioritized findings
- Resume preview with highlighted evidence
- Why the rule matters
- Exact recommended action
- Expected possible point recovery

Actions:

- Edit manually
- Suggest a rewrite
- Mark as intentional
- Re-run analysis

The score remains visible, but the finding and affected resume content stay at
the center of the screen.

## Rewrite Studio Structure

Use a three-part workspace:

1. Findings queue
2. Structured resume editor
3. Live deterministic score and document preview

AI suggestions must appear as diffs. Users accept, edit, or reject each change.
Unsupported facts appear as unresolved prompts, never as completed resume text.

## Responsive Behavior

- Desktop: persistent navigation and split analysis/editor views
- Tablet: collapsible navigation with stacked report panels
- Mobile: task-focused sequence rather than a compressed desktop dashboard
- Export preview remains readable at actual page proportions

Accessibility requirements include keyboard-complete editing, visible focus,
semantic document structure, non-color status labels, and screen-reader
announcements when a score changes.
