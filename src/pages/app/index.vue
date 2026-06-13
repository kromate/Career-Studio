<template>
  <OverviewLoadingState v-if="!workspace.state.value.hydrated" />
  <div v-else class="page-shell">
    <header class="page-header">
      <div>
        <span class="welcome-date">{{ formattedDate }}</span>
        <h1>Good {{ timeOfDay }}, {{ firstName }}</h1>
        <p v-if="currentVersion">You have {{ openFindings.length }} resume improvement{{ openFindings.length === 1 ? '' : 's' }} worth reviewing. Start with the highest-impact change.</p>
        <p v-else>Start with the document that introduces you: a clear, truthful resume built around your strongest evidence.</p>
      </div>
      <div class="page-actions">
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
      <section class="next-action card">
        <span class="next-icon"><Sparkles :size="21" /></span>
        <div>
          <span class="badge badge-purple">Recommended next action</span>
          <h2>{{ nextAction.title }}</h2>
          <p>{{ nextAction.description }}</p>
        </div>
        <NuxtLink :to="nextAction.to" class="btn btn-primary">
          {{ nextAction.label }}
          <ArrowRight :size="15" />
        </NuxtLink>
      </section>

      <section class="dashboard-grid">
        <article class="score-overview card card-pad">
          <div class="card-heading">
            <div>
              <span class="section-kicker">Active resume</span>
              <h2>{{ currentResume.name }}</h2>
            </div>
            <NuxtLink :to="`/app/resumes/${currentResume.id}`" class="icon-btn" aria-label="Open resume analysis">
              <ArrowUpRight :size="17" />
            </NuxtLink>
          </div>
          <div class="score-overview-body">
            <ScoreRing :score="currentVersion.analysis.score" :size="142" />
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
              <h2>Your opportunities</h2>
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
              <span>This week's focus</span>
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
          <div class="finding-list">
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
            :icon="Target"
            title="No compared jobs yet"
            description="Add a job description to see which requirements your resume supports and save the opportunity."
          >
            <NuxtLink to="/app/target" class="btn btn-primary btn-sm">Compare with a job</NuxtLink>
          </EmptyState>
        </article>
      </section>
    </template>

    <section v-else class="empty-dashboard card">
      <div class="empty-dashboard-copy">
        <span class="empty-illustration"><FileSearch :size="34" /></span>
        <span class="eyebrow">Start with your resume</span>
        <h2 class="heading-lg">See what your resume communicates.</h2>
        <p class="body-md">
          First, confirm what Career Studio extracted. Then get specific feedback
          on clarity, evidence, structure, and how well your resume supports a role.
        </p>
        <NuxtLink to="/app/resumes/new" class="btn btn-primary btn-lg">
          <FileUp :size="17" />
          Upload a resume
        </NuxtLink>
      </div>
      <div class="empty-dashboard-steps">
        <div><span>1</span><strong>Upload</strong><p>PDF, DOCX, or TXT</p></div>
        <div><span>2</span><strong>Check</strong><p>Confirm the extraction</p></div>
        <div><span>3</span><strong>Review</strong><p>Prioritize clear improvements</p></div>
      </div>
    </section>

    <section class="career-roadmap card">
      <div class="section-card-header">
        <div>
          <span class="section-kicker">Beyond the resume</span>
          <h2>Career support that grows with you</h2>
        </div>
        <a href="https://github.com/kromate/Career-Studio" target="_blank" rel="noreferrer">
          Join the roadmap <ArrowUpRight :size="14" />
        </a>
      </div>
      <div class="roadmap-grid">
        <article v-for="item in careerRoadmap" :key="item.title" :class="{ live: item.live }">
          <span class="roadmap-icon"><component :is="item.icon" :size="18" /></span>
          <div>
            <small>{{ item.live ? 'Available now' : 'Planned' }}</small>
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
  ChevronRight,
  FileSearch,
  FileUp,
  Files,
  Building2,
  Compass,
  GitBranch,
  GraduationCap,
  MessagesSquare,
  Mic2,
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
    icon: FileSearch,
    title: 'Resume review and rewriting',
    description: 'Clarify your strongest evidence, tailor it to roles, and track every version.',
    live: true,
  },
  {
    icon: Mic2,
    title: 'Practice interviews',
    description: 'Practice live with peers and exchange structured, useful feedback.',
    live: false,
  },
  {
    icon: GraduationCap,
    title: 'Mentorship',
    description: 'Book focused conversations with people who have relevant experience.',
    live: false,
  },
  {
    icon: Building2,
    title: 'Company and pay insights',
    description: 'Learn from anonymous interview, workplace, and compensation experiences.',
    live: false,
  },
  {
    icon: Compass,
    title: 'Career discovery',
    description: 'Connect your skills and interests to roles and realistic transition paths.',
    live: false,
  },
]
</script>

<style scoped>
.welcome-date {
  display: block;
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.next-action {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 17px;
  margin-bottom: 17px;
  padding: 20px;
  border-color: #ded3fa;
  background: var(--purple-soft);
}

.next-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 10px;
  color: var(--purple);
  background: #fff;
}

.next-action h2 {
  margin: 7px 0 4px;
  font-size: 17px;
}

.next-action p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.dashboard-grid,
.lower-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 17px;
}

.lower-grid {
  margin-top: 17px;
}

.career-roadmap {
  margin-top: 17px;
  padding-bottom: 4px;
}

.career-roadmap .section-card-header {
  padding: 20px 20px 0;
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  padding: 17px;
}

.roadmap-grid article {
  display: grid;
  grid-template-columns: auto 1fr;
  align-content: start;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f9fafb;
}

.roadmap-grid article.live {
  border-color: #c7eadf;
  background: #f1fbf7;
}

.roadmap-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 9px;
  color: var(--purple);
  background: var(--purple-soft);
}

.roadmap-grid article.live .roadmap-icon {
  color: var(--green);
  background: #ddf5ec;
}

.roadmap-grid small,
.roadmap-grid strong {
  display: block;
}

.roadmap-grid small {
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.roadmap-grid strong {
  font-size: 11px;
  line-height: 1.3;
}

.roadmap-grid p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.45;
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
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-heading h2,
.section-card-header h2 {
  margin: 0;
  font-size: 16px;
}

.score-overview-body {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 35px;
  padding: 27px 0 24px;
}

.dimension-list {
  display: grid;
  gap: 14px;
}

.score-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
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
  margin-top: 24px;
}

.summary-stats a {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0 10px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.summary-stats a:hover {
  border-color: #d2c8f1;
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
  margin-top: 18px;
  padding: 15px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f9fafb;
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
  background: #e7e3ed;
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
  padding: 20px;
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
  min-height: 72px;
  padding: 13px 18px;
  border-top: 1px solid var(--line);
}

.finding-row:first-child,
.job-row:first-child {
  border-top: 0;
}

.finding-row:hover,
.job-row:hover {
  background: var(--surface-soft);
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

.empty-dashboard {
  display: grid;
  grid-template-columns: 1fr 0.75fr;
  overflow: hidden;
}

.empty-dashboard-copy {
  padding: 65px;
}

.empty-illustration {
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  margin-bottom: 35px;
  border-radius: 20px;
  color: var(--purple);
  background: var(--purple-soft);
}

.empty-dashboard-copy p {
  max-width: 500px;
  margin-bottom: 25px;
}

.empty-dashboard-steps {
  display: grid;
  align-content: center;
  gap: 1px;
  padding: 35px;
  border-left: 1px solid var(--line);
  background: #f9fafb;
}

.empty-dashboard-steps > div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0 13px;
  padding: 20px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}

.empty-dashboard-steps > div:last-child {
  border-bottom: 0;
}

.empty-dashboard-steps span {
  display: grid;
  width: 28px;
  height: 28px;
  grid-row: 1 / 3;
  place-items: center;
  border-radius: 8px;
  color: var(--purple);
  font-size: 10px;
  font-weight: 800;
  background: var(--purple-soft);
}

.empty-dashboard-steps strong {
  font-size: 12px;
}

.empty-dashboard-steps p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 11px;
}

@media (max-width: 1100px) {
  .dashboard-grid,
  .lower-grid {
    grid-template-columns: 1fr;
  }

  .roadmap-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .next-action {
    grid-template-columns: auto 1fr;
  }

  .next-action .btn {
    grid-column: 1 / -1;
  }

  .score-overview-body {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .dimension-list {
    width: 100%;
  }

  .empty-dashboard {
    grid-template-columns: 1fr;
  }

  .empty-dashboard-copy {
    padding: 36px 24px;
  }

  .career-roadmap .section-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .roadmap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
