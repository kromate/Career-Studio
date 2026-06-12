<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <div v-for="message in toastMessages" :key="message.id" class="toast" :class="`toast-${message.tone}`">
      <span class="toast-icon">
        <CircleCheck v-if="message.tone === 'success'" :size="18" />
        <TriangleAlert v-else-if="message.tone === 'warning'" :size="18" />
        <CircleX v-else-if="message.tone === 'error'" :size="18" />
        <Info v-else :size="18" />
      </span>
      <div>
        <strong>{{ message.title }}</strong>
        <p v-if="message.message">{{ message.message }}</p>
      </div>
      <button type="button" aria-label="Dismiss notification" @click="dismiss(message.id)">
        <X :size="15" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToastMessage } from '@/types'
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-vue-next'

const toast = useToast()
const toastMessages = computed<ToastMessage[]>(() => toast.messages.value)
const dismiss = toast.dismiss
</script>

<style scoped>
.toast-stack {
  display: grid;
  width: min(390px, calc(100vw - 30px));
  gap: 10px;
  position: fixed;
  z-index: 100;
  right: 18px;
  bottom: 18px;
}

.toast {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 11px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(23, 20, 38, 0.15);
}

.toast-icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 9px;
  color: var(--purple);
  background: var(--purple-soft);
}

.toast-success .toast-icon {
  color: var(--green);
  background: var(--green-soft);
}

.toast-warning .toast-icon {
  color: var(--amber);
  background: var(--amber-soft);
}

.toast-error .toast-icon {
  color: var(--red);
  background: var(--red-soft);
}

.toast strong {
  display: block;
  margin: 1px 0 3px;
  font-size: 13px;
}

.toast p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

.toast button {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
}

</style>
