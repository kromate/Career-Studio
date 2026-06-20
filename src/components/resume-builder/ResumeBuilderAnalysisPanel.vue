<template>
  <div class="analysis-panel">
    <section class="analysis-score">
      <strong>{{ score }}</strong>
      <span>OF 100</span>
      <p>+{{ recoverablePoints }} pts recoverable</p>
      <small>{{ findings.length }} suggestions · {{ scoreLabel }}</small>
    </section>
    <section class="breakdown-list">
      <h3>Score breakdown</h3>
      <button v-for="dimension in dimensions" :key="dimension.id" type="button">
        <span>{{ dimension.label }}</span>
        <strong>{{ dimension.score }}/{{ dimension.maxScore }}</strong>
      </button>
    </section>
    <section class="suggestion-list">
      <article v-for="finding in findings" :key="finding.ruleId" class="suggestion-card">
        <span>{{ finding.dimension }}</span>
        <h3>{{ finding.title }}</h3>
        <strong>+{{ Math.round(finding.maxPoints - finding.earnedPoints) }} pt</strong>
        <p>{{ finding.recommendation }}</p>
        <button class="btn btn-secondary btn-sm" type="button" @click="$emit('open-section', finding.dimension)">Open in editor</button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DimensionScore, ScoreCheck, ScoreDimension } from '@/types'

defineProps<{
  score: number
  dimensions: DimensionScore[]
  findings: ScoreCheck[]
  recoverablePoints: number
  scoreLabel: string
}>()

defineEmits<{
  'open-section': [dimension: ScoreDimension]
}>()
</script>
