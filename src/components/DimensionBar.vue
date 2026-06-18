<template>
  <div class="dimension">
    <div class="dimension-copy">
      <span>{{ label }}</span>
      <strong>{{ score }}/{{ maxScore }}</strong>
    </div>
    <div class="dimension-track">
      <span :style="{ width: `${percentage}%`, background: color }" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  score: number
  maxScore: number
}>()

const percentage = computed(() => Math.round((props.score / props.maxScore) * 100))
const color = computed(() => {
  if (percentage.value >= 80) return 'var(--green)'
  if (percentage.value >= 60) return 'var(--purple)'
  if (percentage.value >= 40) return 'var(--amber)'
  return 'var(--red)'
})
</script>

<style scoped>
.dimension {
  display: grid;
  gap: 7px;
}

.dimension-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.dimension-copy span {
  color: var(--ink-soft);
}

.dimension-copy strong {
  color: var(--ink);
  font-size: 11px;
}

.dimension-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track-bg);
}

.dimension-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 450ms ease;
}
</style>
