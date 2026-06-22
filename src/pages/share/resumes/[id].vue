<template>
  <div class="share-page">
    <main v-if="share" class="share-shell">
      <header class="share-header">
        <BrandMark to="/" />
        <div>
          <span>Public resume version</span>
          <h1>{{ share.resumeName }}</h1>
          <p>{{ share.versionLabel }} · Shared {{ formatDate(share.createdAt) }}</p>
        </div>
      </header>
      <section class="share-preview card">
        <ResumePreview :parsed="publicParsed" />
      </section>
    </main>
    <main v-else class="share-empty card">
      <BrandMark to="/" />
      <h1>Resume share not found</h1>
      <p>This local-preview share only exists in the browser where it was created.</p>
      <NuxtLink to="/" class="btn btn-primary">Open Career Studio</NuxtLink>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { ParsedResume } from '@/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const workspace = useWorkspace()
const share = computed(() => workspace.getPublicResumeShare(route.params.id as string))
const publicParsed = computed<ParsedResume>(() => {
  if (!share.value?.includeContact) {
    return {
      ...share.value!.parsed,
      lines: share.value!.parsed.lines.filter(line => line.kind !== 'contact'),
      contacts: {},
    }
  }
  return share.value.parsed
})

onMounted(() => {
  workspace.hydrate()
})

const formatDate = (date: string) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(date))
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  padding: 34px 20px 60px;
  background: var(--surface);
}

.share-shell {
  display: grid;
  width: min(100%, 920px);
  gap: 18px;
  margin: 0 auto;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.share-header span {
  display: block;
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.share-header h1 {
  margin: 0 0 5px;
}

.share-header p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.share-preview {
  padding: 24px;
}

.share-empty {
  display: grid;
  justify-items: center;
  width: min(100%, 460px);
  gap: 12px;
  margin: 80px auto;
  padding: 28px;
  text-align: center;
}

.share-empty p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>