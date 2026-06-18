<template>
  <div class="toast-stack" aria-live="polite" aria-relevant="additions removals">
    <TransitionGroup name="toast-list">
      <div
        v-for="message in toastMessages"
        :key="message.id"
        class="toast"
        :class="`toast-${message.tone}`"
        role="status"
      >
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
        <span
          v-if="message.duration > 0"
          class="toast-progress"
          :style="{ animationDuration: `${message.duration}ms` }"
        />
      </div>
    </TransitionGroup>
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
  z-index: 300;
  right: 18px;
  top: 82px;
}

.toast {
  overflow: hidden;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 11px;
  position: relative;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--popover-bg);
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

.toast-progress {
  height: 3px;
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background: currentColor;
  opacity: 0.35;
  transform-origin: left;
  animation: toast-progress linear forwards;
}

.toast-success { color: var(--green); }
.toast-info { color: var(--purple); }
.toast-warning { color: var(--amber); }
.toast-error { color: var(--red); }

.toast > div,
.toast button {
  color: var(--ink);
}

.toast-list-enter-active,
.toast-list-leave-active,
.toast-list-move {
  transition: opacity 180ms ease, transform 180ms ease;
}

.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(18px);
}

@keyframes toast-progress {
  to { transform: scaleX(0); }
}

@media (max-width: 620px) {
  .toast-stack {
    right: 15px;
    top: 74px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-progress,
  .toast-list-enter-active,
  .toast-list-leave-active,
  .toast-list-move {
    animation: none;
    transition: none;
  }
}

</style>
