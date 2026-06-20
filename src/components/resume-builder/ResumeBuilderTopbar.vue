<template>
  <header class="builder-topbar">
    <button class="score-pill" type="button" @click="activeTab = 'analysis'">
      <strong>{{ score }}</strong>
      <span>Score<br>{{ scoreLabel }}</span>
    </button>
    <nav class="builder-tabs" aria-label="Resume builder tabs">
      <button :class="{ active: activeTab === 'content' }" type="button" @click="activeTab = 'content'">Content</button>
      <button :class="{ active: activeTab === 'design' }" type="button" @click="activeTab = 'design'">Design</button>
      <button :class="{ active: activeTab === 'analysis' }" type="button" @click="activeTab = 'analysis'">Analysis</button>
    </nav>
    <div class="builder-actions">
      <span class="saved-pill"><Check :size="14" /> Saved just now</span>
      <button class="ai-pill" type="button" @click="activeTab = 'analysis'">
        <Sparkles :size="15" />
        <span>20</span>
        <strong>AI</strong>
      </button>
      <button class="builder-export-button" type="button" @click="$emit('export-pdf')">
        <Download :size="14" />
        Export PDF
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Check, Download, Sparkles } from 'lucide-vue-next'

const activeTab = defineModel<'content' | 'design' | 'analysis'>('activeTab', { required: true })

defineProps<{
  score: number
  scoreLabel: string
}>()

defineEmits<{
  'export-pdf': []
}>()
</script>
