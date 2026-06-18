<template>
  <DetailPageSkeleton v-if="!resume || !document || !version" />
  <div v-else class="builder-page">
    <header class="builder-topbar">
      <button class="score-pill" type="button" @click="activeTab = 'analysis'">
        <strong>{{ version.analysis.score ?? 0 }}</strong>
        <span>Score<br>{{ scoreLabel }}</span>
      </button>
      <nav class="builder-tabs" aria-label="Resume builder tabs">
        <button :class="{ active: activeTab === 'content' }" type="button" @click="activeTab = 'content'">Content</button>
        <button :class="{ active: activeTab === 'design' }" type="button" @click="activeTab = 'design'">Design</button>
        <button :class="{ active: activeTab === 'analysis' }" type="button" @click="activeTab = 'analysis'">Analysis</button>
      </nav>
      <div class="builder-actions">
        <span class="saved-pill"><Check :size="14" /> Saved just now</span>
        <span class="ai-pill"><Sparkles :size="14" /> 20 AI</span>
        <button class="btn btn-primary btn-sm" type="button" @click="exportPdf">
          <Download :size="14" />
          Export PDF
        </button>
      </div>
    </header>

    <main class="builder-workspace">
      <section class="builder-left">
        <template v-if="activeTab === 'content'">
          <div v-if="!activeSection" class="section-list">
            <article v-for="section in sectionRows" :key="section.id" class="section-row-wrap">
              <div
                class="section-row"
                role="button"
                tabindex="0"
                @click="openSection(section.key)"
                @keydown.enter.prevent="openSection(section.key)"
                @keydown.space.prevent="openSection(section.key)"
              >
                <GripVertical :size="15" />
                <component :is="section.icon" :size="15" />
                <span>{{ section.title }}</span>
                <strong :class="section.statusTone">{{ section.status }}</strong>
                <button v-if="section.ai" class="mini-ai" type="button" title="AI suggestions" @click.stop>
                  <Sparkles :size="13" />
                </button>
                <button
                  v-if="section.actions"
                  class="section-menu-trigger"
                  type="button"
                  :aria-label="`Section actions for ${section.title}`"
                  @click.stop="menuOpenFor = menuOpenFor === section.id ? '' : section.id"
                >
                  <MoreHorizontal :size="15" />
                </button>
              </div>
              <div v-if="menuOpenFor === section.id" class="section-menu">
                <button type="button" @click="startRename(section.id, section.key)">Rename section</button>
                <button type="button" @click="hideSection(section.id, section.key)">Remove section</button>
              </div>
            </article>
            <div v-if="addingSection" class="add-section-inline">
              <input
                v-model.trim="newSectionName"
                class="input"
                placeholder="Section name, then press Enter"
                @keydown.enter="confirmAddSection"
                @keydown.escape="addingSection = false"
              >
            </div>
            <button v-else class="add-section-button" type="button" @click="addingSection = true">
              <Plus :size="15" />
              Add Section
            </button>
          </div>

          <div v-else-if="activeSection === 'profile'" class="drill-panel">
            <header class="drill-header">
              <button class="icon-btn" type="button" aria-label="Back to all sections" @click="activeSection = ''">
                <span>&lt;</span>
              </button>
              <h2>Personal Information</h2>
            </header>
            <section class="editor-block">
              <div class="block-heading"><strong>Tailoring</strong><small>Tunes every AI suggestion</small></div>
              <div class="field-grid two">
                <label class="field">
                  <span class="field-label">Target Role</span>
                  <input class="input" :value="document.profile.targetRole" placeholder="e.g. Senior Software Engineer" @input="updateProfile('targetRole', inputValue($event))">
                </label>
                <div class="field">
                  <span class="field-label">Experience Level</span>
                  <div class="compact-segments">
                    <button v-for="level in experienceLevels" :key="level.value" type="button" :class="{ active: document.profile.experienceLevel === level.value }" @click="updateProfile('experienceLevel', level.value)">{{ level.label }}</button>
                  </div>
                </div>
              </div>
            </section>
            <section class="editor-block">
              <div class="block-heading"><strong>Contact details</strong><small>Used in the resume header</small></div>
              <div class="field-grid two">
                <label class="field"><span class="field-label">First Name</span><input class="input" :value="document.profile.firstName" placeholder="John" @input="updateProfile('firstName', inputValue($event))"></label>
                <label class="field"><span class="field-label">Last Name</span><input class="input" :value="document.profile.lastName" placeholder="Doe" @input="updateProfile('lastName', inputValue($event))"></label>
              </div>
              <label class="field"><span class="field-label">Email</span><input class="input" type="email" :value="document.profile.email" placeholder="john.doe@example.com" @input="updateProfile('email', inputValue($event))"></label>
              <label class="field"><span class="field-label">Phone Number</span><input class="input" :value="document.profile.phone" placeholder="(123) 456-7890" @input="updateProfile('phone', inputValue($event))"></label>
              <label class="field"><span class="field-label">Location</span><input class="input" :value="document.profile.location" placeholder="City, State / Country" @input="updateProfile('location', inputValue($event))"></label>
            </section>
            <section class="editor-block">
              <div class="block-heading"><strong>Links</strong><small>Optional</small></div>
              <button class="ghost-row" type="button" @click="addProfileLink">+ Add link</button>
              <div v-for="link in document.profile.links" :key="link.id" class="field-grid two">
                <input class="input" :value="link.label" placeholder="Label" @input="updateProfileLink(link.id, 'label', inputValue($event))">
                <input class="input" :value="link.url" placeholder="https://..." @input="updateProfileLink(link.id, 'url', inputValue($event))">
              </div>
            </section>
            <section class="editor-block">
              <div class="block-heading"><strong>Professional summary</strong><small>2-4 sentences</small></div>
              <textarea class="textarea" :value="document.profile.summary" placeholder="Write a short, focused summary of your experience and what you're looking for..." @input="updateProfile('summary', inputValue($event))" />
              <button class="btn btn-secondary btn-sm" type="button"><Wand2 :size="14" /> Generate</button>
            </section>
          </div>

          <div v-else-if="activeSection === 'work'" class="drill-panel">
            <header class="drill-header">
              <button class="icon-btn" type="button" aria-label="Back to all sections" @click="activeSection = ''">
                <span>&lt;</span>
              </button>
              <h2>Work Experience</h2>
              <button class="btn btn-secondary btn-sm" type="button" @click="addExperience"><Plus :size="14" /> Add Experience</button>
            </header>
            <div v-if="!activeExperience" class="empty-editor-state">
              <BriefcaseBusiness :size="28" />
              <strong>No work experience yet</strong>
              <p>Add your first role to start scoring this section. Internships, freelance, and open-source count.</p>
              <button class="btn btn-secondary" type="button" @click="addExperience"><Plus :size="15" /> Add Experience</button>
            </div>
            <section v-else class="editor-block">
              <div class="block-heading"><strong>{{ activeExperience.jobTitle || 'New experience' }}</strong><small>{{ activeExperience.employer || 'Adding a new role' }}</small></div>
              <label class="field"><span class="field-label">Job Title</span><input class="input" :value="activeExperience.jobTitle" placeholder="Software Developer" @input="updateExperience(activeExperience.id, 'jobTitle', inputValue($event))"></label>
              <label class="field"><span class="field-label">Employer</span><input class="input" :value="activeExperience.employer" placeholder="ABC Corp" @input="updateExperience(activeExperience.id, 'employer', inputValue($event))"></label>
              <label class="field"><span class="field-label">Location</span><input class="input" :value="activeExperience.location" placeholder="New York, NY" @input="updateExperience(activeExperience.id, 'location', inputValue($event))"></label>
              <div class="field-grid two">
                <label class="field"><span class="field-label">Start Date</span><input class="input" :value="activeExperience.startDate" placeholder="MM/YYYY" @input="updateExperience(activeExperience.id, 'startDate', inputValue($event))"></label>
                <label class="field"><span class="field-label">End Date</span><input class="input" :value="activeExperience.endDate" placeholder="MM/YYYY" :disabled="activeExperience.current" @input="updateExperience(activeExperience.id, 'endDate', inputValue($event))"></label>
              </div>
              <label class="toggle-row"><input type="checkbox" :checked="activeExperience.current" @change="updateExperience(activeExperience.id, 'current', checkedValue($event))"> Currently working here</label>
              <label class="toggle-row"><input type="checkbox" :checked="activeExperience.hideDates" @change="updateExperience(activeExperience.id, 'hideDates', checkedValue($event))"> Hide dates for this role</label>
              <button class="btn btn-ghost btn-sm" type="button" @click="activeTab = 'design'">Change Date Format</button>
              <div class="achievements-head"><div><h3>Achievements</h3><p>Lead with an action verb; include a number when you can.</p></div><span>{{ activeExperience.bullets.length }} bullets</span></div>
              <p v-if="!activeExperience.bullets.length" class="muted-copy">No bullets yet. Add one manually or let AI suggest a starter set.</p>
              <div v-for="(bullet, index) in activeExperience.bullets" :key="bullet.id" class="bullet-editor-row">
                <span>{{ index + 1 }}</span>
                <textarea class="textarea" :value="bullet.text" placeholder="Describe your achievement - quantify the impact when you can" @input="updateExperienceBullet(activeExperience.id, bullet.id, inputValue($event))" />
                <button class="mini-ai" type="button" title="Improve achievement with AI"><Sparkles :size="13" /></button>
              </div>
              <div class="inline-actions"><button class="btn btn-secondary btn-sm" type="button" @click="addExperienceBullet(activeExperience.id)"><Plus :size="14" /> Add Achievement</button><button class="btn btn-secondary btn-sm" type="button" :disabled="!activeExperience.jobTitle && !activeExperience.employer"><Sparkles :size="14" /> AI Suggestions</button></div>
            </section>
          </div>

          <div v-else class="drill-panel">
            <header class="drill-header">
              <button class="icon-btn" type="button" aria-label="Back to all sections" @click="activeSection = ''">
                <span>&lt;</span>
              </button>
              <h2>{{ activeSectionTitle }}</h2>
            </header>
            <div class="empty-editor-state">
              <FileText :size="28" />
              <strong>{{ activeSectionTitle }} is ready</strong>
              <p>Add entries here as your resume grows. This phase includes the section shell and optional-entry support.</p>
              <button class="btn btn-secondary" type="button" @click="addGenericEntry"><Plus :size="15" /> Add Entry</button>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'design'">
          <div class="design-panel">
            <section class="editor-block">
              <div class="block-heading"><strong>Layout</strong><small>Template, page size, and margins</small></div>
              <div class="field-grid two">
                <label class="field"><span class="field-label">Template</span><select class="select" :value="document.design.template" @change="updateDesign('template', inputValue($event))"><option value="classic">Classic</option><option value="compact">Compact</option></select></label>
                <label class="field"><span class="field-label">Page Size</span><select class="select" :value="document.design.pageSize" @change="updateDesign('pageSize', inputValue($event))"><option value="letter">Letter</option><option value="a4">A4</option></select></label>
              </div>
              <label class="field"><span class="field-label">Top & Bottom Margin {{ document.design.marginY }}pt</span><input type="range" min="24" max="72" :value="document.design.marginY" @input="updateDesign('marginY', numberValue($event))"></label>
              <label class="field"><span class="field-label">Side Margins {{ document.design.marginX }}pt</span><input type="range" min="24" max="72" :value="document.design.marginX" @input="updateDesign('marginX', numberValue($event))"></label>
            </section>
            <section class="editor-block">
              <div class="block-heading"><strong>Font & format settings</strong><small>Typography, accent color, and date style</small></div>
              <div class="field-grid two">
                <label class="field"><span class="field-label">Font Family</span><select class="select" :value="document.design.fontFamily" @change="updateDesign('fontFamily', inputValue($event))"><option>Roboto</option><option>Arial</option><option>Georgia</option><option>Helvetica</option></select></label>
                <label class="field"><span class="field-label">Font Size</span><input class="input" type="number" min="8" max="13" :value="document.design.fontSize" @input="updateDesign('fontSize', numberValue($event))"></label>
              </div>
              <label class="field"><span class="field-label">Line Height {{ document.design.lineHeight }}x</span><input type="range" min="1.1" max="1.7" step="0.05" :value="document.design.lineHeight" @input="updateDesign('lineHeight', numberValue($event))"></label>
              <div class="field"><span class="field-label">Accent Color</span><div class="swatches"><button v-for="color in accentColors" :key="color" type="button" :style="{ background: color }" :class="{ active: document.design.accentColor === color }" :aria-label="`Select ${color} accent color`" @click="updateDesign('accentColor', color)" /></div></div>
              <label class="field"><span class="field-label">Date Format</span><select class="select" :value="document.design.dateFormat" @change="updateDesign('dateFormat', inputValue($event))"><option>MM/YYYY</option><option>MMM YYYY</option><option>YYYY</option></select></label>
            </section>
          </div>
        </template>

        <template v-else>
          <div class="analysis-panel">
            <section class="analysis-score"><strong>{{ version.analysis.score }}</strong><span>OF 100</span><p>+{{ recoverablePoints }} pts recoverable</p><small>{{ findings.length }} suggestions · {{ scoreLabel }}</small></section>
            <section class="breakdown-list"><h3>Score breakdown</h3><button v-for="dimension in version.analysis.dimensions" :key="dimension.id" type="button"><span>{{ dimension.label }}</span><strong>{{ dimension.score }}/{{ dimension.maxScore }}</strong></button></section>
            <section class="suggestion-list"><article v-for="finding in findings" :key="finding.ruleId" class="suggestion-card"><span>{{ finding.dimension }}</span><h3>{{ finding.title }}</h3><strong>+{{ Math.round(finding.maxPoints - finding.earnedPoints) }} pt</strong><p>{{ finding.recommendation }}</p><button class="btn btn-secondary btn-sm" type="button" @click="openSectionFromFinding(finding.dimension)">Open in editor</button></article></section>
          </div>
        </template>
      </section>

      <section class="builder-preview-pane">
        <ResumeBuilderPreview :document="document" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type {
  EditableResumeDocument,
  ResumeBuilderSectionKey,
  ResumeBuilderSectionSetting,
  ResumeDesignSettings,
  ResumeExperienceEntry,
  ResumeExperienceLevel,
  ResumeProfileSection,
  ScoreDimension,
} from '@/types'
import {
  BookOpen,
  BriefcaseBusiness,
  Check,
  Download,
  FileText,
  GripVertical,
  GraduationCap,
  HeartHandshake,
  Medal,
  MoreHorizontal,
  Plus,
  ScrollText,
  Sparkles,
  Trophy,
  UserRound,
  Wand2,
} from 'lucide-vue-next'
import { createEmptyBullet, createEmptyExperience, createEmptySimpleEntry } from '@/lib/resume/builder'
import { exportResumePdf } from '@/lib/export/resume'
import { getPrioritizedFindings } from '@/lib/resume/scoring'

definePageMeta({ layout: 'app', middleware: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const toast = useToast()
const activeTab = ref<'content' | 'design' | 'analysis'>('content')
const activeSection = ref<ResumeBuilderSectionKey | string>('')
const activeExperienceId = ref('')
const menuOpenFor = ref('')
const addingSection = ref(false)
const newSectionName = ref('')
const accentColors = ['#16a085', '#27ae60', '#2980b9', '#8e44ad', '#e74c3c', '#f39c12', '#d35400', '#000000']
const experienceLevels: Array<{ value: ResumeExperienceLevel; label: string }> = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
]
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
const sectionIcons: Record<string, Component> = {
  profile: UserRound,
  work: BriefcaseBusiness,
  education: GraduationCap,
  skills: Sparkles,
  projects: FileText,
  volunteer: HeartHandshake,
  certifications: Medal,
  publications: ScrollText,
  awards: Trophy,
  custom: BookOpen,
}
const activeExperience = computed(() => document.value?.workExperiences.find(entry => entry.id === activeExperienceId.value) || document.value?.workExperiences[0])
const activeSectionTitle = computed(() => {
  if (!document.value) return 'Section'
  return document.value.sectionSettings.find(section => section.key === activeSection.value)?.title
    || document.value.customSections.find(section => section.id === activeSection.value)?.title
    || 'Section'
})
const sectionRows = computed(() => {
  if (!document.value) return []
  const baseRows = document.value.sectionSettings
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order)
    .map(section => ({ id: section.key, key: section.key, title: section.title, optional: section.optional }))
  const customRows = document.value.customSections.map(section => ({ id: section.id, key: section.id, title: section.title, optional: true }))
  return [...baseRows, ...customRows].map((section) => {
    const status = sectionStatus(section.key, section.optional)
    return {
      ...section,
      icon: sectionIcons[section.key] || BookOpen,
      status,
      statusTone: status.includes('Needs') ? 'status-warn' : status.includes('Optional') ? 'status-muted' : 'status-good',
      ai: ['profile', 'work', 'education', 'skills'].includes(section.key),
      actions: section.key !== 'profile',
    }
  })
})

onMounted(() => {
  workspace.hydrate()
  if (!resume.value) navigateTo('/app/resumes')
})

const inputValue = (event: Event) => (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
const numberValue = (event: Event) => Number(inputValue(event))
const checkedValue = (event: Event) => (event.target as HTMLInputElement).checked
const saveDocument = (nextDocument: EditableResumeDocument) => {
  if (!resume.value) return
  workspace.updateBuilderDocument(resume.value.id, () => nextDocument)
}
const sectionStatus = (key: string, optional = false) => {
  if (!document.value) return optional ? 'Optional · empty' : 'Needs entries'
  if (key === 'profile') return document.value.profile.firstName || document.value.profile.summary ? '1 info' : 'Needs entries'
  if (key === 'work') return document.value.workExperiences.length ? `${document.value.workExperiences.length} role${document.value.workExperiences.length === 1 ? '' : 's'}` : 'Needs entries'
  if (key === 'education') return document.value.educations.length ? `${document.value.educations.length} school${document.value.educations.length === 1 ? '' : 's'}` : 'Needs entries'
  if (key === 'skills') return document.value.skills.length ? `${document.value.skills.length} group${document.value.skills.length === 1 ? '' : 's'}` : 'Needs entries'
  const counts: Record<string, number> = {
    projects: document.value.projects.length,
    volunteer: document.value.volunteerExperiences.length,
    certifications: document.value.certifications.length,
    publications: document.value.publications.length,
    awards: document.value.awards.length,
  }
  const customCount = document.value.customSections.find(section => section.id === key)?.entries.length || 0
  const count = counts[key] || customCount
  return count ? `${count} entry${count === 1 ? '' : 'ies'}` : 'Optional · empty'
}
const openSection = (key: string) => {
  activeSection.value = key
  menuOpenFor.value = ''
  if (key === 'work' && document.value?.workExperiences[0]) activeExperienceId.value = document.value.workExperiences[0].id
}
const updateProfile = <Key extends keyof ResumeProfileSection>(key: Key, value: ResumeProfileSection[Key]) => {
  if (!document.value) return
  saveDocument({ ...document.value, profile: { ...document.value.profile, [key]: value } })
}
const addProfileLink = () => {
  if (!document.value) return
  saveDocument({
    ...document.value,
    profile: {
      ...document.value.profile,
      links: [...document.value.profile.links, { id: `link-${Date.now()}`, label: '', url: '' }],
    },
  })
}
const updateProfileLink = (id: string, key: 'label' | 'url', value: string) => {
  if (!document.value) return
  saveDocument({
    ...document.value,
    profile: {
      ...document.value.profile,
      links: document.value.profile.links.map(link => link.id === id ? { ...link, [key]: value } : link),
    },
  })
}
const addExperience = () => {
  if (!document.value) return
  const entry = createEmptyExperience()
  activeExperienceId.value = entry.id
  saveDocument({ ...document.value, workExperiences: [...document.value.workExperiences, entry] })
}
const updateExperience = <Key extends keyof ResumeExperienceEntry>(id: string, key: Key, value: ResumeExperienceEntry[Key]) => {
  if (!document.value) return
  saveDocument({
    ...document.value,
    workExperiences: document.value.workExperiences.map(entry => entry.id === id ? { ...entry, [key]: value } : entry),
  })
}
const addExperienceBullet = (id: string) => {
  if (!document.value) return
  saveDocument({
    ...document.value,
    workExperiences: document.value.workExperiences.map(entry => entry.id === id ? { ...entry, bullets: [...entry.bullets, createEmptyBullet()] } : entry),
  })
}
const updateExperienceBullet = (entryId: string, bulletId: string, text: string) => {
  if (!document.value) return
  saveDocument({
    ...document.value,
    workExperiences: document.value.workExperiences.map(entry => entry.id === entryId
      ? { ...entry, bullets: entry.bullets.map(bullet => bullet.id === bulletId ? { ...bullet, text } : bullet) }
      : entry),
  })
}
const updateDesign = (key: keyof ResumeDesignSettings, value: string | number) => {
  if (!document.value) return
  saveDocument({
    ...document.value,
    design: { ...document.value.design, [key]: value } as ResumeDesignSettings,
  })
}
const startRename = (id: string, key: string) => {
  if (!document.value) return
  const name = window.prompt('Section name')
  if (!name?.trim()) return
  if (document.value.customSections.some(section => section.id === id)) {
    saveDocument({ ...document.value, customSections: document.value.customSections.map(section => section.id === id ? { ...section, title: name.trim() } : section) })
    return
  }
  saveDocument({ ...document.value, sectionSettings: document.value.sectionSettings.map(section => section.key === key ? { ...section, title: name.trim() } : section) })
  menuOpenFor.value = ''
}
const hideSection = (id: string, key: string) => {
  if (!document.value) return
  if (document.value.customSections.some(section => section.id === id)) {
    saveDocument({ ...document.value, customSections: document.value.customSections.filter(section => section.id !== id) })
    return
  }
  saveDocument({ ...document.value, sectionSettings: document.value.sectionSettings.map(section => section.key === key ? { ...section, visible: false } : section) })
  menuOpenFor.value = ''
}
const confirmAddSection = () => {
  if (!document.value || !newSectionName.value.trim()) return
  saveDocument({
    ...document.value,
    customSections: [...document.value.customSections, { id: `custom-${Date.now()}`, title: newSectionName.value.trim(), entries: [] }],
  })
  newSectionName.value = ''
  addingSection.value = false
}
const addGenericEntry = () => {
  if (!document.value) return
  const entry = createEmptySimpleEntry(String(activeSection.value))
  if (activeSection.value === 'certifications') saveDocument({ ...document.value, certifications: [...document.value.certifications, entry] })
  else if (activeSection.value === 'publications') saveDocument({ ...document.value, publications: [...document.value.publications, entry] })
  else if (activeSection.value === 'awards') saveDocument({ ...document.value, awards: [...document.value.awards, entry] })
  else if (activeSection.value === 'volunteer') saveDocument({ ...document.value, volunteerExperiences: [...document.value.volunteerExperiences, entry] })
  else if (document.value.customSections.some(section => section.id === activeSection.value)) {
    saveDocument({ ...document.value, customSections: document.value.customSections.map(section => section.id === activeSection.value ? { ...section, entries: [...section.entries, entry] } : section) })
  }
}
const openSectionFromFinding = (dimension: ScoreDimension) => {
  activeTab.value = 'content'
  activeSection.value = dimension === 'completeness' || dimension === 'parseability' ? 'profile' : 'work'
}
const exportPdf = async () => {
  if (!resume.value || !version.value) return
  await exportResumePdf(version.value.parsed, resume.value.name)
  toast.show('PDF exported')
}
</script>

<style scoped>
.builder-page {
  min-height: calc(100vh - 64px);
  overflow: hidden;
  background: var(--surface-warm);
}

.builder-topbar {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 18px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--line);
  background: var(--card-bg);
}

.score-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 10px 5px 5px;
  background: var(--control-bg);
  cursor: pointer;
}

.score-pill strong {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  color: var(--ink);
  font-size: 12px;
  background: var(--surface-soft);
}

.score-pill span {
  color: var(--muted);
  font-size: 9px;
  font-weight: 800;
  line-height: 1.1;
  text-transform: uppercase;
}

.builder-tabs,
.builder-actions,
.saved-pill,
.ai-pill,
.drill-header,
.inline-actions,
.achievements-head {
  display: flex;
  align-items: center;
}

.builder-tabs { gap: 4px; }
.builder-actions { gap: 9px; margin-left: auto; }
.inline-actions { flex-wrap: wrap; gap: 8px; }
.drill-header { gap: 10px; }
.achievements-head { justify-content: space-between; gap: 12px; }

.builder-tabs button {
  min-height: 34px;
  padding: 8px 14px;
  border: 0;
  border-radius: 10px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  background: transparent;
  cursor: pointer;
}

.builder-tabs button.active {
  color: var(--purple);
  background: var(--purple-soft);
}

.saved-pill,
.ai-pill {
  gap: 6px;
  padding: 8px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 750;
  background: var(--control-bg);
}

.saved-pill { color: var(--green); }
.ai-pill { color: var(--purple); }

.builder-workspace {
  display: grid;
  grid-template-columns: minmax(380px, 40%) 1fr;
  height: calc(100vh - 128px);
  gap: 20px;
  padding: 16px 22px 22px;
}

.builder-left,
.builder-preview-pane {
  min-height: 0;
  overflow: auto;
}

.builder-preview-pane {
  display: grid;
  place-items: start center;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card-bg);
}

.section-list,
.drill-panel,
.design-panel,
.analysis-panel,
.suggestion-list,
.breakdown-list {
  display: grid;
  gap: 9px;
}

.section-row-wrap {
  position: relative;
}

.section-row {
  display: grid;
  width: 100%;
  grid-template-columns: auto auto 1fr auto auto auto;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 9px;
  text-align: left;
  background: var(--card-bg);
  cursor: pointer;
}

.section-row:hover {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-sm);
}

.section-row span {
  font-size: 13px;
  font-weight: 700;
}

.section-row strong {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
}

.status-good { color: var(--green); background: var(--green-soft); }
.status-warn { color: var(--amber); background: var(--amber-soft); }
.status-muted { color: var(--muted); background: var(--surface-soft); }

.mini-ai,
.section-menu-trigger {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--purple-border-soft);
  border-radius: 8px;
  color: var(--purple);
  background: var(--purple-soft);
  cursor: pointer;
}

.section-menu-trigger {
  border-color: transparent;
  color: var(--muted);
  background: transparent;
}

.section-menu {
  display: grid;
  min-width: 150px;
  position: absolute;
  z-index: 5;
  top: 36px;
  right: 8px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--popover-bg);
  box-shadow: var(--shadow-md);
}

.section-menu button {
  min-height: 32px;
  border: 0;
  border-radius: 7px;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.section-menu button:hover {
  background: var(--surface-soft);
}

.add-section-button,
.add-section-inline {
  min-height: 42px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  background: var(--card-bg);
}

.add-section-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: var(--muted);
  cursor: pointer;
}

.add-section-inline {
  padding: 6px;
}

.drill-header h2 {
  margin: 0;
  font-size: 16px;
}

.editor-block,
.analysis-score,
.breakdown-list,
.suggestion-card {
  display: grid;
  gap: 11px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card-bg);
}

.block-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.block-heading strong,
.achievements-head h3 {
  margin: 0;
  font-size: 13px;
}

.block-heading small,
.achievements-head p,
.muted-copy {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-segments {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.compact-segments button {
  min-height: 40px;
  border: 0;
  background: var(--control-bg);
  cursor: pointer;
}

.compact-segments button.active {
  color: var(--purple);
  background: var(--purple-soft);
}

.ghost-row {
  min-height: 38px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-soft);
  font-size: 12px;
}

.empty-editor-state {
  display: grid;
  min-height: 240px;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  text-align: center;
  background: var(--card-bg);
}

.empty-editor-state strong {
  color: var(--ink);
}

.empty-editor-state p {
  max-width: 320px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.achievements-head span {
  color: var(--purple);
  font-size: 11px;
  font-weight: 800;
}

.bullet-editor-row {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 8px;
  align-items: start;
}

.bullet-editor-row > span {
  display: grid;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: var(--muted);
  background: var(--surface-soft);
  font-size: 11px;
  font-weight: 800;
}

.bullet-editor-row .textarea {
  min-height: 74px;
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.swatches button {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}

.swatches button.active {
  border-color: var(--ink);
}

.analysis-score strong {
  display: block;
  font-size: 44px;
}

.analysis-score span,
.analysis-score small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.analysis-score p {
  margin: 8px 0 4px;
  color: var(--green);
  font-size: 13px;
  font-weight: 800;
}

.breakdown-list h3 {
  margin: 0 0 6px;
  font-size: 12px;
  text-transform: uppercase;
}

.breakdown-list button {
  display: flex;
  justify-content: space-between;
  min-height: 36px;
  border: 0;
  border-radius: 8px;
  background: var(--surface-soft);
}

.suggestion-card span {
  color: var(--purple);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.suggestion-card h3 {
  margin: 7px 0;
  font-size: 13px;
}

.suggestion-card > strong {
  color: var(--green);
  font-size: 12px;
}

.suggestion-card p {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 1080px) {
  .builder-workspace {
    grid-template-columns: 1fr;
    height: auto;
  }

  .builder-preview-pane {
    min-height: 600px;
  }
}

@media (max-width: 720px) {
  .builder-topbar {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .builder-actions {
    width: 100%;
    margin-left: 0;
  }

  .builder-workspace {
    padding: 12px;
  }

  .field-grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
