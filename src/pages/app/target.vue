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

        <form @submit.prevent="analyzeAndSave">
          <div class="grid-2">
            <label class="field">
              <span class="field-label">Job title</span>
              <input v-model.trim="form.title" class="input" placeholder="Senior Product Designer" required>
            </label>
            <label class="field">
              <span class="field-label">Company</span>
              <input v-model.trim="form.company" class="input" placeholder="Company name" required>
            </label>
          </div>
          <div class="grid-2">
            <label class="field">
              <span class="field-label">Location</span>
              <input v-model.trim="form.location" class="input" placeholder="Remote, London, Lagos…">
            </label>
            <label class="field">
              <span class="field-label url-label">
                Job URL <small>optional</small>
                <ComingSoonBadge>Auto-import coming soon</ComingSoonBadge>
              </span>
              <input v-model.trim="form.url" class="input" type="url" placeholder="https://company.com/jobs/…">
              <small class="field-help">The URL is saved with the job. Paste the complete description below for analysis.</small>
            </label>
          </div>
          <label class="field">
            <span class="field-label">Resume to compare</span>
            <select v-model="form.resumeId" class="select" required>
              <option value="" disabled>Select a resume</option>
              <option v-for="resume in workspace.state.value.resumes" :key="resume.id" :value="resume.id">
                {{ resume.name }} · {{ workspace.getActiveVersion(resume)?.analysis.score ?? '—' }}/100
              </option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">Complete job description</span>
            <textarea
              v-model="form.description"
              class="textarea job-description"
              placeholder="Paste responsibilities, required skills, preferred skills, and qualifications…"
              required
            />
            <small class="field-help">
              {{ wordCount }} words ·
              {{ wordCount >= 50 ? 'Ready to calculate a useful match.' : 'Add at least 50 words for a useful result.' }}
            </small>
          </label>
          <button class="btn btn-primary btn-lg submit-button" type="submit" :disabled="!canAnalyze || saving">
            <AppSpinner v-if="saving" :size="17" light />
            <ScanSearch v-else :size="17" />
            {{ saving ? 'Calculating match…' : 'Calculate and save match' }}
          </button>
        </form>
      </section>

      <aside class="target-preview">
        <article v-if="liveMatch" class="match-preview card card-pad">
          <div class="match-preview-top">
            <div>
              <span class="section-kicker">Live Job Match Score</span>
              <h2>{{ form.title || 'Target role' }}</h2>
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
          <p>Select a resume and paste at least 50 words from the job description.</p>
          <ul>
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
const saving = ref(false)
const form = reactive({
  title: '',
  company: '',
  location: '',
  url: '',
  description: '',
  resumeId: '',
})

onMounted(() => {
  workspace.hydrate()
  form.resumeId = workspace.state.value.resumes[0]?.id || ''
})

const selectedResume = computed(() => workspace.state.value.resumes.find(resume => resume.id === form.resumeId))
const selectedVersion = computed(() => selectedResume.value ? workspace.getActiveVersion(selectedResume.value) : undefined)
const wordCount = computed(() => form.description.trim() ? form.description.trim().split(/\s+/).length : 0)
const liveMatch = computed(() => (
  selectedVersion.value && wordCount.value >= 50
    ? matchResumeToJob(selectedVersion.value.parsed, form.description, 'preview')
    : null
))
const canAnalyze = computed(() => Boolean(
  form.title && form.company && selectedVersion.value && wordCount.value >= 50,
))
const required = computed(() => liveMatch.value?.requirements.filter(item => item.type === 'required') || [])
const responsibilities = computed(() => liveMatch.value?.requirements.filter(item => item.type === 'responsibility') || [])
const requiredCount = computed(() => required.value.length)
const responsibilityCount = computed(() => responsibilities.value.length)
const matchedRequired = computed(() => required.value.filter(item => item.matched).length)
const matchedResponsibilities = computed(() => responsibilities.value.filter(item => item.matched).length)

const analyzeAndSave = async () => {
  if (!canAnalyze.value) return
  saving.value = true
  await new Promise(resolve => window.setTimeout(resolve, 350))
  const job = workspace.saveJob({ ...form })
  workspace.addApplication(job.id)
  toast.show('Job match saved', {
    message: `Match score: ${job.match?.score ?? '—'}/100`,
  })
  await navigateTo(`/app/jobs/${job.id}`)
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

.url-label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.job-description {
  min-height: 280px;
}

.field-help {
  color: var(--muted);
  font-size: 11px;
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
