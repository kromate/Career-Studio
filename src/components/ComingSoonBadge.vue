<template>
  <span class="coming-soon-badge">
    <Clock3 :size="11" />
    <slot>Coming soon</slot>
  </span>
</template>

<script setup lang="ts">
import { Clock3 } from 'lucide-vue-next'
</script>

<style scoped>
.coming-soon-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  border: 1px solid var(--purple-border-soft);
  border-radius: 99px;
  color: var(--purple-dark);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  white-space: nowrap;
  background: var(--purple-soft);
}
</style>
