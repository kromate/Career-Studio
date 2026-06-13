<template>
  <div class="page-shell upload-page">
    <header class="page-header">
      <div>
        <NuxtLink to="/app/resumes" class="back-link"><ArrowLeft :size="14" /> Resumes</NuxtLink>
        <h1>{{ stage === 'review' ? 'Verify extracted resume' : 'Upload a resume' }}</h1>
        <p v-if="stage === 'upload'">Your first score appears only after you confirm the extracted content.</p>
        <p v-else>Check that sections, bullets, dates, and contact details were read correctly.</p>
      </div>
    </header>

    <div class="upload-layout">
      <section class="upload-main card">
        <template v-if="stage === 'upload'">
          <div
            class="drop-zone"
            :class="{ dragging, busy }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              @change="handleFileInput"
            >
            <span class="drop-icon">
              <LoaderCircle v-if="busy" class="spin" :size="29" />
              <FileUp v-else :size="29" />
            </span>
            <h2>{{ busy ? 'Reading your resume…' : 'Drop your resume here' }}</h2>
            <p>PDF, DOCX, or TXT · Maximum 10 MB</p>
            <button class="btn btn-secondary" type="button" :disabled="busy" @click="fileInput?.click()">
              Choose a file
            </button>
            <span class="privacy-note"><LockKeyhole :size="13" /> Local preview processing stays in this browser.</span>
          </div>

          <div class="paste-divider"><span>or paste resume text</span></div>
          <div class="paste-area">
            <textarea
              v-model="pastedText"
              class="textarea"
              rows="10"
              placeholder="Paste the complete resume, including headings and bullet points…"
            />
            <div class="paste-actions">
              <button v-if="localPreview" class="btn btn-ghost btn-sm" type="button" @click="useSample">
                <Sparkles :size="14" />
                Use sample resume
              </button>
              <button class="btn btn-primary" type="button" :disabled="pastedText.trim().length < 40" @click="reviewPastedText">
                Review extraction
                <ArrowRight :size="15" />
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="parsed">
          <div class="review-toolbar">
            <div class="file-summary">
              <span><FileText :size="19" /></span>
              <div>
                <strong>{{ fileName }}</strong>
                <p>{{ parsed.stats.words }} words · ~{{ parsed.stats.pagesEstimated }} page{{ parsed.stats.pagesEstimated === 1 ? '' : 's' }}</p>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" type="button" @click="resetUpload">Change file</button>
          </div>

          <div class="parse-banner" :class="`parse-${parsed.confidence}`">
            <ShieldCheck v-if="parsed.confidence === 'high'" :size="20" />
            <TriangleAlert v-else :size="20" />
            <div>
              <strong>{{ confidenceCopy.title }}</strong>
              <p>{{ confidenceCopy.description }}</p>
            </div>
          </div>

          <div v-if="parsed.warnings.length" class="warning-list">
            <div v-for="warning in parsed.warnings" :key="warning">
              <TriangleAlert :size="15" />
              {{ warning }}
            </div>
          </div>

          <div class="contact-grid">
            <div>
              <span>Email</span>
              <strong>{{ parsed.contacts.email || 'Not detected' }}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{{ parsed.contacts.phone || 'Not detected' }}</strong>
            </div>
            <div>
              <span>Professional profile</span>
              <strong>{{ parsed.contacts.linkedIn || parsed.contacts.website || 'Not detected' }}</strong>
            </div>
          </div>

          <div class="section-review">
            <h2>Detected structure</h2>
            <div class="section-pills">
              <span v-for="section in parsed.sections.filter(item => item.lineIds.length)" :key="section.id">
                <CheckCircle2 :size="13" />
                {{ section.title }}
                <small>{{ section.lineIds.length }} lines</small>
              </span>
            </div>
          </div>

          <div class="extracted-text">
            <div class="extracted-heading">
              <h2>Extracted text</h2>
              <button type="button" @click="editing = !editing">
                <PencilLine :size="14" />
                {{ editing ? 'Preview structure' : 'Correct text' }}
              </button>
            </div>
            <textarea v-if="editing" v-model="sourceText" class="textarea source-editor" />
            <ResumePreview v-else :parsed="parsed" />
          </div>

          <div class="review-actions">
            <label class="field resume-name">
              <span class="field-label">Resume name</span>
              <input v-model.trim="resumeName" class="input" placeholder="e.g. Product engineer resume">
            </label>
            <button class="btn btn-primary btn-lg" type="button" :disabled="saving || !resumeName" @click="confirmAndAnalyze">
              <LoaderCircle v-if="saving" class="spin" :size="17" />
              <ScanSearch v-else :size="17" />
              {{ saving ? 'Analyzing…' : 'Confirm and analyze' }}
            </button>
          </div>
        </template>
      </section>

      <aside class="upload-aside">
        <article class="card card-pad">
          <span class="aside-icon"><ScanText :size="21" /></span>
          <h3>Why review the extraction?</h3>
          <p>A broken parse can look like a weak resume. We ask you to confirm the content before showing a numeric score.</p>
        </article>
        <article class="card card-pad">
          <h3>Best results</h3>
          <ul>
            <li><Check /> Use selectable text, not a scanned image.</li>
            <li><Check /> Prefer one column and standard headings.</li>
            <li><Check /> Avoid contact details inside headers or footers.</li>
            <li><Check /> Use simple bullets instead of text boxes.</li>
          </ul>
        </article>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  FileUp,
  LoaderCircle,
  LockKeyhole,
  PencilLine,
  ScanSearch,
  ScanText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-vue-next'
import { DEMO_RESUME_TEXT } from '@/lib/demo'
import { extractTextFromFile, parseResumeText } from '@/lib/resume/parser'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const toast = useToast()
const config = useRuntimeConfig().public
const fileInput = ref<HTMLInputElement | null>(null)
const stage = ref<'upload' | 'review'>('upload')
const dragging = ref(false)
const busy = ref(false)
const saving = ref(false)
const editing = ref(false)
const pastedText = ref('')
const sourceText = ref('')
const fileName = ref('pasted-resume.txt')
const fileType = ref('text/plain')
const resumeName = ref('')
const localPreview = computed(() => config.appMode === 'local')
const parsed = computed(() => sourceText.value ? parseResumeText(sourceText.value) : null)
const confidenceCopy = computed(() => {
  if (parsed.value?.confidence === 'high') {
    return { title: 'High-confidence extraction', description: 'The resume has enough text and recognizable structure for a normal analysis.' }
  }
  if (parsed.value?.confidence === 'medium') {
    return { title: 'Review the extraction carefully', description: 'The score can be calculated, but some document structure may need correction.' }
  }
  return { title: 'Low-confidence extraction', description: 'Correct the extracted text or upload a cleaner file before relying on a score.' }
})

const prepareReview = (text: string, name: string, type: string) => {
  sourceText.value = text
  fileName.value = name
  fileType.value = type
  resumeName.value = name.replace(/\.(pdf|docx|txt)$/i, '').replace(/[-_]+/g, ' ')
  stage.value = 'review'
}

const processFile = async (file: File) => {
  if (file.size > 10 * 1024 * 1024) {
    toast.show('File is too large', { message: 'Choose a file smaller than 10 MB.', tone: 'error' })
    return
  }
  busy.value = true
  try {
    const text = await extractTextFromFile(file)
    if (text.trim().length < 20) throw new Error('Very little text could be extracted from this file.')
    prepareReview(text, file.name, file.type || 'application/octet-stream')
  } catch (error) {
    toast.show('Could not read this resume', {
      message: error instanceof Error ? error.message : 'Try a DOCX or text-based PDF.',
      tone: 'error',
    })
  } finally {
    busy.value = false
    dragging.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) processFile(file)
}

const handleFileInput = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

const useSample = () => {
  pastedText.value = DEMO_RESUME_TEXT
}

const reviewPastedText = () => {
  prepareReview(pastedText.value, 'pasted-resume.txt', 'text/plain')
}

const resetUpload = () => {
  stage.value = 'upload'
  sourceText.value = ''
  editing.value = false
  if (fileInput.value) fileInput.value.value = ''
}

const confirmAndAnalyze = async () => {
  if (!parsed.value) return
  if (parsed.value.confidence === 'low') {
    toast.show('Improve the extraction first', {
      message: 'The parser cannot identify enough structure for a trustworthy score.',
      tone: 'warning',
    })
    editing.value = true
    return
  }
  saving.value = true
  await new Promise(resolve => window.setTimeout(resolve, 450))
  const resume = workspace.addResume(
    resumeName.value,
    fileName.value,
    fileType.value,
    sourceText.value,
  )
  toast.show('Resume analyzed', {
    message: 'Your immutable first analysis and version have been saved.',
  })
  await navigateTo(`/app/resumes/${resume.id}`)
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 650;
}

.back-link:hover {
  color: var(--purple);
}

.upload-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: start;
  gap: 17px;
}

.upload-main {
  padding: 25px;
}

.drop-zone {
  display: grid;
  min-height: 330px;
  place-items: center;
  align-content: center;
  padding: 35px;
  border: 1.5px dashed #cfc8da;
  border-radius: 16px;
  text-align: center;
  background: var(--surface-soft);
  transition: border-color 160ms ease, background 160ms ease;
}

.drop-zone.dragging {
  border-color: var(--purple);
  background: var(--purple-soft);
}

.drop-zone input {
  display: none;
}

.drop-icon {
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  margin-bottom: 20px;
  border-radius: 18px;
  color: var(--purple);
  background: var(--purple-soft);
}

.drop-zone h2 {
  margin-bottom: 7px;
  font-size: 20px;
}

.drop-zone > p {
  margin-bottom: 20px;
  color: var(--muted);
  font-size: 11px;
}

.privacy-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 20px;
  color: var(--muted);
  font-size: 11px;
}

.paste-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 25px 0;
  color: var(--muted);
  font-size: 10px;
}

.paste-divider::before,
.paste-divider::after {
  height: 1px;
  flex: 1;
  content: '';
  background: var(--line);
}

.paste-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.upload-aside {
  display: grid;
  gap: 14px;
}

.upload-aside h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.upload-aside p,
.upload-aside li {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
}

.aside-icon {
  display: grid;
  width: 45px;
  height: 45px;
  place-items: center;
  margin-bottom: 22px;
  border-radius: 13px;
  color: var(--purple);
  background: var(--purple-soft);
}

.upload-aside ul {
  display: grid;
  gap: 11px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.upload-aside li {
  display: flex;
  align-items: flex-start;
  gap: 7px;
}

.upload-aside li svg {
  flex: 0 0 auto;
  color: var(--green);
}

.review-toolbar,
.file-summary {
  display: flex;
  align-items: center;
}

.review-toolbar {
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.file-summary {
  gap: 11px;
}

.file-summary > span {
  display: grid;
  width: 39px;
  height: 39px;
  place-items: center;
  border-radius: 11px;
  color: var(--purple);
  background: var(--purple-soft);
}

.file-summary strong,
.file-summary p {
  display: block;
}

.file-summary strong {
  margin-bottom: 3px;
  font-size: 12px;
}

.file-summary p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.parse-banner {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  margin: 20px 0;
  padding: 15px;
  border-radius: 12px;
}

.parse-high {
  color: var(--green);
  background: var(--green-soft);
}

.parse-medium,
.parse-low {
  color: var(--amber);
  background: var(--amber-soft);
}

.parse-banner strong {
  display: block;
  margin-bottom: 3px;
  font-size: 11px;
}

.parse-banner p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 11px;
}

.warning-list {
  display: grid;
  gap: 7px;
  margin-bottom: 20px;
}

.warning-list > div {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #f0d3a4;
  border-radius: 9px;
  color: var(--amber);
  font-size: 10px;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.contact-grid > div {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.contact-grid span,
.contact-grid strong {
  display: block;
}

.contact-grid span {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
}

.contact-grid strong {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-review {
  margin: 25px 0;
}

.section-review h2,
.extracted-heading h2 {
  margin-bottom: 12px;
  font-size: 15px;
}

.section-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.section-pills span {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 9px;
  border-radius: 9px;
  color: var(--green);
  font-size: 11px;
  font-weight: 700;
  background: var(--green-soft);
}

.section-pills small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 500;
}

.extracted-text {
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.extracted-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.extracted-heading button {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  color: var(--purple);
  font-size: 10px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
}

.extracted-text :deep(.resume-paper) {
  width: 100%;
  min-height: 500px;
  max-height: 650px;
  overflow: auto;
  padding: 35px;
  box-shadow: none;
}

.source-editor {
  min-height: 500px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
}

.review-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 15px;
  margin-top: 25px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 950px) {
  .upload-layout {
    grid-template-columns: 1fr;
  }

  .upload-aside {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 620px) {
  .upload-main {
    padding: 16px;
  }

  .upload-aside,
  .contact-grid,
  .review-actions {
    grid-template-columns: 1fr;
  }

  .paste-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .paste-actions .btn {
    width: 100%;
  }
}
</style>
