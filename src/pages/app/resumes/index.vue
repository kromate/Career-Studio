<template>
  <CollectionLoadingState v-if="!workspace.state.value.hydrated" />
  <div v-else class="page-shell">
    <header class="page-header">
      <div>
        <h1>Resumes</h1>
        <p>Keep your experience clear, truthful, and ready for each opportunity.</p>
      </div>
      <div class="page-actions">
        <NuxtLink to="/app/resumes/new" class="btn btn-primary">
          <Plus :size="16" />
          Add resume
        </NuxtLink>
      </div>
    </header>

    <div v-if="workspace.state.value.resumes.length" class="resume-grid">
      <article v-for="resume in workspace.state.value.resumes" :key="resume.id" class="resume-card card">
        <div class="document-preview">
          <div class="document-lines">
            <i class="wide" />
            <i />
            <i class="short" />
            <b />
            <i class="wide" />
            <i />
            <i class="wide" />
            <b />
            <i />
            <i class="short" />
          </div>
          <span class="version-badge">{{ resume.versions.length }} version{{ resume.versions.length === 1 ? '' : 's' }}</span>
        </div>
        <div class="resume-card-body">
          <div class="resume-card-top">
            <div>
              <h2>{{ resume.name }}</h2>
              <p>{{ resume.originalFileName }}</p>
            </div>
            <ScoreRing :score="activeVersion(resume)?.analysis.score ?? null" :size="66" :stroke="6" />
          </div>
          <div class="resume-meta">
            <span><Clock3 :size="13" /> Updated {{ relativeDate(resume.updatedAt) }}</span>
            <span :class="`confidence-${activeVersion(resume)?.analysis.parseConfidence}`">
              <ShieldCheck :size="13" />
              {{ activeVersion(resume)?.analysis.parseConfidence }} parse
            </span>
          </div>
          <div class="resume-card-actions">
            <NuxtLink :to="`/app/resumes/${resume.id}`" class="btn btn-primary btn-sm">
              Open analysis
              <ArrowRight :size="14" />
            </NuxtLink>
            <NuxtLink :to="`/app/resumes/${resume.id}/rewrite`" class="btn btn-secondary btn-sm">
              <PencilLine :size="14" />
              Improve
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <section v-else class="card">
      <EmptyState
        :icon="Files"
        title="Your resume library is empty"
        description="Upload a resume to confirm how it is read, get specific feedback, and start a version history."
      >
        <NuxtLink to="/app/resumes/new" class="btn btn-primary">
          <FileUp :size="16" />
          Upload resume
        </NuxtLink>
      </EmptyState>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Clock3, Files, FileUp, PencilLine, Plus, ShieldCheck } from 'lucide-vue-next'
import type { ResumeRecord } from '@/types'

definePageMeta({ layout: 'app', middleware: 'auth' })

const workspace = useWorkspace()
const activeVersion = (resume: ResumeRecord) => workspace.getActiveVersion(resume)
const relativeDate = (date: string) => {
  const difference = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(difference / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
</script>

<style scoped>
.resume-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.resume-card {
  overflow: hidden;
}

.document-preview {
  display: grid;
  min-height: 168px;
  place-items: center;
  position: relative;
  border-bottom: 1px solid var(--line);
  background: #f7f7f7;
}

.document-lines {
  width: 104px;
  height: 136px;
  padding: 16px 13px;
  border-radius: 3px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.1);
}

.document-lines i,
.document-lines b {
  display: block;
  height: 4px;
  margin-bottom: 7px;
  border-radius: 99px;
  background: #d8d3df;
}

.document-lines i.wide { width: 100%; }
.document-lines i.short { width: 55%; }
.document-lines b {
  width: 100%;
  height: 3px;
  margin: 14px 0 8px;
  background: var(--purple);
}

.version-badge {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(6px);
}

.resume-card-body {
  padding: 18px;
}

.resume-card-top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 10px;
}

.resume-card h2 {
  margin-bottom: 5px;
  font-size: 15px;
}

.resume-card p {
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 13px;
  margin: 16px 0;
  color: var(--muted);
  font-size: 11px;
}

.resume-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.confidence-high { color: var(--green); }
.confidence-medium { color: var(--amber); }
.confidence-low { color: var(--red); }

.resume-card-actions {
  display: flex;
  gap: 7px;
}

.resume-card-actions .btn {
  flex: 1;
}

@media (max-width: 1120px) {
  .resume-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .resume-grid {
    grid-template-columns: 1fr;
  }
}
</style>
