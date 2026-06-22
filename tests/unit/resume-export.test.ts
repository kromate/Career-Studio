import { describe, expect, it } from 'vitest'
import type { ResumeTemplateId } from '@/types'
import { createBuilderResumePdfBlob } from '@/lib/export/resume'
import { createEmptyBuilderDocument, createEmptyEducation, createEmptyExperience, createEmptySimpleEntry } from '@/lib/resume/builder'
import { RESUME_TEMPLATE_OPTIONS, resumeTemplatePreset } from '@/lib/resume/templates'

describe('resume export', () => {
    it.each(RESUME_TEMPLATE_OPTIONS.map(template => template.id))('exports %s builder documents as PDFs', async (template: ResumeTemplateId) => {
        const document = createEmptyBuilderDocument({
            now: '2026-06-20T00:00:00.000Z',
            targetRole: 'Frontend Engineer',
            experienceLevel: 'senior',
        })
        const experience = {
            ...createEmptyExperience(),
            jobTitle: 'Lead Frontend Developer',
            employer: 'Kromatech',
            location: 'Remote',
            startDate: 'SEPTEMBER 2018',
            endDate: 'MARCH 2020',
            bullets: [{ id: 'bullet-1', text: 'Created stable, scalable, and maintainable products using Ionic and Vue.' }],
        }
        const education = {
            ...createEmptyEducation(),
            degree: 'Computer Engineering',
            school: 'University of Lagos',
            location: 'Lagos',
            startDate: '2014',
            endDate: '2018',
            details: [{ id: 'education-detail-1', text: 'Focused on software engineering and distributed systems.' }],
        }
        const award = {
            ...createEmptySimpleEntry('award'),
            title: 'Open Source Contributor',
            date: '2024',
            bullets: [{ id: 'award-bullet-1', text: 'Maintained frontend tooling used by product teams.' }],
        }

        const blob = await createBuilderResumePdfBlob({
            ...document,
            design: { ...document.design, ...resumeTemplatePreset(template), template },
            profile: {
                ...document.profile,
                firstName: 'Anthony Omoh',
                lastName: 'Akpan',
                email: 'akpananthony33@gmail.com',
                phone: '(123) 456-7890',
                links: [{ id: 'link-1', label: 'GitHub', url: 'https://github.com/kromate' }],
            },
            workExperiences: [experience],
            educations: [education],
            skills: [{ id: 'skills-1', title: 'Technical Skills', skills: ['TypeScript', 'Vue', 'Nuxt', 'Node.js'] }],
            awards: [award],
        })

        expect(blob.type).toBe('application/pdf')
        expect(blob.size).toBeGreaterThan(1_000)
    })
})