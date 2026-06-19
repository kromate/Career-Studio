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
    ResumeSectionType,
    ResumeSkillGroup,
} from '@/types'
import { parseResumeText } from './parser'

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/
const DATE_RANGE_PATTERN = /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b/i
const PRESENT_PATTERN = /\bpresent\b|\bcurrent\b/i
const URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/[^\s|]*)?/i

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

function createBullet(text: string): ResumeBuilderBullet {
    return {
        id: createBuilderId('bullet'),
        text,
    }
}

function cleanLine(text: string): string {
    return text.replace(/^[-*+•◦▪‣]\s*/, '').replace(/\s+/g, ' ').trim()
}

function titleCaseNamePart(text: string): string {
    if (text !== text.toUpperCase()) return text
    return text.toLowerCase().replace(/\b[a-z]/g, character => character.toUpperCase())
}

function splitName(name: string): Pick<ResumeProfileSection, 'firstName' | 'lastName'> {
    const parts = name.split(/\s+/).map(titleCaseNamePart).filter(Boolean)
    if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' }
    return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts.at(-1) || '',
    }
}

function sectionLines(parsed: ParsedResume, type: ResumeSectionType): string[] {
    return parsed.lines
        .filter(line => line.section === type && line.kind !== 'heading')
        .map(line => cleanLine(line.text))
        .filter(Boolean)
}

function sectionBodyLines(parsed: ParsedResume, type: ResumeSectionType): string[] {
    return parsed.lines
        .filter(line => line.section === type && line.kind !== 'heading' && line.kind !== 'bullet')
        .map(line => cleanLine(line.text))
        .filter(Boolean)
}

function sectionBullets(parsed: ParsedResume, type: ResumeSectionType): string[] {
    return parsed.lines
        .filter(line => line.section === type && line.kind === 'bullet')
        .map(line => cleanLine(line.text))
        .filter(Boolean)
}

function looksLikeDateLine(text: string): boolean {
    return DATE_RANGE_PATTERN.test(text) || PRESENT_PATTERN.test(text)
}

function splitDateRange(text = ''): { startDate: string; endDate: string; current: boolean } {
    const normalized = text.replace(/[–—]/g, '-').replace(/\s+to\s+/i, ' - ')
    const parts = normalized.split(/\s+-\s+/).map(part => part.trim()).filter(Boolean)
    const current = PRESENT_PATTERN.test(parts.at(-1) || normalized)
    return {
        startDate: parts[0] || normalized,
        endDate: current ? '' : parts.slice(1).join(' - '),
        current,
    }
}

function looksLikeLocation(text: string): boolean {
    return /\b(remote|hybrid)\b/i.test(text) || /\b[A-Z][a-z]+,\s*(?:[A-Z]{2}|[A-Z][a-z]+)\b/.test(text)
}

function createExperienceEntry(headerLines: string[], bulletTexts: string[]): ResumeExperienceEntry | null {
    const dateLine = headerLines.find(looksLikeDateLine) || ''
    const headingLines = headerLines.filter(line => line !== dateLine)
    let location = ''
    const locationIndex = headingLines.findIndex(looksLikeLocation)
    if (locationIndex >= 0) {
        location = headingLines[locationIndex] || ''
        headingLines.splice(locationIndex, 1)
    } else if (headingLines.length > 2) {
        location = headingLines.pop() || ''
    }
    const dates = splitDateRange(dateLine)

    if (!headingLines.length && !bulletTexts.length) return null
    return {
        id: createBuilderId('experience'),
        jobTitle: headingLines[0] || '',
        employer: headingLines[1] || '',
        location,
        startDate: dates.startDate,
        endDate: dates.endDate,
        current: dates.current,
        hideDates: !dateLine,
        bullets: bulletTexts.map(createBullet),
    }
}

function experienceEntriesFromParsed(parsed: ParsedResume): ResumeExperienceEntry[] {
    const entries: ResumeExperienceEntry[] = []
    let headerLines: string[] = []
    let bulletTexts: string[] = []

    const flush = () => {
        const entry = createExperienceEntry(headerLines, bulletTexts)
        if (entry) entries.push(entry)
        headerLines = []
        bulletTexts = []
    }

    parsed.lines
        .filter(line => line.section === 'experience' && line.kind !== 'heading')
        .forEach((line) => {
            const text = cleanLine(line.text)
            if (!text) return
            if (line.kind === 'bullet') {
                bulletTexts.push(text)
                return
            }
            if (bulletTexts.length) flush()
            headerLines.push(text)
        })

    flush()
    return entries
}

function educationEntriesFromParsed(parsed: ParsedResume): ResumeEducationEntry[] {
    const lines = sectionBodyLines(parsed, 'education')
    if (!lines.length) return []
    const dateLine = lines.find(looksLikeDateLine) || ''
    const headingLines = lines.filter(line => line !== dateLine)
    const details = sectionBullets(parsed, 'education')
    let location = ''
    const locationIndex = headingLines.findIndex(looksLikeLocation)
    if (locationIndex >= 0) {
        location = headingLines[locationIndex] || ''
        headingLines.splice(locationIndex, 1)
    }
    const dates = splitDateRange(dateLine)

    return [{
        id: createBuilderId('education'),
        degree: headingLines[0] || '',
        school: headingLines[1] || '',
        location,
        startDate: dates.startDate,
        endDate: dates.endDate,
        details: details.map(createBullet),
    }]
}

function skillGroupsFromParsed(parsed: ParsedResume): ResumeSkillGroup[] {
    return sectionLines(parsed, 'skills')
        .map((line) => {
            const [rawTitle, rawSkills] = line.includes(':') ? line.split(/:(.*)/s) : ['', line]
            const skills = (rawSkills || '')
                .split(/[,;|]/)
                .map(skill => skill.trim())
                .filter(Boolean)
            if (!skills.length) return null
            return {
                id: createBuilderId('skills'),
                title: rawTitle?.trim() || '',
                skills,
            }
        })
        .filter((group): group is ResumeSkillGroup => Boolean(group))
}

function projectEntriesFromParsed(parsed: ParsedResume): ResumeProjectEntry[] {
    const lines = sectionBodyLines(parsed, 'projects')
    if (!lines.length) return []
    const dateLine = lines.find(looksLikeDateLine) || ''
    const urlLine = lines.find(line => URL_PATTERN.test(line)) || ''
    const headingLines = lines.filter(line => line !== dateLine && line !== urlLine)
    const dates = splitDateRange(dateLine)

    return [{
        id: createBuilderId('project'),
        name: headingLines[0] || '',
        role: headingLines[1] || '',
        url: urlLine,
        startDate: dates.startDate,
        endDate: dates.endDate,
        bullets: sectionBullets(parsed, 'projects').map(createBullet),
    }]
}

function simpleEntriesFromLines(prefix: string, lines: string[]): ResumeSimpleEntry[] {
    if (!lines.length) return []
    const dateLine = lines.find(looksLikeDateLine) || ''
    const headingLines = lines.filter(line => line !== dateLine)
    return [{
        id: createBuilderId(prefix),
        title: headingLines[0] || '',
        subtitle: headingLines.slice(1).join(' | '),
        date: dateLine,
        location: '',
        bullets: [],
    }]
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

export function parsedResumeToBuilderDocument(input: {
    parsed: ParsedResume
    targetRole?: string
    experienceLevel?: ResumeExperienceLevel
    now?: string
}): EditableResumeDocument {
    const document = createEmptyBuilderDocument({
        source: 'import',
        targetRole: input.targetRole,
        experienceLevel: input.experienceLevel,
        now: input.now,
    })
    const headerLines = sectionLines(input.parsed, 'header')
    const nameLine = headerLines.find(line => !EMAIL_PATTERN.test(line) && !PHONE_PATTERN.test(line) && !URL_PATTERN.test(line)) || ''
    const name = splitName(nameLine)
    const links = [input.parsed.contacts.linkedIn, input.parsed.contacts.website]
        .filter((link): link is string => Boolean(link))
        .map(link => ({ id: createBuilderId('link'), label: link.includes('linkedin.com') ? 'LinkedIn' : 'Website', url: link }))

    return mergeBuilderDocument({
        ...document,
        profile: {
            ...document.profile,
            ...name,
            email: input.parsed.contacts.email || '',
            phone: input.parsed.contacts.phone || '',
            location: input.parsed.contacts.location || '',
            links,
            summary: sectionLines(input.parsed, 'summary').join(' '),
        },
        workExperiences: experienceEntriesFromParsed(input.parsed),
        educations: educationEntriesFromParsed(input.parsed),
        skills: skillGroupsFromParsed(input.parsed),
        projects: projectEntriesFromParsed(input.parsed),
        certifications: simpleEntriesFromLines('certification', sectionBodyLines(input.parsed, 'certifications')),
    })
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
