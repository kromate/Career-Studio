<template>
  <div class="page-shell">
    <header class="page-header">
      <div>
        <h1>Compare your resume with a job</h1>
        <p>See which requirements your resume supports, where the evidence is thin, and what to strengthen next.</p>
      </div>
    </header>

    <div class="target-layout">
      <section class="target-form card card-pad">
        <div class="form-heading">
          <span class="form-icon"><Target :size="21" /></span>
          <div>
            <h2>Add the opportunity</h2>
            <p>Use the job description as published so the comparison reflects the employer's stated requirements.</p>
          </div>
        </div>

        <form @submit.prevent="extractAnalyzeAndSave">
          <label class="field">
            <span class="field-label">Job posting URL</span>
            <input v-model.trim="form.url" class="input" type="url" placeholder="https://company.com/jobs/…" required>
            <small class="field-help">Use the public posting URL for the role you want to compare.</small>
          </label>
          <p v-if="!selectedVersion" class="error-note">Upload a resume before comparing a job.</p>
          <p v-if="extractError" class="error-note">{{ extractError }}</p>
          <button class="btn btn-primary btn-lg submit-button" type="submit" :disabled="!canAnalyze || extracting">
            <AppSpinner v-if="extracting" :size="17" light />
            <ScanSearch v-else :size="17" />
            {{ extracting ? 'Extracting job…' : 'Extract and save match' }}
          </button>
        </form>
      </section>

      <aside class="target-preview">
        <article v-if="liveMatch" class="match-preview card card-pad">
          <div class="match-preview-top">
            <div>
              <span class="section-kicker">Live Job Match Score</span>
              <h2>{{ extractedJob?.title || 'Target role' }}</h2>
            </div>
            <ScoreRing :score="liveMatch.score" :size="100" :stroke="8" />
          </div>
          <div class="match-dimensions">
            <DimensionBar
              v-for="dimension in liveMatch.dimensions"
              :key="dimension.id"
              :label="dimension.label"
              :score="dimension.score"
              :max-score="dimension.maxScore"
            />
          </div>
          <div class="coverage-summary">
            <div>
              <strong>{{ matchedRequired }}/{{ requiredCount }}</strong>
              <span>required skills</span>
            </div>
            <div>
              <strong>{{ matchedResponsibilities }}/{{ responsibilityCount }}</strong>
              <span>responsibilities</span>
            </div>
          </div>
          <p class="score-disclaimer">
            This measures explicit role alignment, not hiring probability.
          </p>
        </article>

        <article v-else class="match-placeholder card card-pad">
          <span><Gauge :size="27" /></span>
          <h2>Your job match will appear here</h2>
          <p>Enter a public job posting URL to extract the description and compare it with your current resume.</p>
          <ul>
            <li><Check :size="14" /> Job description extraction</li>
            <li><Check :size="14" /> Required skill coverage</li>
            <li><Check :size="14" /> Responsibility evidence</li>
            <li><Check :size="14" /> Experience and seniority</li>
            <li><Check :size="14" /> Preferred qualifications</li>
          </ul>
        </article>

        <article class="honesty-note card card-pad">
          <ShieldCheck :size="20" />
          <div>
            <h3>No keyword-stuffing bonus</h3>
            <p>A requirement earns coverage once. Repeating the same term does not keep increasing the score.</p>
          </div>
        </article>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StructuredJobImport } from '@/types'
import {
  Check,
  Gauge,
  ScanSearch,
  ShieldCheck,
  Target,
} from 'lucide-vue-next'
import { matchResumeToJob } from '@/lib/resume/matching'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const toast = useToast()
const extracting = ref(false)
const extractError = ref('')
const extractedJob = ref<StructuredJobImport | null>(null)
const form = reactive({
  url: '',
})

onMounted(() => {
  workspace.hydrate()
})

const selectedResume = computed(() => workspace.state.value.resumes[0])
const selectedVersion = computed(() => selectedResume.value ? workspace.getActiveVersion(selectedResume.value) : undefined)
const wordCount = computed(() => extractedJob.value?.description.trim() ? extractedJob.value.description.trim().split(/\s+/).length : 0)
const liveMatch = computed(() => (
  selectedVersion.value && extractedJob.value && wordCount.value >= 50
    ? matchResumeToJob(selectedVersion.value.parsed, extractedJob.value.description, 'preview')
    : null
))
const canAnalyze = computed(() => Boolean(
  form.url && selectedVersion.value,
))
const required = computed(() => liveMatch.value?.requirements.filter(item => item.type === 'required') || [])
const responsibilities = computed(() => liveMatch.value?.requirements.filter(item => item.type === 'responsibility') || [])
const requiredCount = computed(() => required.value.length)
const responsibilityCount = computed(() => responsibilities.value.length)
const matchedRequired = computed(() => required.value.filter(item => item.matched).length)
const matchedResponsibilities = computed(() => responsibilities.value.filter(item => item.matched).length)

const jobExtractionErrorMessage = (error: unknown) => {
  const candidate = error as {
    data?: { message?: string; statusMessage?: string; statusCode?: number }
    message?: string
    statusCode?: number
    statusMessage?: string
  }
  const message = candidate.data?.statusMessage || candidate.data?.message || candidate.statusMessage || candidate.message || 'Job extraction failed.'
  const statusCode = candidate.data?.statusCode || candidate.statusCode
  if (statusCode === 503 || message.includes('not configured')) {
    return 'Tabstack job extraction is not configured. Add TABSTACK_API_KEY to .env.dev and restart the dev server.'
  }
  return message
}

const extractAnalyzeAndSave = async () => {
  if (!canAnalyze.value || extracting.value) return
  extracting.value = true
  extractError.value = ''
  extractedJob.value = null

  try {
    const response = await $fetch<{ job: StructuredJobImport }>('/api/jobs/extract', {
      method: 'POST',
      body: { url: form.url },
    })
    extractedJob.value = response.job
    const job = workspace.saveJob({ ...response.job, resumeId: selectedResume.value?.id })
    workspace.addApplication(job.id)
    toast.show('Job match saved', {
      message: `Match score: ${job.match?.score ?? '—'}/100`,
    })
    await navigateTo(`/app/jobs/${job.id}`)
  } catch (error) {
    const message = jobExtractionErrorMessage(error)
    extractError.value = message
    toast.show('Job import failed', { message, tone: 'error' })
  } finally {
    extracting.value = false
  }
}
</script>

<style scoped>
.target-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  align-items: start;
  gap: 17px;
}

.form-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.form-icon {
  display: grid;
  width: 45px;
  height: 45px;
  place-items: center;
  border-radius: 10px;
  color: var(--purple);
  background: var(--purple-soft);
}

.form-heading h2 {
  margin-bottom: 5px;
  font-size: 17px;
}

.form-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
}

.target-form form {
  display: grid;
  gap: 17px;
}

.field-label small {
  color: var(--muted);
  font-weight: 500;
}

.field-help {
  color: var(--muted);
  font-size: 11px;
}

.error-note {
  margin: 0;
  color: var(--red);
  font-size: 11px;
  line-height: 1.5;
}

.submit-button {
  width: 100%;
}

.target-preview {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 82px;
}

.match-preview-top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
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

.match-preview h2 {
  margin: 0;
  font-size: 16px;
}

.match-dimensions {
  display: grid;
  gap: 12px;
  margin: 20px 0;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.coverage-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.coverage-summary > div {
  padding: 12px;
  border-radius: 10px;
  background: var(--surface-soft);
}

.coverage-summary strong,
.coverage-summary span {
  display: block;
}

.coverage-summary strong {
  margin-bottom: 3px;
  font-family: var(--font-display);
  font-size: 17px;
}

.coverage-summary span {
  color: var(--muted);
  font-size: 10px;
}

.score-disclaimer {
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.match-placeholder {
  min-height: 380px;
}

.match-placeholder > span {
  display: grid;
  width: 57px;
  height: 57px;
  place-items: center;
  margin-bottom: 25px;
  border-radius: 12px;
  color: var(--purple);
  background: var(--purple-soft);
}

.match-placeholder h2 {
  margin-bottom: 8px;
  font-size: 18px;
}

.match-placeholder > p {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.55;
}

.match-placeholder ul {
  display: grid;
  gap: 10px;
  margin: 25px 0 0;
  padding: 0;
  list-style: none;
}

.match-placeholder li {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-soft);
  font-size: 10px;
}

.match-placeholder li svg {
  color: var(--green);
}

.honesty-note {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  color: var(--green);
  background: var(--green-soft);
}

.honesty-note h3 {
  margin-bottom: 5px;
  font-size: 12px;
}

.honesty-note p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

@media (max-width: 1050px) {
  .target-layout {
    grid-template-columns: 1fr;
  }

  .target-preview {
    position: static;
  }
}
</style>
