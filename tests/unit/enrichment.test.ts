import { describe, expect, it } from 'vitest'
import { createEmptyBuilderDocument } from '@/lib/resume/builder'
import {
    applyEnrichmentSuggestionToDocument,
    generateEnrichmentQuestions,
    generateEnrichmentSuggestions,
} from '@/lib/resume/enrichment'
import { matchResumeToJob } from '@/lib/resume/matching'
import { parseResumeText } from '@/lib/resume/parser'
import { scoreResume } from '@/lib/resume/scoring'
import { sampleJobDescription, sampleResume } from '../fixtures/sample-resume'

describe('evidence enrichment', () => {
    it('asks at most six grounded questions and maps suggestions to user answers', () => {
        const parsed = parseResumeText(sampleResume)
        const questions = generateEnrichmentQuestions(
            parsed,
            scoreResume(parsed),
            matchResumeToJob(parsed, `${sampleJobDescription}\nKubernetes is required.`),
        )
        const answers = Object.fromEntries(questions.map(question => [question.id, 'Reduced review time by 24% in Q2']))
        const suggestions = generateEnrichmentSuggestions(questions, answers)

        expect(questions.length).toBeLessThanOrEqual(6)
        expect(questions.some(question => question.sourceLineId || question.missingRequirementId)).toBe(true)
        expect(suggestions[0]?.evidenceSources.some(source => source.type === 'user-answer')).toBe(true)
        expect(suggestions[0]?.riskFlags).toBeTruthy()
    })

    it('applies accepted enrichment suggestions to matching builder bullets', () => {
        const document = createEmptyBuilderDocument()
        const sourceText = 'Built Vue applications for operations teams across 4 countries.'
        const suggestion = {
            id: 'suggestion-1',
            questionId: 'question-1',
            targetPath: 'line:line-1',
            originalText: sourceText,
            proposedText: 'Built Vue applications for operations teams across 4 countries; Reduced review time by 24% in Q2.',
            rationale: 'User supplied evidence.',
            evidenceSources: [{ type: 'user-answer' as const, id: 'question-1', quote: 'Reduced review time by 24% in Q2' }],
            riskFlags: ['new_metric' as const],
            status: 'pending' as const,
        }
        const updated = applyEnrichmentSuggestionToDocument({
            ...document,
            workExperiences: [{
                id: 'experience-1',
                jobTitle: 'Engineer',
                employer: 'Example',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                hideDates: true,
                bullets: [{ id: 'bullet-1', text: sourceText }],
            }],
        }, suggestion)

        expect(updated.workExperiences[0]?.bullets[0]?.text).toContain('Reduced review time')
    })
})