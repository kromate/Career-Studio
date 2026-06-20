import { describe, expect, it } from 'vitest'
import { createBuilderResumePdfBlob } from '@/lib/export/resume'
import { createEmptyBuilderDocument, createEmptyExperience } from '@/lib/resume/builder'

describe('resume export', () => {
    it('exports builder documents as PDFs', async () => {
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

        const blob = await createBuilderResumePdfBlob({
            ...document,
            profile: {
                ...document.profile,
                firstName: 'Anthony Omoh',
                lastName: 'Akpan',
                email: 'akpananthony33@gmail.com',
                links: [{ id: 'link-1', label: 'GitHub', url: 'https://github.com/kromate' }],
            },
            workExperiences: [experience],
        })

        expect(blob.type).toBe('application/pdf')
        expect(blob.size).toBeGreaterThan(1_000)
    })
})