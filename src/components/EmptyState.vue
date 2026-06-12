<template>
  <div class="empty-state">
    <span class="empty-icon">
      <component :is="icon" :size="25" />
    </span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  description: string
}>()
</script>

<style scoped>
.empty-state {
  display: grid;
  min-height: 260px;
  place-items: center;
  align-content: center;
  padding: 32px;
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  margin-bottom: 15px;
  border-radius: 16px;
  color: var(--purple);
  background: var(--purple-soft);
}

.empty-state h3 {
  margin-bottom: 7px;
  font-size: 17px;
}

.empty-state p {
  max-width: 380px;
  margin: 0 0 18px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
}
</style>
