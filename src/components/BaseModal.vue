<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div
        v-if="open"
        class="modal-backdrop"
        @click.self="closeOnBackdrop && requestClose()"
      >
        <Transition name="modal-panel" appear>
          <section
            v-if="open"
            ref="panel"
            class="modal-panel"
            :class="`modal-${size}`"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="description ? descriptionId : undefined"
            tabindex="-1"
          >
            <header class="modal-header">
              <div class="modal-heading">
                <slot name="icon" />
                <div>
                  <h2 :id="titleId">{{ title }}</h2>
                  <p v-if="description" :id="descriptionId">{{ description }}</p>
                </div>
              </div>
              <button
                v-if="showClose"
                class="modal-close"
                type="button"
                aria-label="Close dialog"
                :disabled="busy"
                @click="requestClose"
              >
                <X :size="18" />
              </button>
            </header>
            <div class="modal-content">
              <slot />
            </div>
            <footer v-if="$slots.footer" class="modal-footer">
              <slot name="footer" />
            </footer>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  busy?: boolean
  closeOnBackdrop?: boolean
  showClose?: boolean
}>(), {
  description: '',
  size: 'md',
  busy: false,
  closeOnBackdrop: true,
  showClose: true,
})

const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement | null>(null)
const route = useRoute()
let previouslyFocused: HTMLElement | null = null
const instanceId = useId()
const titleId = `modal-title-${instanceId}`
const descriptionId = `modal-description-${instanceId}`

const requestClose = () => {
  if (!props.busy) emit('close')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    requestClose()
    return
  }

  if (event.key !== 'Tab' || !panel.value) return
  const focusable = Array.from(panel.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ))
  if (!focusable.length) {
    event.preventDefault()
    panel.value.focus()
    return
  }

  const first = focusable[0]!
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = open ? 'hidden' : ''
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    panel.value?.focus()
  } else {
    window.removeEventListener('keydown', handleKeydown)
    previouslyFocused?.focus()
    previouslyFocused = null
  }
}, { immediate: true })

watch(() => route.fullPath, () => {
  if (props.open) emit('close')
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
  previouslyFocused?.focus()
})
</script>

<style scoped>
.modal-backdrop {
  display: grid;
  overflow-y: auto;
  place-items: center;
  position: fixed;
  z-index: 200;
  inset: 0;
  padding: 20px;
  background: rgba(23, 20, 38, 0.48);
  backdrop-filter: blur(4px);
}

.modal-panel {
  overflow: hidden;
  width: min(100%, 540px);
  max-height: min(88dvh, 840px);
  border: 1px solid var(--line);
  border-radius: 16px;
  outline: none;
  background: var(--card-bg);
  box-shadow: 0 28px 80px rgba(23, 20, 38, 0.24);
}

.modal-sm { max-width: 430px; }
.modal-lg { max-width: 900px; }
.modal-full {
  width: min(100%, 1100px);
  max-height: calc(100dvh - 40px);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 21px 22px;
  border-bottom: 1px solid var(--line);
}

.modal-heading {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 12px;
}

.modal-heading h2 {
  margin: 0;
  font-size: 18px;
}

.modal-heading p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.55;
}

.modal-close {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: var(--muted);
  background: var(--surface-soft);
  cursor: pointer;
}

.modal-content {
  overflow-y: auto;
  max-height: calc(88dvh - 145px);
  padding: 22px;
}

.modal-full .modal-content {
  max-height: calc(100dvh - 125px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding: 16px 22px;
  border-top: 1px solid var(--line);
  background: var(--surface-subtle);
}

.modal-fade-enter-active,
.modal-fade-leave-active,
.modal-panel-enter-active,
.modal-panel-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to,
.modal-panel-enter-from,
.modal-panel-leave-to {
  opacity: 0;
}

.modal-panel-enter-from,
.modal-panel-leave-to {
  transform: translateY(12px) scale(0.985);
}

@media (max-width: 620px) {
  .modal-backdrop {
    align-items: end;
    padding: 0;
  }

  .modal-panel {
    width: 100%;
    max-width: none;
    max-height: 92dvh;
    border-radius: 18px 18px 0 0;
  }

  .modal-content {
    max-height: calc(92dvh - 145px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-panel-enter-active,
  .modal-panel-leave-active {
    transition: none;
  }
}
</style>
