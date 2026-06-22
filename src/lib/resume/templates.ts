import type { ResumeDesignSettings, ResumeTemplateId } from '@/types'

export type ResumeTemplateStyleId = 'classic' | 'compact' | 'blueprint' | 'coral' | 'green' | 'mono'

export interface ResumeTemplateOption {
    id: ResumeTemplateId
    label: string
    description?: string
    source?: string
}

type ResumeTemplatePreset = Omit<ResumeDesignSettings, 'template'>

export const RESUME_TEMPLATE_OPTIONS: ResumeTemplateOption[] = [
    { id: 'ats-clean', label: 'ATS Clean', description: 'Single-column, scanner-friendly default.' },
    { id: 'modern-single', label: 'Modern Single', description: 'Polished single-column layout with a stronger accent.' },
    { id: 'compact-two-column', label: 'Compact Two Column', description: 'Dense layout for experienced resumes.' },
    { id: 'executive', label: 'Executive', description: 'Editorial spacing for senior leadership profiles.' },
]

export const LEGACY_RESUME_TEMPLATE_OPTIONS: ResumeTemplateOption[] = [
    { id: 'classic', label: 'Classic' },
    { id: 'compact', label: 'Compact' },
    { id: 'blueprint', label: 'Blue Split', source: 'resume one' },
    { id: 'coral', label: 'Coral Editorial', source: 'resume two' },
    { id: 'green', label: 'Modern Green', source: 'Resume 3' },
    { id: 'mono', label: 'Mono Accent', source: 'Resume 4' },
]

export const RESUME_TEMPLATE_PRESETS: Record<ResumeTemplateId, ResumeTemplatePreset> = {
    'ats-clean': {
        pageSize: 'letter',
        marginY: 36,
        marginX: 36,
        fontFamily: 'Roboto',
        fontSize: 10,
        lineHeight: 1.35,
        accentColor: '#3f6f68',
        dateFormat: 'MM/YYYY',
    },
    'modern-single': {
        pageSize: 'letter',
        marginY: 52,
        marginX: 72,
        fontFamily: 'Helvetica',
        fontSize: 10.5,
        lineHeight: 1.38,
        accentColor: '#00a650',
        dateFormat: 'MM/YYYY',
    },
    'compact-two-column': {
        pageSize: 'letter',
        marginY: 54,
        marginX: 56,
        fontFamily: 'Georgia',
        fontSize: 10.5,
        lineHeight: 1.35,
        accentColor: '#1476d4',
        dateFormat: 'MM/YYYY',
    },
    executive: {
        pageSize: 'letter',
        marginY: 58,
        marginX: 70,
        fontFamily: 'Georgia',
        fontSize: 10.5,
        lineHeight: 1.45,
        accentColor: '#b44b4f',
        dateFormat: 'MM/YYYY',
    },
    classic: {
        pageSize: 'letter',
        marginY: 36,
        marginX: 36,
        fontFamily: 'Roboto',
        fontSize: 10,
        lineHeight: 1.35,
        accentColor: '#601ded',
        dateFormat: 'MM/YYYY',
    },
    compact: {
        pageSize: 'letter',
        marginY: 30,
        marginX: 34,
        fontFamily: 'Roboto',
        fontSize: 9,
        lineHeight: 1.24,
        accentColor: '#601ded',
        dateFormat: 'MM/YYYY',
    },
    blueprint: {
        pageSize: 'letter',
        marginY: 54,
        marginX: 56,
        fontFamily: 'Georgia',
        fontSize: 10.5,
        lineHeight: 1.35,
        accentColor: '#1476d4',
        dateFormat: 'MM/YYYY',
    },
    coral: {
        pageSize: 'letter',
        marginY: 58,
        marginX: 70,
        fontFamily: 'Georgia',
        fontSize: 10.5,
        lineHeight: 1.45,
        accentColor: '#ff5c61',
        dateFormat: 'MM/YYYY',
    },
    green: {
        pageSize: 'letter',
        marginY: 52,
        marginX: 72,
        fontFamily: 'Helvetica',
        fontSize: 10.5,
        lineHeight: 1.38,
        accentColor: '#00a650',
        dateFormat: 'MM/YYYY',
    },
    mono: {
        pageSize: 'letter',
        marginY: 52,
        marginX: 72,
        fontFamily: 'Courier',
        fontSize: 9.5,
        lineHeight: 1.42,
        accentColor: '#f00657',
        dateFormat: 'MM/YYYY',
    },
}

export function resumeTemplateStyleId(template: ResumeTemplateId): ResumeTemplateStyleId {
    if (template === 'ats-clean') return 'classic'
    if (template === 'modern-single') return 'green'
    if (template === 'compact-two-column') return 'blueprint'
    if (template === 'executive') return 'coral'
    return template
}

export function resumeTemplatePreset(template: ResumeTemplateId): ResumeTemplatePreset {
    return RESUME_TEMPLATE_PRESETS[template]
}
