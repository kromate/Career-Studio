<template>
  <BaseModal
    :open="open"
    :title="title"
    :description="description"
    size="sm"
    :busy="loading"
    :close-on-backdrop="!loading"
    @close="$emit('close')"
  >
    <template #icon>
      <span class="confirm-icon" :class="tone">
        <TriangleAlert v-if="tone === 'danger' || tone === 'warning'" :size="20" />
        <Info v-else :size="20" />
      </span>
    </template>

    <label v-if="confirmationText" class="field">
      <span class="field-label">Type {{ confirmationText }} to confirm</span>
      <input
        v-model="typedConfirmation"
        class="input"
        autocomplete="off"
        :disabled="loading"
      >
    </label>

    <slot />

    <template #footer>
      <button class="btn btn-secondary" type="button" :disabled="loading" @click="$emit('close')">
        {{ cancelLabel }}
      </button>
      <button
        class="btn"
        :class="tone === 'danger' ? 'btn-danger' : 'btn-primary'"
        type="button"
        :disabled="loading || !canConfirm"
        @click="$emit('confirm')"
      >
        <AppSpinner v-if="loading" :size="15" light />
        {{ loading ? loadingLabel : confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { Info, TriangleAlert } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  tone?: 'danger' | 'warning' | 'info'
  loading?: boolean
  confirmationText?: string
}>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  loadingLabel: 'Working…',
  tone: 'danger',
  loading: false,
  confirmationText: '',
})

defineEmits<{ close: []; confirm: [] }>()

const typedConfirmation = ref('')
const canConfirm = computed(() => (
  !props.confirmationText || typedConfirmation.value === props.confirmationText
))

watch(() => props.open, (open) => {
  if (!open) typedConfirmation.value = ''
})
</script>

<style scoped>
.confirm-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  color: var(--purple);
  background: var(--purple-soft);
}

.confirm-icon.danger {
  color: var(--red);
  background: var(--red-soft);
}

.confirm-icon.warning {
  color: var(--amber);
  background: var(--amber-soft);
}

.field {
  display: grid;
  gap: 7px;
}
</style>
