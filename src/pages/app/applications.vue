<template>
  <div class="page-shell applications-page">
    <header class="page-header">
      <div>
        <h1>Applications</h1>
        <p>Track each opportunity from preparation to outcome, including the resume and next action that moved it forward.</p>
      </div>
      <div class="page-actions">
        <ComingSoonBadge>Email reminders coming soon</ComingSoonBadge>
        <NuxtLink to="/app/target" class="btn btn-primary">
          <Plus :size="16" />
          Add opportunity
        </NuxtLink>
      </div>
    </header>

    <div class="pipeline-summary">
      <span v-for="column in columns" :key="column.status">
        <strong>{{ applicationsFor(column.status).length }}</strong>
        {{ column.label }}
      </span>
    </div>

    <div v-if="workspace.state.value.applications.length" class="pipeline">
      <section v-for="column in columns" :key="column.status" class="pipeline-column">
        <header>
          <div><span :style="{ background: column.color }" /><strong>{{ column.label }}</strong></div>
          <span>{{ applicationsFor(column.status).length }}</span>
        </header>
        <div class="pipeline-cards">
          <article v-for="application in applicationsFor(column.status)" :key="application.id" class="application-card card">
            <div class="application-top">
              <span class="company-logo">{{ jobFor(application.jobId)?.company.slice(0, 1).toUpperCase() }}</span>
              <button type="button" aria-label="Application menu" @click="toggleMenu(application.id)">
                <MoreHorizontal :size="17" />
              </button>
              <div v-if="openMenu === application.id" class="application-menu">
                <NuxtLink :to="`/app/jobs/${application.jobId}`" @click="openMenu = ''">
                  <ExternalLink :size="14" /> Open job
                </NuxtLink>
                <button type="button" @click="removeApplication(application.id)">
                  <Trash2 :size="14" /> Remove
                </button>
              </div>
            </div>
            <h2>{{ jobFor(application.jobId)?.title || 'Unknown role' }}</h2>
            <p class="company-name">{{ jobFor(application.jobId)?.company }} · {{ jobFor(application.jobId)?.location }}</p>
            <div v-if="jobFor(application.jobId)?.match" class="application-match">
              <span>Match</span>
              <strong>{{ jobFor(application.jobId)?.match?.score }}/100</strong>
            </div>
            <label>
              <span>Next action</span>
              <input
                :value="application.nextAction"
                placeholder="Add next action"
                @change="updateNextAction(application.id, $event)"
              >
            </label>
            <label>
              <span>Action date</span>
              <input
                :value="application.nextActionAt || ''"
                type="date"
                @change="updateNextActionDate(application.id, $event)"
              >
            </label>
            <select
              :value="application.status"
              class="select status-select"
              @change="move(application.id, $event)"
            >
              <option v-for="target in columns" :key="target.status" :value="target.status">
                Move to {{ target.label }}
              </option>
            </select>
            <footer>
              <Clock3 :size="12" />
              {{ application.nextActionAt ? `Due ${formatActionDate(application.nextActionAt)}` : `Updated ${relativeDate(application.updatedAt)}` }}
            </footer>
          </article>
          <div v-if="!applicationsFor(column.status).length" class="column-empty">
            <span />
            <p>No applications here</p>
          </div>
        </div>
      </section>
    </div>

    <section v-else class="card">
      <EmptyState
        :icon="BriefcaseBusiness"
        title="Your application pipeline is empty"
        description="Save a job match first, then track it from preparation through offer or close."
      >
        <NuxtLink to="/app/target" class="btn btn-primary">Target a job</NuxtLink>
      </EmptyState>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ApplicationStatus } from '@/types'
import {
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const toast = useToast()
const openMenu = ref('')
const columns: Array<{ status: ApplicationStatus; label: string; color: string }> = [
  { status: 'saved', label: 'Saved', color: '#777188' },
  { status: 'applied', label: 'Applied', color: '#601ded' },
  { status: 'interview', label: 'Interview', color: '#2161c2' },
  { status: 'offer', label: 'Offer', color: '#158564' },
  { status: 'rejected', label: 'Closed', color: '#c1394b' },
]

const applicationsFor = (status: ApplicationStatus) => (
  workspace.state.value.applications.filter(application => application.status === status)
)
const jobFor = (jobId: string) => workspace.getJob(jobId)
const toggleMenu = (id: string) => {
  openMenu.value = openMenu.value === id ? '' : id
}
const move = (id: string, event: Event) => {
  const status = (event.target as HTMLSelectElement).value as ApplicationStatus
  workspace.moveApplication(id, status)
  toast.show(`Application moved to ${columns.find(column => column.status === status)?.label}`)
}
const updateNextAction = (id: string, event: Event) => {
  const nextAction = (event.target as HTMLInputElement).value
  workspace.updateApplication(id, { nextAction })
  toast.show('Next action saved')
}
const updateNextActionDate = (id: string, event: Event) => {
  const nextActionAt = (event.target as HTMLInputElement).value
  workspace.updateApplication(id, { nextActionAt: nextActionAt || undefined })
  toast.show(nextActionAt ? 'Action date saved' : 'Action date cleared')
}
const removeApplication = (id: string) => {
  openMenu.value = ''
  workspace.deleteApplication(id)
  toast.show('Application removed', { tone: 'info' })
}
const relativeDate = (date: string) => {
  const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
const formatActionDate = (date: string) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
}).format(new Date(`${date}T12:00:00`))
</script>

<style scoped>
.pipeline-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.pipeline-summary span {
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--muted);
  font-size: 11px;
  background: #fff;
}

.pipeline-summary strong {
  margin-right: 4px;
  color: var(--ink);
}

.pipeline {
  display: grid;
  grid-template-columns: repeat(5, minmax(235px, 1fr));
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 15px;
}

.pipeline-column {
  min-width: 235px;
}

.pipeline-column > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.pipeline-column > header > div {
  display: flex;
  align-items: center;
  gap: 7px;
}

.pipeline-column > header div > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.pipeline-column > header strong {
  font-size: 11px;
}

.pipeline-column > header > span {
  display: grid;
  min-width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 6px;
  color: var(--muted);
  font-size: 10px;
  background: #eef0f3;
}

.pipeline-cards {
  display: grid;
  min-height: 470px;
  align-content: start;
  gap: 9px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f9fafb;
}

.application-card {
  padding: 13px;
}

.application-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.company-logo {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  color: var(--purple-dark);
  font-size: 11px;
  font-weight: 800;
  background: var(--purple-soft);
}

.application-top > button {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
}

.application-menu {
  display: grid;
  min-width: 130px;
  gap: 2px;
  position: absolute;
  z-index: 5;
  top: 34px;
  right: 0;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #fff;
  box-shadow: var(--shadow-md);
}

.application-menu a,
.application-menu button {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px;
  border: 0;
  border-radius: 7px;
  font-size: 11px;
  background: transparent;
  cursor: pointer;
}

.application-menu a:hover,
.application-menu button:hover {
  background: var(--surface-soft);
}

.application-card h2 {
  margin: 14px 0 5px;
  font-size: 13px;
}

.company-name {
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-match {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 13px 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 10px;
  background: var(--green-soft);
}

.application-match span {
  color: var(--green);
  font-weight: 700;
}

.application-match strong {
  color: var(--green);
  font-size: 10px;
}

.application-card label {
  display: grid;
  gap: 5px;
}

.application-card label + label {
  margin-top: 8px;
}

.application-card label span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
}

.application-card label input {
  width: 100%;
  height: 34px;
  padding: 0 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 11px;
  background: var(--surface-soft);
}

.status-select {
  height: 34px;
  margin-top: 8px;
  font-size: 11px;
}

.application-card footer {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 11px;
  color: var(--muted);
  font-size: 10px;
}

.column-empty {
  display: grid;
  min-height: 120px;
  place-items: center;
  align-content: center;
  color: var(--muted);
  text-align: center;
}

.column-empty span {
  width: 35px;
  height: 5px;
  border-radius: 99px;
  background: #ddd9e3;
}

.column-empty p {
  margin: 9px 0 0;
  font-size: 10px;
}
</style>
