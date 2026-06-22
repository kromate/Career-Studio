<template>
  <BaseModal
    :open="open"
    title="Evidence enrichment"
    description="Answer only with facts you can verify."
    size="lg"
    header-align="left"
    @close="requestClose"
  >
    <div class="enrichment-modal">
      <section v-if="questions.length" class="question-list">
        <label v-for="question in questions" :key="question.id" class="question-card">
          <span>{{ question.label }}</span>
          <strong>{{ question.prompt }}</strong>
          <blockquote v-if="question.sourceText">{{ question.sourceText }}</blockquote>
          <textarea v-model="answers[question.id]" class="textarea" rows="3" placeholder="Verified evidence" />
        </label>
      </section>
      <section v-else class="empty-enrichment">
        <CheckCircle2 :size="24" />
        <strong>No targeted questions right now</strong>
      </section>

      <section v-if="suggestions.length" class="suggestion-review">
        <article v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-row" :class="suggestion.status">
          <div>
            <span>{{ suggestion.riskFlags.length ? suggestion.riskFlags.join(', ') : 'resume evidence' }}</span>
            <p>{{ suggestion.proposedText }}</p>
            <small>{{ suggestion.evidenceSources.map(source => source.type).join(' + ') }}</small>
          </div>
          <button
            class="btn btn-primary btn-sm"
            type="button"
            :disabled="suggestion.status !== 'pending'"
            @click="applySuggestion(suggestion.id)"
          >
            Apply
          </button>
        </article>
      </section>
    </div>

    <template #footer>
      <button class="btn btn-secondary" type="button" @click="requestClose">Close</button>
      <button class="btn btn-primary" type="button" :disabled="!hasAnswers" @click="refreshSuggestions">
        <Sparkles :size="15" />
        Generate suggestions
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import type { EnrichmentQuestion, EnrichmentSuggestion } from '@/types'
import { CheckCircle2, Sparkles } from 'lucide-vue-next'
import { generateEnrichmentSuggestions } from '@/lib/resume/enrichment'

const props = defineProps<{
  open: boolean
  questions: EnrichmentQuestion[]
}>()

const emit = defineEmits<{
  close: []
  apply: [suggestion: EnrichmentSuggestion]
}>()

const answers = reactive<Record<string, string>>({})
const suggestions = ref<EnrichmentSuggestion[]>([])
const hasAnswers = computed(() => Object.values(answers).some(value => value.trim()))

watch(() => props.open, (open) => {
  if (!open) return
  suggestions.value = []
  props.questions.forEach((question) => {
    if (!(question.id in answers)) answers[question.id] = ''
  })
})

const refreshSuggestions = () => {
  suggestions.value = generateEnrichmentSuggestions(props.questions, answers)
}

const applySuggestion = (id: string) => {
  const suggestion = suggestions.value.find(item => item.id === id)
  if (!suggestion || suggestion.status !== 'pending') return
  suggestion.status = 'accepted'
  emit('apply', suggestion)
}

const requestClose = () => emit('close')
</script>

<style scoped>
.enrichment-modal {
  display: grid;
  gap: 15px;
  padding-bottom: 8px;
}

.question-list,
.suggestion-review {
  display: grid;
  gap: 9px;
}

.question-card,
.suggestion-row,
.empty-enrichment {
  display: grid;
  gap: 8px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.question-card span,
.suggestion-row span,
.suggestion-row small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.question-card strong,
.empty-enrichment strong {
  font-size: 12px;
  line-height: 1.45;
}

.question-card blockquote {
  margin: 0;
  padding-left: 10px;
  border-left: 2px solid var(--purple-border);
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.45;
}

.suggestion-row {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.suggestion-row.accepted {
  border-color: var(--green-border);
  background: var(--green-soft);
}

.suggestion-row p {
  margin: 3px 0;
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.45;
}

.empty-enrichment {
  justify-items: center;
  color: var(--green);
  text-align: center;
}
</style>