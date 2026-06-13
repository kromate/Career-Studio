<template>
  <CollectionLoadingState v-if="!workspace.state.value.hydrated" />
  <div v-else class="page-shell">
    <header class="page-header">
      <div>
        <h1>Saved jobs</h1>
        <p>Save roles worth considering, compare their requirements, and keep your research together.</p>
      </div>
      <div class="page-actions">
        <NuxtLink to="/app/target" class="btn btn-primary">
          <Plus :size="16" />
          Compare with a job
        </NuxtLink>
      </div>
    </header>

    <template v-if="workspace.state.value.jobs.length">
      <div class="jobs-summary grid-3">
        <article class="card card-pad">
          <span class="summary-icon purple-bg"><Bookmark :size="19" /></span>
          <div><strong>{{ workspace.state.value.jobs.length }}</strong><span>Saved opportunities</span></div>
        </article>
        <article class="card card-pad">
          <span class="summary-icon green-bg"><TrendingUp :size="19" /></span>
          <div><strong>{{ averageMatch }}</strong><span>Average match score</span></div>
        </article>
        <article class="card card-pad">
          <span class="summary-icon blue-bg"><FileCheck2 :size="19" /></span>
          <div><strong>{{ tailoredCount }}</strong><span>Tailored versions</span></div>
        </article>
      </div>

      <section class="jobs-table card">
        <div class="jobs-toolbar">
          <div class="search-box">
            <Search :size="16" />
            <input v-model="search" type="search" placeholder="Search saved jobs…">
          </div>
          <select v-model="sort" class="select sort-select">
            <option value="recent">Most recent</option>
            <option value="match">Highest match</option>
            <option value="company">Company A-Z</option>
          </select>
        </div>
        <div class="job-cards">
          <article v-for="job in visibleJobs" :key="job.id" class="saved-job">
            <span class="company-logo">{{ job.company.slice(0, 1).toUpperCase() }}</span>
            <div class="job-main">
              <div>
                <h2>{{ job.title }}</h2>
                <p>{{ job.company }} · {{ job.location }}</p>
              </div>
              <div class="job-tags">
                <span v-if="applicationFor(job.id)" class="badge" :class="statusBadge(applicationFor(job.id)?.status)">
                  {{ applicationFor(job.id)?.status }}
                </span>
                <span v-if="job.resumeId" class="badge badge-purple">
                  <Files :size="11" />
                  Resume linked
                </span>
              </div>
            </div>
            <div class="job-match">
              <ScoreRing :score="job.match?.score ?? null" :size="76" :stroke="7" />
            </div>
            <div class="job-actions">
              <NuxtLink :to="`/app/jobs/${job.id}`" class="btn btn-primary btn-sm">View match</NuxtLink>
              <a v-if="job.url" :href="job.url" target="_blank" rel="noreferrer" class="icon-btn" aria-label="Open job posting">
                <ExternalLink :size="15" />
              </a>
            </div>
          </article>
        </div>
      </section>
    </template>

    <section v-else class="card">
      <EmptyState
        :icon="Bookmark"
        title="No saved opportunities"
        description="Paste a job description to see which requirements your resume supports, then save the role with that evidence."
      >
        <NuxtLink to="/app/target" class="btn btn-primary">Compare with a job</NuxtLink>
      </EmptyState>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Bookmark, ExternalLink, FileCheck2, Files, Plus, Search, TrendingUp } from 'lucide-vue-next'
import type { ApplicationStatus } from '@/types'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const search = ref('')
const sort = ref<'recent' | 'match' | 'company'>('recent')

const applicationFor = (jobId: string) => workspace.state.value.applications.find(item => item.jobId === jobId)
const averageMatch = computed(() => {
  const scores = workspace.state.value.jobs.map(job => job.match?.score).filter((score): score is number => score !== undefined)
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : '—'
})
const tailoredCount = computed(() => workspace.state.value.resumes.flatMap(resume => resume.versions).filter(version => version.source === 'tailored').length)
const visibleJobs = computed(() => {
  const query = search.value.toLowerCase()
  const jobs = workspace.state.value.jobs.filter(job => (
    !query || `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(query)
  ))
  if (sort.value === 'match') return [...jobs].sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))
  if (sort.value === 'company') return [...jobs].sort((a, b) => a.company.localeCompare(b.company))
  return [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})
const statusBadge = (status?: ApplicationStatus) => {
  if (status === 'offer' || status === 'interview') return 'badge-green'
  if (status === 'rejected') return 'badge-red'
  if (status === 'applied') return 'badge-purple'
  return ''
}
</script>

<style scoped>
.jobs-summary {
  margin-bottom: 17px;
}

.jobs-summary article {
  display: flex;
  align-items: center;
  gap: 13px;
}

.summary-icon {
  display: grid;
  width: 43px;
  height: 43px;
  place-items: center;
  border-radius: 12px;
}

.purple-bg { color: var(--purple); background: var(--purple-soft); }
.green-bg { color: var(--green); background: var(--green-soft); }
.blue-bg { color: var(--blue); background: var(--blue-soft); }

.jobs-summary strong,
.jobs-summary span {
  display: block;
}

.jobs-summary strong {
  margin-bottom: 3px;
  font-family: var(--font-display);
  font-size: 20px;
}

.jobs-summary div > span {
  color: var(--muted);
  font-size: 11px;
}

.jobs-table {
  overflow: hidden;
}

.jobs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px;
  border-bottom: 1px solid var(--line);
}

.search-box {
  display: flex;
  width: min(100%, 380px);
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted);
  background: var(--surface-soft);
}

.search-box input {
  width: 100%;
  height: 40px;
  border: 0;
  outline: 0;
  background: transparent;
}

.sort-select {
  width: 160px;
  height: 40px;
  font-size: 10px;
}

.job-cards {
  display: grid;
}

.saved-job {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 17px;
  padding: 18px;
  border-top: 1px solid var(--line);
}

.saved-job:first-child {
  border-top: 0;
}

.saved-job:hover {
  background: var(--surface-soft);
}

.company-logo {
  display: grid;
  width: 47px;
  height: 47px;
  place-items: center;
  border-radius: 13px;
  color: var(--purple-dark);
  font-size: 15px;
  font-weight: 800;
  background: var(--purple-soft);
}

.job-main {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.job-main h2 {
  margin-bottom: 5px;
  font-size: 14px;
}

.job-main p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.job-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.job-match {
  min-width: 76px;
}

.job-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 760px) {
  .saved-job {
    grid-template-columns: auto 1fr auto;
  }

  .job-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .job-tags {
    justify-content: flex-start;
  }

  .job-actions {
    grid-column: 1 / -1;
  }

  .job-actions .btn {
    flex: 1;
  }
}
</style>
