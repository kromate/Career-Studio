<template>
  <div
    class="builder-paper"
    :class="`template-${templateStyle}`"
    :style="paperStyle"
  >
    <header v-if="hasHeader" class="builder-header">
      <h1 v-if="fullName">{{ fullName }}</h1>
      <p v-if="showTargetRole && targetRoleLine" class="builder-target-role">{{ targetRoleLine }}</p>
      <p v-if="contactLine">{{ contactLine }}</p>
      <p v-if="linkLine">{{ linkLine }}</p>
    </header>

    <div v-if="isBlueprintTemplate" class="builder-content two-column-content">
      <div class="builder-main-column">
        <section v-for="section in primarySections" :key="section.key" :class="sectionClass(section.key)">
          <h2>{{ section.title }}</h2>
          <p v-if="section.text">{{ section.text }}</p>
          <p v-for="group in section.skillGroups" v-else-if="section.skillGroups" :key="group.id">
            <strong v-if="group.title">{{ group.title }}: </strong>{{ group.skills.filter(Boolean).join(', ') }}
          </p>
          <article v-for="entry in section.entries" v-else :key="entry.id" class="builder-entry">
            <div class="entry-heading">
              <strong>{{ entry.title }}</strong>
              <span v-if="entry.date">{{ entry.date }}</span>
            </div>
            <p v-if="entry.subtitle" class="entry-subtitle">{{ entry.subtitle }}</p>
            <ul v-if="entry.bullets.length">
              <li v-for="bullet in entry.bullets" :key="bullet">{{ bullet }}</li>
            </ul>
          </article>
        </section>
      </div>
      <div class="builder-side-column">
        <section v-for="section in secondarySections" :key="section.key" :class="sectionClass(section.key)">
          <h2>{{ section.title }}</h2>
          <p v-if="section.text">{{ section.text }}</p>
          <p v-for="group in section.skillGroups" v-else-if="section.skillGroups" :key="group.id">
            <strong v-if="group.title">{{ group.title }}: </strong>{{ group.skills.filter(Boolean).join(', ') }}
          </p>
          <article v-for="entry in section.entries" v-else :key="entry.id" class="builder-entry">
            <div class="entry-heading">
              <strong>{{ entry.title }}</strong>
              <span v-if="entry.date">{{ entry.date }}</span>
            </div>
            <p v-if="entry.subtitle" class="entry-subtitle">{{ entry.subtitle }}</p>
            <ul v-if="entry.bullets.length">
              <li v-for="bullet in entry.bullets" :key="bullet">{{ bullet }}</li>
            </ul>
          </article>
        </section>
      </div>
    </div>

    <div v-else class="builder-content">
      <section v-for="section in visibleSections" :key="section.key" :class="sectionClass(section.key)">
        <h2>{{ section.title }}</h2>
        <p v-if="section.text">{{ section.text }}</p>
        <p v-for="group in section.skillGroups" v-else-if="section.skillGroups" :key="group.id">
          <strong v-if="group.title">{{ group.title }}: </strong>{{ group.skills.filter(Boolean).join(', ') }}
        </p>
        <article v-for="entry in section.entries" v-else :key="entry.id" class="builder-entry">
          <div class="entry-heading">
            <strong>{{ entry.title }}</strong>
            <span v-if="entry.date">{{ entry.date }}</span>
          </div>
          <p v-if="entry.subtitle" class="entry-subtitle">{{ entry.subtitle }}</p>
          <ul v-if="entry.bullets.length">
            <li v-for="bullet in entry.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditableResumeDocument, ResumeBuilderSectionKey, ResumeSimpleEntry, ResumeSkillGroup } from '@/types'
import { resumeTemplateStyleId } from '@/lib/resume/templates'

interface PreviewEntry {
  id: string
  title: string
  date: string
  subtitle: string
  bullets: string[]
}

interface PreviewSection {
  key: string
  title: string
  text?: string
  entries?: PreviewEntry[]
  skillGroups?: ResumeSkillGroup[]
}

const props = defineProps<{ document: EditableResumeDocument }>()

const fullName = computed(() => `${props.document.profile.firstName} ${props.document.profile.lastName}`.trim())
const targetRoleLine = computed(() => props.document.profile.targetRole.trim())
const contactLine = computed(() => [
  props.document.profile.email,
  props.document.profile.phone,
  props.document.profile.location,
].filter(Boolean).join(' | '))
const linkLine = computed(() => props.document.profile.links.map(link => link.url || link.label).filter(Boolean).join(' | '))
const hasHeader = computed(() => Boolean(fullName.value || targetRoleLine.value || contactLine.value || linkLine.value))
const visibleSkillGroups = computed(() => props.document.skills.filter(group => group.skills.some(Boolean)))
const templateStyle = computed(() => resumeTemplateStyleId(props.document.design.template))
const isBlueprintTemplate = computed(() => templateStyle.value === 'blueprint')
const usesUploadedTemplateTitles = computed(() => ['blueprint', 'coral', 'green', 'mono'].includes(templateStyle.value))
const showTargetRole = computed(() => templateStyle.value === 'green')
const pageDimensions = computed(() => (
  props.document.design.pageSize === 'a4'
    ? { width: 794, height: 1123 }
    : { width: 816, height: 1056 }
))
const paperStyle = computed(() => ({
  '--builder-accent': props.document.design.accentColor,
  '--builder-font-size': `${props.document.design.fontSize}px`,
  '--builder-line-height': String(props.document.design.lineHeight),
  '--builder-margin-y': `${props.document.design.marginY}px`,
  '--builder-margin-x': `${props.document.design.marginX}px`,
  '--builder-page-width': `${pageDimensions.value.width}px`,
  '--builder-page-height': `${pageDimensions.value.height}px`,
  '--builder-page-ratio': `${pageDimensions.value.width} / ${pageDimensions.value.height}`,
  fontFamily: `${props.document.design.fontFamily}, Arial, sans-serif`,
}))
const sectionTitle = (key: ResumeBuilderSectionKey) => {
  const title = props.document.sectionSettings.find(section => section.key === key)?.title || key
  return usesUploadedTemplateTitles.value && key === 'work' ? title.replace(/^Work\s+/i, '') : title
}
const dateRange = (startDate: string, endDate: string, current = false) => {
  if (!startDate && !endDate && !current) return ''
  if (current) return [startDate, 'Present'].filter(Boolean).join(' - ')
  return [startDate, endDate].filter(Boolean).join(' - ')
}
const bullets = (items: Array<{ text: string }>) => items.map(item => item.text.trim()).filter(Boolean)
const simpleSections = computed<Array<{ key: string; title: string; entries: ResumeSimpleEntry[] }>>(() => [
  { key: 'volunteer', title: sectionTitle('volunteer'), entries: props.document.volunteerExperiences },
  { key: 'certifications', title: sectionTitle('certifications'), entries: props.document.certifications },
  { key: 'publications', title: sectionTitle('publications'), entries: props.document.publications },
  { key: 'awards', title: sectionTitle('awards'), entries: props.document.awards },
  ...props.document.customSections.map(section => ({ key: section.id, title: section.title, entries: section.entries })),
].filter(section => section.entries.length))
const simpleEntry = (entry: ResumeSimpleEntry, fallbackTitle: string): PreviewEntry => ({
  id: entry.id,
  title: [entry.title, entry.subtitle].filter(Boolean).join(' - ') || fallbackTitle,
  date: entry.date,
  subtitle: entry.location,
  bullets: bullets(entry.bullets),
})
const visibleSections = computed<PreviewSection[]>(() => {
  const sectionCandidates: Array<PreviewSection | undefined> = [
    props.document.profile.summary.trim()
    ? { key: 'summary', title: 'Summary', text: props.document.profile.summary.trim() }
    : undefined,
    props.document.workExperiences.length
    ? {
        key: 'work',
        title: sectionTitle('work'),
        entries: props.document.workExperiences.map(entry => ({
          id: entry.id,
          title: [entry.jobTitle, entry.employer].filter(Boolean).join(' - ') || 'Untitled role',
          date: entry.hideDates ? '' : dateRange(entry.startDate, entry.endDate, entry.current),
          subtitle: entry.location,
          bullets: bullets(entry.bullets),
        })),
      }
    : undefined,
    props.document.educations.length
    ? {
        key: 'education',
        title: sectionTitle('education'),
        entries: props.document.educations.map(entry => ({
          id: entry.id,
          title: [entry.degree, entry.school].filter(Boolean).join(' - ') || 'Education',
          date: dateRange(entry.startDate, entry.endDate),
          subtitle: entry.location,
          bullets: bullets(entry.details),
        })),
      }
    : undefined,
    visibleSkillGroups.value.length
    ? { key: 'skills', title: sectionTitle('skills'), skillGroups: visibleSkillGroups.value }
    : undefined,
    props.document.projects.length
    ? {
        key: 'projects',
        title: sectionTitle('projects'),
        entries: props.document.projects.map(entry => ({
          id: entry.id,
          title: [entry.name, entry.role].filter(Boolean).join(' - ') || 'Project',
          date: dateRange(entry.startDate, entry.endDate),
          subtitle: entry.url,
          bullets: bullets(entry.bullets),
        })),
      }
    : undefined,
    ...simpleSections.value.map(section => ({
      key: section.key,
      title: section.title,
      entries: section.entries.map(entry => simpleEntry(entry, section.title)),
    })),
  ]
  const sections: PreviewSection[] = sectionCandidates.flatMap(section => section ? [section] : [])
  if (!['coral', 'green', 'mono'].includes(templateStyle.value)) return sections
  const templateOrder = ['summary', 'skills', 'work', 'education', 'projects', 'volunteer', 'certifications', 'publications', 'awards']
  const orderIndex = (key: string) => {
    const index = templateOrder.indexOf(key)
    return index >= 0 ? index : templateOrder.length
  }
  return [...sections].sort((first, second) => orderIndex(first.key) - orderIndex(second.key))
})
const secondaryBlueprintSections = new Set(['skills', 'volunteer', 'certifications', 'publications', 'awards'])
const primarySections = computed(() => visibleSections.value.filter(section => !secondaryBlueprintSections.has(section.key)))
const secondarySections = computed(() => visibleSections.value.filter(section => secondaryBlueprintSections.has(section.key)))
const sectionClass = (key: string) => ['builder-section', `section-${key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`]
</script>

<style scoped>
.builder-paper {
  width: min(100%, var(--builder-page-width, 816px));
  min-height: var(--builder-page-height, 1056px);
  aspect-ratio: var(--builder-page-ratio, 816 / 1056);
  padding: var(--builder-margin-y) var(--builder-margin-x);
  border: 1px solid var(--document-border);
  color: var(--document-ink);
  font-size: var(--builder-font-size);
  line-height: var(--builder-line-height);
  background: var(--document-surface);
  box-shadow: 0 18px 50px rgba(35, 27, 61, 0.1);
}

.builder-header {
  margin-bottom: 18px;
  text-align: center;
}

.builder-header h1 {
  margin: 0 0 6px;
  color: var(--builder-accent);
  font-size: 2em;
  letter-spacing: 0;
}

.builder-header p,
.builder-section p {
  margin: 0 0 7px;
}

.builder-target-role {
  display: none;
}

.builder-content {
  display: block;
}

.builder-section {
  margin-top: 16px;
}

.builder-section h2 {
  margin: 0 0 8px;
  padding-bottom: 4px;
  border-bottom: 1.5px solid var(--builder-accent);
  color: var(--builder-accent);
  font-size: 1.08em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.builder-entry {
  margin-bottom: 10px;
}

.entry-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.entry-heading strong {
  font-weight: 800;
}

.entry-heading span,
.entry-subtitle {
  color: var(--document-muted);
}

.entry-subtitle {
  margin: 2px 0 5px;
}

ul {
  display: grid;
  gap: 3px;
  margin: 5px 0 0;
  padding-left: 18px;
}

.template-compact .builder-section {
  margin-top: 11px;
}

.template-compact ul {
  gap: 1px;
}

.template-blueprint {
  color: #3d3b46;
}

.template-blueprint .builder-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 230px;
  align-items: start;
  column-gap: 64px;
  margin-bottom: 42px;
  text-align: left;
}

.template-blueprint .builder-header h1 {
  grid-row: 1 / span 3;
  color: #000000;
  font-size: 3.3em;
  line-height: 1;
}

.template-blueprint .builder-header p {
  grid-column: 2;
  margin-bottom: 2px;
  color: #000000;
  font-family: Arial, sans-serif;
  font-size: 0.82em;
  font-weight: 700;
  line-height: 1.3;
}

.template-blueprint .two-column-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 230px;
  column-gap: 64px;
  align-items: start;
}

.template-blueprint .builder-section {
  margin-top: 0;
  margin-bottom: 32px;
}

.template-blueprint .builder-section h2,
.template-coral .builder-section h2,
.template-green .builder-section h2,
.template-mono .builder-section h2 {
  border-bottom: 0;
}

.template-blueprint .builder-section h2 {
  margin-bottom: 20px;
  padding-bottom: 0;
  font-family: Arial, sans-serif;
  font-size: 0.9em;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.template-blueprint .builder-entry {
  margin-bottom: 26px;
}

.template-blueprint .entry-heading {
  display: block;
}

.template-blueprint .entry-heading strong {
  color: #000000;
  font-size: 1.12em;
}

.template-blueprint .entry-heading span,
.template-blueprint .entry-subtitle {
  display: block;
  margin-top: 8px;
  color: #6d6a75;
  font-family: Arial, sans-serif;
  font-size: 0.78em;
  text-transform: uppercase;
}

.template-coral {
  color: #000000;
}

.template-coral .builder-header {
  margin-bottom: 28px;
  text-align: left;
}

.template-coral .builder-header::before {
  display: block;
  color: var(--builder-accent);
  content: 'Hello';
  font-size: 1.45em;
  font-weight: 800;
  line-height: 1.1;
}

.template-coral .builder-header h1 {
  color: #000000;
  font-size: 1.25em;
}

.template-coral .builder-header h1::before {
  content: "I'm ";
}

.template-coral .builder-header p {
  color: #000000;
  font-family: Arial, sans-serif;
  font-size: 0.85em;
  font-weight: 700;
  text-transform: uppercase;
}

.template-coral .builder-section {
  margin-top: 24px;
}

.template-coral .builder-section h2 {
  padding-bottom: 0;
  font-size: 1.5em;
  letter-spacing: 0;
  text-transform: none;
}

.template-coral .entry-heading {
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 4px;
}

.template-coral .entry-heading span {
  color: #707070;
  font-family: Arial, sans-serif;
  font-size: 0.82em;
  text-transform: uppercase;
}

.template-coral ul,
.template-green ul {
  padding-left: 28px;
}

.template-green {
  color: #000000;
}

.template-green .builder-header {
  margin-bottom: 28px;
  text-align: left;
}

.template-green .builder-header h1 {
  color: #3c3d4a;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 2.9em;
  font-weight: 400;
}

.template-green .builder-target-role {
  display: block;
  margin-bottom: 4px;
  color: var(--builder-accent);
  font-family: Helvetica, Arial, sans-serif;
  font-size: 1.55em;
}

.template-green .builder-header p:not(.builder-target-role) {
  color: #666666;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 0.94em;
  line-height: 1.18;
}

.template-green .builder-section {
  margin-top: 28px;
}

.template-green .builder-section h2 {
  padding-bottom: 0;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 1.35em;
  font-weight: 800;
  letter-spacing: 0;
}

.template-green .entry-heading {
  display: block;
}

.template-green .entry-heading strong {
  color: #3c3d4a;
  font-family: Helvetica, Arial, sans-serif;
}

.template-green .entry-heading span {
  display: block;
  margin-top: 4px;
  color: #666666;
  font-size: 0.85em;
  text-transform: uppercase;
}

.template-mono {
  color: #585858;
}

.template-mono .builder-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 38px;
  text-align: left;
}

.template-mono .builder-header h1 {
  order: 2;
  width: 100%;
  margin-top: 26px;
  padding-bottom: 12px;
  border-bottom: 4px solid #4a4a4a;
  color: #4a4a4a;
  font-family: 'Courier New', Courier, monospace;
  font-size: 3em;
  line-height: 1;
  text-transform: uppercase;
}

.template-mono .builder-header p {
  order: 1;
  margin-bottom: 4px;
  color: #8a8a8a;
  font-size: 0.85em;
  text-transform: uppercase;
}

.template-mono .builder-section {
  margin-top: 26px;
}

.template-mono .builder-section h2 {
  padding-bottom: 0;
  color: #4a4a4a;
  font-size: 1.35em;
  font-weight: 700;
  letter-spacing: 0;
}

.template-mono .entry-heading {
  display: block;
}

.template-mono .entry-heading strong {
  color: var(--builder-accent);
}

.template-mono .entry-heading span {
  display: block;
  margin-top: 6px;
  color: #696969;
  font-size: 0.85em;
  text-transform: uppercase;
}

.template-mono ul {
  padding-left: 28px;
}

@media (max-width: 760px) {
  .builder-paper {
    min-height: auto;
  }
}
</style>
