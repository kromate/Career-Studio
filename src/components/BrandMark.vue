<template>
  <NuxtLink :to="to" class="brand-mark" :aria-label="compact ? 'Career Studio by Goalmatic' : undefined">
    <span class="brand-icon" aria-hidden="true">
      <svg viewBox="0 0 28 28" width="28" height="28" role="presentation">
        <circle cx="14" cy="14" r="3.6" fill="currentColor" />
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.2">
          <path d="M14 2.5v5" />
          <path d="M14 20.5v5" />
          <path d="M2.5 14h5" />
          <path d="M20.5 14h5" />
          <path d="m5.9 5.9 3.5 3.5" />
          <path d="m18.6 18.6 3.5 3.5" />
          <path d="m22.1 5.9-3.5 3.5" />
          <path d="m9.4 18.6-3.5 3.5" />
        </g>
      </svg>
    </span>
    <span v-if="!compact" class="brand-copy">
      <strong>Career Studio</strong>
      <small>by Goalmatic</small>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  to?: string
  compact?: boolean
}>(), {
  to: '/',
  compact: false,
})
</script>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.brand-icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: var(--purple);
}

.brand-icon svg {
  width: 28px;
  height: 28px;
}

.brand-copy {
  display: grid;
  gap: 1px;
  font-family: var(--font-display);
  line-height: 1;
}

.brand-copy strong {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.brand-copy small {
  color: var(--muted);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0;
}
</style>
