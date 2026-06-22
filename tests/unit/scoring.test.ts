import { describe, expect, it } from 'vitest'
import { createResumeDocxBlob, createResumePdfBlob } from '@/lib/export/resume'
import { CANONICAL_SCHEMA_VERSION } from '@/lib/resume/constants'
import { matchResumeToJob } from '@/lib/resume/matching'
import { parseResumeText, reconstructPdfText } from '@/lib/resume/parser'
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

  it('emits a versioned canonical resume shape and stable content hash', () => {
    const first = parseResumeText(sampleResume)
    const second = parseResumeText(sampleResume.replace(/\r?\n/g, '\r\n'))

    expect(first.canonicalSchemaVersion).toBe(CANONICAL_SCHEMA_VERSION)
    expect(second.canonicalSchemaVersion).toBe(CANONICAL_SCHEMA_VERSION)
    expect(second.normalizedText).toBe(first.normalizedText)
    expect(second.contentHash).toBe(first.contentHash)
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

  it('recognizes a header portfolio as a professional profile', () => {
    const parsed = parseResumeText(sampleResume.replace(
      'linkedin.com/in/jordanlee',
      'https://portfolio.example.com',
    ))
    const profileCheck = scoreResume(parsed).checks.find(check => check.ruleId === 'search.linkedin')

    expect(parsed.contacts.website).toBe('https://portfolio.example.com')
    expect(profileCheck?.earnedPoints).toBe(2)
    expect(profileCheck?.passed).toBe(true)
  })

  it('penalizes sparse three-page resumes, repeated verbs, and filler language', () => {
    const resume = [
      'TAYLOR REED',
      'taylor@example.com | +1 416 555 0100',
      'EXPERIENCE',
      'Developer',
      'Jan 2023 - Present',
      '- Technologies used: Vue and Firebase.',
      '- Technologies used: TypeScript and Node.',
      '- Technologies used: Docker and SQL.',
      '- Responsible for various product improvements.',
      '\f',
      'Developer',
      '2020 - 2022',
      '- Worked on internal tools.',
      '- Built a service used by 500 customers.',
      '\f',
      'SKILLS',
      'Vue, TypeScript, Node, Firebase, Docker, SQL',
      'EDUCATION',
      'BSc Computer Science',
      '09/2016 - 2020',
    ].join('\n')
    const analysis = scoreResume(parseResumeText(resume))
    const check = (ruleId: string) => analysis.checks.find(item => item.ruleId === ruleId)

    expect(check('clarity.resume-length')?.earnedPoints).toBe(0)
    expect(check('clarity.repetition')?.passed).toBe(false)
    expect(check('clarity.filler-words')?.earnedPoints).toBeLessThan(2)
    expect(check('consistency.dates')?.earnedPoints).toBeLessThan(4)
  })

  it('requires quantified evidence across the resume instead of only six bullets', () => {
    const unquantifiedBullets = Array.from(
      { length: 12 },
      (_, index) => `- Built feature ${String.fromCharCode(65 + index)} for customer workflows.`,
    ).join('\n')
    const resume = `${sampleResume}\n${unquantifiedBullets}`
    const impact = scoreResume(parseResumeText(resume)).checks
      .find(check => check.ruleId === 'impact.quantified-outcomes')

    expect(impact?.earnedPoints).toBeLessThan(10)
  })

  it('detects broken ligature text as a language-quality issue', () => {
    const resume = sampleResume.replace(
      'Product-minded software engineer',
      'Product-minded software engineer focused on uni fi cation',
    )
    const mechanics = scoreResume(parseResumeText(resume)).checks
      .find(check => check.ruleId === 'mechanics.language-quality')

    expect(mechanics?.passed).toBe(false)
    expect(mechanics?.evidence[0]?.quote).toContain('uni fi cation')
  })
})

describe('PDF text reconstruction', () => {
  it('preserves headings and bullets while joining wrapped bullet lines', () => {
    const text = reconstructPdfText([[
      { str: 'SKILLS & TOOLS', transform: [10, 0, 0, 10, 45, 700] },
      { str: '', hasEOL: true, transform: [10, 0, 0, 10, 45, 680] },
      { str: 'EXPERIENCE', transform: [10, 0, 0, 10, 45, 660] },
      { str: '', hasEOL: true, transform: [10, 0, 0, 10, 45, 640] },
      { str: '●', width: 5, transform: [10, 0, 0, 10, 45, 620] },
      { str: ' ', width: 13, transform: [10, 0, 0, 10, 50, 620] },
      { str: 'Built a reliable product for', hasEOL: true, width: 150, transform: [10, 0, 0, 10, 63, 620] },
      { str: 'customers across Africa.', transform: [10, 0, 0, 10, 63, 602] },
    ]])

    expect(text).toBe([
      'SKILLS & TOOLS',
      'EXPERIENCE',
      '• Built a reliable product for customers across Africa.',
    ].join('\n'))
  })

  it('joins adjacent ligature fragments and removes isolated page numbers', () => {
    const text = reconstructPdfText([[
      { str: 'uni', width: 18, transform: [10, 0, 0, 10, 63, 620] },
      { str: 'fi', width: 7, transform: [10, 0, 0, 10, 81, 620] },
      { str: 'cation', hasEOL: true, width: 32, transform: [10, 0, 0, 10, 88, 620] },
      { str: '1', width: 6, transform: [10, 0, 0, 10, 543, 20] },
    ]])

    expect(text).toBe('unification')
  })

  it('preserves PDF page count without exposing page-break markers in normalized text', () => {
    const text = reconstructPdfText([
      [{ str: 'Page one', hasEOL: true, transform: [10, 0, 0, 10, 45, 700] }],
      [{ str: 'Page two', hasEOL: true, transform: [10, 0, 0, 10, 45, 700] }],
      [{ str: 'Page three', hasEOL: true, transform: [10, 0, 0, 10, 45, 700] }],
    ])
    const parsed = parseResumeText(text)

    expect(parsed.stats.pagesEstimated).toBe(3)
    expect(parsed.normalizedText).not.toContain('\f')
  })

  it('recognizes Skills & Tools as a standard section', () => {
    const parsed = parseResumeText([
      'Taylor Reed',
      'taylor@example.com',
      'SKILLS & TOOLS',
      'Vue, TypeScript, Firebase',
      'EXPERIENCE',
      '• Built reliable applications for customers.',
      'EDUCATION',
      'University of Lagos',
    ].join('\n'))

    expect(parsed.sections.some(section => section.type === 'skills')).toBe(true)
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
    expect(first.coverage.required.total).toBeGreaterThan(0)
    expect(first.requirements.some(requirement => requirement.evidenceLocations.length)).toBe(true)
  })

  it('returns coverage buckets, evidence locations, credentials, and missing actions', () => {
    const parsed = parseResumeText(sampleResume.replace('Firebase, SQL, Docker', 'SQL'))
    const result = matchResumeToJob(
      parsed,
      `${sampleJobDescription}\nCandidates must know Kubernetes. AWS certification is required.`,
      '2026-06-11T12:00:00.000Z',
    )
    const typescript = result.requirements.find(requirement => requirement.normalized === 'typescript')
    const kubernetes = result.requirements.find(requirement => requirement.normalized === 'kubernetes')
    const certification = result.requirements.find(requirement => requirement.normalized === 'certification')

    expect(typescript?.matched).toBe(true)
    expect(typescript?.evidenceLocations[0]?.lineId).toMatch(/^line-/)
    expect(kubernetes?.matched).toBe(false)
    expect(certification?.type).toBe('credential')
    expect(result.coverage.required.missing).toBeGreaterThan(0)
    expect(result.coverage.credential.total).toBeGreaterThan(0)
    expect(result.missing.some(item => item.label === 'Kubernetes' && item.suggestedAction.includes('truthful'))).toBe(true)
  })

  it('awards a repeated requirement once and flags suspicious repetition', () => {
    const resume = `${sampleResume}\nSKILLS\nTypeScript TypeScript TypeScript TypeScript TypeScript TypeScript TypeScript`
    const result = matchResumeToJob(
      parseResumeText(resume),
      'TypeScript is required. TypeScript is required. TypeScript is required.',
      '2026-06-11T12:00:00.000Z',
    )

    expect(result.requirements.filter(requirement => requirement.normalized === 'typescript')).toHaveLength(1)
    expect(result.coverage.required).toMatchObject({ total: 1, matched: 1, missing: 0 })
    expect(result.warnings.some(warning => warning.includes('awarded once'))).toBe(true)
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
    expect(direct?.targetPath).toMatch(/^lines\./)
    expect(direct?.originalText).toBe(direct?.sourceText)
    expect(direct?.riskFlags).toEqual([])
    expect(direct?.requiresFactConfirmation).toBe(false)
    expect(evidencePrompt?.proposedText).toBe(evidencePrompt?.sourceText)
    expect(evidencePrompt?.riskFlags).toContain('new_metric')
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

  it('prioritizes safe leadership rewrites ahead of evidence prompts', () => {
    const resume = sampleResume.replace(
      'Led development of a workflow platform',
      'Was in charge of development of a workflow platform',
    )
    const parsed = parseResumeText(resume)
    const suggestions = generateRewriteSuggestions(parsed, scoreResume(parsed))

    expect(suggestions[0]?.requiresFactConfirmation).toBe(false)
    expect(suggestions[0]?.proposedText).toContain('Led development of a workflow platform')
  })

  it('does not request impact metrics for technology-list bullets', () => {
    const resume = `${sampleResume}\n\nPROJECTS\n- Technologies used: Vue, Firebase, Node.js`
    const parsed = parseResumeText(resume)
    const suggestions = generateRewriteSuggestions(parsed, scoreResume(parsed))

    expect(suggestions.some(suggestion => suggestion.sourceText.startsWith('Technologies used:'))).toBe(false)
  })
})

describe('resume exports', () => {
  it('generates non-empty PDF and DOCX files', async () => {
    const parsed = parseResumeText(sampleResume)
    const [pdf, docx] = await Promise.all([
      createResumePdfBlob(parsed),
      createResumeDocxBlob(parsed),
    ])

    expect(pdf.type).toBe('application/pdf')
    expect(pdf.size).toBeGreaterThan(1_000)
    expect(docx.size).toBeGreaterThan(1_000)
  })
})
