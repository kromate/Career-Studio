import type {
    AiProviderSettings,
    AppSettings,
    ApplicationRecord,
    ApplicationStatus,
    CoverLetterDraft,
    CoverLetterExportMetadata,
    EditableResumeDocument,
    PublicResumeShare,
    ResumeExportMetadata,
    ResumeAnalysis,
    ResumeRecord,
    ResumeVersion,
    SavedJob,
    UserProfile,
    WorkspaceState,
} from '@/types'
import { builderDocumentToText, mergeBuilderDocument } from './builder'
import { matchResumeToJob } from './matching'
import { hashText, parseResumeText } from './parser'
import { scoreResume } from './scoring'

export const CAREER_STUDIO_WORKSPACE_FORMAT = 'career-studio-workspace'
export const CAREER_STUDIO_WORKSPACE_FORMAT_VERSION = 1

type JsonRecord = Record<string, unknown>

export interface CareerStudioWorkspaceExport {
    format: typeof CAREER_STUDIO_WORKSPACE_FORMAT
    formatVersion: typeof CAREER_STUDIO_WORKSPACE_FORMAT_VERSION
    exportedAt: string
    schemaVersion: number
    ownerId: string | null
    masterResumeId: string | null
    user: UserProfile | null
    settings: AppSettings
    resumes: ResumeRecord[]
    jobs: SavedJob[]
    applications: ApplicationRecord[]
    coverLetters: CoverLetterDraft[]
    publicShares: PublicResumeShare[]
}

function defaultAiProvider(): AiProviderSettings {
    return {
        provider: 'local-preview',
        model: 'deterministic-local',
        baseUrl: '',
        enabled: true,
        lastStatus: 'untested',
    }
}

function defaultSettings(): AppSettings {
    return {
        emailUpdates: true,
        weeklyReview: true,
        retainUploads: false,
        scoringDetails: true,
        aiProvider: defaultAiProvider(),
    }
}

function asRecord(value: unknown): JsonRecord {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : []
}

function asText(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback = false): boolean {
    return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asNullableText(value: unknown): string | null {
    return typeof value === 'string' && value ? value : null
}

function importId(prefix: string, value: unknown, seed: string): string {
    const candidate = asText(value).trim()
    if (candidate) return candidate
    return `${prefix}-${hashText(seed).replace(/[^a-z0-9]+/gi, '-')}`
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function normalizeStatus(value: unknown): ApplicationStatus {
    if (
        value === 'saved'
        || value === 'drafting'
        || value === 'applied'
        || value === 'interview'
        || value === 'offer'
        || value === 'rejected'
        || value === 'withdrawn'
    ) return value
    return 'saved'
}

function sanitizeSettings(value: unknown): AppSettings {
    const input = asRecord(value)
    const aiProvider = asRecord(input.aiProvider)
    const provider = aiProvider.provider === 'openai-compatible' || aiProvider.provider === 'ollama'
        ? aiProvider.provider
        : 'local-preview'
    const lastStatus = aiProvider.lastStatus === 'ok' || aiProvider.lastStatus === 'failed'
        ? aiProvider.lastStatus
        : 'untested'

    return {
        ...defaultSettings(),
        emailUpdates: asBoolean(input.emailUpdates, true),
        weeklyReview: asBoolean(input.weeklyReview, true),
        retainUploads: asBoolean(input.retainUploads, false),
        scoringDetails: asBoolean(input.scoringDetails, true),
        aiProvider: {
            provider,
            model: asText(aiProvider.model, provider === 'local-preview' ? 'deterministic-local' : ''),
            baseUrl: asText(aiProvider.baseUrl),
            enabled: asBoolean(aiProvider.enabled, true),
            lastTestedAt: asText(aiProvider.lastTestedAt) || undefined,
            lastStatus,
        },
    }
}

function historicalAnalyses(input: JsonRecord): ResumeAnalysis[] {
    const previous = asArray(input.historicalAnalyses).map(item => asRecord(item) as unknown as ResumeAnalysis)
    const exportedAnalysis = asRecord(input.analysis)
    if (!Object.keys(exportedAnalysis).length) return previous
    return [exportedAnalysis as unknown as ResumeAnalysis, ...previous]
}

function sanitizeVersion(input: unknown, resumeId: string, index: number): ResumeVersion | null {
    const raw = asRecord(input)
    const text = asText(raw.text) || asText(asRecord(raw.parsed).normalizedText)
    if (!text.trim()) return null

    const id = importId('version', raw.id, `${resumeId}:${index}:${text}`)
    const createdAt = asText(raw.createdAt, new Date().toISOString())
    const parsed = parseResumeText(text)
    const analysis = scoreResume(parsed, {
        resumeId,
        versionId: id,
        createdAt,
    })
    const source = raw.source === 'edit' || raw.source === 'rewrite' || raw.source === 'tailored' || raw.source === 'builder'
        ? raw.source
        : 'upload'
    const lineage = asRecord(raw.lineage)

    return {
        id,
        label: asText(raw.label, index === 0 ? 'Imported version' : `Imported version ${index + 1}`),
        createdAt,
        source,
        kind: raw.kind === 'master' || raw.kind === 'tailored' || raw.kind === 'exported' ? raw.kind : 'revision',
        text,
        parsed,
        analysis,
        historicalAnalyses: historicalAnalyses(raw),
        targetJobId: asText(raw.targetJobId) || undefined,
        lineage: {
            sourceResumeId: asText(lineage.sourceResumeId) || undefined,
            sourceVersionId: asText(lineage.sourceVersionId) || undefined,
            sourceContentHash: asText(lineage.sourceContentHash) || undefined,
            targetJobId: asText(lineage.targetJobId) || asText(raw.targetJobId) || undefined,
            acceptedSuggestionIds: asArray(lineage.acceptedSuggestionIds).map(item => asText(item)).filter(Boolean),
        },
        exportMetadata: asArray(raw.exportMetadata).map(item => asRecord(item) as unknown as ResumeExportMetadata),
        intentionalRuleIds: asArray(raw.intentionalRuleIds).map(item => asText(item)).filter(Boolean),
    }
}

function sanitizeResume(input: unknown, index: number): ResumeRecord | null {
    const raw = asRecord(input)
    const id = importId('resume', raw.id, `${index}:${asText(raw.name)}`)
    const builderDocument = Object.keys(asRecord(raw.builderDocument)).length
        ? mergeBuilderDocument(asRecord(raw.builderDocument) as unknown as EditableResumeDocument)
        : undefined
    const versions = asArray(raw.versions)
        .map((version, versionIndex) => sanitizeVersion(version, id, versionIndex))
        .filter((version): version is ResumeVersion => Boolean(version))

    if (!versions.length && builderDocument) {
        const text = builderDocumentToText(builderDocument)
        const fallbackVersion = sanitizeVersion({ text, source: 'builder', label: 'Builder resume' }, id, 0)
        if (fallbackVersion) versions.push(fallbackVersion)
    }
    if (!versions.length) return null

    const activeVersionId = versions.some(version => version.id === raw.activeVersionId)
        ? asText(raw.activeVersionId)
        : versions[0]!.id

    return {
        id,
        name: asText(raw.name, 'Imported resume'),
        isMaster: asBoolean(raw.isMaster, index === 0),
        originalFileName: asText(raw.originalFileName, 'career-studio-import.json'),
        fileType: asText(raw.fileType, 'application/json'),
        targetJobTitle: asText(raw.targetJobTitle) || undefined,
        experienceLevel: raw.experienceLevel === 'mid' || raw.experienceLevel === 'senior' ? raw.experienceLevel : 'entry',
        builderSource: raw.builderSource === 'new' ? 'new' : raw.builderSource === 'import' ? 'import' : undefined,
        builderDocument,
        createdAt: asText(raw.createdAt, versions[0]!.createdAt),
        updatedAt: asText(raw.updatedAt, versions[0]!.createdAt),
        activeVersionId,
        versions,
    }
}

function sanitizeJob(input: unknown, resumes: ResumeRecord[]): SavedJob | null {
    const raw = asRecord(input)
    const description = asText(raw.description).trim()
    if (!description) return null
    const id = importId('job', raw.id, description)
    const resumeId = asText(raw.resumeId) || undefined
    const resume = resumeId ? resumes.find(item => item.id === resumeId) : undefined
    const resumeVersionId = asText(raw.resumeVersionId) || resume?.activeVersionId
    const version = resume?.versions.find(item => item.id === resumeVersionId)
    const createdAt = asText(raw.createdAt, new Date().toISOString())

    return {
        id,
        title: asText(raw.title, 'Imported role'),
        company: asText(raw.company, 'Unknown company'),
        location: asText(raw.location, 'Not specified'),
        url: asText(raw.url) || undefined,
        description,
        createdAt,
        updatedAt: asText(raw.updatedAt, createdAt),
        resumeId: resume?.id,
        resumeVersionId: version?.id,
        match: version ? matchResumeToJob(version.parsed, description, createdAt) : undefined,
    }
}

function sanitizeApplication(input: unknown, jobs: SavedJob[]): ApplicationRecord | null {
    const raw = asRecord(input)
    const jobId = asText(raw.jobId)
    const job = jobs.find(item => item.id === jobId)
    if (!job) return null
    const createdAt = asText(raw.createdAt, new Date().toISOString())

    return {
        id: importId('application', raw.id, `${jobId}:${createdAt}`),
        jobId,
        status: normalizeStatus(raw.status),
        createdAt,
        updatedAt: asText(raw.updatedAt, createdAt),
        resumeId: asText(raw.resumeId) || job.resumeId,
        resumeVersionId: asText(raw.resumeVersionId) || job.resumeVersionId,
        submittedResumeVersionId: asText(raw.submittedResumeVersionId) || undefined,
        coverLetterDraftIds: asArray(raw.coverLetterDraftIds).map(item => asText(item)).filter(Boolean),
        submittedCoverLetterDraftId: asText(raw.submittedCoverLetterDraftId) || undefined,
        appliedAt: asText(raw.appliedAt) || undefined,
        nextAction: asText(raw.nextAction) || undefined,
        nextActionAt: asText(raw.nextActionAt) || undefined,
        notes: asText(raw.notes) || undefined,
    }
}

function sanitizeCoverLetter(input: unknown, resumes: ResumeRecord[], jobs: SavedJob[]): CoverLetterDraft | null {
    const raw = asRecord(input)
    const job = jobs.find(item => item.id === asText(raw.jobId))
    const resume = resumes.find(item => item.id === asText(raw.resumeId))
    const version = resume?.versions.find(item => item.id === asText(raw.resumeVersionId))
    if (!job || !resume || !version) return null
    const createdAt = asText(raw.createdAt, new Date().toISOString())
    const tone = raw.tone === 'warm' || raw.tone === 'formal' || raw.tone === 'concise' ? raw.tone : 'direct'
    const length = raw.length === 'short-email' || raw.length === 'recruiter-note' ? raw.length : 'standard-letter'

    return {
        id: importId('cover-letter', raw.id, `${job.id}:${resume.id}:${createdAt}`),
        title: asText(raw.title, `${job.title} cover letter`),
        jobId: job.id,
        resumeId: resume.id,
        resumeVersionId: version.id,
        tone,
        length,
        createdAt,
        updatedAt: asText(raw.updatedAt, createdAt),
        paragraphs: asArray(raw.paragraphs)
            .map((paragraph, index) => {
                const record = asRecord(paragraph)
                return {
                    id: importId('paragraph', record.id, `${job.id}:${index}:${asText(record.text)}`),
                    text: asText(record.text),
                    evidenceSources: asArray(record.evidenceSources).map(source => asRecord(source) as unknown as CoverLetterDraft['paragraphs'][number]['evidenceSources'][number]),
                    unsupported: asBoolean(record.unsupported, false),
                }
            })
            .filter(paragraph => paragraph.text.trim()),
        userNotes: asText(raw.userNotes) || undefined,
        exportMetadata: asArray(raw.exportMetadata).map(item => asRecord(item) as unknown as CoverLetterExportMetadata),
        status: raw.status === 'ready' || raw.status === 'exported' ? raw.status : 'draft',
    }
}

function sanitizePublicShare(input: unknown, resumes: ResumeRecord[]): PublicResumeShare | null {
    const raw = asRecord(input)
    const resume = resumes.find(item => item.id === asText(raw.resumeId))
    const version = resume?.versions.find(item => item.id === asText(raw.versionId))
    if (!resume || !version) return null
    return {
        id: importId('share', raw.id, `${resume.id}:${version.id}`),
        resumeId: resume.id,
        versionId: version.id,
        resumeName: resume.name,
        versionLabel: version.label,
        createdAt: asText(raw.createdAt, new Date().toISOString()),
        parsed: version.parsed,
        includeContact: asBoolean(raw.includeContact, true),
        visibility: 'local-public',
    }
}

export function createCareerStudioWorkspaceExport(state: WorkspaceState): CareerStudioWorkspaceExport {
    return clone({
        format: CAREER_STUDIO_WORKSPACE_FORMAT,
        formatVersion: CAREER_STUDIO_WORKSPACE_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        schemaVersion: state.schemaVersion,
        ownerId: state.ownerId,
        masterResumeId: state.masterResumeId,
        user: state.user,
        settings: state.settings,
        resumes: state.resumes,
        jobs: state.jobs,
        applications: state.applications,
        coverLetters: state.coverLetters,
        publicShares: state.publicShares,
    })
}

export function parseCareerStudioWorkspaceJson(json: string): CareerStudioWorkspaceExport {
    let parsed: JsonRecord
    try {
        parsed = asRecord(JSON.parse(json))
    } catch {
        throw new Error('Import file is not valid JSON.')
    }
    if (parsed.format !== CAREER_STUDIO_WORKSPACE_FORMAT) {
        throw new Error('Import file is not a Career Studio workspace export.')
    }
    if (parsed.formatVersion !== CAREER_STUDIO_WORKSPACE_FORMAT_VERSION) {
        throw new Error('Career Studio workspace export version is not supported.')
    }
    return parsed as unknown as CareerStudioWorkspaceExport
}

export function importCareerStudioWorkspaceExport(
    workspaceExport: CareerStudioWorkspaceExport,
    options: { ownerId?: string | null; user?: UserProfile | null } = {},
): WorkspaceState {
    const input = asRecord(workspaceExport)
    const resumes = asArray(input.resumes)
        .map((resume, index) => sanitizeResume(resume, index))
        .filter((resume): resume is ResumeRecord => Boolean(resume))
    if (!resumes.length) throw new Error('Import file does not contain any usable resumes.')

    const resumeIds = new Set(resumes.map(resume => resume.id))
    const masterResumeId = resumeIds.has(asText(input.masterResumeId))
        ? asText(input.masterResumeId)
        : resumes[0]!.id
    const normalizedResumes = resumes.map(resume => ({
        ...resume,
        isMaster: resume.id === masterResumeId,
        versions: resume.versions.map(version => ({
            ...version,
            kind: resume.id === masterResumeId && version.source !== 'tailored' ? 'master' : version.kind,
        })),
    }))
    const jobs = asArray(input.jobs)
        .map(job => sanitizeJob(job, normalizedResumes))
        .filter((job): job is SavedJob => Boolean(job))
    const applications = asArray(input.applications)
        .map(application => sanitizeApplication(application, jobs))
        .filter((application): application is ApplicationRecord => Boolean(application))
    const coverLetters = asArray(input.coverLetters)
        .map(draft => sanitizeCoverLetter(draft, normalizedResumes, jobs))
        .filter((draft): draft is CoverLetterDraft => Boolean(draft))
    const publicShares = asArray(input.publicShares)
        .map(share => sanitizePublicShare(share, normalizedResumes))
        .filter((share): share is PublicResumeShare => Boolean(share))

    return {
        schemaVersion: asNumber(input.schemaVersion, 5),
        ownerId: options.ownerId ?? asNullableText(input.ownerId),
        masterResumeId,
        user: options.user ?? (Object.keys(asRecord(input.user)).length ? asRecord(input.user) as unknown as UserProfile : null),
        resumes: normalizedResumes,
        jobs,
        applications,
        coverLetters,
        publicShares,
        settings: sanitizeSettings(input.settings),
        hydrated: true,
    }
}