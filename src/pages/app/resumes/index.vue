<template>
  <CollectionLoadingState v-if="!workspace.state.value.hydrated" />
  <div v-else class="resume-hub-shell">


    <div class="resume-hub-grid">
      <button class="create-resume-tile" type="button" @click="openCreate('new')">
        <span><Plus :size="24" /></span>
        <strong>Create New Resume</strong>
        <small>Start blank or upload a resume</small>
      </button>

      <article v-for="resume in sortedResumes" :key="resume.id" class="hub-resume-card">
        <button class="resume-thumb" type="button" @click="openBuilder(resume.id)">
          <div class="thumb-paper">
            <ResumeBuilderPreview
              v-if="resume.builderDocument"
              :document="resume.builderDocument"
            />
            <div v-else class="document-lines">
              <i class="wide" />
              <i />
              <i class="short" />
              <b />
              <i class="wide" />
              <i />
              <i class="wide" />
            </div>
          </div>
          <span v-if="scoreFor(resume) !== null" class="score-chip" :class="scoreTone(scoreFor(resume))">
            {{ scoreFor(resume) }}/100
          </span>
        </button>
        <div class="hub-card-body">
          <div class="card-time">{{ relativeDate(resume.updatedAt) }}</div>
          <h3>{{ resume.name }}</h3>
          <p>{{ resume.targetJobTitle || activeVersion(resume)?.label || resume.originalFileName }}</p>
          <span class="level-chip">{{ experienceLabel(resume.experienceLevel) }}</span>
          <NuxtLink :to="`/app/resumes/${resume.id}/builder`" class="btn btn-primary btn-sm edit-button">
            <PencilLine :size="14" />
            Edit
          </NuxtLink>
          <div class="card-icon-actions" aria-label="Resume actions">
            <NuxtLink :to="`/app/resumes/${resume.id}`" class="icon-action" title="View analysis">
              <Eye :size="14" />
            </NuxtLink>
            <button class="icon-action" type="button" title="Duplicate" @click="duplicate(resume.id)">
              <Copy :size="14" />
            </button>
            <button class="icon-action" type="button" title="Download" @click="download(resume)">
              <Download :size="14" />
            </button>
            <button class="icon-action" type="button" title="Delete" @click="deleteTarget = resume">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <BaseModal
      :open="createOpen"
      title="Create new resume"
      size="md"
      :busy="creating || extracting"
      @close="closeCreate"
    >
      <div class="create-form">
        <div class="field">
          <span class="field-label">How do you want to start?</span>
          <div class="source-grid">
            <button
              v-for="source in sources"
              :key="source.value"
              type="button"
              :class="{ active: createForm.source === source.value }"
              @click="createForm.source = source.value"
            >
              <component :is="source.icon" :size="16" />
              <strong>{{ source.label }}</strong>
            </button>
          </div>
        </div>

        <div v-if="createForm.source === 'new'" class="source-note">
          Start with an empty builder and add each section yourself.
        </div>

        <label v-else class="import-picker" :class="{ extracting }">
          <input
            ref="importInput"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            @change="handleImportFile"
          >
          <span>
            <AppSpinner v-if="extracting" :size="14" />
            <FileText v-else :size="14" />
            {{ importFileName || 'Upload a PDF, DOCX, or TXT resume' }}
          </span>
          <small v-if="importFileText">Extracted text will be placed into the builder sections.</small>
        </label>
      </div>

      <template #footer>
        <button class="btn btn-secondary" type="button" :disabled="creating || extracting" @click="closeCreate">Cancel</button>
        <button class="btn btn-primary" type="button" :disabled="!canCreate || creating || extracting" @click="createResume">
          <AppSpinner v-if="creating" :size="15" light />
          {{ creating ? 'Creating...' : 'Create resume' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      title="Delete Resume"
      description="Are you sure you want to delete this resume?"
      confirm-label="Confirm"
      tone="warning"
      @close="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { ResumeBuilderSource, ResumeExperienceLevel, ResumeRecord } from '@/types'
import {
  Copy,
  Download,
  Eye,
  FilePlus2,
  FileText,
  PencilLine,
  Plus,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import { extractTextFromFile } from '@/lib/resume/parser'
import { exportResumePdf } from '@/lib/export/resume'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const toast = useToast()
const sortBy = ref<'updatedAt' | 'createdAt' | 'name' | 'score'>('updatedAt')
const createOpen = ref(false)
const creating = ref(false)
const extracting = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const importFileName = ref('')
const importFileText = ref('')
const importFileType = ref('text/plain')
const deleteTarget = ref<ResumeRecord | null>(null)
const createForm = reactive<{
  source: ResumeBuilderSource
}>({
  source: 'new',
})
const sources: Array<{ value: ResumeBuilderSource; label: string; icon: Component }> = [
  { value: 'new', label: 'Blank Resume', icon: FilePlus2 },
  { value: 'import', label: 'Upload Resume', icon: Upload },
]
const sortedResumes = computed(() => [...workspace.state.value.resumes].sort((a, b) => {
  const sortKey = sortBy.value
  if (sortKey === 'name') return a.name.localeCompare(b.name)
  if (sortKey === 'score') return (scoreFor(b) ?? -1) - (scoreFor(a) ?? -1)
  return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime()
}))
const canCreate = computed(() => (
  createForm.source === 'new' || Boolean(importFileText.value.trim())
))

const activeVersion = (resume: ResumeRecord) => workspace.getActiveVersion(resume)
const scoreFor = (resume: ResumeRecord) => activeVersion(resume)?.analysis.score ?? null
const scoreTone = (score: number | null) => {
  if (score === null) return 'score-low'
  if (score >= 70) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}
const experienceLabel = (level?: ResumeExperienceLevel) => {
  if (level === 'senior') return 'Senior Level'
  if (level === 'mid') return 'Mid Level'
  return 'Entry Level'
}
const relativeDate = (date: string) => {
  const difference = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(difference / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`
  return `${Math.floor(hours / 24)} days ago`
}
const resetCreate = () => {
  createForm.source = 'new'
  importFileName.value = ''
  importFileText.value = ''
  importFileType.value = 'text/plain'
  if (importInput.value) importInput.value.value = ''
}
const openCreate = (source: ResumeBuilderSource) => {
  resetCreate()
  createForm.source = source
  createOpen.value = true
}
const closeCreate = () => {
  if (!creating.value && !extracting.value) createOpen.value = false
}
const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  extracting.value = true
  try {
    const text = await extractTextFromFile(file)
    if (text.trim().length < 20) throw new Error('Very little text could be extracted from this file.')
    importFileText.value = text
    importFileName.value = file.name
    importFileType.value = file.type || 'application/octet-stream'
    toast.show('Resume extracted', { message: 'The builder will prefill sections from this file.' })
  } catch (error) {
    toast.show('Could not import resume', {
      message: error instanceof Error ? error.message : 'Try another PDF, DOCX, or TXT file.',
      tone: 'error',
    })
  } finally {
    extracting.value = false
  }
}
const createResume = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    const resume = workspace.addBuilderResume({
      source: createForm.source,
      originalFileName: importFileName.value || undefined,
      fileType: importFileType.value,
      sourceText: createForm.source === 'import' ? importFileText.value : undefined,
    })
    toast.show('Resume created', {
      message: createForm.source === 'import'
        ? 'Extracted sections are ready in the builder.'
        : 'Your blank builder workspace is ready.',
    })
    createOpen.value = false
    await navigateTo(`/app/resumes/${resume.id}/builder`)
  } finally {
    creating.value = false
  }
}
const openBuilder = (resumeId: string) => navigateTo(`/app/resumes/${resumeId}/builder`)
const duplicate = (resumeId: string) => {
  const resume = workspace.duplicateResume(resumeId)
  if (resume) toast.show('Resume duplicated', { message: `${resume.name} is ready to edit.` })
}
const download = async (resume: ResumeRecord) => {
  const version = activeVersion(resume)
  if (!version) return
  await exportResumePdf(version.parsed, resume.name)
  toast.show('PDF exported')
}
const confirmDelete = () => {
  if (!deleteTarget.value) return
  workspace.deleteResume(deleteTarget.value.id)
  toast.show('Resume deleted', { tone: 'info' })
  deleteTarget.value = null
}
</script>

<style scoped>
.resume-hub-shell {
  min-height: calc(100vh - 64px);
  padding: 22px 32px 64px;
  background: var(--surface-warm);
}

.hub-header,
.hub-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.hub-header {
  margin-bottom: 22px;
}

.hub-header h1 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0;
}

.active-resume-banner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  width: 376px;
  min-height: 59px;
  margin-bottom: 26px;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card-bg);
}

.banner-upload-button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
}

.banner-upload-button:hover {
  color: var(--purple);
  background: var(--purple-soft);
}

.active-resume-banner > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  color: var(--muted);
  background: var(--surface-soft);
}

.active-resume-banner strong {
  display: block;
  font-size: 12px;
}

.active-resume-banner p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 11px;
}

.hub-section-head {
  margin-bottom: 20px;
}

.hub-section-head h2 {
  margin: 0;
  font-size: 18px;
}

.sort-select {
  width: 155px;
}

.resume-hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 255px);
  align-items: start;
  gap: 12px;
}

.create-resume-tile,
.hub-resume-card {
  min-height: 238px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card-bg);
}

.create-resume-tile {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 9px;
  border: 1.5px dashed var(--line-strong);
  color: var(--muted);
  cursor: pointer;
}

.create-resume-tile:hover {
  border-color: var(--purple-border);
  color: var(--purple);
  background: var(--surface-hover);
}

.create-resume-tile span {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 50%;
  background: var(--badge-bg);
}

.create-resume-tile strong {
  color: var(--ink-soft);
  font-size: 14px;
}

.create-resume-tile small {
  font-size: 11px;
}

.hub-resume-card {
  display: grid;
  grid-template-columns: 132px 1fr;
  overflow: hidden;
  padding: 13px 13px 12px;
}

.resume-thumb {
  display: grid;
  overflow: hidden;
  width: 118px;
  height: 184px;
  place-items: center;
  position: relative;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.thumb-paper {
  display: grid;
  width: 118px;
  height: 184px;
  place-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: var(--document-preview-bg);
}

.thumb-paper :deep(.builder-paper) {
  width: 170px;
  min-height: 235px;
  padding: 13px;
  font-size: 3.15px;
  transform: scale(0.78);
  transform-origin: center;
}

.document-lines {
  width: 92px;
  height: 120px;
  padding: 14px 12px;
  background: var(--document-surface);
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.1);
}

.document-lines i,
.document-lines b {
  display: block;
  height: 4px;
  margin-bottom: 7px;
  border-radius: 99px;
  background: var(--document-line);
}

.document-lines .wide { width: 100%; }
.document-lines .short { width: 55%; }
.document-lines b {
  height: 3px;
  margin: 13px 0 8px;
  background: var(--purple-solid);
}

.score-chip {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 4px 5px;
  border-radius: 99px;
  color: var(--red);
  font-size: 10px;
  font-weight: 800;
  background: var(--card-bg);
}

.score-chip.score-high { color: var(--green); }
.score-chip.score-mid { color: var(--amber); }
.score-chip.score-low { color: var(--red); }

.hub-card-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 2px 0 0;
}

.card-time {
  order: 5;
  margin-top: auto;
  margin-bottom: 0;
  color: var(--muted);
  font-size: 10px;
}

.hub-card-body h3 {
  overflow: hidden;
  margin: 0 0 6px;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hub-card-body p {
  overflow: hidden;
  margin: 0 0 9px;
  color: var(--muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-chip {
  display: inline-flex;
  align-self: flex-start;
  margin-bottom: 10px;
  padding: 5px 8px;
  border-radius: 8px;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 750;
  background: var(--surface-soft);
}

.edit-button {
  width: 100%;
  min-height: 32px;
  margin-bottom: 8px;
  margin-top: auto;
}

.card-icon-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  order: 4;
}

.icon-action {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
}

.icon-action:hover {
  color: var(--purple);
  background: var(--purple-soft);
}

.create-form {
  display: grid;
  gap: 10px;
}

.create-form small {
  color: var(--muted);
  font-size: 9px;
  line-height: 1.25;
}

.create-form .field {
  gap: 5px;
}

.create-form .field-label {
  font-size: 11px;
}

.create-form .input {
  height: 31px;
  padding: 0 10px;
  font-size: 11px;
}

.source-grid {
  display: grid;
  gap: 6px;
}

.source-grid { grid-template-columns: repeat(2, 1fr); }

.source-grid button {
  display: grid;
  min-height: 28px;
  place-items: center;
  gap: 2px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--ink-soft);
  font-size: 11px;
  background: var(--control-bg);
  cursor: pointer;
}

.source-grid button {
  min-height: 50px;
}

.source-grid button.active {
  border-color: var(--purple);
  color: var(--purple);
  background: var(--purple-soft);
  box-shadow: 0 0 0 1px var(--purple-border);
}

.source-note,
.import-picker {
  min-height: 34px;
  padding: 8px 11px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-size: 10px;
  background: var(--surface-subtle);
}

.import-picker {
  display: grid;
  gap: 5px;
  min-height: 42px;
  cursor: pointer;
}

.import-picker.extracting {
  cursor: progress;
}

.import-picker input {
  display: none;
}

.import-picker span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 720px) {
  .resume-hub-shell {
    padding: 22px 16px 48px;
  }

  .active-resume-banner {
    grid-template-columns: auto 1fr;
  }

  .active-resume-banner .btn {
    grid-column: 1 / -1;
  }

  .hub-section-head {
    align-items: stretch;
    flex-direction: column;
  }

  .sort-select {
    width: 100%;
  }

  .source-grid {
    grid-template-columns: 1fr;
  }
}
</style>
