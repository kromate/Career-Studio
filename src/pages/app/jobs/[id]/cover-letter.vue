<template>
  <div class="page-shell cover-letter-page">
    <template v-if="job && resume && version">
      <header class="page-header">
        <div>
          <NuxtLink :to="`/app/jobs/${job.id}`" class="back-link"><ArrowLeft :size="14" /> Job details</NuxtLink>
          <h1>Cover Letter Studio</h1>
          <p>{{ job.title }} · {{ job.company }} · {{ version.label }}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" type="button" :disabled="!draft" @click="copyDraft">
            <Copy :size="15" />
            Copy
          </button>
          <button class="btn btn-secondary" type="button" :disabled="!draft" @click="exportTxt">
            <FileText :size="15" />
            TXT
          </button>
          <button class="btn btn-primary" type="button" :disabled="!draft" @click="exportPdf">
            <Download :size="15" />
            PDF
          </button>
        </div>
      </header>

      <section class="cover-letter-grid">
        <aside class="card card-pad draft-controls">
          <span class="section-kicker">Draft controls</span>
          <label class="field">
            <span class="field-label">Tone</span>
            <select v-model="tone" class="select">
              <option value="direct">Direct</option>
              <option value="warm">Warm</option>
              <option value="formal">Formal</option>
              <option value="concise">Concise</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">Length</span>
            <select v-model="length" class="select">
              <option value="short-email">Short email</option>
              <option value="standard-letter">Standard letter</option>
              <option value="recruiter-note">Recruiter note</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">User notes</span>
            <textarea v-model="userNotes" class="textarea" rows="5" placeholder="Optional verified preference, context, or connection." />
          </label>
          <button class="btn btn-primary full-button" type="button" @click="generateDraft">
            <Sparkles :size="15" />
            Generate grounded draft
          </button>
          <div v-if="draft" class="draft-meta">
            <strong>{{ draft.status }}</strong>
            <span>{{ unsupportedCount }} unsupported paragraph{{ unsupportedCount === 1 ? '' : 's' }}</span>
          </div>
        </aside>

        <main class="card draft-editor">
          <div class="section-card-header">
            <div>
              <span class="section-kicker">Letter paragraphs</span>
              <h2>{{ draft?.title || 'Generate a draft' }}</h2>
            </div>
            <span v-if="draft">{{ draft.paragraphs.length }} paragraphs</span>
          </div>
          <div v-if="draft" class="paragraph-list">
            <article
              v-for="paragraph in draft.paragraphs"
              :key="paragraph.id"
              class="paragraph-card"
              :class="{ active: selectedParagraphId === paragraph.id, unsupported: paragraph.unsupported }"
              @click="selectedParagraphId = paragraph.id"
            >
              <div class="paragraph-top">
                <span>{{ paragraph.evidenceSources.length }} evidence source{{ paragraph.evidenceSources.length === 1 ? '' : 's' }}</span>
                <strong v-if="paragraph.unsupported">Needs support</strong>
              </div>
              <textarea
                class="textarea"
                :value="paragraph.text"
                rows="5"
                @input="updateParagraph(paragraph.id, inputValue($event))"
              />
            </article>
          </div>
          <EmptyState
            v-else
            :icon="FilePenLine"
            title="No cover letter draft yet"
            description="Generate a grounded draft from the selected resume version and saved job evidence."
          />
        </main>

        <aside class="card evidence-sidebar">
          <div class="section-card-header">
            <div>
              <span class="section-kicker">Evidence map</span>
              <h2>Paragraph support</h2>
            </div>
          </div>
          <div v-if="selectedParagraph" class="evidence-list">
            <article v-for="source in selectedParagraph.evidenceSources" :key="`${source.type}-${source.id}-${source.quote}`">
              <span>{{ source.type }}</span>
              <p>{{ source.quote }}</p>
            </article>
            <p v-if="!selectedParagraph.evidenceSources.length" class="unsupported-note">Add a resume line, job requirement, or user note before export.</p>
          </div>
          <div v-else class="evidence-empty">Select a paragraph to inspect its support.</div>
        </aside>
      </section>
    </template>
    <DetailPageSkeleton v-else />
  </div>
</template>

<script setup lang="ts">
import type { CoverLetterLength, CoverLetterTone } from '@/types'
import { ArrowLeft, Copy, Download, FilePenLine, FileText, Sparkles } from 'lucide-vue-next'
import { coverLetterToText, createCoverLetterPdfBlob } from '@/lib/cover-letter'

definePageMeta({ layout: 'app', middleware: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const toast = useToast()
const tone = ref<CoverLetterTone>('direct')
const length = ref<CoverLetterLength>('standard-letter')
const userNotes = ref('')
const selectedParagraphId = ref('')

const job = computed(() => workspace.getJob(route.params.id as string))
const resume = computed(() => {
  const resumeId = job.value?.resumeId || workspace.state.value.masterResumeId || workspace.state.value.resumes[0]?.id
  return resumeId ? workspace.getResume(resumeId) : undefined
})
const version = computed(() => {
  if (!resume.value) return undefined
  const versionId = job.value?.resumeVersionId || resume.value.activeVersionId
  return resume.value.versions.find(item => item.id === versionId) || workspace.getActiveVersion(resume.value)
})
const draft = computed(() => (
  workspace.state.value.coverLetters.find(item => item.jobId === job.value?.id && item.resumeVersionId === version.value?.id)
))
const selectedParagraph = computed(() => draft.value?.paragraphs.find(item => item.id === selectedParagraphId.value) || draft.value?.paragraphs[0])
const unsupportedCount = computed(() => draft.value?.paragraphs.filter(paragraph => paragraph.unsupported).length || 0)

onMounted(() => {
  workspace.hydrate()
  if (!job.value) navigateTo('/app/jobs')
})

watch(draft, (nextDraft) => {
  if (!nextDraft) return
  selectedParagraphId.value = nextDraft.paragraphs[0]?.id || ''
  tone.value = nextDraft.tone
  length.value = nextDraft.length
  userNotes.value = nextDraft.userNotes || ''
}, { immediate: true })

const inputValue = (event: Event) => (event.target as HTMLTextAreaElement).value
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
const generateDraft = () => {
  if (!job.value || !resume.value || !version.value) return
  const created = workspace.createCoverLetterDraft({
    jobId: job.value.id,
    resumeId: resume.value.id,
    resumeVersionId: version.value.id,
    tone: tone.value,
    length: length.value,
    userNotes: userNotes.value,
  })
  if (created) {
    selectedParagraphId.value = created.paragraphs[0]?.id || ''
    toast.show('Cover letter draft generated')
  }
}
const updateParagraph = (paragraphId: string, text: string) => {
  if (!draft.value) return
  workspace.updateCoverLetterDraft(draft.value.id, {
    paragraphs: draft.value.paragraphs.map(paragraph => paragraph.id === paragraphId
      ? { ...paragraph, text }
      : paragraph),
    status: unsupportedCount.value ? 'draft' : 'ready',
  })
}
const copyDraft = async () => {
  if (!draft.value) return
  await navigator.clipboard.writeText(coverLetterToText(draft.value))
  toast.show('Cover letter copied')
}
const exportTxt = () => {
  if (!draft.value) return
  downloadBlob(new Blob([coverLetterToText(draft.value)], { type: 'text/plain' }), `${draft.value.title}.txt`)
  workspace.recordCoverLetterExport(draft.value.id, 'txt')
  toast.show('Cover letter TXT exported')
}
const exportPdf = async () => {
  if (!draft.value) return
  downloadBlob(await createCoverLetterPdfBlob(draft.value), `${draft.value.title}.pdf`)
  workspace.recordCoverLetterExport(draft.value.id, 'pdf')
  toast.show('Cover letter PDF exported')
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

.cover-letter-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 320px;
  align-items: start;
  gap: 16px;
}

.draft-controls,
.evidence-sidebar {
  position: sticky;
  top: 82px;
}

.draft-controls {
  display: grid;
  gap: 14px;
}

.full-button {
  width: 100%;
}

.draft-meta {
  display: grid;
  gap: 3px;
  padding: 10px;
  border-radius: 8px;
  background: var(--surface-soft);
}

.draft-meta strong {
  color: var(--purple);
  font-size: 11px;
  text-transform: capitalize;
}

.draft-meta span {
  color: var(--muted);
  font-size: 10px;
}

.draft-editor,
.evidence-sidebar {
  overflow: hidden;
}

.paragraph-list,
.evidence-list {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.paragraph-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.paragraph-card.active {
  border-color: var(--purple-border);
  background: var(--purple-soft);
}

.paragraph-card.unsupported {
  border-color: var(--amber-border);
}

.paragraph-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.paragraph-top strong {
  color: var(--amber);
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 18px;
  border-bottom: 1px solid var(--line);
}

.section-card-header h2 {
  margin: 0;
  font-size: 16px;
}

.section-card-header > span,
.section-kicker {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.evidence-list article {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-soft);
}

.evidence-list span {
  color: var(--purple);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.evidence-list p,
.unsupported-note,
.evidence-empty {
  margin: 5px 0 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

.evidence-empty {
  padding: 18px;
}

@media (max-width: 1100px) {
  .cover-letter-grid {
    grid-template-columns: 1fr;
  }

  .draft-controls,
  .evidence-sidebar {
    position: static;
  }
}
</style>