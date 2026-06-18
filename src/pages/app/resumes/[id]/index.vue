<template>
  <div class="page-shell analysis-page">
    <template v-if="resume && version">
      <header class="page-header">
        <div>
          <NuxtLink to="/app/resumes" class="back-link"><ArrowLeft :size="14" /> Resumes</NuxtLink>
          <div class="resume-title-row">
            <div>
              <h1>{{ resume.name }}</h1>
              <p>{{ version.label }} · Analyzed {{ formatDate(version.analysis.createdAt) }}</p>
            </div>
            <span class="badge" :class="confidenceBadge">
              <ShieldCheck :size="13" />
              {{ version.analysis.parseConfidence }} parse confidence
            </span>
          </div>
        </div>
        <div class="page-actions">
          <div class="export-menu-wrap">
            <button class="btn btn-secondary" type="button" @click="exportOpen = !exportOpen">
              <Download :size="16" />
              Export
              <ChevronDown :size="14" />
            </button>
            <div v-if="exportOpen" class="export-menu">
              <button type="button" @click="exportPdf"><FileText :size="15" /> Download PDF</button>
              <button type="button" @click="exportDocx"><FileType2 :size="15" /> Download DOCX</button>
            </div>
          </div>
          <NuxtLink :to="`/app/resumes/${resume.id}/rewrite`" class="btn btn-primary">
            <Sparkles :size="16" />
            Improve resume
          </NuxtLink>
        </div>
      </header>

      <nav class="analysis-tabs" aria-label="Resume sections">
        <button :class="{ active: activeTab === 'report' }" type="button" @click="activeTab = 'report'">
          <ScanSearch :size="16" />
          Analysis report
        </button>
        <button :class="{ active: activeTab === 'versions' }" type="button" @click="activeTab = 'versions'">
          <History :size="16" />
          Version history
          <span>{{ resume.versions.length }}</span>
        </button>
      </nav>

      <template v-if="activeTab === 'report'">
        <section class="score-hero card">
          <div class="score-primary">
            <ScoreRing :score="version.analysis.score" :size="160" :stroke="12" />
            <div>
              <span class="section-kicker">Career Studio Resume Quality Score</span>
              <h2>{{ scoreMessage.title }}</h2>
              <p>{{ scoreMessage.description }}</p>
              <div v-if="workspace.state.value.settings.scoringDetails" class="score-meta">
                <span><GitBranch :size="13" /> {{ version.analysis.scoringVersion }}</span>
                <span><Fingerprint :size="13" /> {{ workspace.scoreFingerprint.value }}</span>
              </div>
            </div>
          </div>
          <div class="dimension-grid">
            <DimensionBar
              v-for="dimension in version.analysis.dimensions"
              :key="dimension.id"
              :label="dimension.label"
              :score="dimension.score"
              :max-score="dimension.maxScore"
            />
          </div>
        </section>

        <section v-if="version.analysis.parseWarnings.length" class="parse-warnings card">
          <span><TriangleAlert :size="20" /></span>
          <div>
            <h3>Review extraction warnings</h3>
            <ul>
              <li v-for="warning in version.analysis.parseWarnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>
        </section>

        <section class="analysis-workspace">
          <aside class="findings-panel card">
            <div class="findings-header">
              <div>
                <span class="section-kicker">Prioritized findings</span>
                <h2>{{ actionableFindings.length }} improvements</h2>
              </div>
              <button class="filter-button" type="button" @click="filterOpen = !filterOpen">
                <ListFilter :size="15" />
              </button>
              <div v-if="filterOpen" class="filter-menu">
                <button
                  v-for="option in filters"
                  :key="option.value"
                  type="button"
                  :class="{ active: activeFilter === option.value }"
                  @click="activeFilter = option.value; filterOpen = false"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="finding-items">
              <button
                v-for="finding in filteredFindings"
                :key="finding.ruleId"
                class="finding-item"
                :class="{
                  active: selectedFinding?.ruleId === finding.ruleId,
                  intentional: intentionalRuleIds.has(finding.ruleId),
                }"
                type="button"
                @click="selectFinding(finding.ruleId)"
              >
                <span class="finding-severity" :class="finding.severity">
                  <TriangleAlert v-if="finding.severity === 'high'" :size="13" />
                  <CircleDot v-else :size="13" />
                </span>
                <div>
                  <strong>{{ finding.title }}</strong>
                  <p>{{ finding.recommendation }}</p>
                  <span v-if="intentionalRuleIds.has(finding.ruleId)" class="intentional-label">
                    Marked intentional
                  </span>
                  <span v-else>{{ finding.dimension }} · {{ pointsLost(finding) }} points available</span>
                </div>
                <ChevronRight :size="15" />
              </button>
            </div>
          </aside>

          <div class="evidence-column">
            <article v-if="selectedFinding" class="finding-detail card">
              <div class="finding-detail-top">
                <div>
                  <span class="badge" :class="severityBadge(selectedFinding.severity)">
                    {{ selectedFinding.severity }} priority
                  </span>
                  <span v-if="workspace.state.value.settings.scoringDetails" class="rule-id">{{ selectedFinding.ruleId }}</span>
                </div>
                <span class="point-recovery">Up to +{{ pointsLost(selectedFinding) }} pts</span>
              </div>
              <h2>{{ selectedFinding.title }}</h2>
              <p class="finding-explanation">{{ selectedFinding.explanation }}</p>
              <div class="recommendation-box">
                <span><Lightbulb :size="17" /></span>
                <div>
                  <strong>Recommended action</strong>
                  <p>{{ selectedFinding.recommendation }}</p>
                </div>
              </div>
              <div v-if="selectedFinding.evidence.length" class="evidence-quotes">
                <span class="section-kicker">Affected content</span>
                <blockquote v-for="evidence in selectedFinding.evidence" :key="`${evidence.lineId}-${evidence.quote}`">
                  {{ evidence.quote }}
                </blockquote>
              </div>
              <div class="finding-detail-actions">
                <NuxtLink :to="`/app/resumes/${resume.id}/rewrite?finding=${selectedFinding.ruleId}`" class="btn btn-primary">
                  <Sparkles :size="15" />
                  Improve this
                </NuxtLink>
                <button class="btn btn-secondary" type="button" @click="toggleIntentional">
                  <CheckCircle2 :size="15" />
                  {{ intentionalRuleIds.has(selectedFinding.ruleId) ? 'Restore finding' : 'Mark intentional' }}
                </button>
              </div>
            </article>

            <article class="preview-card card">
              <div class="preview-header">
                <div>
                  <span class="section-kicker">Resume evidence</span>
                  <h2>Document preview</h2>
                </div>
                <span>{{ highlightedLineIds.length }} highlighted line{{ highlightedLineIds.length === 1 ? '' : 's' }}</span>
              </div>
              <div class="preview-scroll">
                <ResumePreview :parsed="version.parsed" :highlighted-line-ids="highlightedLineIds" />
              </div>
            </article>
          </div>
        </section>
      </template>

      <section v-else class="versions-layout">
        <article class="card versions-list">
          <div class="section-card-header">
            <div>
              <span class="section-kicker">Immutable history</span>
              <h2>Resume versions</h2>
            </div>
            <NuxtLink :to="`/app/resumes/${resume.id}/rewrite`" class="btn btn-primary btn-sm">
              <Plus :size="14" />
              New version
            </NuxtLink>
          </div>
          <button
            v-for="item in resume.versions"
            :key="item.id"
            class="version-row"
            :class="{ active: item.id === resume.activeVersionId }"
            type="button"
            @click="workspace.setActiveVersion(resume.id, item.id)"
          >
            <span class="version-icon"><component :is="versionIcon(item.source)" :size="17" /></span>
            <div>
              <strong>{{ item.label }}</strong>
              <p>{{ item.source }} · {{ formatDate(item.createdAt) }}</p>
            </div>
            <span class="version-score">{{ item.analysis.score ?? '—' }}</span>
            <span v-if="item.id === resume.activeVersionId" class="badge badge-green">Active</span>
            <ChevronRight v-else :size="16" />
          </button>
        </article>

        <aside class="version-summary card card-pad">
          <span class="section-kicker">Current version</span>
          <ScoreRing :score="version.analysis.score" :size="130" />
          <h2>{{ version.label }}</h2>
          <p>{{ version.parsed.stats.words }} words · {{ version.parsed.stats.bullets }} bullets · {{ version.analysis.parseConfidence }} confidence</p>
          <div class="version-summary-actions">
            <NuxtLink :to="`/app/resumes/${resume.id}/rewrite`" class="btn btn-primary">Edit as new version</NuxtLink>
            <button class="btn btn-danger" type="button" @click="deleteConfirm = true">
              <Trash2 :size="15" />
              Delete resume
            </button>
          </div>
        </aside>
      </section>

      <ConfirmDialog
        :open="deleteConfirm"
        title="Delete this resume?"
        description="This removes every local version and analysis. Saved jobs will remain, but their match results will be cleared."
        confirm-label="Delete resume"
        loading-label="Deleting…"
        :loading="deleteLoading"
        @close="deleteConfirm = false"
        @confirm="confirmDelete"
      />
    </template>

    <DetailPageSkeleton v-else />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { FindingSeverity, ResumeVersion, ScoreCheck, ScoreDimension } from '@/types'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Download,
  FileInput,
  FilePenLine,
  FileText,
  FileType2,
  Fingerprint,
  GitBranch,
  History,
  Lightbulb,
  ListFilter,
  Plus,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from 'lucide-vue-next'
import { exportResumeDocx, exportResumePdf } from '@/lib/export/resume'
import { getPrioritizedFindings } from '@/lib/resume/scoring'

definePageMeta({ layout: 'app', middleware: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const toast = useToast()
const activeTab = ref<'report' | 'versions'>('report')
const selectedRuleId = ref(typeof route.query.finding === 'string' ? route.query.finding : '')
const activeFilter = ref<'all' | ScoreDimension>('all')
const filterOpen = ref(false)
const exportOpen = ref(false)
const deleteConfirm = ref(false)
const deleteLoading = ref(false)
const resume = computed(() => workspace.getResume(route.params.id as string))
const version = computed(() => resume.value ? workspace.getActiveVersion(resume.value) : undefined)
const findings = computed(() => version.value ? getPrioritizedFindings(version.value.analysis) : [])
const intentionalRuleIds = computed(() => new Set(version.value?.intentionalRuleIds || []))
const actionableFindings = computed(() => findings.value.filter(
  finding => !intentionalRuleIds.value.has(finding.ruleId),
))
const filteredFindings = computed(() => activeFilter.value === 'all'
  ? findings.value
  : findings.value.filter(finding => finding.dimension === activeFilter.value))
const selectedFinding = computed(() => {
  const selected = findings.value.find(finding => finding.ruleId === selectedRuleId.value)
  return selected || filteredFindings.value[0]
})
const highlightedLineIds = computed(() => (
  selectedFinding.value?.evidence.map(evidence => evidence.lineId).filter(Boolean) as string[] || []
))
const confidenceBadge = computed(() => {
  if (version.value?.analysis.parseConfidence === 'high') return 'badge-green'
  if (version.value?.analysis.parseConfidence === 'medium') return 'badge-amber'
  return 'badge-red'
})
const scoreMessage = computed(() => {
  const score = version.value?.analysis.score
  if (score === null || score === undefined) {
    return { title: 'Review the document extraction', description: 'The parser needs a cleaner structure before the overall score is trustworthy.' }
  }
  if (score >= 85) return { title: 'Excellent, focused resume', description: 'The foundation is strong. Use job targeting to make the evidence role-specific.' }
  if (score >= 70) return { title: 'Strong foundation with focused improvements', description: 'Resolve the highest-impact findings before tailoring this version to a job.' }
  if (score >= 50) return { title: 'Useful evidence, but important gaps remain', description: 'Prioritize parseability, role context, and outcome-focused bullets.' }
  return { title: 'Rebuild the foundation before applying', description: 'Correct extraction issues and add the missing evidence before tailoring.' }
})
const filters: Array<{ value: 'all' | ScoreDimension; label: string }> = [
  { value: 'all', label: 'All findings' },
  { value: 'parseability', label: 'ATS readability' },
  { value: 'completeness', label: 'Completeness' },
  { value: 'impact', label: 'Evidence & impact' },
  { value: 'clarity', label: 'Clarity' },
  { value: 'consistency', label: 'Consistency' },
  { value: 'searchability', label: 'Searchability' },
  { value: 'mechanics', label: 'Mechanics' },
]

onMounted(() => {
  workspace.hydrate()
  if (route.query.tab === 'versions') activeTab.value = 'versions'
  if (!resume.value) navigateTo('/app/resumes')
})

const selectFinding = (ruleId: string) => {
  selectedRuleId.value = ruleId
  navigateTo({ query: { finding: ruleId } }, { replace: true })
}
const toggleIntentional = () => {
  if (!resume.value || !version.value || !selectedFinding.value) return
  const wasIntentional = intentionalRuleIds.value.has(selectedFinding.value.ruleId)
  workspace.toggleFindingIntentional(resume.value.id, version.value.id, selectedFinding.value.ruleId)
  toast.show(wasIntentional ? 'Finding restored' : 'Finding marked intentional', {
    message: wasIntentional
      ? 'It will count toward your improvement list again.'
      : 'It remains in the report for transparency but no longer counts as an open improvement.',
    tone: 'info',
  })
}
const pointsLost = (finding: ScoreCheck) => Math.round(finding.maxPoints - finding.earnedPoints)
const severityBadge = (severity: FindingSeverity) => (
  severity === 'high' ? 'badge-red' : severity === 'medium' ? 'badge-amber' : 'badge-purple'
)
const formatDate = (date: string) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(date))
const versionIcon = (source: ResumeVersion['source']): Component => {
  if (source === 'rewrite') return FilePenLine
  if (source === 'tailored') return Target
  if (source === 'edit') return FileInput
  return FileText
}
const exportPdf = async () => {
  if (!resume.value || !version.value) return
  exportOpen.value = false
  await exportResumePdf(version.value.parsed, resume.value.name)
  toast.show('PDF exported')
}
const exportDocx = async () => {
  if (!resume.value || !version.value) return
  exportOpen.value = false
  await exportResumeDocx(version.value.parsed, resume.value.name)
  toast.show('DOCX exported')
}
const confirmDelete = async () => {
  if (!resume.value) return
  deleteLoading.value = true
  workspace.deleteResume(resume.value.id)
  toast.show('Resume deleted', { tone: 'info' })
  await navigateTo('/app/resumes')
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

.resume-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resume-title-row h1 {
  margin-bottom: 5px;
}

.resume-title-row p {
  margin: 0;
}

.export-menu-wrap,
.findings-header {
  position: relative;
}

.export-menu,
.filter-menu {
  display: grid;
  min-width: 180px;
  gap: 3px;
  position: absolute;
  z-index: 10;
  top: calc(100% + 7px);
  right: 0;
  padding: 7px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--popover-bg);
  box-shadow: var(--shadow-md);
}

.export-menu button,
.filter-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 37px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  font-size: 11px;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.export-menu button:hover,
.filter-menu button:hover,
.filter-menu button.active {
  color: var(--purple);
  background: var(--purple-soft);
}

.analysis-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 17px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card-bg);
}

.analysis-tabs button {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 0;
  border-radius: 9px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
}

.analysis-tabs button.active {
  color: var(--purple-dark);
  background: var(--purple-soft);
}

.analysis-tabs button span {
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 99px;
  font-size: 11px;
  background: var(--track-bg);
}

.score-hero {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  align-items: center;
  gap: 45px;
  padding: 28px;
}

.score-primary {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 25px;
}

.section-kicker {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.score-primary h2 {
  margin-bottom: 8px;
  font-size: 20px;
}

.score-primary p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.55;
}

.score-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 15px;
  color: var(--muted);
  font-size: 10px;
}

.score-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dimension-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 17px 20px;
  padding: 8px 0;
}

.parse-warnings {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  margin-top: 15px;
  padding: 18px;
  color: var(--amber);
  background: var(--amber-soft);
}

.parse-warnings h3 {
  margin-bottom: 5px;
  font-size: 13px;
}

.parse-warnings ul {
  display: grid;
  gap: 3px;
  margin: 0;
  padding-left: 16px;
  color: var(--ink-soft);
  font-size: 11px;
}

.analysis-workspace {
  display: grid;
  grid-template-columns: 350px minmax(0, 1fr);
  align-items: start;
  gap: 15px;
  margin-top: 15px;
}

.findings-panel {
  max-height: calc(100vh - 105px);
  overflow: hidden;
  position: sticky;
  top: 82px;
}

.findings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid var(--line);
}

.findings-header h2 {
  margin: 0;
  font-size: 15px;
}

.filter-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--muted);
  background: var(--control-bg);
  cursor: pointer;
}

.filter-menu {
  top: 55px;
  right: 13px;
}

.finding-items {
  max-height: calc(100vh - 195px);
  overflow: auto;
}

.finding-item {
  display: grid;
  width: 100%;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 10px;
  padding: 15px;
  border: 0;
  border-top: 1px solid var(--line);
  text-align: left;
  background: var(--card-bg);
  cursor: pointer;
}

.finding-item:first-child {
  border-top: 0;
}

.finding-item:hover,
.finding-item.active {
  background: var(--surface-soft);
}

.finding-item.active {
  box-shadow: inset 3px 0 0 var(--purple);
}

.finding-item.intentional {
  opacity: 0.68;
}

.finding-item .intentional-label {
  color: var(--green);
}

.finding-severity {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 8px;
  color: var(--blue);
  background: var(--blue-soft);
}

.finding-severity.high {
  color: var(--red);
  background: var(--red-soft);
}

.finding-severity.medium {
  color: var(--amber);
  background: var(--amber-soft);
}

.finding-item strong {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
}

.finding-item p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0 0 7px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.finding-item div > span {
  color: var(--purple);
  font-size: 10px;
  font-weight: 700;
  text-transform: capitalize;
}

.evidence-column {
  display: grid;
  min-width: 0;
  gap: 15px;
}

.finding-detail {
  padding: 25px;
}

.finding-detail-top,
.finding-detail-top > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.finding-detail-top {
  justify-content: space-between;
}

.rule-id {
  color: var(--muted);
  font-family: ui-monospace, monospace;
  font-size: 10px;
}

.point-recovery {
  padding: 5px 8px;
  border-radius: 99px;
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
  background: var(--green-soft);
}

.finding-detail > h2 {
  margin: 23px 0 8px;
  font-size: 23px;
}

.finding-explanation {
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.6;
}

.recommendation-box {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  margin: 22px 0;
  padding: 15px;
  border: 1px solid var(--purple-border-soft);
  border-radius: 11px;
  background: var(--purple-soft);
}

.recommendation-box > span {
  color: var(--purple);
}

.recommendation-box strong {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
}

.recommendation-box p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 10px;
  line-height: 1.5;
}

.evidence-quotes {
  display: grid;
  gap: 8px;
}

.evidence-quotes blockquote {
  margin: 0;
  padding: 12px 14px;
  border-left: 3px solid var(--amber);
  border-radius: 0 9px 9px 0;
  color: var(--ink-soft);
  font-size: 10px;
  line-height: 1.5;
  background: var(--amber-soft);
}

.finding-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.preview-card {
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 17px 20px;
  border-bottom: 1px solid var(--line);
}

.preview-header h2 {
  margin: 0;
  font-size: 15px;
}

.preview-header > span {
  color: var(--muted);
  font-size: 10px;
}

.preview-scroll {
  display: grid;
  max-height: 760px;
  overflow: auto;
  place-items: start center;
  padding: 25px;
  background: var(--document-preview-bg);
}

.versions-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  align-items: start;
  gap: 17px;
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 19px;
  border-bottom: 1px solid var(--line);
}

.section-card-header h2 {
  margin: 0;
  font-size: 16px;
}

.version-row {
  display: grid;
  width: 100%;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 15px 18px;
  border: 0;
  border-top: 1px solid var(--line);
  text-align: left;
  background: var(--card-bg);
  cursor: pointer;
}

.version-row.active,
.version-row:hover {
  background: var(--surface-soft);
}

.version-icon {
  display: grid;
  width: 37px;
  height: 37px;
  place-items: center;
  border-radius: 10px;
  color: var(--purple);
  background: var(--purple-soft);
}

.version-row strong {
  display: block;
  margin-bottom: 3px;
  font-size: 11px;
}

.version-row p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  text-transform: capitalize;
}

.version-score {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border: 2px solid var(--purple);
  border-radius: 50%;
  color: var(--purple);
  font-size: 10px;
  font-weight: 800;
}

.version-summary {
  display: grid;
  place-items: center;
  text-align: center;
}

.version-summary h2 {
  margin: 18px 0 7px;
  font-size: 17px;
}

.version-summary > p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.version-summary-actions {
  display: grid;
  width: 100%;
  gap: 8px;
  margin-top: 22px;
}

@media (max-width: 1100px) {
  .score-hero {
    grid-template-columns: 1fr;
  }

  .analysis-workspace {
    grid-template-columns: 310px minmax(0, 1fr);
  }
}

@media (max-width: 850px) {
  .analysis-workspace,
  .versions-layout {
    grid-template-columns: 1fr;
  }

  .findings-panel {
    max-height: none;
    position: static;
  }

  .finding-items {
    max-height: 430px;
  }
}

@media (max-width: 620px) {
  .resume-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .score-primary {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .dimension-grid {
    grid-template-columns: 1fr;
  }
}
</style>
