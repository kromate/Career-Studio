<template>
  <div class="design-panel">
    <section class="editor-block">
      <div class="block-heading"><strong>Layout</strong><small>Template, page size, and margins</small></div>
      <div class="field-grid two">
        <label class="field">
          <span class="field-label">Template</span>
          <select class="select" :value="document.design.template" @change="updateDesign('template', inputValue($event))">
            <option v-for="template in templateOptions" :key="template.id" :value="template.id">
              {{ template.label }}
            </option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Page Size</span>
          <select class="select" :value="document.design.pageSize" @change="updateDesign('pageSize', inputValue($event))">
            <option value="letter">Letter</option>
            <option value="a4">A4</option>
          </select>
        </label>
      </div>
      <label class="field">
        <span class="field-label">Top & Bottom Margin {{ document.design.marginY }}pt</span>
        <input type="range" min="24" max="72" :value="document.design.marginY" @input="updateDesign('marginY', numberValue($event))">
      </label>
      <label class="field">
        <span class="field-label">Side Margins {{ document.design.marginX }}pt</span>
        <input type="range" min="24" max="72" :value="document.design.marginX" @input="updateDesign('marginX', numberValue($event))">
      </label>
    </section>
    <section class="editor-block">
      <div class="block-heading"><strong>Font & format settings</strong><small>Typography, accent color, and date style</small></div>
      <div class="field-grid two">
        <label class="field">
          <span class="field-label">Font Family</span>
          <select class="select" :value="document.design.fontFamily" @change="updateDesign('fontFamily', inputValue($event))">
            <option>Roboto</option>
            <option>Arial</option>
            <option>Georgia</option>
            <option>Helvetica</option>
            <option>Courier</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Font Size</span>
          <input class="input" type="number" min="8" max="13" :value="document.design.fontSize" @input="updateDesign('fontSize', numberValue($event))">
        </label>
      </div>
      <label class="field">
        <span class="field-label">Line Height {{ document.design.lineHeight }}x</span>
        <input type="range" min="1.1" max="1.7" step="0.05" :value="document.design.lineHeight" @input="updateDesign('lineHeight', numberValue($event))">
      </label>
      <div class="field">
        <span class="field-label">Accent Color</span>
        <div class="swatches">
          <button
            v-for="color in accentColors"
            :key="color"
            type="button"
            :style="{ background: color }"
            :class="{ active: document.design.accentColor === color }"
            :aria-label="`Select ${color} accent color`"
            @click="updateDesign('accentColor', color)"
          />
        </div>
      </div>
      <label class="field">
        <span class="field-label">Date Format</span>
        <select class="select" :value="document.design.dateFormat" @change="updateDesign('dateFormat', inputValue($event))">
          <option>MM/YYYY</option>
          <option>MMM YYYY</option>
          <option>YYYY</option>
        </select>
      </label>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { EditableResumeDocument, ResumeDesignSettings } from '@/types'
import { RESUME_TEMPLATE_OPTIONS } from '@/lib/resume/templates'

const props = defineProps<{
  document: EditableResumeDocument
  accentColors: string[]
}>()

const emit = defineEmits<{
  'update-design': [key: keyof ResumeDesignSettings, value: string | number]
}>()

const templateOptions = RESUME_TEMPLATE_OPTIONS

const inputValue = (event: Event) => (event.target as HTMLInputElement | HTMLSelectElement).value
const numberValue = (event: Event) => Number(inputValue(event))
const updateDesign = (key: keyof ResumeDesignSettings, value: string | number) => emit('update-design', key, value)
</script>
