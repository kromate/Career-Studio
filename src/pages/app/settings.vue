<template>
  <div class="page-shell settings-page">
    <header class="page-header">
      <div>
        <h1>Settings</h1>
        <p>Manage your identity, product preferences, and locally stored career data.</p>
      </div>
    </header>

    <div class="settings-layout">
      <nav class="settings-nav card" aria-label="Settings sections">
        <button
          v-for="item in sections"
          :key="item.id"
          type="button"
          :class="{ active: activeSection === item.id }"
          @click="activeSection = item.id"
        >
          <component :is="item.icon" :size="16" />
          {{ item.label }}
        </button>
      </nav>

      <main class="settings-content">
        <section v-if="activeSection === 'profile'" class="card settings-section">
          <div class="settings-heading">
            <span class="settings-icon"><UserRound :size="20" /></span>
            <div>
              <div class="heading-with-badge">
                <h2>Profile and identity</h2>
                <span class="badge badge-purple">Managed by Goalmatic</span>
              </div>
              <p>Your Goalmatic identity is used to scope all resumes, jobs, and applications.</p>
            </div>
          </div>
          <div class="profile-summary">
            <span class="large-avatar">{{ initials }}</span>
            <div>
              <strong>{{ workspace.state.value.user?.name }}</strong>
              <p>{{ workspace.state.value.user?.email }}</p>
              <span class="badge badge-green">
                {{ workspace.state.value.user?.authProvider }} authentication
              </span>
            </div>
          </div>
          <div class="profile-fields grid-2">
            <label class="field">
              <span class="field-label">Display name</span>
              <input :value="workspace.state.value.user?.name" class="input" disabled>
            </label>
            <label class="field">
              <span class="field-label">Email address</span>
              <input :value="workspace.state.value.user?.email" class="input" disabled>
            </label>
            <label class="field">
              <span class="field-label">User ID</span>
              <input :value="workspace.state.value.user?.id" class="input mono" disabled>
            </label>
            <label class="field">
              <span class="field-label">Account scope</span>
              <input :value="workspace.state.value.user?.accountId" class="input mono" disabled>
            </label>
          </div>
        </section>

        <section v-else-if="activeSection === 'preferences'" class="card settings-section">
          <div class="settings-heading">
            <span class="settings-icon"><SlidersHorizontal :size="20" /></span>
            <div>
              <h2>Product preferences</h2>
              <p>Choose what the workspace shows and how it reminds you to follow through.</p>
            </div>
          </div>
          <div class="setting-rows">
            <label class="setting-row">
              <div><strong>Weekly job-search review</strong><p>Show progress prompts and a weekly focus on the dashboard.</p></div>
              <input v-model="preferences.weeklyReview" type="checkbox" @change="savePreferences">
              <span class="toggle" />
            </label>
            <div class="setting-row unavailable">
              <div>
                <div class="setting-title"><strong>Email updates</strong><ComingSoonBadge /></div>
                <p>Receive application reminders when production Goalmatic email is connected.</p>
              </div>
            </div>
            <label class="setting-row">
              <div><strong>Show scoring details</strong><p>Display rule IDs, scoring versions, and content fingerprints.</p></div>
              <input v-model="preferences.scoringDetails" type="checkbox" @change="savePreferences">
              <span class="toggle" />
            </label>
            <div class="setting-row unavailable">
              <div>
                <div class="setting-title"><strong>Retain original upload</strong><ComingSoonBadge /></div>
                <p>Local preview stores extracted text only. Encrypted source-file retention is not connected yet.</p>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="activeSection === 'data'" class="card settings-section">
          <div class="settings-heading">
            <span class="settings-icon"><Database :size="20" /></span>
            <div>
              <h2>Data and privacy</h2>
              <p>See what this browser contains and remove the complete local workspace.</p>
            </div>
          </div>
          <div class="data-stats">
            <div><strong>{{ workspace.state.value.resumes.length }}</strong><span>Resumes</span></div>
            <div><strong>{{ versionCount }}</strong><span>Versions</span></div>
            <div><strong>{{ workspace.state.value.jobs.length }}</strong><span>Saved jobs</span></div>
            <div><strong>{{ workspace.state.value.applications.length }}</strong><span>Applications</span></div>
          </div>
          <div class="privacy-callout">
            <LockKeyhole :size="20" />
            <div>
              <strong>Local preview storage</strong>
              <p>This development workspace stores extracted resume text and app state in this browser's local storage. It does not upload source files.</p>
            </div>
          </div>
          <div class="danger-zone">
            <div>
              <h3>Delete all career data</h3>
              <p>Remove resumes, versions, analyses, jobs, and applications from this browser. Your sign-in identity remains.</p>
            </div>
            <button class="btn btn-danger" type="button" @click="deleteConfirm = true">
              <Trash2 :size="15" />
              Delete all data
            </button>
          </div>
        </section>

        <section v-else class="card settings-section">
          <div class="settings-heading">
            <span class="settings-icon"><Code2 :size="20" /></span>
            <div>
              <h2>About this build</h2>
              <p>Version and methodology details for reproducible issue reports.</p>
            </div>
          </div>
          <div class="about-grid">
            <div><span>Application</span><strong>Career Studio 0.1.0</strong></div>
            <div><span>Resume parser</span><strong>{{ PARSER_VERSION }}</strong></div>
            <div><span>Resume scorer</span><strong>{{ SCORING_VERSION }}</strong></div>
            <div><span>Job matcher</span><strong>{{ MATCH_SCORING_VERSION }}</strong></div>
            <div><span>Skills taxonomy</span><strong>{{ TAXONOMY_VERSION }}</strong></div>
            <div><span>License</span><strong>MIT</strong></div>
          </div>
          <div class="about-actions">
            <NuxtLink to="/methodology" class="btn btn-secondary">Read methodology</NuxtLink>
            <a href="https://github.com/kromate/Career-Studio" class="btn btn-secondary" target="_blank" rel="noreferrer">Open-source project</a>
          </div>
        </section>
      </main>
    </div>

    <ConfirmDialog
      :open="deleteConfirm"
      title="Delete all local career data?"
      description="This cannot be undone. Your resumes, versions, analyses, saved jobs, and applications will be removed from this browser."
      confirm-label="Delete everything"
      confirmation-text="DELETE"
      @close="deleteConfirm = false"
      @confirm="deleteAll"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  Code2,
  Database,
  LockKeyhole,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from 'lucide-vue-next'
import {
  MATCH_SCORING_VERSION,
  PARSER_VERSION,
  SCORING_VERSION,
  TAXONOMY_VERSION,
} from '@/lib/resume/constants'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const toast = useToast()
const activeSection = ref<'profile' | 'preferences' | 'data' | 'about'>('profile')
const deleteConfirm = ref(false)
const preferences = reactive({ ...workspace.state.value.settings })
const sections: Array<{ id: typeof activeSection.value; label: string; icon: Component }> = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'data', label: 'Data & privacy', icon: ShieldCheck },
  { id: 'about', label: 'About', icon: Code2 },
]

const initials = computed(() => workspace.state.value.user?.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'G')
const versionCount = computed(() => workspace.state.value.resumes.reduce((sum, resume) => sum + resume.versions.length, 0))
onMounted(() => {
  workspace.hydrate()
  Object.assign(preferences, workspace.state.value.settings)
})
const savePreferences = () => {
  workspace.updateSettings(preferences)
  toast.show('Preferences saved')
}
const deleteAll = () => {
  workspace.deleteAllData()
  deleteConfirm.value = false
  toast.show('All local career data deleted', { tone: 'info' })
}
</script>

<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 820px);
  align-items: start;
  gap: 17px;
}

.settings-nav {
  display: grid;
  gap: 4px;
  padding: 8px;
  position: sticky;
  top: 82px;
}

.settings-nav button {
  display: flex;
  min-height: 41px;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  border: 0;
  border-radius: 9px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
}

.settings-nav button:hover,
.settings-nav button.active {
  color: var(--purple);
  background: var(--purple-soft);
}

.settings-section {
  padding: 25px;
}

.settings-heading {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 13px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.settings-icon {
  display: grid;
  width: 43px;
  height: 43px;
  place-items: center;
  border-radius: 12px;
  color: var(--purple);
  background: var(--purple-soft);
}

.settings-heading h2 {
  margin-bottom: 5px;
  font-size: 18px;
}

.heading-with-badge,
.setting-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.heading-with-badge h2,
.setting-title strong {
  margin-bottom: 0;
}

.settings-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 25px 0;
}

.large-avatar {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 18px;
  color: var(--purple-dark);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  background: var(--purple-soft);
}

.profile-summary strong {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.profile-summary p {
  margin: 0 0 7px;
  color: var(--muted);
  font-size: 12px;
}

.profile-fields {
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 10px;
}

.setting-rows {
  display: grid;
}

.setting-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 20px;
  position: relative;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
}

.setting-row:last-child {
  border-bottom: 0;
}

.setting-row.unavailable {
  cursor: default;
}

.setting-row strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
}

.setting-row p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}

.setting-row input {
  position: absolute;
  opacity: 0;
}

.toggle {
  width: 40px;
  height: 23px;
  position: relative;
  border-radius: 99px;
  background: #dcd8e2;
  transition: background 160ms ease;
}

.toggle::after {
  width: 17px;
  height: 17px;
  position: absolute;
  top: 3px;
  left: 3px;
  border-radius: 50%;
  content: '';
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 160ms ease;
}

.setting-row input:checked + .toggle {
  background: var(--purple);
}

.setting-row input:checked + .toggle::after {
  transform: translateX(17px);
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 25px 0;
}

.data-stats > div {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-soft);
}

.data-stats strong,
.data-stats span {
  display: block;
}

.data-stats strong {
  margin-bottom: 3px;
  font-family: var(--font-display);
  font-size: 19px;
}

.data-stats span {
  color: var(--muted);
  font-size: 11px;
}

.privacy-callout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 16px;
  border-radius: 11px;
  color: var(--green);
  background: var(--green-soft);
}

.privacy-callout strong {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
}

.privacy-callout p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid var(--line);
}

.danger-zone h3 {
  margin-bottom: 5px;
  color: var(--red);
  font-size: 13px;
}

.danger-zone p {
  max-width: 470px;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin: 25px 0;
}

.about-grid > div {
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 9px;
}

.about-grid span,
.about-grid strong {
  display: block;
}

.about-grid span {
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 10px;
}

.about-grid strong {
  font-family: ui-monospace, monospace;
  font-size: 10px;
}

.about-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 760px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    display: flex;
    overflow-x: auto;
    position: static;
  }

  .settings-nav button {
    flex: 0 0 auto;
  }

  .data-stats {
    grid-template-columns: 1fr 1fr;
  }

  .danger-zone {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
