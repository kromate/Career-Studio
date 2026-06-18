import type {
    EditableResumeDocument,
    ParsedResume,
    ResumeBuilderBullet,
    ResumeBuilderSectionKey,
    ResumeBuilderSectionSetting,
    ResumeBuilderSource,
    ResumeDesignSettings,
    ResumeEducationEntry,
    ResumeExperienceEntry,
    ResumeExperienceLevel,
    ResumeProfileSection,
    ResumeProjectEntry,
    ResumeSimpleEntry,
    ResumeSkillGroup,
} from '@/types'
import { parseResumeText } from './parser'

const SECTION_DEFAULTS: Array<Omit<ResumeBuilderSectionSetting, 'order'>> = [
    { key: 'profile', title: 'Personal Information', visible: true, optional: false },
    { key: 'work', title: 'Work Experience', visible: true, optional: false },
    { key: 'education', title: 'Education', visible: true, optional: false },
    { key: 'skills', title: 'Skills', visible: true, optional: false },
    { key: 'projects', title: 'Projects', visible: true, optional: true },
    { key: 'volunteer', title: 'Volunteer Experience', visible: true, optional: true },
    { key: 'certifications', title: 'Certifications', visible: true, optional: true },
    { key: 'publications', title: 'Publications', visible: true, optional: true },
    { key: 'awards', title: 'Awards', visible: true, optional: true },
]

export function createBuilderId(prefix: string): string {
    if (import.meta.client && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${prefix}-${crypto.randomUUID()}`
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function defaultResumeDesignSettings(): ResumeDesignSettings {
    return {
        template: 'classic',
        pageSize: 'letter',
        marginY: 36,
        marginX: 36,
        fontFamily: 'Roboto',
        fontSize: 10,
        lineHeight: 1.35,
        accentColor: '#601ded',
        dateFormat: 'MM/YYYY',
    }
}

export function defaultSectionSettings(): ResumeBuilderSectionSetting[] {
    return SECTION_DEFAULTS.map((section, order) => ({ ...section, order }))
}

export function createEmptyProfile(
    targetRole = '',
    experienceLevel: ResumeExperienceLevel = 'entry',
): ResumeProfileSection {
    return {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        links: [],
        summary: '',
        targetRole,
        experienceLevel,
    }
}

export function createEmptyBuilderDocument(input: {
    id?: string
    source?: ResumeBuilderSource
    targetRole?: string
    experienceLevel?: ResumeExperienceLevel
    now?: string
} = {}): EditableResumeDocument {
    const timestamp = input.now || new Date().toISOString()
    return {
        id: input.id || createBuilderId('builder'),
        source: input.source || 'new',
        profile: createEmptyProfile(input.targetRole, input.experienceLevel || 'entry'),
        workExperiences: [],
        educations: [],
        skills: [],
        projects: [],
        volunteerExperiences: [],
        certifications: [],
        publications: [],
        awards: [],
        customSections: [],
        design: defaultResumeDesignSettings(),
        sectionSettings: defaultSectionSettings(),
        updatedAt: timestamp,
    }
}

export function createEmptyExperience(): ResumeExperienceEntry {
    return {
        id: createBuilderId('experience'),
        jobTitle: '',
        employer: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        hideDates: false,
        bullets: [],
    }
}

export function createEmptyEducation(): ResumeEducationEntry {
    return {
        id: createBuilderId('education'),
        school: '',
        degree: '',
        location: '',
        startDate: '',
        endDate: '',
        details: [],
    }
}

export function createEmptyProject(): ResumeProjectEntry {
    return {
        id: createBuilderId('project'),
        name: '',
        role: '',
        url: '',
        startDate: '',
        endDate: '',
        bullets: [],
    }
}

export function createEmptySimpleEntry(prefix = 'entry'): ResumeSimpleEntry {
    return {
        id: createBuilderId(prefix),
        title: '',
        subtitle: '',
        date: '',
        location: '',
        bullets: [],
    }
}

export function createEmptyBullet(): ResumeBuilderBullet {
    return {
        id: createBuilderId('bullet'),
        text: '',
    }
}

function cleanParts(parts: Array<string | undefined>): string {
    return parts.map(part => part?.trim()).filter(Boolean).join(' | ')
}

function dateRange(startDate: string, endDate: string, current = false): string {
    if (!startDate && !endDate && !current) return ''
    if (current) return [startDate, 'Present'].filter(Boolean).join(' - ')
    return [startDate, endDate].filter(Boolean).join(' - ')
}

function pushSection(lines: string[], title: string, body: string[]): void {
    const content = body.map(line => line.trim()).filter(Boolean)
    if (!content.length) return
    if (lines.length) lines.push('')
    lines.push(title.toUpperCase())
    lines.push(...content)
}

function bulletLines(bullets: ResumeBuilderBullet[]): string[] {
    return bullets.map(bullet => bullet.text.trim()).filter(Boolean).map(text => `• ${text}`)
}

function experienceLines(entries: ResumeExperienceEntry[]): string[] {
    return entries.flatMap((entry) => {
        const heading = cleanParts([
            [entry.jobTitle, entry.employer].filter(Boolean).join(' - '),
            entry.location,
            entry.hideDates ? '' : dateRange(entry.startDate, entry.endDate, entry.current),
        ])
        return [heading, ...bulletLines(entry.bullets)].filter(Boolean)
    })
}

function educationLines(entries: ResumeEducationEntry[]): string[] {
    return entries.flatMap((entry) => {
        const heading = cleanParts([
            [entry.degree, entry.school].filter(Boolean).join(' - '),
            entry.location,
            dateRange(entry.startDate, entry.endDate),
        ])
        return [heading, ...bulletLines(entry.details)].filter(Boolean)
    })
}

function skillLines(groups: ResumeSkillGroup[]): string[] {
    return groups
        .map((group) => {
            const skills = group.skills.map(skill => skill.trim()).filter(Boolean).join(', ')
            if (!skills) return ''
            return group.title.trim() ? `${group.title.trim()}: ${skills}` : skills
        })
        .filter(Boolean)
}

function projectLines(entries: ResumeProjectEntry[]): string[] {
    return entries.flatMap((entry) => {
        const heading = cleanParts([
            [entry.name, entry.role].filter(Boolean).join(' - '),
            entry.url,
            dateRange(entry.startDate, entry.endDate),
        ])
        return [heading, ...bulletLines(entry.bullets)].filter(Boolean)
    })
}

function simpleLines(entries: ResumeSimpleEntry[]): string[] {
    return entries.flatMap((entry) => {
        const heading = cleanParts([
            [entry.title, entry.subtitle].filter(Boolean).join(' - '),
            entry.location,
            entry.date,
        ])
        return [heading, ...bulletLines(entry.bullets)].filter(Boolean)
    })
}

export function builderDocumentToText(document: EditableResumeDocument): string {
    const lines: string[] = []
    const name = `${document.profile.firstName} ${document.profile.lastName}`.trim()
    if (name) lines.push(name)
    const contact = cleanParts([
        document.profile.email,
        document.profile.phone,
        document.profile.location,
        ...document.profile.links.map(link => link.url || link.label),
    ])
    if (contact) lines.push(contact)

    pushSection(lines, 'Summary', [document.profile.summary])
    pushSection(lines, 'Experience', experienceLines(document.workExperiences))
    pushSection(lines, 'Education', educationLines(document.educations))
    pushSection(lines, 'Skills', skillLines(document.skills))
    pushSection(lines, 'Projects', projectLines(document.projects))
    pushSection(lines, 'Volunteer Experience', simpleLines(document.volunteerExperiences))
    pushSection(lines, 'Certifications', simpleLines(document.certifications))
    pushSection(lines, 'Publications', simpleLines(document.publications))
    pushSection(lines, 'Awards', simpleLines(document.awards))

    document.customSections.forEach((section) => {
        pushSection(lines, section.title || 'Additional Experience', simpleLines(section.entries))
    })

    return lines.join('\n').trim()
}

export function builderDocumentToParsedResume(document: EditableResumeDocument): ParsedResume {
    return parseResumeText(builderDocumentToText(document))
}

export function mergeBuilderDocument(document: EditableResumeDocument): EditableResumeDocument {
    return {
        ...createEmptyBuilderDocument({
            id: document.id,
            source: document.source,
            targetRole: document.profile?.targetRole,
            experienceLevel: document.profile?.experienceLevel,
            now: document.updatedAt,
        }),
        ...document,
        profile: { ...createEmptyProfile(), ...document.profile },
        workExperiences: document.workExperiences || [],
        educations: document.educations || [],
        skills: document.skills || [],
        projects: document.projects || [],
        volunteerExperiences: document.volunteerExperiences || [],
        certifications: document.certifications || [],
        publications: document.publications || [],
        awards: document.awards || [],
        customSections: document.customSections || [],
        design: { ...defaultResumeDesignSettings(), ...document.design },
        sectionSettings: document.sectionSettings?.length ? document.sectionSettings : defaultSectionSettings(),
    }
}
