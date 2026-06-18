<template>
  <div class="resume-paper">
    <div
      v-for="line in parsed.lines"
      :key="line.id"
      class="resume-line"
      :class="[
        `resume-${line.kind}`,
        { highlighted: highlightedLineIds.includes(line.id) },
      ]"
      :data-line-id="line.id"
    >
      <span v-if="line.kind === 'bullet'" class="bullet-dot">•</span>
      <span>{{ line.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParsedResume } from '@/types'

withDefaults(defineProps<{
  parsed: ParsedResume
  highlightedLineIds?: string[]
}>(), {
  highlightedLineIds: () => [],
})
</script>

<style scoped>
.resume-paper {
  width: min(100%, 700px);
  min-height: 760px;
  padding: 52px 56px;
  border: 1px solid var(--document-border);
  color: var(--document-ink);
  background: var(--document-surface);
  box-shadow: 0 18px 50px rgba(35, 27, 61, 0.1);
}

.resume-line {
  display: flex;
  gap: 8px;
  margin-bottom: 7px;
  padding: 2px 5px;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  font-size: 11.5px;
  line-height: 1.42;
  transition: background 180ms ease, box-shadow 180ms ease;
}

.resume-heading {
  margin-top: 18px;
  margin-bottom: 7px;
  padding-bottom: 4px;
  border-bottom: 1.5px solid #393342;
  border-radius: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.resume-heading:first-child {
  margin-top: 0;
}

.resume-contact {
  justify-content: center;
  margin-bottom: 3px;
  color: var(--document-muted);
  font-size: 10px;
}

.resume-line:first-child {
  justify-content: center;
  margin-bottom: 5px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.resume-bullet {
  padding-left: 10px;
}

.bullet-dot {
  flex: 0 0 auto;
}

.highlighted {
  background: var(--document-highlight-bg);
  box-shadow: inset 3px 0 0 var(--document-highlight-bar);
}

@media (max-width: 680px) {
  .resume-paper {
    min-height: 600px;
    padding: 34px 25px;
  }
}
</style>
