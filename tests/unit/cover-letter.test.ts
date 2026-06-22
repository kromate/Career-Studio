import { describe, expect, it } from 'vitest'
import { generateCoverLetterDraft, coverLetterContentHash, coverLetterToText } from '@/lib/cover-letter'
import { matchResumeToJob } from '@/lib/resume/matching'
import { parseResumeText } from '@/lib/resume/parser'
import { scoreResume } from '@/lib/resume/scoring'
import { sampleJobDescription, sampleResume } from '../fixtures/sample-resume'

describe('cover letter drafts', () => {
    it('generates deterministic paragraphs grounded in job and resume evidence', () => {
        const parsed = parseResumeText(sampleResume)
        const version = {
            id: 'version-1',
            label: 'Tailored resume',
            createdAt: '2026-06-22T00:00:00.000Z',
            source: 'tailored' as const,
            kind: 'tailored' as const,
            text: sampleResume,
            parsed,
            analysis: scoreResume(parsed),
            lineage: { acceptedSuggestionIds: [] },
            exportMetadata: [],
        }
        const job = {
            id: 'job-1',
            title: 'Senior Frontend Engineer',
            company: 'Northstar',
            location: 'Remote',
            description: sampleJobDescription,
            createdAt: '2026-06-22T00:00:00.000Z',
            updatedAt: '2026-06-22T00:00:00.000Z',
            resumeId: 'resume-1',
            resumeVersionId: 'version-1',
            match: matchResumeToJob(parsed, sampleJobDescription, '2026-06-22T00:00:00.000Z'),
        }
        const draft = generateCoverLetterDraft({
            id: 'cover-1',
            job,
            resumeId: 'resume-1',
            version,
            tone: 'direct',
            length: 'standard-letter',
            userNotes: 'Available to start in September',
            createdAt: '2026-06-22T00:00:00.000Z',
        })

        expect(draft.paragraphs.length).toBeGreaterThanOrEqual(4)
        expect(draft.paragraphs.some(paragraph => paragraph.evidenceSources.some(source => source.type === 'resume-line'))).toBe(true)
        expect(draft.paragraphs.some(paragraph => paragraph.evidenceSources.some(source => source.type === 'user-note'))).toBe(true)
        expect(coverLetterToText(draft)).toContain('Senior Frontend Engineer')
        expect(coverLetterContentHash(draft)).toMatch(/^fnv1a:/)
    })
})