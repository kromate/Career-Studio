<template>
  <span
    class="app-spinner"
    :class="{ light }"
    :style="{ width: normalizedSize, height: normalizedSize }"
    role="status"
    :aria-label="label"
  />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: number | string
  light?: boolean
  label?: string
}>(), {
  size: 18,
  light: false,
  label: 'Loading',
})

const normalizedSize = computed(() => (
  typeof props.size === 'number' ? `${props.size}px` : props.size
))
</script>

<style scoped>
.app-spinner {
  display: inline-block;
  flex: 0 0 auto;
  box-sizing: border-box;
  border: 3px solid color-mix(in srgb, currentColor 22%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  color: var(--purple);
  animation: app-spin 800ms linear infinite;
}

.app-spinner.light {
  color: #fff;
}

@keyframes app-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .app-spinner {
    animation-duration: 1.6s;
  }
}
</style>
