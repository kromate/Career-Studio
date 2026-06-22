<template>
  <DetailPageSkeleton v-if="!resume || !document || !version" />
  <div v-else class="career-builder-shell">
    <div class="builder-page">
      <ResumeBuilderTopbar
        v-model:active-tab="activeTab"
        :enrichment-count="enrichmentQuestions.length"
        :score="version.analysis.score ?? 0"
        :score-label="scoreLabel"
        @export-pdf="exportPdf"
        @open-enrichment="enrichmentOpen = true"
      />

      <main class="builder-workspace">
        <section class="builder-left">
          <ResumeBuilderContentPanel
            v-show="activeTab === 'content'"
            :document="document"
            :requested-section="requestedSection"
            @change-tab="activeTab = $event"
            @save-document="saveDocument"
          />
          <ResumeBuilderDesignPanel
            v-show="activeTab === 'design'"
            :accent-colors="accentColors"
            :document="document"
            @update-design="updateDesign"
          />
          <ResumeBuilderAnalysisPanel
            v-show="activeTab === 'analysis'"
            :dimensions="version.analysis.dimensions"
            :findings="findings"
            :recoverable-points="recoverablePoints"
            :score="version.analysis.score ?? 0"
            :score-label="scoreLabel"
            @open-section="openSectionFromFinding"
          />
        </section>

        <section class="builder-preview-pane">
          <div class="preview-artboard" :style="previewStyle">
            <ResumeBuilderPreview :document="document" />
          </div>
          <div class="preview-page-control">
            <button type="button" aria-label="Zoom out" @click="zoomOut"><ZoomOut :size="15" /></button>
            <button type="button" aria-label="Previous page" :disabled="previewPage <= 1" @click="previousPage"><ChevronLeft :size="15" /></button>
            <span>{{ Math.round(previewScale * 100) }}% · {{ previewPage }} / {{ pageCount }}</span>
            <button type="button" aria-label="Next page" :disabled="previewPage >= pageCount" @click="nextPage"><ChevronRight :size="15" /></button>
            <button type="button" aria-label="Zoom in" @click="zoomIn"><ZoomIn :size="15" /></button>
          </div>
        </section>
      </main>

      <ResumeEvidenceEnrichmentModal
        :open="enrichmentOpen"
        :questions="enrichmentQuestions"
        @close="enrichmentOpen = false"
        @apply="applyEnrichment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditableResumeDocument, EnrichmentSuggestion, ResumeDesignSettings, ResumeTemplateId, ScoreDimension } from '@/types'
import '@/assets/css/resume-builder.css'
import { exportResumePdf } from '@/lib/export/resume'
import { applyEnrichmentSuggestionToDocument, generateEnrichmentQuestions } from '@/lib/resume/enrichment'
import { resumeTemplatePreset } from '@/lib/resume/templates'
import { getPrioritizedFindings } from '@/lib/resume/scoring'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-vue-next'

definePageMeta({ layout: 'app-builder', middleware: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const toast = useToast()

useHead({ bodyAttrs: { class: 'career-builder-body' } })

const activeTab = ref<'content' | 'design' | 'analysis'>('content')
const requestedSection = ref('')
const enrichmentOpen = ref(false)
const previewScale = ref(0.86)
const previewPage = ref(1)
const accentColors = ['#16a085', '#27ae60', '#2980b9', '#8e44ad', '#e74c3c', '#f39c12', '#d35400', '#000000']
const resume = computed(() => workspace.getResume(route.params.id as string))
const version = computed(() => resume.value ? workspace.getActiveVersion(resume.value) : undefined)
const document = computed(() => resume.value?.builderDocument)
const activeJob = computed(() => version.value
  ? workspace.state.value.jobs.find(job => job.resumeVersionId === version.value?.id || job.id === version.value?.targetJobId)
  : undefined)
const findings = computed(() => version.value ? getPrioritizedFindings(version.value.analysis).slice(0, 8) : [])
const recoverablePoints = computed(() => findings.value.reduce((sum, finding) => sum + Math.round(finding.maxPoints - finding.earnedPoints), 0))
const enrichmentQuestions = computed(() => version.value
  ? generateEnrichmentQuestions(version.value.parsed, version.value.analysis, activeJob.value?.match)
  : [])
const pageCount = computed(() => Math.max(1, version.value?.parsed.stats.pagesEstimated || 1))
const previewStyle = computed(() => ({ transform: `scale(${previewScale.value})` }))
const scoreLabel = computed(() => {
  const score = version.value?.analysis.score || 0
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Needs work'
  return 'Poor'
})

onMounted(() => {
  workspace.hydrate()
  if (!resume.value) navigateTo('/app/resumes')
})

watch(pageCount, (count) => {
  previewPage.value = Math.min(previewPage.value, count)
})

const saveDocument = (nextDocument: EditableResumeDocument) => {
  if (!resume.value) return
  workspace.updateBuilderDocument(resume.value.id, () => nextDocument)
}
const zoomOut = () => {
  previewScale.value = Math.max(0.6, Math.round((previewScale.value - 0.08) * 100) / 100)
}
const zoomIn = () => {
  previewScale.value = Math.min(1.15, Math.round((previewScale.value + 0.08) * 100) / 100)
}
const previousPage = () => {
  previewPage.value = Math.max(1, previewPage.value - 1)
}
const nextPage = () => {
  previewPage.value = Math.min(pageCount.value, previewPage.value + 1)
}
const updateDesign = (key: keyof ResumeDesignSettings, value: string | number) => {
  if (!document.value) return
  if (key === 'template') {
    const template = value as ResumeTemplateId
    saveDocument({
      ...document.value,
      design: { ...document.value.design, ...resumeTemplatePreset(template), template },
    })
    return
  }
  saveDocument({
    ...document.value,
    design: { ...document.value.design, [key]: value } as ResumeDesignSettings,
  })
}
const openSectionFromFinding = (dimension: ScoreDimension) => {
  activeTab.value = 'content'
  requestedSection.value = dimension === 'completeness' || dimension === 'parseability' ? 'profile' : 'work'
}
const applyEnrichment = (suggestion: EnrichmentSuggestion) => {
  if (!document.value) return
  saveDocument(applyEnrichmentSuggestionToDocument(document.value, suggestion))
  toast.show('Evidence suggestion applied', {
    message: 'The deterministic score recalculates from the updated resume content.',
  })
}
const exportPdf = async () => {
  if (!resume.value || !version.value || !document.value) return
  await exportResumePdf(document.value, resume.value.name)
  workspace.recordResumeExport(resume.value.id, version.value.id, 'pdf')
  toast.show('PDF exported')
}
</script>
