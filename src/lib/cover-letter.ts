import type {
    CoverLetterDraft,
    CoverLetterEvidenceSource,
    CoverLetterLength,
    CoverLetterParagraph,
    CoverLetterTone,
    ParsedResume,
    ResumeVersion,
    SavedJob,
} from '@/types'
import { hashText } from './resume/parser'

interface CoverLetterInput {
    id: string
    job: SavedJob
    resumeId: string
    version: ResumeVersion
    tone: CoverLetterTone
    length: CoverLetterLength
    userNotes?: string
    createdAt?: string
}

function fullName(parsed: ParsedResume): string {
    const firstHeader = parsed.lines.find(line => line.section === 'header' && line.kind !== 'contact')?.text || ''
    return firstHeader.trim() || 'Candidate'
}

function sentenceTone(tone: CoverLetterTone): string {
    if (tone === 'warm') return 'I am excited to apply'
    if (tone === 'formal') return 'I am writing to apply'
    if (tone === 'concise') return 'I am applying'
    return 'I am interested in applying'
}

function closingTone(tone: CoverLetterTone): string {
    if (tone === 'formal') return 'Thank you for your consideration.'
    if (tone === 'warm') return 'Thank you for reviewing my application.'
    if (tone === 'concise') return 'Thank you for your time.'
    return 'Thank you for considering my application.'
}

function cleanSentence(text: string): string {
    return text.replace(/\s+/g, ' ').trim().replace(/[.。]+$/, '')
}

function matchedEvidence(job: SavedJob): CoverLetterEvidenceSource[] {
    return (job.match?.requirements || [])
        .filter(requirement => requirement.matched && requirement.evidenceLocations.length)
        .flatMap(requirement => requirement.evidenceLocations.slice(0, 1).map(location => ({
            type: 'resume-line' as const,
            id: location.lineId,
            quote: location.quote,
        })))
        .slice(0, 4)
}

function jobEvidence(job: SavedJob): CoverLetterEvidenceSource[] {
    return (job.match?.requirements || [])
        .flatMap(requirement => requirement.sourceSentences.slice(0, 1).map(sentence => ({
            type: 'job-requirement' as const,
            id: requirement.id,
            quote: sentence,
        })))
        .slice(0, 3)
}

function paragraph(id: string, text: string, evidenceSources: CoverLetterEvidenceSource[]): CoverLetterParagraph {
    return {
        id,
        text,
        evidenceSources,
        unsupported: evidenceSources.length === 0,
    }
}

function evidenceParagraph(evidence: CoverLetterEvidenceSource[], job: SavedJob): string {
    if (!evidence.length) {
        return `My resume should be reviewed against the evidence requirements for ${job.title}, with any unsupported claims removed before export.`
    }
    const examples = evidence.slice(0, 3).map(source => cleanSentence(source.quote))
    if (examples.length === 1) return `The strongest relevant evidence in my resume is that I ${examples[0]!.replace(/^I\s+/i, '')}.`
    return `My resume includes relevant evidence such as ${examples.slice(0, -1).join('; ')}; and ${examples.at(-1)}.`
}

function noteParagraph(note: string): CoverLetterParagraph | null {
    const clean = cleanSentence(note)
    if (!clean) return null
    return paragraph('user-note', `${clean}.`, [{ type: 'user-note', id: 'user-note', quote: clean }])
}

export function generateCoverLetterDraft(input: CoverLetterInput): CoverLetterDraft {
    const createdAt = input.createdAt || new Date().toISOString()
    const name = fullName(input.version.parsed)
    const resumeEvidence = matchedEvidence(input.job)
    const requirementEvidence = jobEvidence(input.job)
    const intro = paragraph(
        'intro',
        `${sentenceTone(input.tone)} for the ${input.job.title} role at ${input.job.company}. I am grounding this letter in the attached ${input.version.label} resume version for ${name}.`,
        [{ type: 'job-description', id: input.job.id, quote: `${input.job.title} at ${input.job.company}` }],
    )
    const evidence = paragraph('evidence', evidenceParagraph(resumeEvidence, input.job), resumeEvidence)
    const fit = paragraph(
        'fit',
        requirementEvidence.length
            ? `The role emphasizes ${requirementEvidence.map(source => cleanSentence(source.quote)).slice(0, 2).join(' and ')}, and my application materials should keep those requirements tied to explicit resume evidence.`
            : `The job description should remain the source of truth for tailoring this cover letter.`,
        requirementEvidence,
    )
    const closing = paragraph(
        'closing',
        `${closingTone(input.tone)} I would welcome a conversation about how this evidence maps to the role.`,
        [{ type: 'job-description', id: input.job.id, quote: input.job.title }],
    )
    const note = noteParagraph(input.userNotes || '')
    const paragraphs = input.length === 'short-email'
        ? [intro, evidence, closing]
        : input.length === 'recruiter-note'
            ? [intro, evidence, note || closing]
            : [intro, evidence, fit, ...(note ? [note] : []), closing]

    return {
        id: input.id,
        title: `${input.job.title} cover letter`,
        jobId: input.job.id,
        resumeId: input.resumeId,
        resumeVersionId: input.version.id,
        tone: input.tone,
        length: input.length,
        createdAt,
        updatedAt: createdAt,
        paragraphs,
        userNotes: input.userNotes,
        exportMetadata: [],
        status: paragraphs.some(item => item.unsupported) ? 'draft' : 'ready',
    }
}

export function coverLetterToText(draft: CoverLetterDraft): string {
    return draft.paragraphs.map(paragraph => paragraph.text.trim()).filter(Boolean).join('\n\n')
}

export function coverLetterContentHash(draft: CoverLetterDraft): string {
    return hashText(coverLetterToText(draft))
}

export async function createCoverLetterPdfBlob(draft: CoverLetterDraft): Promise<Blob> {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 54
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const contentWidth = pageWidth - margin * 2
    let y = margin

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.text(draft.title, margin, y)
    y += 30
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10.5)

    for (const paragraph of draft.paragraphs) {
        const lines = pdf.splitTextToSize(paragraph.text, contentWidth) as string[]
        for (const line of lines) {
            if (y > pageHeight - margin) {
                pdf.addPage()
                y = margin
            }
            pdf.text(line, margin, y)
            y += 15
        }
        y += 10
    }

    return pdf.output('blob')
}