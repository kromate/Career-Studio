<template>
  <div class="page-shell">
    <template v-if="job">
      <header class="page-header">
        <div>
          <NuxtLink to="/app/jobs" class="back-link"><ArrowLeft :size="14" /> Saved jobs</NuxtLink>
          <div class="job-heading">
            <span class="company-logo">{{ job.company.slice(0, 1).toUpperCase() }}</span>
            <div>
              <h1>{{ job.title }}</h1>
              <p>{{ job.company }} · {{ job.location }}</p>
            </div>
          </div>
        </div>
        <div class="page-actions">
          <a v-if="job.url" :href="job.url" class="btn btn-secondary" target="_blank" rel="noreferrer">
            <ExternalLink :size="15" />
            View posting
          </a>
          <button class="btn btn-primary" type="button" @click="prepareTailoredVersion">
            <Sparkles :size="15" />
            Tailor resume
          </button>
          <NuxtLink :to="`/app/jobs/${job.id}/cover-letter`" class="btn btn-secondary">
            <FilePenLine :size="15" />
            Cover letter
          </NuxtLink>
        </div>
      </header>

      <section v-if="job.match" class="job-score-card card">
        <div class="job-score-primary">
          <ScoreRing :score="job.match.score" :size="154" />
          <div>
            <span class="section-kicker">Career Studio Job Match Score</span>
            <h2>{{ matchMessage.title }}</h2>
            <p>{{ matchMessage.description }}</p>
            <span class="score-version">{{ job.match.scoringVersion }} · {{ job.match.taxonomyVersion }}</span>
          </div>
        </div>
        <div class="job-dimensions">
          <DimensionBar
            v-for="dimension in job.match.dimensions"
            :key="dimension.id"
            :label="dimension.label"
            :score="dimension.score"
            :max-score="dimension.maxScore"
          />
        </div>
      </section>

      <section class="job-detail-grid">
        <article class="card requirement-card">
          <div class="section-card-header">
            <div>
              <span class="section-kicker">Requirement evidence</span>
              <h2>What the role asks for</h2>
            </div>
            <select v-model="selectedResumeId" class="select resume-select" @change="refreshMatch">
              <option v-for="resume in workspace.state.value.resumes" :key="resume.id" :value="resume.id">
                {{ resume.name }}
              </option>
            </select>
          </div>
          <div class="requirement-groups">
            <section v-for="group in requirementGroups" :key="group.type">
              <h3>{{ group.label }} <span>{{ group.matched }}/{{ group.items.length }} matched</span></h3>
              <div>
                <div v-for="item in group.items" :key="item.id" class="requirement-row" :class="{ matched: item.matched }">
                  <span>
                    <Check v-if="item.matched" :size="14" />
                    <X v-else :size="14" />
                  </span>
                  <div>
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.priority }} · {{ item.matched ? 'Evidence found' : 'Not explicit' }}</small>
                    <p v-if="item.sourceSentences.length" class="job-source">{{ item.sourceSentences[0] }}</p>
                    <blockquote v-if="item.evidenceLocations.length">{{ item.evidenceLocations[0]?.quote }}</blockquote>
                    <p v-else class="missing-action">{{ missingAction(item.id) }}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div v-if="job.match?.warnings.length" class="coverage-warnings">
            <TriangleAlert :size="15" />
            <ul>
              <li v-for="warning in job.match.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>
        </article>

        <aside class="job-aside">
          <article class="card card-pad">
            <span class="section-kicker">Recommended next steps</span>
            <h2>Close the most important gaps</h2>
            <ul class="recommendations">
              <li v-for="recommendation in job.match?.recommendations" :key="recommendation">
                <Lightbulb :size="15" />
                {{ recommendation }}
              </li>
            </ul>
            <div v-if="job.match?.missing.length" class="missing-list">
              <strong>Missing evidence</strong>
              <p v-for="item in job.match.missing.slice(0, 5)" :key="item.requirementId">
                {{ item.label }}
              </p>
            </div>
            <button class="btn btn-primary full-button" type="button" @click="prepareTailoredVersion">
              Create tailored version
            </button>
            <NuxtLink :to="`/app/jobs/${job.id}/cover-letter`" class="btn btn-secondary full-button">
              Draft cover letter
            </NuxtLink>
          </article>

          <article class="card card-pad">
            <span class="section-kicker">Application status</span>
            <h2>{{ application ? statusLabels[application.status] : 'Not tracked' }}</h2>
            <select v-if="application" v-model="applicationStatus" class="select" @change="updateStatus">
              <option v-for="status in statuses" :key="status" :value="status">{{ statusLabels[status] }}</option>
            </select>
            <button v-else class="btn btn-secondary full-button" type="button" @click="addToPipeline">
              Add to application pipeline
            </button>
          </article>

          <article class="card card-pad danger-card">
            <button type="button" @click="deleteConfirm = true">
              <Trash2 :size="15" />
              Remove saved job
            </button>
          </article>
        </aside>
      </section>

      <section class="description-card card">
        <div class="section-card-header">
          <div>
            <span class="section-kicker">Source material</span>
            <h2>Job description</h2>
          </div>
          <span>{{ job.description.split(/\s+/).length }} words</span>
        </div>
        <pre>{{ job.description }}</pre>
      </section>

      <ConfirmDialog
        :open="deleteConfirm"
        title="Remove this saved job?"
        description="The associated application pipeline record will also be removed."
        confirm-label="Remove job"
        loading-label="Removing…"
        :loading="deleteLoading"
        @close="deleteConfirm = false"
        @confirm="deleteJob"
      />
    </template>
    <DetailPageSkeleton v-else />
  </div>
</template>

<script setup lang="ts">
import type { ApplicationStatus, JobRequirement } from '@/types'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FilePenLine,
  Lightbulb,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const toast = useToast()
const selectedResumeId = ref('')
const deleteConfirm = ref(false)
const deleteLoading = ref(false)
const statuses: ApplicationStatus[] = ['saved', 'drafting', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']
const statusLabels: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  drafting: 'Drafting materials',
  applied: 'Applied',
  interview: 'Interviewing',
  offer: 'Offer received',
  rejected: 'Closed',
  withdrawn: 'Withdrawn',
}

const job = computed(() => workspace.getJob(route.params.id as string))
const application = computed(() => workspace.state.value.applications.find(item => item.jobId === job.value?.id))
const applicationStatus = ref<ApplicationStatus>('saved')
const matchMessage = computed(() => {
  const score = job.value?.match?.score || 0
  if (score >= 85) return { title: 'Strong explicit alignment', description: 'The resume covers most of the role. Tailor the summary and strongest evidence before applying.' }
  if (score >= 70) return { title: 'Good match with focused gaps', description: 'Prioritize the missing required skills and responsibility evidence.' }
  if (score >= 50) return { title: 'Partial alignment', description: 'The role may fit, but important criteria are not explicit in this resume.' }
  return { title: 'Significant evidence gaps', description: 'Review whether this role matches your background before rewriting the resume.' }
})
const requirementGroups = computed(() => {
  const requirements = job.value?.match?.requirements || []
  const group = (type: JobRequirement['type'], label: string) => {
    const items = requirements.filter(item => item.type === type)
    return { type, label, items, matched: items.filter(item => item.matched).length }
  }
  return [
    group('required', 'Required skills'),
    group('responsibility', 'Responsibilities'),
    group('credential', 'Education and credentials'),
    group('preferred', 'Preferred skills'),
  ].filter(item => item.items.length)
})
const missingAction = (requirementId: string) => (
  job.value?.match?.missing.find(item => item.requirementId === requirementId)?.suggestedAction || 'Add evidence only if it is truthful.'
)

onMounted(() => {
  workspace.hydrate()
  if (!job.value) {
    navigateTo('/app/jobs')
    return
  }
  selectedResumeId.value = job.value.resumeId || workspace.state.value.resumes[0]?.id || ''
  applicationStatus.value = application.value?.status || 'saved'
})

const refreshMatch = () => {
  if (!job.value || !selectedResumeId.value) return
  workspace.updateJobMatch(job.value.id, selectedResumeId.value)
  toast.show('Job match recalculated')
}

const prepareTailoredVersion = async () => {
  if (!job.value) return
  const resume = workspace.state.value.resumes.find(item => item.id === selectedResumeId.value)
  const version = resume ? workspace.getActiveVersion(resume) : undefined
  if (!resume || !version) {
    toast.show('Select a resume first', { tone: 'warning' })
    return
  }
  await navigateTo(`/app/resumes/${resume.id}/rewrite?target=${job.value.id}`)
}

const addToPipeline = () => {
  if (!job.value) return
  workspace.addApplication(job.value.id)
  applicationStatus.value = 'saved'
  toast.show('Added to application pipeline')
}

const updateStatus = () => {
  if (!application.value) return
  workspace.moveApplication(application.value.id, applicationStatus.value)
  toast.show(`Application moved to ${statusLabels[applicationStatus.value]}`)
}

const deleteJob = async () => {
  if (!job.value) return
  deleteLoading.value = true
  workspace.deleteJob(job.value.id)
  toast.show('Saved job removed', { tone: 'info' })
  await navigateTo('/app/jobs')
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 9px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 650;
}

.job-heading {
  display: flex;
  align-items: center;
  gap: 13px;
}

.company-logo {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 13px;
  color: var(--purple-dark);
  font-size: 15px;
  font-weight: 800;
  background: var(--purple-soft);
}

.job-heading h1 {
  margin-bottom: 4px;
}

.job-heading p {
  margin: 0;
}

.job-score-card {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  align-items: center;
  gap: 45px;
  padding: 28px;
}

.job-score-primary {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 22px;
}

.section-kicker {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.job-score-primary h2 {
  margin-bottom: 8px;
  font-size: 20px;
}

.job-score-primary p {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.55;
}

.score-version {
  color: var(--muted);
  font-family: ui-monospace, monospace;
  font-size: 10px;
}

.job-dimensions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;
}

.job-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  align-items: start;
  gap: 17px;
  margin-top: 17px;
}

.requirement-card {
  overflow: hidden;
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid var(--line);
}

.section-card-header h2 {
  margin: 0;
  font-size: 16px;
}

.resume-select {
  width: 220px;
  height: 40px;
  font-size: 10px;
}

.requirement-groups {
  display: grid;
  gap: 0;
}

.requirement-groups section {
  padding: 20px;
  border-top: 1px solid var(--line);
}

.requirement-groups section:first-child {
  border-top: 0;
}

.requirement-groups h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
}

.requirement-groups h3 span {
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
}

.requirement-groups section > div {
  display: grid;
  grid-template-columns: 1fr;
  gap: 7px;
}

.requirement-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  padding: 11px;
  border: 1px solid var(--red-border);
  border-radius: 9px;
  background: var(--red-soft);
}

.requirement-row.matched {
  border-color: var(--green-border);
  background: var(--green-soft);
}

.requirement-row > span {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 6px;
  color: var(--red);
  background: var(--card-bg);
}

.requirement-row.matched > span {
  color: var(--green);
}

.requirement-row strong {
  font-size: 10px;
}

.requirement-row small {
  color: var(--muted);
  font-size: 10px;
  text-transform: capitalize;
}

.job-source,
.missing-action,
.requirement-row blockquote {
  margin: 7px 0 0;
  font-size: 10px;
  line-height: 1.45;
}

.job-source {
  color: var(--muted);
}

.missing-action {
  color: var(--red);
}

.requirement-row blockquote {
  padding-left: 9px;
  border-left: 2px solid var(--green-border);
  color: var(--ink-soft);
}

.coverage-warnings {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  margin: 0 20px 20px;
  padding: 12px;
  border-radius: 8px;
  color: var(--amber);
  background: var(--amber-soft);
}

.coverage-warnings ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 16px;
  color: var(--ink-soft);
  font-size: 10px;
}

.job-aside {
  display: grid;
  gap: 14px;
}

.job-aside h2 {
  margin-bottom: 14px;
  font-size: 16px;
}

.recommendations {
  display: grid;
  gap: 10px;
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}

.recommendations li {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

.recommendations svg {
  flex: 0 0 auto;
  color: var(--amber);
}

.missing-list {
  display: grid;
  gap: 6px;
  margin: 0 0 16px;
  padding: 12px;
  border-radius: 8px;
  background: var(--red-soft);
}

.missing-list strong {
  color: var(--red);
  font-size: 11px;
}

.missing-list p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 10px;
}

.full-button {
  width: 100%;
}

.danger-card {
  padding: 10px;
}

.danger-card button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  border: 0;
  border-radius: 9px;
  color: var(--red);
  font-size: 10px;
  font-weight: 700;
  background: var(--red-soft);
  cursor: pointer;
}

.description-card {
  overflow: hidden;
  margin-top: 17px;
}

.description-card pre {
  overflow: auto;
  max-height: 500px;
  margin: 0;
  padding: 25px;
  color: var(--ink-soft);
  font-family: var(--font-body);
  font-size: 11px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.section-card-header > span {
  color: var(--muted);
  font-size: 11px;
}

@media (max-width: 980px) {
  .job-score-card,
  .job-detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .job-score-primary {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .job-dimensions,
  .requirement-groups section > div {
    grid-template-columns: 1fr;
  }

  .section-card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .resume-select {
    width: 100%;
  }
}
</style>
