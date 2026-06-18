<template>
  <OverviewLoadingState v-if="!workspace.state.value.hydrated" />
  <div v-else class="page-shell overview-page">
    <header class="page-header">
      <div class="welcome-copy">
        <span class="welcome-date">{{ formattedDate }}</span>
        <h1>Good {{ timeOfDay }}, {{ firstName }}</h1>
        <p v-if="currentVersion">You have {{ openFindings.length }} resume improvement{{ openFindings.length === 1 ? '' : 's' }} worth reviewing. Start with the highest-impact change.</p>
        <p v-else>Build a stronger resume, understand what to improve, and prepare for the roles you want next.</p>
      </div>
      <div v-if="currentVersion" class="page-actions">
        <NuxtLink to="/app/target" class="btn btn-secondary">
          <Target :size="16" />
          Compare with a job
        </NuxtLink>
        <NuxtLink to="/app/resumes/new" class="btn btn-primary">
          <FileUp :size="16" />
          Upload resume
        </NuxtLink>
      </div>
    </header>

    <template v-if="currentResume && currentVersion">
      <section class="focus-panel card">
        <div class="focus-main">
          <span class="next-icon"><Sparkles :size="22" /></span>
          <div class="focus-copy">
            <span class="focus-label">Recommended next step</span>
            <h2>{{ nextAction.title }}</h2>
            <p>{{ nextAction.description }}</p>
          </div>
          <NuxtLink :to="nextAction.to" class="btn btn-primary">
            {{ nextAction.label }}
            <ArrowRight :size="15" />
          </NuxtLink>
        </div>
        <div class="focus-context">
          <div>
            <span>Active resume</span>
            <strong>{{ currentResume.name }}</strong>
          </div>
          <div>
            <span>Resume score</span>
            <strong>{{ currentVersion.analysis.score ?? '—' }}<small v-if="currentVersion.analysis.score !== null">/100</small></strong>
          </div>
          <div>
            <span>Open findings</span>
            <strong>{{ openFindings.length }}</strong>
          </div>
          <div>
            <span>Last reviewed</span>
            <strong class="date-value">{{ currentResumeUpdated }}</strong>
          </div>
        </div>
      </section>

      <section class="dashboard-grid">
        <article class="score-overview card card-pad">
          <div class="card-heading">
            <div>
              <span class="section-kicker">Active resume</span>
              <h2>{{ currentResume.name }}</h2>
              <p>{{ currentVersion.label }} · {{ currentVersion.parsed.stats.words }} words</p>
            </div>
            <NuxtLink :to="`/app/resumes/${currentResume.id}`" class="icon-btn" aria-label="Open resume analysis">
              <ArrowUpRight :size="17" />
            </NuxtLink>
          </div>
          <div class="score-overview-body">
            <div class="score-summary">
              <ScoreRing :score="currentVersion.analysis.score" :size="148" />
              <span :class="['score-status', scoreStatus.tone]">{{ scoreStatus.label }}</span>
            </div>
            <div class="dimension-list">
              <DimensionBar
                v-for="dimension in currentVersion.analysis.dimensions.slice(0, 4)"
                :key="dimension.id"
                :label="dimension.label"
                :score="dimension.score"
                :max-score="dimension.maxScore"
              />
            </div>
          </div>
          <div class="score-footer">
            <span>
              <ShieldCheck :size="15" />
              {{ confidenceLabel }} parse confidence
            </span>
            <span v-if="workspace.state.value.settings.scoringDetails">
              <GitBranch :size="15" />
              {{ currentVersion.analysis.scoringVersion }}
            </span>
          </div>
        </article>

        <article class="search-summary card card-pad">
          <div class="card-heading">
            <div>
              <span class="section-kicker">Job search</span>
              <h2>Career activity</h2>
              <p>Keep the work around your search connected.</p>
            </div>
          </div>
          <div class="summary-stats">
            <NuxtLink to="/app/resumes">
              <span class="stat-icon purple-bg"><Files :size="19" /></span>
              <strong>{{ workspace.state.value.resumes.length }}</strong>
              <small>Resumes</small>
            </NuxtLink>
            <NuxtLink to="/app/jobs">
              <span class="stat-icon blue-bg"><Bookmark :size="19" /></span>
              <strong>{{ workspace.state.value.jobs.length }}</strong>
              <small>Saved jobs</small>
            </NuxtLink>
            <NuxtLink to="/app/applications">
              <span class="stat-icon green-bg"><Send :size="19" /></span>
              <strong>{{ appliedCount }}</strong>
              <small>Applied</small>
            </NuxtLink>
            <NuxtLink to="/app/applications">
              <span class="stat-icon amber-bg"><MessagesSquare :size="19" /></span>
              <strong>{{ interviewCount }}</strong>
              <small>Interviews</small>
            </NuxtLink>
          </div>
          <div v-if="workspace.state.value.settings.weeklyReview" class="weekly-review">
            <div class="weekly-top">
              <span>Weekly momentum</span>
              <strong>{{ weeklyCompletion }}%</strong>
            </div>
            <div class="weekly-track"><span :style="{ width: `${weeklyCompletion}%` }" /></div>
            <p>Review two high-impact findings and prepare one role-specific version.</p>
          </div>
        </article>
      </section>

      <section class="lower-grid">
        <article class="card">
          <div class="section-card-header">
            <div>
              <span class="section-kicker">Resume findings</span>
              <h2>Highest-impact improvements</h2>
            </div>
            <NuxtLink :to="`/app/resumes/${currentResume.id}`">View full report <ArrowRight :size="14" /></NuxtLink>
          </div>
          <div v-if="openFindings.length" class="finding-list">
            <NuxtLink
              v-for="finding in openFindings.slice(0, 4)"
              :key="finding.ruleId"
              :to="`/app/resumes/${currentResume.id}?finding=${finding.ruleId}`"
              class="finding-row"
            >
              <span class="severity-mark" :class="finding.severity" />
              <div>
                <strong>{{ finding.title }}</strong>
                <p>{{ finding.recommendation }}</p>
              </div>
              <span class="recovery">+{{ Math.round(finding.maxPoints - finding.earnedPoints) }}</span>
              <ChevronRight :size="16" />
            </NuxtLink>
          </div>
          <EmptyState
            v-else
            class="compact-empty"
            :icon="CheckCircle2"
            title="Your review is clear"
            description="There are no open findings in this version. Compare it with a role or create a tailored version next."
          >
            <NuxtLink to="/app/target" class="btn btn-secondary btn-sm">Compare with a job</NuxtLink>
          </EmptyState>
        </article>

        <article class="card">
          <div class="section-card-header">
            <div>
              <span class="section-kicker">Saved jobs</span>
              <h2>Recent opportunities</h2>
            </div>
            <NuxtLink to="/app/jobs">View all <ArrowRight :size="14" /></NuxtLink>
          </div>
          <div v-if="workspace.state.value.jobs.length" class="job-list">
            <NuxtLink
              v-for="job in workspace.state.value.jobs.slice(0, 4)"
              :key="job.id"
              :to="`/app/jobs/${job.id}`"
              class="job-row"
            >
              <span class="company-logo">{{ job.company.slice(0, 1).toUpperCase() }}</span>
              <div>
                <strong>{{ job.title }}</strong>
                <p>{{ job.company }} · {{ job.location }}</p>
              </div>
              <span v-if="job.match" class="match-score" :class="{ strong: job.match.score >= 75 }">
                {{ job.match.score }}
              </span>
              <ChevronRight :size="16" />
            </NuxtLink>
          </div>
          <EmptyState
            v-else
            class="compact-empty"
            :icon="Target"
            title="No compared jobs yet"
            description="Add a job description to see which requirements your resume supports and save the opportunity."
          >
            <NuxtLink to="/app/target" class="btn btn-primary btn-sm">Compare with a job</NuxtLink>
          </EmptyState>
        </article>
      </section>
    </template>

    <template v-else>
      <section class="onboarding-hero card">
        <div class="onboarding-copy">
          <span class="onboarding-label">
            <Sparkles :size="14" />
            Your career workspace starts here
          </span>
          <h2>Turn your resume into a clear plan.</h2>
          <p class="body-md">
            Upload your resume to get a consistent score, specific improvements,
            and a workspace for preparing role by role.
          </p>
          <div class="onboarding-actions">
            <NuxtLink to="/app/resumes/new" class="btn btn-primary btn-lg">
              <FileUp :size="17" />
              Upload your resume
            </NuxtLink>
            <NuxtLink to="/methodology" class="btn btn-ghost btn-lg">
              How scoring works
              <ArrowRight :size="15" />
            </NuxtLink>
          </div>
          <div class="onboarding-trust">
            <span><LockKeyhole :size="15" /> Private workspace</span>
            <span><RefreshCw :size="15" /> Repeatable scoring</span>
            <span><Clock3 :size="15" /> Review in minutes</span>
          </div>
        </div>

        <div class="review-preview">
          <div class="preview-heading">
            <span class="preview-icon"><FileSearch :size="22" /></span>
            <div>
              <span>Your first review</span>
              <strong>What you will get</strong>
            </div>
          </div>
          <div class="outcome-list">
            <div>
              <span class="outcome-icon"><Gauge :size="18" /></span>
              <div>
                <strong>A dependable resume score</strong>
                <p>See how clarity, evidence, structure, and completeness contribute.</p>
              </div>
            </div>
            <div>
              <span class="outcome-icon"><ListChecks :size="18" /></span>
              <div>
                <strong>Prioritized improvements</strong>
                <p>Work from the highest-impact change instead of guessing.</p>
              </div>
            </div>
            <div>
              <span class="outcome-icon"><Target :size="18" /></span>
              <div>
                <strong>Role-specific matching</strong>
                <p>Compare the reviewed resume with jobs when you are ready.</p>
              </div>
            </div>
          </div>
          <div class="privacy-note">
            <ShieldCheck :size="17" />
            <p><strong>You stay in control.</strong> Review the extracted text before Career Studio scores it.</p>
          </div>
        </div>
      </section>

      <section class="getting-started">
        <div class="getting-started-heading">
          <span class="section-kicker">Three simple steps</span>
          <h2>From document to direction</h2>
        </div>
        <div class="step-grid">
          <article>
            <span>01</span>
            <div>
              <strong>Upload</strong>
              <p>Add a PDF, DOCX, TXT file, or paste your resume text.</p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <strong>Confirm</strong>
              <p>Check the extracted sections before any scoring begins.</p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <strong>Improve</strong>
              <p>Review clear findings and save each stronger version.</p>
            </div>
          </article>
        </div>
      </section>
    </template>

    <section class="career-roadmap card">
      <div class="section-card-header">
        <div>
          <span class="section-kicker">Career Studio roadmap</span>
          <h2>One profile, a growing set of career tools</h2>
          <p>Available tools work today. Planned tools stay visible so the community can help shape them.</p>
        </div>
      </div>
      <div class="roadmap-grid">
        <article v-for="item in careerRoadmap" :key="item.title" :class="{ live: item.live }">
          <span class="roadmap-icon"><component :is="item.icon" :size="18" /></span>
          <div>
            <small>{{ item.phase }}</small>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  FilePenLine,
  FileUp,
  Files,
  Compass,
  GitBranch,
  Gauge,
  ListChecks,
  LockKeyhole,
  MessagesSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-vue-next'
import { getPrioritizedFindings } from '@/lib/resume/scoring'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const currentResume = workspace.currentResume
const currentVersion = workspace.currentVersion

const firstName = computed(() => workspace.state.value.user?.name.split(/\s+/)[0] || 'there')
const timeOfDay = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
})
const formattedDate = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date())

const openFindings = computed(() => (
  currentVersion.value
    ? getPrioritizedFindings(currentVersion.value.analysis).filter(
        finding => !currentVersion.value?.intentionalRuleIds?.includes(finding.ruleId),
      )
    : []
))
const confidenceLabel = computed(() => (
  currentVersion.value?.analysis.parseConfidence === 'high'
    ? 'High'
    : currentVersion.value?.analysis.parseConfidence === 'medium'
      ? 'Review'
      : 'Low'
))
const appliedCount = computed(() => workspace.state.value.applications.filter(item => (
  ['applied', 'interview', 'offer'].includes(item.status)
)).length)
const interviewCount = computed(() => workspace.state.value.applications.filter(item => (
  ['interview', 'offer'].includes(item.status)
)).length)
const currentResumeUpdated = computed(() => (
  currentResume.value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(currentResume.value.updatedAt))
    : ''
))
const scoreStatus = computed(() => {
  const score = currentVersion.value?.analysis.score
  if (score === null || score === undefined) return { label: 'Needs review', tone: 'warning' }
  if (score >= 80) return { label: 'Strong foundation', tone: 'strong' }
  if (score >= 60) return { label: 'Good progress', tone: 'progress' }
  return { label: 'Room to improve', tone: 'warning' }
})
const weeklyCompletion = computed(() => {
  const resolved = Math.max(0, 4 - Math.min(4, openFindings.value.length))
  const targeted = workspace.state.value.jobs.length ? 1 : 0
  return Math.round(((resolved + targeted) / 5) * 100)
})
const nextAction = computed(() => {
  const firstFinding = openFindings.value[0]
  if (firstFinding && currentResume.value) {
    return {
      title: `Fix “${firstFinding.title}”`,
      description: firstFinding.recommendation,
      label: 'Review finding',
      to: `/app/resumes/${currentResume.value.id}?finding=${firstFinding.ruleId}`,
    }
  }
  return {
    title: 'Create a job-specific resume',
    description: 'Add a job description to measure requirement coverage separately from resume quality.',
    label: 'Compare with a job',
    to: '/app/target',
  }
})

const careerRoadmap = [
  {
    icon: ShieldCheck,
    title: 'Resume checker',
    description: 'Repeatable scoring, exact evidence, and prioritized findings.',
    live: true,
    phase: 'Available',
  },
  {
    icon: FilePenLine,
    title: 'Resume builder',
    description: 'Evidence-preserving edits, exports, and immutable version history.',
    live: true,
    phase: 'Available',
  },
  {
    icon: Target,
    title: 'Job match',
    description: 'Role requirements, evidence gaps, and tailored resume versions.',
    live: true,
    phase: 'Available',
  },
  {
    icon: FileSearch,
    title: 'Cover letter studio',
    description: 'Job-specific drafts grounded in approved resume evidence.',
    live: false,
    phase: 'Planned next',
  },
  {
    icon: Send,
    title: 'Application assistant',
    description: 'Prepare answers and autofill details with review before submission.',
    live: false,
    phase: 'Later phase',
  },
  {
    icon: Compass,
    title: 'Job discovery',
    description: 'Find relevant, verified opportunities without turning the workspace into a noisy job board.',
    live: false,
    phase: 'Later phase',
  },
]
</script>

<style scoped>
.overview-page {
  width: 100%;
  max-width: 1540px;
  margin-inline: auto;
}

.welcome-copy {
  max-width: 760px;
}

.welcome-date {
  display: block;
  margin-bottom: 7px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.focus-panel {
  overflow: hidden;
  margin-bottom: 18px;
  border-color: var(--purple-border);
  background:
    radial-gradient(circle at 0 0, rgba(96, 29, 237, 0.1), transparent 32%),
    var(--card-bg);
}

.focus-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
}

.next-icon {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  border: 1px solid var(--purple-border-soft);
  border-radius: 14px;
  color: var(--purple);
  background: var(--purple-soft);
}

.focus-copy {
  min-width: 0;
}

.focus-label {
  display: block;
  margin-bottom: 5px;
  color: var(--purple-dark);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.focus-main h2 {
  margin: 0 0 5px;
  font-size: 19px;
  line-height: 1.25;
}

.focus-main p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.focus-context {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(110px, 0.65fr));
  border-top: 1px solid var(--purple-border-soft);
  background: var(--surface-subtle);
}

.focus-context > div {
  min-width: 0;
  padding: 13px 18px;
  border-left: 1px solid var(--purple-border-soft);
}

.focus-context > div:first-child {
  border-left: 0;
}

.focus-context span,
.focus-context strong {
  display: block;
}

.focus-context span {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.focus-context strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-context strong small {
  margin-left: 2px;
  color: var(--muted);
  font-size: 9px;
}

.focus-context .date-value {
  font-size: 12px;
}

.dashboard-grid,
.lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
  gap: 18px;
}

.lower-grid {
  margin-top: 18px;
}

.career-roadmap {
  margin-top: 18px;
  padding-bottom: 3px;
}

.career-roadmap .section-card-header {
  padding: 20px 22px;
}

.career-roadmap .section-card-header p {
  max-width: 620px;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.career-roadmap .section-card-header > a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--purple);
  font-size: 11px;
  font-weight: 700;
}

.roadmap-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  padding: 18px;
  border-top: 1px solid var(--line);
}

.roadmap-grid article {
  display: grid;
  grid-template-columns: auto 1fr;
  align-content: start;
  gap: 12px;
  min-height: 118px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface-subtle);
  grid-column: span 2;
}

.roadmap-grid article:nth-last-child(-n + 2) {
  grid-column: span 2;
}

.roadmap-grid article.live {
  border-color: var(--green-border);
  background: var(--green-soft);
}

.roadmap-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  color: var(--purple);
  background: var(--purple-soft);
}

.roadmap-grid article.live .roadmap-icon {
  color: var(--green);
  background: var(--green-soft);
}

.roadmap-grid small,
.roadmap-grid strong {
  display: block;
}

.roadmap-grid small {
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.roadmap-grid strong {
  font-size: 12px;
  line-height: 1.3;
}

.roadmap-grid p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.dashboard-grid > *,
.lower-grid > * {
  min-width: 0;
}

.card-heading,
.section-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.section-kicker {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-heading h2,
.section-card-header h2 {
  margin: 0;
  font-size: 17px;
}

.card-heading p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 10px;
}

.score-overview-body {
  display: grid;
  grid-template-columns: 170px 1fr;
  align-items: center;
  gap: 32px;
  padding: 24px 0 22px;
}

.score-summary {
  display: grid;
  justify-items: center;
  gap: 11px;
}

.score-status {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 750;
}

.score-status.strong {
  color: var(--green);
  background: var(--green-soft);
}

.score-status.progress {
  color: var(--purple-dark);
  background: var(--purple-soft);
}

.score-status.warning {
  color: var(--amber);
  background: var(--amber-soft);
}

.dimension-list {
  display: grid;
  gap: 14px;
}

.score-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 10px;
}

.score-footer span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
}

.summary-stats a {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0 10px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface-tint);
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.summary-stats a:hover {
  border-color: var(--purple-border);
  background: var(--purple-soft);
  transform: translateY(-1px);
}

.stat-icon {
  display: grid;
  width: 37px;
  height: 37px;
  grid-row: 1 / 3;
  place-items: center;
  border-radius: 10px;
}

.purple-bg { color: var(--purple); background: var(--purple-soft); }
.blue-bg { color: var(--blue); background: var(--blue-soft); }
.green-bg { color: var(--green); background: var(--green-soft); }
.amber-bg { color: var(--amber); background: var(--amber-soft); }

.summary-stats strong {
  font-family: var(--font-display);
  font-size: 18px;
}

.summary-stats small {
  color: var(--muted);
  font-size: 11px;
}

.weekly-review {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface-subtle);
}

.weekly-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 10px;
  font-weight: 700;
}

.weekly-track {
  height: 6px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--track-bg);
}

.weekly-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--purple);
}

.weekly-review p {
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 11px;
}

.section-card-header {
  padding: 19px 20px;
  border-bottom: 1px solid var(--line);
}

.section-card-header > a {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--purple);
  font-size: 10px;
  font-weight: 700;
}

.finding-list,
.job-list {
  display: grid;
}

.finding-row,
.job-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 11px;
  min-height: 76px;
  padding: 13px 18px;
  border-top: 1px solid var(--line);
}

.finding-row:first-child,
.job-row:first-child {
  border-top: 0;
}

.finding-row:hover,
.job-row:hover {
  background: var(--surface-hover);
}

.severity-mark {
  width: 7px;
  height: 36px;
  border-radius: 99px;
  background: var(--purple);
}

.severity-mark.high { background: var(--red); }
.severity-mark.medium { background: var(--amber); }
.severity-mark.low { background: var(--blue); }

.finding-row strong,
.job-row strong {
  display: block;
  overflow: hidden;
  margin-bottom: 3px;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finding-row p,
.job-row p {
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recovery {
  padding: 4px 7px;
  border-radius: 99px;
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
  background: var(--green-soft);
}

.company-logo {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  color: var(--purple-dark);
  font-size: 12px;
  font-weight: 800;
  background: var(--purple-soft);
}

.match-score {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 2px solid var(--amber);
  border-radius: 50%;
  color: var(--amber);
  font-size: 10px;
  font-weight: 800;
}

.match-score.strong {
  border-color: var(--green);
  color: var(--green);
}

.compact-empty {
  min-height: 290px;
}

:deep(.compact-empty .empty-icon) {
  width: 48px;
  height: 48px;
  border-radius: 13px;
}

:deep(.compact-empty h3) {
  font-size: 16px;
}

.onboarding-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr);
  overflow: hidden;
  min-height: 470px;
  border-color: var(--line);
  background:
    radial-gradient(circle at 12% 8%, rgba(96, 29, 237, 0.12), transparent 30%),
    linear-gradient(135deg, var(--card-bg) 0%, var(--surface-warm) 56%, var(--surface-soft) 100%);
}

.onboarding-copy {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  padding: clamp(42px, 5vw, 74px);
}

.onboarding-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 22px;
  padding: 7px 10px;
  border: 1px solid var(--purple-border-soft);
  border-radius: 999px;
  color: var(--purple-dark);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.04em;
  background: var(--purple-soft);
  text-transform: uppercase;
}

.onboarding-copy h2 {
  max-width: 650px;
  margin: 0 0 16px;
  font-size: clamp(34px, 4.1vw, 54px);
  line-height: 1.04;
  letter-spacing: -0.045em;
}

.onboarding-copy > p {
  max-width: 590px;
  margin-bottom: 25px;
  color: var(--ink-soft);
  font-size: 15px;
  line-height: 1.65;
}

.onboarding-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.onboarding-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 28px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
}

.onboarding-trust span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.review-preview {
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 40px;
  border-left: 1px solid var(--line);
  background: var(--surface-subtle);
}

.preview-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 21px;
  border-bottom: 1px solid var(--line);
}

.preview-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  color: var(--purple);
  background: var(--purple-soft);
}

.preview-heading span:not(.preview-icon),
.preview-heading strong {
  display: block;
}

.preview-heading span:not(.preview-icon) {
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-heading strong {
  font-size: 17px;
}

.outcome-list {
  display: grid;
}

.outcome-list > div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 13px;
  padding: 19px 0;
  border-bottom: 1px solid var(--line);
}

.outcome-list > div:last-child {
  border-bottom: 0;
}

.outcome-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--purple-border-soft);
  border-radius: 10px;
  color: var(--purple);
  background: var(--control-bg);
}

.outcome-list strong {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
}

.outcome-list p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 5px;
  padding: 13px 14px;
  border: 1px solid var(--green-border-soft);
  border-radius: 11px;
  color: var(--green);
  background: var(--green-soft);
}

.privacy-note svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.privacy-note p {
  margin: 0;
  color: var(--privacy-note-text);
  font-size: 10px;
  line-height: 1.5;
}

.getting-started {
  display: grid;
  grid-template-columns: minmax(220px, 0.55fr) 1.45fr;
  align-items: center;
  gap: 30px;
  margin-top: 18px;
  padding: 23px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-tint);
}

.getting-started-heading h2 {
  margin: 0;
  font-size: 18px;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.step-grid article {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--card-bg);
}

.step-grid article > span {
  color: var(--purple);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.step-grid strong {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
}

.step-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
}

@media (max-width: 1100px) {
  .dashboard-grid,
  .lower-grid {
    grid-template-columns: 1fr;
  }

  .onboarding-hero {
    grid-template-columns: 1fr 0.9fr;
  }

  .getting-started {
    grid-template-columns: 1fr;
  }

  .roadmap-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .roadmap-grid article,
  .roadmap-grid article:nth-last-child(-n + 2) {
    grid-column: auto;
  }

  .roadmap-grid article:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {
  .focus-main {
    grid-template-columns: auto 1fr;
  }

  .focus-main .btn {
    grid-column: 1 / -1;
    justify-self: start;
    margin-left: 68px;
  }

  .focus-context {
    grid-template-columns: 1fr 1fr;
  }

  .focus-context > div:nth-child(3) {
    border-left: 0;
  }

  .focus-context > div:nth-child(n + 3) {
    border-top: 1px solid var(--purple-border-soft);
  }

  .onboarding-hero {
    grid-template-columns: 1fr;
  }

  .review-preview {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .step-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .score-overview-body {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .dimension-list {
    width: 100%;
  }

  .focus-main {
    grid-template-columns: 1fr;
  }

  .next-icon {
    width: 44px;
    height: 44px;
  }

  .focus-main .btn {
    width: 100%;
    margin-left: 0;
  }

  .focus-context {
    grid-template-columns: 1fr;
  }

  .focus-context > div {
    border-top: 1px solid var(--purple-border-soft);
    border-left: 0;
  }

  .focus-context > div:first-child {
    border-top: 0;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }

  .onboarding-copy {
    padding: 38px 24px;
  }

  .onboarding-copy h2 {
    font-size: 37px;
  }

  .onboarding-actions {
    display: grid;
    width: 100%;
  }

  .onboarding-trust {
    display: grid;
    gap: 10px;
    margin-top: 24px;
  }

  .review-preview {
    padding: 28px 24px;
  }

  .getting-started {
    padding: 19px;
  }

  .career-roadmap .section-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .roadmap-grid {
    grid-template-columns: 1fr;
  }

  .roadmap-grid article:last-child {
    grid-column: auto;
  }
}
</style>
