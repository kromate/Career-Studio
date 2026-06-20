<template>
  <DetailPageSkeleton v-if="!resume || !document || !version" />
  <div v-else class="career-builder-shell">
    <div class="builder-page">
      <ResumeBuilderTopbar
        v-model:active-tab="activeTab"
        :score="version.analysis.score ?? 0"
        :score-label="scoreLabel"
        @export-pdf="exportPdf"
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
          <ResumeBuilderPreview :document="document" />
          <div class="preview-page-control" aria-hidden="true">
            <button type="button">‹</button>
            <span>1 / 2</span>
            <button type="button">›</button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditableResumeDocument, ResumeDesignSettings, ScoreDimension } from '@/types'
import '@/assets/css/resume-builder.css'
import { exportResumePdf } from '@/lib/export/resume'
import { getPrioritizedFindings } from '@/lib/resume/scoring'

definePageMeta({ layout: 'app-builder', middleware: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const toast = useToast()

useHead({ bodyAttrs: { class: 'career-builder-body' } })

const activeTab = ref<'content' | 'design' | 'analysis'>('content')
const requestedSection = ref('')
const accentColors = ['#16a085', '#27ae60', '#2980b9', '#8e44ad', '#e74c3c', '#f39c12', '#d35400', '#000000']
const resume = computed(() => workspace.getResume(route.params.id as string))
const version = computed(() => resume.value ? workspace.getActiveVersion(resume.value) : undefined)
const document = computed(() => resume.value?.builderDocument)
const findings = computed(() => version.value ? getPrioritizedFindings(version.value.analysis).slice(0, 8) : [])
const recoverablePoints = computed(() => findings.value.reduce((sum, finding) => sum + Math.round(finding.maxPoints - finding.earnedPoints), 0))
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

const saveDocument = (nextDocument: EditableResumeDocument) => {
  if (!resume.value) return
  workspace.updateBuilderDocument(resume.value.id, () => nextDocument)
}
const updateDesign = (key: keyof ResumeDesignSettings, value: string | number) => {
  if (!document.value) return
  saveDocument({
    ...document.value,
    design: { ...document.value.design, [key]: value } as ResumeDesignSettings,
  })
}
const openSectionFromFinding = (dimension: ScoreDimension) => {
  activeTab.value = 'content'
  requestedSection.value = dimension === 'completeness' || dimension === 'parseability' ? 'profile' : 'work'
}
const exportPdf = async () => {
  if (!resume.value || !version.value || !document.value) return
  await exportResumePdf(document.value, resume.value.name)
  toast.show('PDF exported')
}
</script>
