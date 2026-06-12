import { describe, expect, it } from 'vitest'
import { matchResumeToJob } from '@/lib/resume/matching'
import { parseResumeText } from '@/lib/resume/parser'
import { applySuggestion, generateRewriteSuggestions } from '@/lib/resume/rewrite'
import { getPrioritizedFindings, scoreResume } from '@/lib/resume/scoring'
import { sampleJobDescription, sampleResume } from '../fixtures/sample-resume'

describe('deterministic resume analysis', () => {
  it('returns the exact same analysis for repeated inputs and versions', () => {
    const parsed = parseResumeText(sampleResume)
    const createdAt = '2026-06-11T12:00:00.000Z'
    const baseline = scoreResume(parsed, { createdAt })

    for (let index = 0; index < 100; index += 1) {
      expect(scoreResume(parseResumeText(sampleResume), { createdAt })).toEqual(baseline)
    }
  })

  it('keeps the score explainable and bounded', () => {
    const analysis = scoreResume(parseResumeText(sampleResume), {
      createdAt: '2026-06-11T12:00:00.000Z',
    })
    expect(analysis.score).toBeTypeOf('number')
    expect(analysis.score).toBeGreaterThanOrEqual(0)
    expect(analysis.score).toBeLessThanOrEqual(100)
    expect(analysis.dimensions.reduce((sum, item) => sum + item.maxScore, 0)).toBe(100)
    expect(analysis.checks.every(check => check.ruleId && check.recommendation)).toBe(true)
    expect(getPrioritizedFindings(analysis)[0]?.passed).toBe(false)
  })

  it('gates low-confidence extractions instead of showing a misleading score', () => {
    const analysis = scoreResume(parseResumeText('Jordan Lee\nDeveloper'))
    expect(analysis.parseConfidence).toBe('low')
    expect(analysis.score).toBeNull()
    expect(analysis.parseWarnings.length).toBeGreaterThan(0)
  })
})

describe('job matching', () => {
  it('is deterministic and separates match scoring from resume quality', () => {
    const parsed = parseResumeText(sampleResume)
    const createdAt = '2026-06-11T12:00:00.000Z'
    const first = matchResumeToJob(parsed, sampleJobDescription, createdAt)
    const second = matchResumeToJob(parsed, sampleJobDescription, createdAt)

    expect(second).toEqual(first)
    expect(first.score).toBeGreaterThan(50)
    expect(first.dimensions.reduce((sum, item) => sum + item.maxScore, 0)).toBe(100)
    expect(first.requirements.some(requirement => requirement.type === 'required')).toBe(true)
  })

  it('matches whole skill terms instead of substrings', () => {
    const parsed = parseResumeText(sampleResume.replace(/JavaScript/g, 'TypeScript'))
    const result = matchResumeToJob(
      parsed,
      'Java is required. Candidates must build reliable backend services and mentor engineers.',
      '2026-06-11T12:00:00.000Z',
    )
    const java = result.requirements.find(requirement => requirement.normalized === 'java')

    expect(java).toBeTruthy()
    expect(java?.matched).toBe(false)
  })

  it('recognizes irregular responsibility verb forms', () => {
    const parsed = parseResumeText(sampleResume)
    const result = matchResumeToJob(
      parsed,
      'You will lead a frontend team and build customer-facing products.',
      '2026-06-11T12:00:00.000Z',
    )
    const lead = result.requirements.find(requirement => requirement.normalized === 'lead')

    expect(lead?.matched).toBe(true)
  })
})

describe('evidence-preserving rewrites', () => {
  it('suggests direct edits without inventing metrics', () => {
    const parsed = parseResumeText(sampleResume)
    const analysis = scoreResume(parsed)
    const suggestions = generateRewriteSuggestions(parsed, analysis)
    const direct = suggestions.find(suggestion => suggestion.sourceText.startsWith('Responsible for'))
    const evidencePrompt = suggestions.find(suggestion => suggestion.requiresFactConfirmation)

    expect(direct?.proposedText).toContain('Managed')
    expect(direct?.requiresFactConfirmation).toBe(false)
    expect(evidencePrompt?.proposedText).toBe(evidencePrompt?.sourceText)
  })

  it('applies only suggestions that do not require new facts', () => {
    const parsed = parseResumeText(sampleResume)
    const analysis = scoreResume(parsed)
    const suggestions = generateRewriteSuggestions(parsed, analysis)
    const direct = suggestions.find(suggestion => !suggestion.requiresFactConfirmation)
    const factPrompt = suggestions.find(suggestion => suggestion.requiresFactConfirmation)

    expect(direct).toBeTruthy()
    expect(factPrompt).toBeTruthy()
    expect(applySuggestion(sampleResume, direct!)).not.toBe(sampleResume)
    expect(applySuggestion(sampleResume, factPrompt!)).toBe(sampleResume)
  })
})
