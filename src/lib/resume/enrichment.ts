import type {
    EditableResumeDocument,
    EnrichmentQuestion,
    EnrichmentSuggestion,
    JobMatchResult,
    ParsedResume,
    ResumeBuilderBullet,
    ResumeAnalysis,
    ScoreCheck,
} from '@/types'
import { hashText } from './parser'

type RiskFlag = NonNullable<EnrichmentQuestion['riskFlags']>[number]

function evidenceFindingQuestions(parsed: ParsedResume, analysis: ResumeAnalysis): EnrichmentQuestion[] {
    const checksById = new Map(analysis.checks.map(check => [check.ruleId, check]))
    const metricCheck = checksById.get('impact.quantified-outcomes')
    const actionCheck = checksById.get('impact.action-verbs')
    const candidates = [metricCheck, actionCheck]
        .filter((check): check is ScoreCheck => Boolean(check && !check.passed))
        .flatMap(check => check.evidence.map(evidence => ({ check, evidence })))
        .filter(item => item.evidence.quote && item.evidence.lineId)

    return candidates.map(({ check, evidence }) => {
        const sourceText = evidence.quote || ''
        const riskFlags: RiskFlag[] = check.ruleId === 'impact.quantified-outcomes'
            ? ['new_metric']
            : []
        return {
            id: `enrichment-${hashText(`${check.ruleId}:${evidence.lineId}:${sourceText}`)}`,
            prompt: check.ruleId === 'impact.quantified-outcomes'
                ? `What verified number, scale, time saved, quality change, or volume can support this bullet?`
                : `What stronger action verb accurately describes your role in this work?`,
            targetPath: `line:${evidence.lineId}`,
            sourceText,
            sourceLineId: evidence.lineId,
            sourceSection: evidence.section,
            label: check.title,
            riskFlags,
        }
    })
}

function missingRequirementQuestions(match?: JobMatchResult): EnrichmentQuestion[] {
    return (match?.missing || []).slice(0, 4).map(item => ({
        id: `enrichment-${hashText(`missing:${item.requirementId}:${item.label}`)}`,
        prompt: `If it is true, what resume evidence supports ${item.label}?`,
        targetPath: 'profile.summary',
        missingRequirementId: item.requirementId,
        label: item.label,
        riskFlags: ['new_technology'],
    }))
}

function normalizeAnswer(value: string): string {
    return value.replace(/\s+/g, ' ').trim().replace(/[.。]+$/, '')
}

function suggestedText(question: EnrichmentQuestion, answer: string): string {
    if (question.sourceText) {
        const source = question.sourceText.replace(/[.。]+$/, '')
        return `${source}; ${answer}.`
    }
    return `${question.label}: ${answer}.`
}

function updateBulletText(bullets: ResumeBuilderBullet[], originalText: string, proposedText: string): ResumeBuilderBullet[] {
    return bullets.map(bullet => (
        bullet.text.trim() === originalText.trim()
            ? { ...bullet, text: proposedText }
            : bullet
    ))
}

export function generateEnrichmentQuestions(
    parsed: ParsedResume,
    analysis: ResumeAnalysis,
    match?: JobMatchResult,
    limit = 6,
): EnrichmentQuestion[] {
    const questions = [...evidenceFindingQuestions(parsed, analysis), ...missingRequirementQuestions(match)]
    const seen = new Set<string>()
    return questions
        .filter((question) => {
            const key = question.sourceLineId || question.missingRequirementId || question.prompt
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .slice(0, limit)
}

export function generateEnrichmentSuggestions(
    questions: EnrichmentQuestion[],
    answers: Record<string, string>,
): EnrichmentSuggestion[] {
    return questions.flatMap((question) => {
        const answer = normalizeAnswer(answers[question.id] || '')
        if (!answer) return []
        const originalText = question.sourceText || ''
        const proposedText = suggestedText(question, answer)
        return [{
            id: `enrichment-suggestion-${hashText(`${question.id}:${answer}`)}`,
            questionId: question.id,
            targetPath: question.targetPath,
            originalText,
            proposedText,
            rationale: question.sourceText
                ? 'Combines an existing resume bullet with user-supplied supporting evidence.'
                : 'Uses a user answer to create a confirmation-gated evidence note.',
            evidenceSources: [
                ...(question.sourceText && question.sourceLineId ? [{
                    type: 'resume-line' as const,
                    id: question.sourceLineId,
                    quote: question.sourceText,
                }] : []),
                ...(question.missingRequirementId ? [{
                    type: 'job-requirement' as const,
                    id: question.missingRequirementId,
                    quote: question.label,
                }] : []),
                {
                    type: 'user-answer' as const,
                    id: question.id,
                    quote: answer,
                },
            ],
            riskFlags: question.riskFlags,
            status: 'pending' as const,
        }]
    })
}

export function applyEnrichmentSuggestionToDocument(
    document: EditableResumeDocument,
    suggestion: EnrichmentSuggestion,
): EditableResumeDocument {
    if (suggestion.originalText) {
        return {
            ...document,
            workExperiences: document.workExperiences.map(entry => ({
                ...entry,
                bullets: updateBulletText(entry.bullets, suggestion.originalText, suggestion.proposedText),
            })),
            projects: document.projects.map(entry => ({
                ...entry,
                bullets: updateBulletText(entry.bullets, suggestion.originalText, suggestion.proposedText),
            })),
            educations: document.educations.map(entry => ({
                ...entry,
                details: updateBulletText(entry.details, suggestion.originalText, suggestion.proposedText),
            })),
        }
    }

    const summary = document.profile.summary.trim()
    const sentence = suggestion.proposedText.trim()
    return {
        ...document,
        profile: {
            ...document.profile,
            summary: [summary, sentence].filter(Boolean).join(' '),
        },
    }
}