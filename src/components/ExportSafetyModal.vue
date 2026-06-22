<template>
  <BaseModal
    :open="open"
    title="Review before export"
    :description="`You are exporting ${version.label} as ${format.toUpperCase()}.`"
    size="lg"
    header-align="left"
    @close="$emit('close')"
  >
    <div class="export-review">
      <section class="review-summary">
        <div>
          <span>Resume version</span>
          <strong>{{ version.label }}</strong>
          <small>{{ version.kind || version.source }} · {{ version.parsed.contentHash }}</small>
        </div>
        <div>
          <span>Quality score</span>
          <strong>{{ version.analysis.score ?? 'Review' }}</strong>
          <small>{{ version.analysis.scoringVersion }}</small>
        </div>
        <div>
          <span>Job match</span>
          <strong>{{ linkedJob?.match?.score ?? 'None' }}</strong>
          <small>{{ linkedJob ? `${linkedJob.title} at ${linkedJob.company}` : 'No target job linked' }}</small>
        </div>
      </section>

      <section class="review-grid">
        <article :class="unresolvedFindings.length ? 'attention' : 'clear'">
          <span><ListChecks :size="17" /></span>
          <div>
            <strong>{{ unresolvedFindings.length }} unresolved finding{{ unresolvedFindings.length === 1 ? '' : 's' }}</strong>
            <p>{{ unresolvedFindings.length ? unresolvedFindings.slice(0, 3).map(item => item.title).join(', ') : 'No open deterministic scoring findings.' }}</p>
          </div>
        </article>
        <article :class="version.analysis.parseWarnings.length ? 'attention' : 'clear'">
          <span><TriangleAlert :size="17" /></span>
          <div>
            <strong>{{ version.analysis.parseWarnings.length }} parse warning{{ version.analysis.parseWarnings.length === 1 ? '' : 's' }}</strong>
            <p>{{ version.analysis.parseWarnings[0] || 'Extraction confidence is ready for export review.' }}</p>
          </div>
        </article>
        <article :class="hiddenSections.length ? 'attention' : 'clear'">
          <span><EyeOff :size="17" /></span>
          <div>
            <strong>{{ hiddenSections.length }} hidden section{{ hiddenSections.length === 1 ? '' : 's' }}</strong>
            <p>{{ hiddenSections.length ? hiddenSections.join(', ') : 'No builder sections are hidden.' }}</p>
          </div>
        </article>
        <article :class="atsWarnings.length ? 'attention' : 'clear'">
          <span><ShieldCheck :size="17" /></span>
          <div>
            <strong>{{ atsWarnings.length }} ATS check{{ atsWarnings.length === 1 ? '' : 's' }}</strong>
            <p>{{ atsWarnings[0] || 'No additional export checks need attention.' }}</p>
          </div>
        </article>
      </section>
    </div>

    <template #footer>
      <button class="btn btn-secondary" type="button" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" type="button" @click="$emit('confirm')">
        <Download :size="15" />
        Export {{ format.toUpperCase() }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import type { ResumeExportFormat, ResumeRecord, ResumeVersion } from '@/types'
import { Download, EyeOff, ListChecks, ShieldCheck, TriangleAlert } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  resume: ResumeRecord
  version: ResumeVersion
  format: ResumeExportFormat
}>()

defineEmits<{ close: []; confirm: [] }>()

const workspace = useWorkspace()
const linkedJob = computed(() => (
  props.version.targetJobId
    ? workspace.getJob(props.version.targetJobId)
    : workspace.state.value.jobs.find(job => job.resumeVersionId === props.version.id)
))
const intentionalRuleIds = computed(() => new Set(props.version.intentionalRuleIds || []))
const unresolvedFindings = computed(() => props.version.analysis.checks.filter(check => (
  !check.passed && !intentionalRuleIds.value.has(check.ruleId)
)))
const hiddenSections = computed(() => props.resume.builderDocument?.sectionSettings
  .filter(section => !section.visible)
  .map(section => section.title)
  || [])
const atsWarnings = computed(() => {
  const warnings: string[] = []
  if (props.version.analysis.parseConfidence === 'low') warnings.push('Low parse confidence can make the exported resume harder to trust.')
  if (!props.version.parsed.contacts.email) warnings.push('No email address is detected in the active version.')
  if (!props.version.parsed.contacts.phone) warnings.push('No phone number is detected in the active version.')
  if (props.version.parsed.stats.pagesEstimated > 2) warnings.push('The resume is estimated above two pages.')
  return warnings
})
</script>

<style scoped>
.export-review {
  display: grid;
  gap: 16px;
  padding-bottom: 8px;
}

.review-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.review-summary > div {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.review-summary span,
.review-summary strong,
.review-summary small {
  display: block;
}

.review-summary span {
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.review-summary strong {
  overflow-wrap: anywhere;
  font-size: 14px;
}

.review-summary small {
  overflow: hidden;
  margin-top: 5px;
  color: var(--muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.review-grid article {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  min-height: 92px;
  padding: 14px;
  border: 1px solid var(--green-border);
  border-radius: 8px;
  background: var(--green-soft);
}

.review-grid article.attention {
  border-color: var(--amber-border);
  background: var(--amber-soft);
}

.review-grid article > span {
  color: var(--green);
}

.review-grid article.attention > span {
  color: var(--amber);
}

.review-grid strong {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
}

.review-grid p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.45;
}

@media (max-width: 720px) {
  .review-summary,
  .review-grid {
    grid-template-columns: 1fr;
  }
}
</style>