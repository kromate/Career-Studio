<template>
  <NuxtLink :to="to" class="brand-mark" :aria-label="compact ? 'Career Studio by Goalmatic' : undefined">
    <span class="brand-icon" aria-hidden="true">
      <svg viewBox="0 0 42 45" width="42" height="45" role="presentation" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M39.1147 5.73974C37.5539 4.51117 35.9255 4.37741 34.214 5.14478C24.7386 9.39311 15.2679 13.6519 5.7931 17.9016C3.68766 18.846 2.6181 20.3739 2.73331 22.3233C2.83082 23.9734 3.9632 25.4411 5.56484 25.8837C8.11596 26.5887 10.6692 27.2908 13.2403 27.9171C14.5411 28.234 15.621 28.7695 16.4621 29.5648C17.2258 30.2869 17.7926 31.2231 18.1491 32.4043C18.9141 34.9389 19.7188 37.4616 20.5056 39.9897C21.1378 42.0205 22.6204 43.1851 24.6556 43.2482C26.3621 43.3012 27.8972 42.2104 28.6232 40.3368C32.2108 31.0775 35.7807 21.8114 39.359 12.5485C39.5818 11.9717 39.825 11.4029 40.0554 10.829C40.8027 8.96745 40.6268 7.26646 39.1147 5.73974Z" fill="#4025E0" />
        <path d="M34.3058 5.469C36.0173 4.70163 37.6457 4.83539 39.2065 6.06396L16.5539 29.889C15.7128 29.0938 14.6329 28.5583 13.3321 28.2414C10.761 27.615 8.20776 26.9129 5.65663 26.2079C4.05499 25.7653 2.92261 24.2977 2.8251 22.6475C2.70989 20.6981 3.77945 19.1702 5.8849 18.2258C15.3597 13.9761 24.8304 9.71733 34.3058 5.469Z" fill="#5533FC" />
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
  height: 32px;
  place-items: center;
}

.brand-icon svg {
  width: 25px;
  height: auto;
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
