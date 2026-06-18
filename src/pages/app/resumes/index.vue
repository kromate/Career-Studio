<template>
  <CollectionLoadingState v-if="!workspace.state.value.hydrated" />
  <div v-else class="resume-hub-shell">
    <header class="hub-header">
      <div>
        <h1>Resume Hub</h1>
      </div>
      <div class="hub-actions">
        <span class="credit-pill"><Sparkles :size="14" /> 20 AI</span>
      </div>
    </header>

    <section class="active-resume-banner">
      <span><FileText :size="19" /></span>
      <div>
        <strong>No Active Resume</strong>
        <p>Upload a resume to your profile to see your score</p>
      </div>
      <button class="btn btn-secondary btn-sm" type="button" @click="openCreate('import')">
        <Upload :size="14" />
        Upload Resume
      </button>
    </section>

    <section class="hub-section-head">
      <h2>Resumes{{ sortedResumes.length ? ` (${sortedResumes.length})` : '' }}</h2>
      <label class="sort-select">
        <span class="sr-only">Sort resumes</span>
        <select v-model="sortBy" class="select">
          <option value="updatedAt">Last Modified</option>
          <option value="createdAt">Created</option>
          <option value="name">Name</option>
          <option value="score">Score</option>
        </select>
      </label>
    </section>

    <div class="resume-hub-grid">
      <button class="create-resume-tile" type="button" @click="openCreate('new')">
        <span><Plus :size="24" /></span>
        <strong>Create New Resume</strong>
        <small>Upload, paste, or start fresh</small>
      </button>

      <article v-for="resume in sortedResumes" :key="resume.id" class="hub-resume-card">
        <button class="resume-thumb" type="button" @click="openBuilder(resume.id)">
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
          <span v-if="scoreFor(resume) !== null" class="score-chip">{{ scoreFor(resume) }}/100</span>
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
      :busy="creating"
      @close="closeCreate"
    >
      <div class="create-form">
        <label class="field">
          <span class="field-label">Document title</span>
          <input v-model.trim="createForm.title" class="input" placeholder="e.g. Senior Product Designer - 2026">
          <small>This is the name you'll see in your resume list. Pick something you can recognize at a glance.</small>
        </label>

        <label class="field">
          <span class="field-label">Target job title</span>
          <input v-model.trim="createForm.targetJobTitle" class="input" placeholder="What role is this resume for?">
        </label>

        <div class="field">
          <span class="field-label">Experience level</span>
          <div class="segmented-control">
            <button
              v-for="level in levels"
              :key="level.value"
              type="button"
              :class="{ active: createForm.experienceLevel === level.value }"
              @click="createForm.experienceLevel = level.value"
            >
              <strong>{{ level.label }}</strong>
              <span>{{ level.years }}</span>
            </button>
          </div>
        </div>

        <div class="field">
          <span class="field-label">Resume source</span>
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

        <div v-if="createForm.source === 'profile'" class="source-note">
          Your Career Studio profile is empty. Add work history and education in your profile first.
        </div>

        <label v-if="createForm.source === 'import'" class="import-picker">
          <input
            ref="importInput"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            @change="handleImportFile"
          >
          <span><FileText :size="14" /> {{ importFileName || 'Choose PDF, DOCX, or TXT' }}</span>
        </label>
      </div>

      <template #footer>
        <button class="btn btn-secondary" type="button" :disabled="creating" @click="closeCreate">Cancel</button>
        <button class="btn btn-primary" type="button" :disabled="!canCreate || creating" @click="createResume">
          <AppSpinner v-if="creating" :size="15" light />
          {{ creating ? 'Creating...' : 'Create resume' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      title="Delete this resume?"
      description="This removes every local version and builder edit for this resume."
      confirm-label="Delete resume"
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
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-vue-next'
import { extractTextFromFile } from '@/lib/resume/parser'
import { exportResumePdf } from '@/lib/export/resume'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const toast = useToast()
const sortBy = ref<'updatedAt' | 'createdAt' | 'name' | 'score'>('updatedAt')
const createOpen = ref(false)
const creating = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const importFileName = ref('')
const importFileText = ref('')
const importFileType = ref('text/plain')
const deleteTarget = ref<ResumeRecord | null>(null)
const createForm = reactive<{
  title: string
  targetJobTitle: string
  experienceLevel: ResumeExperienceLevel
  source: ResumeBuilderSource
}>({
  title: '',
  targetJobTitle: '',
  experienceLevel: 'entry',
  source: 'new',
})
const levels: Array<{ value: ResumeExperienceLevel; label: string; years: string }> = [
  { value: 'entry', label: 'Entry', years: '0-2 yrs' },
  { value: 'mid', label: 'Mid', years: '2-5 yrs' },
  { value: 'senior', label: 'Senior', years: '5+ yrs' },
]
const sources: Array<{ value: ResumeBuilderSource; label: string; icon: Component }> = [
  { value: 'profile', label: 'Career Profile', icon: UserRound },
  { value: 'new', label: 'Create New', icon: FilePlus2 },
  { value: 'import', label: 'Import Existing', icon: Upload },
]
const sortedResumes = computed(() => [...workspace.state.value.resumes].sort((a, b) => {
  const sortKey = sortBy.value
  if (sortKey === 'name') return a.name.localeCompare(b.name)
  if (sortKey === 'score') return (scoreFor(b) ?? -1) - (scoreFor(a) ?? -1)
  return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime()
}))
const canCreate = computed(() => (
  Boolean(createForm.title.trim() && createForm.targetJobTitle.trim())
  && createForm.source !== 'profile'
  && (createForm.source !== 'import' || Boolean(importFileText.value.trim()))
))

const activeVersion = (resume: ResumeRecord) => workspace.getActiveVersion(resume)
const scoreFor = (resume: ResumeRecord) => activeVersion(resume)?.analysis.score ?? null
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
  createForm.title = ''
  createForm.targetJobTitle = ''
  createForm.experienceLevel = 'entry'
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
  if (!creating.value) createOpen.value = false
}
const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  creating.value = true
  try {
    importFileText.value = await extractTextFromFile(file)
    importFileName.value = file.name
    importFileType.value = file.type || 'application/octet-stream'
    if (!createForm.title) createForm.title = file.name.replace(/\.(pdf|docx|txt)$/i, '').replace(/[-_]+/g, ' ')
  } catch (error) {
    toast.show('Could not import resume', {
      message: error instanceof Error ? error.message : 'Try another PDF, DOCX, or TXT file.',
      tone: 'error',
    })
  } finally {
    creating.value = false
  }
}
const createResume = async () => {
  if (!canCreate.value) return
  creating.value = true
  try {
    const resume = workspace.addBuilderResume({
      name: createForm.title,
      targetJobTitle: createForm.targetJobTitle,
      experienceLevel: createForm.experienceLevel,
      source: createForm.source,
      originalFileName: importFileName.value || undefined,
      fileType: importFileType.value,
      sourceText: importFileText.value || undefined,
    })
    toast.show('Resume created', { message: 'Your builder workspace is ready.' })
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
  padding: 30px 32px 64px;
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
  margin-bottom: 20px;
}

.hub-header h1 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0;
}

.hub-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.credit-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  color: var(--purple);
  font-size: 12px;
  font-weight: 800;
  background: var(--purple-soft);
}

.active-resume-banner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  max-width: 520px;
  min-height: 64px;
  margin-bottom: 26px;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card-bg);
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
  margin-bottom: 14px;
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
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.create-resume-tile,
.hub-resume-card {
  min-height: 258px;
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
  overflow: hidden;
}

.resume-thumb {
  display: grid;
  overflow: hidden;
  width: 100%;
  height: 158px;
  place-items: center;
  position: relative;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: var(--document-preview-bg);
  cursor: pointer;
}

.resume-thumb :deep(.builder-paper) {
  width: 180px;
  min-height: 235px;
  padding: 14px;
  font-size: 3.3px;
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
  right: 10px;
  bottom: 10px;
  padding: 5px 8px;
  border-radius: 99px;
  color: var(--purple);
  font-size: 11px;
  font-weight: 800;
  background: var(--purple-soft);
}

.hub-card-body {
  padding: 13px;
}

.card-time {
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 11px;
}

.hub-card-body h3 {
  overflow: hidden;
  margin: 0 0 6px;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hub-card-body p {
  overflow: hidden;
  margin: 0 0 9px;
  color: var(--muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-chip {
  display: inline-flex;
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
  margin-bottom: 8px;
}

.card-icon-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
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
  gap: 14px;
}

.create-form small {
  color: var(--muted);
  font-size: 10px;
}

.segmented-control,
.source-grid {
  display: grid;
  gap: 8px;
}

.segmented-control,
.source-grid {
  grid-template-columns: repeat(3, 1fr);
}

.segmented-control button,
.source-grid button {
  display: grid;
  min-height: 42px;
  place-items: center;
  gap: 2px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--ink-soft);
  font-size: 11px;
  background: var(--control-bg);
  cursor: pointer;
}

.segmented-control button.active,
.source-grid button.active {
  border-color: var(--purple);
  color: var(--purple);
  background: var(--purple-soft);
  box-shadow: 0 0 0 1px var(--purple-border);
}

.segmented-control span {
  color: var(--muted);
  font-size: 10px;
}

.source-note,
.import-picker {
  min-height: 38px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-size: 11px;
  background: var(--surface-subtle);
}

.import-picker {
  display: flex;
  align-items: center;
  cursor: pointer;
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

  .source-grid,
  .segmented-control {
    grid-template-columns: 1fr;
  }
}
</style>
