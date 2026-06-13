<template>
  <div class="score-ring" :style="{ '--size': `${size}px`, '--progress': progressColor }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
      <circle
        class="score-track"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
      />
      <circle
        class="score-progress"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </svg>
    <div class="score-copy">
      <strong>{{ score === null ? '—' : score }}</strong>
      <span>{{ score === null ? 'Review parse' : 'out of 100' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  score: number | null
  size?: number
  stroke?: number
}>(), {
  size: 124,
  stroke: 10,
})

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - (props.score || 0) / 100))
const progressColor = computed(() => {
  if (props.score === null) return 'var(--amber)'
  if (props.score >= 80) return 'var(--green)'
  if (props.score >= 60) return 'var(--purple)'
  if (props.score >= 40) return 'var(--amber)'
  return 'var(--red)'
})
</script>

<style scoped>
.score-ring {
  display: grid;
  width: var(--size);
  height: var(--size);
  place-items: center;
  position: relative;
}

.score-ring svg {
  transform: rotate(-90deg);
  transform-origin: center;
}

.score-track {
  stroke: #ece9f2;
}

.score-progress {
  stroke: var(--progress);
  transition: stroke-dashoffset 500ms ease;
}

.score-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  position: absolute;
  inset: 0;
  text-align: center;
}

.score-copy strong {
  font-family: var(--font-display);
  font-size: calc(var(--size) * 0.27);
  line-height: 1;
}

.score-copy span {
  color: var(--muted);
  font-size: calc(var(--size) * 0.083);
  font-weight: 600;
  line-height: 1.1;
}
</style>
