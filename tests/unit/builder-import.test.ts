import { describe, expect, it } from 'vitest'
import { builderDocumentToText, parsedResumeToBuilderDocument } from '@/lib/resume/builder'
import { parseResumeText } from '@/lib/resume/parser'
import { RESUME_TEMPLATE_OPTIONS, resumeTemplatePreset, resumeTemplateStyleId } from '@/lib/resume/templates'
import { sampleResume } from '../fixtures/sample-resume'

describe('resume builder imports', () => {
    it('hydrates builder sections from parsed resume text', () => {
        const document = parsedResumeToBuilderDocument({
            parsed: parseResumeText(sampleResume),
            targetRole: 'Senior Frontend Engineer',
            experienceLevel: 'senior',
            now: '2026-06-18T00:00:00.000Z',
        })

        expect(document.source).toBe('import')
        expect(document.profile.firstName).toBe('Jordan')
        expect(document.profile.lastName).toBe('Lee')
        expect(document.profile.email).toBe('jordan.lee@example.com')
        expect(document.profile.links[0]?.url).toBe('linkedin.com/in/jordanlee')
        expect(document.profile.targetRole).toBe('Senior Frontend Engineer')
        expect(document.profile.experienceLevel).toBe('senior')
        expect(document.workExperiences).toHaveLength(2)
        expect(document.workExperiences[0]).toMatchObject({
            jobTitle: 'Senior Software Engineer',
            employer: 'Northstar Labs',
            startDate: 'Jan 2023',
            current: true,
        })
        expect(document.workExperiences[0]?.bullets).toHaveLength(4)
        expect(document.educations[0]).toMatchObject({
            degree: 'BSc Computer Science',
            school: 'University of Lagos',
        })
        expect(document.skills[0]?.skills).toContain('TypeScript')
        expect(builderDocumentToText(document)).toContain('EXPERIENCE')
    })

    it('exposes the roadmap template registry with supported rendering styles', () => {
        expect(RESUME_TEMPLATE_OPTIONS.map(template => template.id)).toEqual([
            'ats-clean',
            'modern-single',
            'compact-two-column',
            'executive',
        ])
        expect(resumeTemplateStyleId('ats-clean')).toBe('classic')
        expect(resumeTemplateStyleId('compact-two-column')).toBe('blueprint')
        expect(resumeTemplatePreset('executive').fontFamily).toBe('Georgia')
    })
})