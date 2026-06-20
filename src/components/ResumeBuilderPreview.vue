<template>
  <div
    class="builder-paper"
    :class="`template-${document.design.template}`"
    :style="paperStyle"
  >
    <header v-if="hasHeader" class="builder-header">
      <h1 v-if="fullName">{{ fullName }}</h1>
      <p v-if="contactLine">{{ contactLine }}</p>
      <p v-if="linkLine">{{ linkLine }}</p>
    </header>

    <section v-if="document.profile.summary" class="builder-section">
      <h2>Summary</h2>
      <p>{{ document.profile.summary }}</p>
    </section>

    <section v-if="document.workExperiences.length" class="builder-section">
      <h2>{{ sectionTitle('work') }}</h2>
      <article v-for="entry in document.workExperiences" :key="entry.id" class="builder-entry">
        <div class="entry-heading">
          <strong>{{ [entry.jobTitle, entry.employer].filter(Boolean).join(' - ') || 'Untitled role' }}</strong>
          <span v-if="!entry.hideDates">{{ dateRange(entry.startDate, entry.endDate, entry.current) }}</span>
        </div>
        <p v-if="entry.location" class="entry-subtitle">{{ entry.location }}</p>
        <ul v-if="entry.bullets.some(bullet => bullet.text.trim())">
          <li v-for="bullet in entry.bullets.filter(item => item.text.trim())" :key="bullet.id">{{ bullet.text }}</li>
        </ul>
      </article>
    </section>

    <section v-if="document.educations.length" class="builder-section">
      <h2>{{ sectionTitle('education') }}</h2>
      <article v-for="entry in document.educations" :key="entry.id" class="builder-entry">
        <div class="entry-heading">
          <strong>{{ [entry.degree, entry.school].filter(Boolean).join(' - ') || 'Education' }}</strong>
          <span>{{ dateRange(entry.startDate, entry.endDate) }}</span>
        </div>
        <p v-if="entry.location" class="entry-subtitle">{{ entry.location }}</p>
        <ul v-if="entry.details.some(bullet => bullet.text.trim())">
          <li v-for="bullet in entry.details.filter(item => item.text.trim())" :key="bullet.id">{{ bullet.text }}</li>
        </ul>
      </article>
    </section>

    <section v-if="document.skills.length" class="builder-section">
      <h2>{{ sectionTitle('skills') }}</h2>
      <p v-for="group in visibleSkillGroups" :key="group.id">
        <strong v-if="group.title">{{ group.title }}: </strong>{{ group.skills.filter(Boolean).join(', ') }}
      </p>
    </section>

    <section v-if="document.projects.length" class="builder-section">
      <h2>{{ sectionTitle('projects') }}</h2>
      <article v-for="entry in document.projects" :key="entry.id" class="builder-entry">
        <div class="entry-heading">
          <strong>{{ [entry.name, entry.role].filter(Boolean).join(' - ') || 'Project' }}</strong>
          <span>{{ dateRange(entry.startDate, entry.endDate) }}</span>
        </div>
        <p v-if="entry.url" class="entry-subtitle">{{ entry.url }}</p>
        <ul v-if="entry.bullets.some(bullet => bullet.text.trim())">
          <li v-for="bullet in entry.bullets.filter(item => item.text.trim())" :key="bullet.id">{{ bullet.text }}</li>
        </ul>
      </article>
    </section>

    <section
      v-for="section in simpleSections"
      :key="section.key"
      class="builder-section"
    >
      <h2>{{ section.title }}</h2>
      <article v-for="entry in section.entries" :key="entry.id" class="builder-entry">
        <div class="entry-heading">
          <strong>{{ [entry.title, entry.subtitle].filter(Boolean).join(' - ') || section.title }}</strong>
          <span>{{ entry.date }}</span>
        </div>
        <p v-if="entry.location" class="entry-subtitle">{{ entry.location }}</p>
        <ul v-if="entry.bullets.some(bullet => bullet.text.trim())">
          <li v-for="bullet in entry.bullets.filter(item => item.text.trim())" :key="bullet.id">{{ bullet.text }}</li>
        </ul>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { EditableResumeDocument, ResumeBuilderSectionKey, ResumeSimpleEntry } from '@/types'

const props = defineProps<{ document: EditableResumeDocument }>()

const fullName = computed(() => `${props.document.profile.firstName} ${props.document.profile.lastName}`.trim())
const contactLine = computed(() => [
  props.document.profile.email,
  props.document.profile.phone,
  props.document.profile.location,
].filter(Boolean).join(' | '))
const linkLine = computed(() => props.document.profile.links.map(link => link.url || link.label).filter(Boolean).join(' | '))
const hasHeader = computed(() => Boolean(fullName.value || contactLine.value || linkLine.value))
const visibleSkillGroups = computed(() => props.document.skills.filter(group => group.skills.some(Boolean)))
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
const sectionTitle = (key: ResumeBuilderSectionKey) => (
  props.document.sectionSettings.find(section => section.key === key)?.title || key
)
const dateRange = (startDate: string, endDate: string, current = false) => {
  if (!startDate && !endDate && !current) return ''
  if (current) return [startDate, 'Present'].filter(Boolean).join(' - ')
  return [startDate, endDate].filter(Boolean).join(' - ')
}
const simpleSections = computed<Array<{ key: string; title: string; entries: ResumeSimpleEntry[] }>>(() => [
  { key: 'volunteer', title: sectionTitle('volunteer'), entries: props.document.volunteerExperiences },
  { key: 'certifications', title: sectionTitle('certifications'), entries: props.document.certifications },
  { key: 'publications', title: sectionTitle('publications'), entries: props.document.publications },
  { key: 'awards', title: sectionTitle('awards'), entries: props.document.awards },
  ...props.document.customSections.map(section => ({ key: section.id, title: section.title, entries: section.entries })),
].filter(section => section.entries.length))
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

@media (max-width: 760px) {
  .builder-paper {
    min-height: auto;
  }
}
</style>
