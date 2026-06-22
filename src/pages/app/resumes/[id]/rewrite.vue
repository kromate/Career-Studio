<template>
  <div class="rewrite-page">
    <template v-if="resume && sourceVersion">
      <header class="rewrite-header">
        <div class="rewrite-title">
          <NuxtLink :to="backLink" class="icon-btn" aria-label="Back">
            <ArrowLeft :size="17" />
          </NuxtLink>
          <div>
            <span>{{ targetJob ? 'Job-specific rewrite' : 'Rewrite studio' }}</span>
            <h1>{{ resume.name }}</h1>
          </div>
        </div>
        <div class="rewrite-score">
          <span>Live quality score</span>
          <strong :class="scoreTone">{{ draftAnalysis.score ?? '—' }}</strong>
          <small v-if="scoreDelta !== 0" :class="{ positive: scoreDelta > 0 }">
            {{ scoreDelta > 0 ? '+' : '' }}{{ scoreDelta }}
          </small>
        </div>
        <div class="rewrite-actions">
          <button class="btn btn-secondary" type="button" @click="resetDraft">Reset</button>
          <button class="btn btn-primary" type="button" :disabled="!hasChanges || saving" @click="saveVersion">
            <AppSpinner v-if="saving" :size="16" light />
            <Save v-else :size="16" />
            {{ saving ? 'Saving…' : 'Save new version' }}
          </button>
        </div>
      </header>

      <section v-if="targetJob" class="target-context">
        <div>
          <span class="section-kicker">Target role</span>
          <h2>{{ targetJob.title }} at {{ targetJob.company }}</h2>
          <p>
            Match {{ targetJob.match?.score ?? '—' }}/100. Use only experience you can verify when closing these gaps.
          </p>
        </div>
        <div class="target-gaps">
          <span v-for="requirement in targetMissing" :key="requirement.requirementId">
            {{ requirement.label }}
          </span>
          <span v-if="!targetMissing.length" class="all-covered">Core requirements covered</span>
        </div>
      </section>

      <div class="rewrite-workspace">
        <aside class="suggestion-panel">
          <div class="panel-header">
            <div>
              <span class="section-kicker">Improvement queue</span>
              <h2>{{ pendingSuggestions.length }} suggestions</h2>
            </div>
            <span class="badge badge-purple">{{ acceptedCount }} applied</span>
          </div>
          <div class="suggestion-list">
            <article
              v-for="suggestion in suggestions"
              :key="suggestion.id"
              class="suggestion-card"
              :class="{ selected: selectedSuggestion?.id === suggestion.id, resolved: suggestion.status !== 'pending' }"
              @click="selectedSuggestionId = suggestion.id"
            >
              <div class="suggestion-card-top">
                <span :class="suggestion.requiresFactConfirmation ? 'fact-needed' : 'safe-rewrite'">
                  <CircleHelp v-if="suggestion.requiresFactConfirmation" :size="13" />
                  <WandSparkles v-else :size="13" />
                  {{ suggestion.requiresFactConfirmation ? 'Needs your evidence' : 'Safe rephrase' }}
                </span>
                <span>+{{ suggestion.expectedPointRecovery }}</span>
              </div>
              <strong>{{ suggestion.reason }}</strong>
              <p>{{ suggestion.sourceText }}</p>
              <div v-if="suggestion.status !== 'pending'" class="resolved-status" :class="suggestion.status">
                <Check v-if="suggestion.status === 'accepted'" :size="13" />
                <X v-else :size="13" />
                {{ suggestion.status }}
              </div>
            </article>
          </div>
        </aside>

        <main class="editor-panel">
          <div v-if="selectedSuggestion" class="suggestion-detail">
            <div class="detail-heading">
              <div>
                <span class="section-kicker">Suggested improvement</span>
                <h2>{{ selectedSuggestion.reason }}</h2>
              </div>
              <button class="icon-btn" type="button" aria-label="Hide suggestion" @click="selectedSuggestionId = ''">
                <X :size="16" />
              </button>
            </div>
            <template v-if="selectedSuggestion.requiresFactConfirmation">
              <div class="fact-prompt">
                <CircleHelp :size="20" />
                <div>
                  <strong>Add only evidence you can verify</strong>
                  <p>{{ selectedSuggestion.reason }} Edit the bullet directly below, then save it as a new version.</p>
                </div>
              </div>
              <blockquote>{{ selectedSuggestion.sourceText }}</blockquote>
              <div class="suggestion-actions">
                <button class="btn btn-secondary btn-sm" type="button" @click="rejectSuggestion(selectedSuggestion.id)">
                  Dismiss prompt
                </button>
                <button class="btn btn-primary btn-sm" type="button" @click="focusEditorLine(selectedSuggestion.sourceText)">
                  Edit this bullet
                </button>
              </div>
            </template>
            <template v-else>
              <div class="diff-grid">
                <div>
                  <span>Before</span>
                  <p>{{ selectedSuggestion.sourceText }}</p>
                </div>
                <ArrowRight :size="18" />
                <div class="after">
                  <span>Suggested</span>
                  <p>{{ selectedSuggestion.proposedText }}</p>
                </div>
              </div>
              <div class="suggestion-actions">
                <button class="btn btn-secondary btn-sm" type="button" @click="rejectSuggestion(selectedSuggestion.id)">
                  <X :size="14" />
                  Reject
                </button>
                <button class="btn btn-primary btn-sm" type="button" @click="acceptSuggestion(selectedSuggestion.id)">
                  <Check :size="14" />
                  Accept change
                </button>
              </div>
            </template>
          </div>

          <div class="editor-toolbar">
            <div>
              <span class="section-kicker">Structured source</span>
              <h2>Resume content</h2>
            </div>
            <span>{{ draftParsed.stats.words }} words · {{ draftParsed.stats.bullets }} bullets</span>
          </div>
          <textarea
            ref="editor"
            v-model="draftText"
            class="resume-editor"
            spellcheck="true"
            aria-label="Resume text editor"
          />
        </main>

        <aside class="live-preview-panel">
          <div class="preview-toolbar">
            <div>
              <span class="section-kicker">Document preview</span>
              <h2>ATS-readable layout</h2>
            </div>
            <button class="icon-btn" type="button" aria-label="Toggle full preview" @click="previewExpanded = !previewExpanded">
              <Maximize2 :size="16" />
            </button>
          </div>
          <div class="live-document">
            <ResumePreview :parsed="draftParsed" />
          </div>
          <div class="live-dimensions">
            <DimensionBar
              v-for="dimension in draftAnalysis.dimensions.slice(0, 4)"
              :key="dimension.id"
              :label="dimension.label"
              :score="dimension.score"
              :max-score="dimension.maxScore"
            />
          </div>
        </aside>
      </div>

      <BaseModal
        :open="previewExpanded"
        title="Resume preview"
        description="Review the current ATS-readable document layout."
        size="full"
        @close="previewExpanded = false"
      >
        <div class="preview-document">
          <ResumePreview :parsed="draftParsed" />
        </div>
      </BaseModal>
    </template>
    <div v-else class="rewrite-loading" aria-label="Loading editor" role="status">
      <div class="rewrite-loading-header">
        <AppSkeleton width="220px" height="24px" radius="8px" />
        <AppSkeleton width="145px" height="40px" radius="9px" />
      </div>
      <div class="rewrite-loading-grid">
        <AppSkeleton height="610px" radius="12px" />
        <AppSkeleton height="610px" radius="12px" />
        <AppSkeleton height="610px" radius="12px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RewriteSuggestion } from '@/types'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Maximize2,
  Save,
  WandSparkles,
  X,
} from 'lucide-vue-next'
import { parseResumeText } from '@/lib/resume/parser'
import { applySuggestion, generateRewriteSuggestions } from '@/lib/resume/rewrite'
import { scoreResume } from '@/lib/resume/scoring'

definePageMeta({ layout: 'app', middleware: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const toast = useToast()
const editor = ref<HTMLTextAreaElement | null>(null)
const draftText = ref('')
const suggestions = ref<RewriteSuggestion[]>([])
const selectedSuggestionId = ref(typeof route.query.finding === 'string' ? '' : '')
const previewExpanded = ref(false)
const saving = ref(false)

const resume = computed(() => workspace.getResume(route.params.id as string))
const sourceVersion = computed(() => resume.value ? workspace.getActiveVersion(resume.value) : undefined)
const targetJobId = computed(() => typeof route.query.target === 'string' ? route.query.target : '')
const targetJob = computed(() => targetJobId.value ? workspace.getJob(targetJobId.value) : undefined)
const targetMissing = computed(() => (
  targetJob.value?.match?.missing.slice(0, 6) || []
))
const backLink = computed(() => (
  targetJob.value ? `/app/jobs/${targetJob.value.id}` : `/app/resumes/${route.params.id as string}`
))
const draftParsed = computed(() => parseResumeText(draftText.value))
const draftAnalysis = computed(() => scoreResume(draftParsed.value, {
  resumeId: resume.value?.id,
  versionId: 'draft',
  createdAt: sourceVersion.value?.analysis.createdAt,
}))
const selectedSuggestion = computed(() => (
  suggestions.value.find(suggestion => suggestion.id === selectedSuggestionId.value)
  || suggestions.value.find(suggestion => suggestion.status === 'pending')
))
const pendingSuggestions = computed(() => suggestions.value.filter(suggestion => suggestion.status === 'pending'))
const acceptedCount = computed(() => suggestions.value.filter(suggestion => suggestion.status === 'accepted').length)
const scoreDelta = computed(() => (
  (draftAnalysis.value.score || 0) - (sourceVersion.value?.analysis.score || 0)
))
const scoreTone = computed(() => (
  (draftAnalysis.value.score || 0) >= 80 ? 'strong' : (draftAnalysis.value.score || 0) >= 60 ? 'good' : 'needs-work'
))
const hasChanges = computed(() => draftText.value.trim() !== sourceVersion.value?.text.trim())

onMounted(() => {
  workspace.hydrate()
  if (!resume.value || !sourceVersion.value) {
    navigateTo('/app/resumes')
    return
  }
  draftText.value = sourceVersion.value.text
  suggestions.value = generateRewriteSuggestions(sourceVersion.value.parsed, sourceVersion.value.analysis)
  const ruleId = typeof route.query.finding === 'string' ? route.query.finding : ''
  const matching = suggestions.value.find(suggestion => suggestion.addressedRuleIds.includes(ruleId))
  selectedSuggestionId.value = matching?.id || suggestions.value[0]?.id || ''
})

const acceptSuggestion = (id: string) => {
  const suggestion = suggestions.value.find(item => item.id === id)
  if (!suggestion || suggestion.requiresFactConfirmation) return
  draftText.value = applySuggestion(draftText.value, suggestion)
  suggestion.status = 'accepted'
  selectedSuggestionId.value = suggestions.value.find(item => item.status === 'pending' && item.id !== id)?.id || ''
  toast.show('Suggestion applied', { message: 'The live score was recalculated by the deterministic engine.' })
}

const rejectSuggestion = (id: string) => {
  const suggestion = suggestions.value.find(item => item.id === id)
  if (!suggestion) return
  suggestion.status = 'rejected'
  selectedSuggestionId.value = suggestions.value.find(item => item.status === 'pending' && item.id !== id)?.id || ''
}

const resetDraft = () => {
  if (!sourceVersion.value) return
  draftText.value = sourceVersion.value.text
  suggestions.value = generateRewriteSuggestions(sourceVersion.value.parsed, sourceVersion.value.analysis)
  selectedSuggestionId.value = suggestions.value[0]?.id || ''
}

const focusEditorLine = (text: string) => {
  const index = draftText.value.indexOf(text)
  editor.value?.focus()
  if (index >= 0) editor.value?.setSelectionRange(index, index + text.length)
}

const saveVersion = async () => {
  if (!resume.value || !sourceVersion.value || !hasChanges.value) return
  saving.value = true
  const priorScore = sourceVersion.value.analysis.score
  const nextScore = draftAnalysis.value.score
  const savedTargetJobId = targetJobId.value || undefined
  await new Promise(resolve => window.setTimeout(resolve, 350))
  const versionNumber = resume.value.versions.length + 1
  workspace.addResumeVersion(
    resume.value.id,
    draftText.value,
    savedTargetJobId ? `Tailored resume v${versionNumber}` : `Improved resume v${versionNumber}`,
    savedTargetJobId ? 'tailored' : 'rewrite',
    savedTargetJobId,
    {
      sourceVersionId: sourceVersion.value.id,
      acceptedSuggestionIds: suggestions.value
        .filter(suggestion => suggestion.status === 'accepted' && !suggestion.requiresFactConfirmation)
        .map(suggestion => suggestion.id),
    },
  )
  toast.show('New resume version saved', {
    message: `Quality score: ${priorScore ?? '—'} → ${nextScore ?? '—'}`,
  })
  await navigateTo(`/app/resumes/${resume.value.id}?tab=versions`)
}
</script>

<style scoped>
.rewrite-page {
  min-height: calc(100vh - 64px);
  background: var(--app-bg);
}

.rewrite-header {
  display: grid;
  min-height: 64px;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  position: sticky;
  z-index: 30;
  top: 64px;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
  background: var(--topbar-bg);
  backdrop-filter: blur(15px);
}

.rewrite-title,
.rewrite-actions,
.rewrite-score {
  display: flex;
  align-items: center;
}

.rewrite-title {
  gap: 11px;
}

.rewrite-title span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.rewrite-title h1 {
  margin: 2px 0 0;
  font-size: 15px;
}

.rewrite-score {
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.rewrite-score > span {
  color: var(--muted);
  font-size: 11px;
}

.rewrite-score strong {
  font-family: var(--font-display);
  font-size: 19px;
}

.rewrite-score strong.strong { color: var(--green); }
.rewrite-score strong.good { color: var(--purple); }
.rewrite-score strong.needs-work { color: var(--amber); }

.rewrite-score small {
  color: var(--red);
  font-size: 11px;
  font-weight: 800;
}

.rewrite-score small.positive {
  color: var(--green);
}

.rewrite-actions {
  justify-content: flex-end;
  gap: 7px;
}

.target-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--purple-border-soft);
  background: var(--purple-soft);
}

.target-context h2 {
  margin: 0 0 3px;
  font-size: 14px;
}

.target-context p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.target-gaps {
  display: flex;
  max-width: 52%;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.target-gaps span {
  padding: 5px 8px;
  border: 1px solid var(--purple-border-soft);
  border-radius: 6px;
  color: var(--purple-dark);
  font-size: 10px;
  font-weight: 700;
  background: var(--control-bg);
}

.target-gaps span.all-covered {
  color: var(--green);
  border-color: var(--green-border);
}

.rewrite-workspace {
  display: grid;
  grid-template-columns: 280px minmax(390px, 1fr) minmax(310px, 0.82fr);
  min-height: calc(100vh - 128px);
}

.suggestion-panel,
.editor-panel,
.live-preview-panel {
  min-width: 0;
  border-right: 1px solid var(--line);
  background: var(--card-bg);
}

.suggestion-panel,
.live-preview-panel {
  position: sticky;
  top: 128px;
  height: calc(100vh - 128px);
  overflow: hidden;
}

.panel-header,
.editor-toolbar,
.preview-toolbar {
  display: flex;
  min-height: 67px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.panel-header h2,
.editor-toolbar h2,
.preview-toolbar h2 {
  margin: 0;
  font-size: 14px;
}

.section-kicker {
  display: block;
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.suggestion-list {
  height: calc(100% - 67px);
  overflow: auto;
  padding: 10px;
}

.suggestion-card {
  margin-bottom: 8px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 9px;
  cursor: pointer;
}

.suggestion-card:hover,
.suggestion-card.selected {
  border-color: var(--purple-border);
  background: var(--purple-soft);
}

.suggestion-card.resolved {
  opacity: 0.6;
}

.suggestion-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.suggestion-card-top > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--green);
  font-size: 10px;
  font-weight: 750;
}

.suggestion-card-top > span.fact-needed {
  color: var(--amber);
}

.suggestion-card strong {
  display: block;
  margin-bottom: 6px;
  font-size: 10px;
  line-height: 1.4;
}

.suggestion-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.resolved-status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  color: var(--red);
  font-size: 10px;
  font-weight: 800;
  text-transform: capitalize;
}

.resolved-status.accepted {
  color: var(--green);
}

.editor-panel {
  background: var(--document-preview-bg);
}

.suggestion-detail {
  padding: 20px;
  border-bottom: 1px solid var(--line);
  background: var(--card-bg);
}

.detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.detail-heading h2 {
  margin: 0;
  font-size: 16px;
}

.diff-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 17px;
}

.diff-grid > div {
  min-height: 90px;
  padding: 12px;
  border: 1px solid var(--red-border);
  border-radius: 9px;
  background: var(--red-soft);
}

.diff-grid > div.after {
  border-color: var(--green-border);
  background: var(--green-soft);
}

.diff-grid span {
  display: block;
  margin-bottom: 6px;
  color: var(--red);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.diff-grid .after span {
  color: var(--green);
}

.diff-grid p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 10px;
  line-height: 1.5;
}

.suggestion-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 13px;
}

.fact-prompt {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  margin-top: 15px;
  padding: 13px;
  border-radius: 10px;
  color: var(--amber);
  background: var(--amber-soft);
}

.fact-prompt strong {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
}

.fact-prompt p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

.suggestion-detail blockquote {
  margin: 12px 0 0;
  padding: 11px 13px;
  border-left: 3px solid var(--amber);
  color: var(--ink-soft);
  font-size: 10px;
  background: var(--surface-soft);
}

.editor-toolbar > span {
  color: var(--muted);
  font-size: 11px;
}

.resume-editor {
  display: block;
  width: calc(100% - 34px);
  min-height: 700px;
  margin: 17px;
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--document-ink);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.65;
  resize: vertical;
  background: var(--document-surface);
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.07);
}

.resume-editor:focus {
  border-color: var(--purple);
  outline: 0;
  box-shadow: 0 0 0 3px rgba(96, 29, 237, 0.1), 0 8px 24px rgba(16, 24, 40, 0.07);
}

.live-preview-panel {
  border-right: 0;
  background: var(--document-preview-bg);
}

.preview-toolbar {
  background: var(--card-bg);
}

.live-document {
  height: calc(100% - 235px);
  overflow: auto;
  padding: 20px;
}

.live-document :deep(.resume-paper) {
  min-height: 600px;
  padding: 38px;
  transform-origin: top center;
}

.live-dimensions {
  display: grid;
  gap: 10px;
  padding: 15px 18px;
  border-top: 1px solid var(--line);
  background: var(--card-bg);
}

.preview-document {
  display: grid;
  place-items: start center;
  min-height: 640px;
  padding: 12px;
  background: var(--document-preview-bg);
}

.rewrite-loading {
  display: grid;
  min-height: calc(100vh - 64px);
  gap: 16px;
  padding: 18px;
}

.rewrite-loading-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rewrite-loading-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 350px;
  gap: 12px;
}

@media (max-width: 1180px) {
  .rewrite-workspace {
    grid-template-columns: 280px 1fr;
  }

  .live-preview-panel {
    display: none;
  }

  .rewrite-loading-grid {
    grid-template-columns: 280px 1fr;
  }

  .rewrite-loading-grid :deep(.app-skeleton:last-child) {
    display: none;
  }
}

@media (max-width: 780px) {
  .rewrite-header {
    min-height: auto;
    grid-template-columns: 1fr auto;
    padding: 10px;
  }

  .rewrite-score {
    display: none;
  }

  .rewrite-loading-grid {
    grid-template-columns: 1fr;
  }

  .rewrite-loading-grid :deep(.app-skeleton:first-child) {
    display: none;
  }

  .target-context {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .target-gaps {
    max-width: none;
    justify-content: flex-start;
  }

  .rewrite-workspace {
    grid-template-columns: 1fr;
  }

  .suggestion-panel {
    height: 300px;
    position: static;
  }

  .suggestion-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
  }

  .suggestion-card {
    min-width: 250px;
  }
}
</style>
