<template>
  <span
    class="app-skeleton"
    :style="{
      width,
      height,
      borderRadius: radius,
    }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string
  height?: string
  radius?: string
}>(), {
  width: '100%',
  height: '16px',
  radius: '6px',
})
</script>

<style scoped>
.app-skeleton {
  display: block;
  max-width: 100%;
  border: 1px solid var(--line);
  background: linear-gradient(
    90deg,
    var(--skeleton-bg) 0%,
    var(--skeleton-highlight) 45%,
    var(--skeleton-bg) 100%
  );
  background-size: 220% 100%;
  animation: app-skeleton-shimmer 1.35s ease-in-out infinite;
}

@keyframes app-skeleton-shimmer {
  0% { background-position: 120% 0; }
  100% { background-position: -120% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .app-skeleton {
    animation: none;
  }
}
</style>
